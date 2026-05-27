from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import uuid

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_messages.db"


def now_iso():
    return datetime.utcnow().isoformat()


def clean_username(value):
    text = str(value or "").strip()
    if not text:
        return "@guest"
    return text if text.startswith("@") else f"@{text}"


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_schema():
    with connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                sender TEXT,
                receiver TEXT,
                text TEXT,
                created_at TEXT,
                read_at TEXT,
                archived_at TEXT
            )
        """)

        conn.commit()


def row_to_message(row):
    return {
        "id": row["id"],
        "sender": row["sender"],
        "receiver": row["receiver"],
        "text": row["text"],
        "createdAt": row["created_at"],
        "readAt": row["read_at"],
    }


@router.get("/api/v1/messages/thread")
def get_thread(user: str, with_user: str):
    ensure_schema()

    me = clean_username(user)
    other = clean_username(with_user)

    with connect() as conn:
        rows = conn.execute("""
            SELECT * FROM messages
            WHERE archived_at IS NULL
            AND (
                (sender = ? AND receiver = ?)
                OR
                (sender = ? AND receiver = ?)
            )
            ORDER BY datetime(created_at) ASC
            LIMIT 300
        """, (me, other, other, me)).fetchall()

    return {
        "success": True,
        "user": me,
        "with": other,
        "messages": [row_to_message(row) for row in rows]
    }


@router.post("/api/v1/messages/send")
def send_message(payload: dict = Body(...)):
    ensure_schema()

    sender = clean_username(payload.get("sender"))
    receiver = clean_username(payload.get("receiver"))
    text = str(payload.get("text") or "").strip()

    if not text:
        return {
            "success": False,
            "message": "Message text is required."
        }

    message_id = f"MSG-{uuid.uuid4().hex[:14]}"
    created_at = now_iso()

    with connect() as conn:
        conn.execute("""
            INSERT INTO messages (
                id, sender, receiver, text, created_at, read_at, archived_at
            )
            VALUES (?, ?, ?, ?, ?, NULL, NULL)
        """, (message_id, sender, receiver, text, created_at))
        conn.commit()

    return {
        "success": True,
        "message": "Message sent.",
        "item": {
            "id": message_id,
            "sender": sender,
            "receiver": receiver,
            "text": text,
            "createdAt": created_at,
            "readAt": None
        }
    }


@router.get("/api/v1/messages/conversations")
def get_conversations(user: str):
    ensure_schema()

    me = clean_username(user)

    with connect() as conn:
        rows = conn.execute("""
            SELECT * FROM messages
            WHERE archived_at IS NULL
            AND (sender = ? OR receiver = ?)
            ORDER BY datetime(created_at) DESC
            LIMIT 500
        """, (me, me)).fetchall()

    latest = {}

    for row in rows:
        other = row["receiver"] if row["sender"] == me else row["sender"]

        if other not in latest:
            latest[other] = {
                "id": other,
                "username": other,
                "name": other.replace("@", "") or "Creator",
                "lastMessage": row["text"],
                "lastAt": row["created_at"],
                "unread": 0
            }

    return {
        "success": True,
        "user": me,
        "conversations": list(latest.values())
    }


@router.post("/api/v1/messages/seed")
def seed_messages():
    ensure_schema()

    samples = [
        ("@creator", "@pradip", "Hello, welcome to VibeLoop."),
        ("@pradip", "@creator", "Thanks. I am testing real messages."),
        ("@sambhajingrdevelopers", "@pradip", "Your post design looks good."),
        ("@manoj", "@pradip", "Send me the reel preview."),
    ]

    inserted = []

    for sender, receiver, text in samples:
        message_id = f"MSG-SEED-{uuid.uuid4().hex[:10]}"
        created_at = now_iso()

        with connect() as conn:
            conn.execute("""
                INSERT INTO messages (
                    id, sender, receiver, text, created_at, read_at, archived_at
                )
                VALUES (?, ?, ?, ?, ?, NULL, NULL)
            """, (message_id, sender, receiver, text, created_at))
            conn.commit()

        inserted.append(message_id)

    return {
        "success": True,
        "message": "Sample backend messages added.",
        "items": inserted
    }
