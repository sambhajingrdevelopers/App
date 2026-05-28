from fastapi import APIRouter, Body, Query
from pathlib import Path
from datetime import datetime, timezone
import base64
import os
import sqlite3
import uuid

try:
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    from cryptography.hazmat.primitives.kdf.hkdf import HKDF
    from cryptography.hazmat.primitives import hashes
except Exception:
    AESGCM = None
    HKDF = None
    hashes = None

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_secure_messages.db"
USERS_DB = BASE_DIR / "vibeloop_users.db"
KEY_FILE = BASE_DIR / ".message_master_key"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean_username(value):
    text = str(value or "").strip()
    if not text:
        return "@guest"
    return text if text.startswith("@") else f"@{text}"


def connect(db_path=DB_PATH):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def crypto_ready():
    return AESGCM is not None and HKDF is not None


def get_master_key():
    env_key = os.environ.get("VIBELOOP_MESSAGE_MASTER_KEY", "").strip()

    if env_key:
        try:
            raw = base64.urlsafe_b64decode(env_key.encode())
            if len(raw) == 32:
                return raw
        except Exception:
            pass

    if KEY_FILE.exists():
        raw = base64.urlsafe_b64decode(KEY_FILE.read_text().strip().encode())
        if len(raw) == 32:
            return raw

    raw = os.urandom(32)
    KEY_FILE.write_text(base64.urlsafe_b64encode(raw).decode())
    try:
        KEY_FILE.chmod(0o600)
    except Exception:
        pass
    return raw


def conversation_id(user_a, user_b):
    a = clean_username(user_a).lower()
    b = clean_username(user_b).lower()
    first, second = sorted([a, b])
    return f"{first}__{second}"


def derive_conversation_key(conv_id):
    master = get_master_key()

    hkdf = HKDF(
        algorithm=hashes.SHA256(),
        length=32,
        salt=conv_id.encode(),
        info=b"vibeloop-user-to-user-message-v1",
    )

    return hkdf.derive(master)


def encrypt_text(plain_text, conv_id, aad):
    if not crypto_ready():
        raise RuntimeError("cryptography package missing. Install with: pip install cryptography")

    key = derive_conversation_key(conv_id)
    aesgcm = AESGCM(key)
    nonce = os.urandom(12)
    cipher = aesgcm.encrypt(nonce, plain_text.encode("utf-8"), aad.encode("utf-8"))

    return {
        "nonce": base64.urlsafe_b64encode(nonce).decode(),
        "ciphertext": base64.urlsafe_b64encode(cipher).decode()
    }


def decrypt_text(nonce_b64, cipher_b64, conv_id, aad):
    if not crypto_ready():
        return "[Encrypted message unavailable: cryptography missing]"

    try:
        key = derive_conversation_key(conv_id)
        aesgcm = AESGCM(key)
        nonce = base64.urlsafe_b64decode(str(nonce_b64).encode())
        cipher = base64.urlsafe_b64decode(str(cipher_b64).encode())
        plain = aesgcm.decrypt(nonce, cipher, aad.encode("utf-8"))
        return plain.decode("utf-8")
    except Exception:
        return "[Unable to decrypt message]"


def ensure_schema():
    with connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS secure_messages (
                id TEXT PRIMARY KEY,
                conversation_id TEXT,
                sender TEXT,
                receiver TEXT,
                ciphertext TEXT,
                nonce TEXT,
                preview TEXT,
                created_at TEXT,
                read_at TEXT,
                sender_archived_at TEXT,
                receiver_archived_at TEXT
            )
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_secure_messages_conversation
            ON secure_messages(conversation_id, created_at)
        """)

        conn.execute("""
            CREATE INDEX IF NOT EXISTS idx_secure_messages_user
            ON secure_messages(sender, receiver, created_at)
        """)

        conn.commit()


def ensure_users_schema():
    with sqlite3.connect(USERS_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                userId TEXT,
                name TEXT,
                username TEXT UNIQUE,
                email TEXT,
                bio TEXT,
                avatarUrl TEXT,
                bannerUrl TEXT,
                verified INTEGER DEFAULT 1,
                followers INTEGER DEFAULT 0,
                following INTEGER DEFAULT 0,
                status TEXT DEFAULT 'Active',
                role TEXT DEFAULT 'creator',
                is_private INTEGER DEFAULT 0,
                allow_messages INTEGER DEFAULT 1,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        conn.commit()


def user_allows_messages(username):
    ensure_users_schema()
    clean = clean_username(username)

    with sqlite3.connect(USERS_DB) as raw:
        raw.row_factory = sqlite3.Row
        row = raw.execute(
            "SELECT allow_messages FROM users WHERE lower(username) = lower(?) LIMIT 1",
            (clean,)
        ).fetchone()

    if not row:
        return True

    try:
        return bool(row["allow_messages"])
    except Exception:
        return True


def safe_get(row, key, default=None):
    try:
        return row[key]
    except Exception:
        return default


def row_to_message(row, viewer):
    sender = clean_username(safe_get(row, "sender", "@guest"))
    receiver = clean_username(safe_get(row, "receiver", "@guest"))
    conv_id = safe_get(row, "conversation_id", conversation_id(sender, receiver))
    msg_id = safe_get(row, "id", "")
    aad = f"{msg_id}|{conv_id}|{sender}|{receiver}"

    return {
        "id": msg_id,
        "conversationId": conv_id,
        "sender": sender,
        "receiver": receiver,
        "text": decrypt_text(
            safe_get(row, "nonce", ""),
            safe_get(row, "ciphertext", ""),
            conv_id,
            aad
        ),
        "preview": safe_get(row, "preview", "Encrypted message"),
        "createdAt": safe_get(row, "created_at", ""),
        "readAt": safe_get(row, "read_at", None),
        "mine": sender.lower() == clean_username(viewer).lower(),
        "encrypted": True
    }


@router.get("/api/v1/secure/messages/thread")
def get_secure_thread(
    user: str = Query("@guest"),
    with_user: str = Query("@creator")
):
    ensure_schema()

    me = clean_username(user)
    other = clean_username(with_user)
    conv_id = conversation_id(me, other)

    with connect() as conn:
        rows = conn.execute("""
            SELECT * FROM secure_messages
            WHERE conversation_id = ?
            AND (
                (sender = ? AND COALESCE(sender_archived_at, '') = '')
                OR
                (receiver = ? AND COALESCE(receiver_archived_at, '') = '')
            )
            ORDER BY datetime(created_at) ASC
            LIMIT 500
        """, (conv_id, me, me)).fetchall()

        conn.execute("""
            UPDATE secure_messages
            SET read_at = COALESCE(read_at, ?)
            WHERE conversation_id = ?
            AND receiver = ?
            AND COALESCE(read_at, '') = ''
        """, (now_iso(), conv_id, me))
        conn.commit()

    return {
        "success": True,
        "encrypted": True,
        "user": me,
        "with": other,
        "conversationId": conv_id,
        "messages": [row_to_message(row, me) for row in rows]
    }


@router.post("/api/v1/secure/messages/send")
def send_secure_message(payload: dict = Body(...)):
    ensure_schema()

    sender = clean_username(payload.get("sender"))
    receiver = clean_username(payload.get("receiver"))
    text = str(payload.get("text") or "").strip()

    if not crypto_ready():
        return {
            "success": False,
            "message": "cryptography package missing. Run: pip install cryptography"
        }

    if not text:
        return {"success": False, "message": "Message text is required."}

    if sender.lower() == receiver.lower():
        return {"success": False, "message": "You cannot message yourself."}

    if not user_allows_messages(receiver):
        return {"success": False, "message": "This user has disabled messages."}

    msg_id = f"SMG-{uuid.uuid4().hex[:16]}"
    conv_id = conversation_id(sender, receiver)
    aad = f"{msg_id}|{conv_id}|{sender}|{receiver}"
    encrypted = encrypt_text(text, conv_id, aad)

    preview = "Encrypted message"
    created_at = now_iso()

    with connect() as conn:
        conn.execute("""
            INSERT INTO secure_messages (
                id, conversation_id, sender, receiver,
                ciphertext, nonce, preview, created_at,
                read_at, sender_archived_at, receiver_archived_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL)
        """, (
            msg_id,
            conv_id,
            sender,
            receiver,
            encrypted["ciphertext"],
            encrypted["nonce"],
            preview,
            created_at
        ))
        conn.commit()

    return {
        "success": True,
        "message": "Encrypted message sent.",
        "item": {
            "id": msg_id,
            "conversationId": conv_id,
            "sender": sender,
            "receiver": receiver,
            "text": text,
            "preview": preview,
            "createdAt": created_at,
            "encrypted": True
        }
    }


@router.get("/api/v1/secure/messages/conversations")
def get_secure_conversations(user: str = Query("@guest")):
    ensure_schema()

    me = clean_username(user)

    with connect() as conn:
        rows = conn.execute("""
            SELECT *
            FROM secure_messages
            WHERE sender = ? OR receiver = ?
            ORDER BY datetime(created_at) DESC
            LIMIT 1000
        """, (me, me)).fetchall()

    latest = {}

    for row in rows:
        sender = clean_username(safe_get(row, "sender", ""))
        receiver = clean_username(safe_get(row, "receiver", ""))
        other = receiver if sender.lower() == me.lower() else sender

        if not other:
            continue

        if sender.lower() == me.lower() and safe_get(row, "sender_archived_at"):
            continue

        if receiver.lower() == me.lower() and safe_get(row, "receiver_archived_at"):
            continue

        if other.lower() not in latest:
            latest[other.lower()] = {
                "id": safe_get(row, "conversation_id", conversation_id(me, other)),
                "username": other,
                "name": other.replace("@", "") or "Creator",
                "lastMessage": safe_get(row, "preview", "Encrypted message"),
                "lastAt": safe_get(row, "created_at", ""),
                "encrypted": True,
                "unread": 0
            }

    return {
        "success": True,
        "encrypted": True,
        "user": me,
        "conversations": list(latest.values())
    }


@router.post("/api/v1/secure/messages/archive")
def archive_secure_thread(payload: dict = Body(...)):
    ensure_schema()

    user = clean_username(payload.get("user"))
    with_user = clean_username(payload.get("withUser") or payload.get("with_user"))
    conv_id = conversation_id(user, with_user)
    archived_at = now_iso()

    with connect() as conn:
        conn.execute("""
            UPDATE secure_messages
            SET sender_archived_at = ?
            WHERE conversation_id = ?
            AND sender = ?
        """, (archived_at, conv_id, user))

        conn.execute("""
            UPDATE secure_messages
            SET receiver_archived_at = ?
            WHERE conversation_id = ?
            AND receiver = ?
        """, (archived_at, conv_id, user))

        conn.commit()

    return {
        "success": True,
        "message": "Conversation moved to hidden archive.",
        "conversationId": conv_id
    }


@router.post("/api/v1/secure/messages/seed")
def seed_secure_messages(user: str = Query("@pradip")):
    ensure_schema()

    me = clean_username(user)

    samples = [
        ("@creator", me, "Hello, this is encrypted backend message."),
        (me, "@creator", "Good. Now our chat is stored safely."),
        ("@sambhajingrdevelopers", me, "Your website design work looks ready."),
        ("@manoj", me, "Send the reel preview when ready."),
    ]

    created = []

    for sender, receiver, text in samples:
        result = send_secure_message({
            "sender": sender,
            "receiver": receiver,
            "text": text
        })

        if result.get("success"):
            created.append(result["item"]["id"])

    return {
        "success": True,
        "message": "Secure encrypted sample messages added.",
        "items": created
    }


@router.get("/api/v1/secure/messages/health")
def secure_messages_health():
    return {
        "success": True,
        "cryptoReady": crypto_ready(),
        "db": str(DB_PATH),
        "keyFileExists": KEY_FILE.exists(),
        "message": "Secure messages route is active."
    }
