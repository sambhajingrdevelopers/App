from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import hashlib
import hmac

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_users.db"


def now_iso():
    return datetime.utcnow().isoformat()


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def normalize_username(value: str):
    clean = (value or "").strip()

    if not clean:
        return ""

    if "@" in clean and not clean.startswith("@"):
        clean = clean.split("@", 1)[0]

    clean = clean.replace(" ", "").lower()

    if not clean.startswith("@"):
        clean = f"@{clean}"

    return clean


def password_hash(password: str):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def safe_compare(a: str, b: str):
    return hmac.compare_digest(str(a or ""), str(b or ""))


def get_columns(conn):
    try:
        return [row["name"] for row in conn.execute("PRAGMA table_info(users)").fetchall()]
    except Exception:
        return []


def ensure_column(conn, column_name, column_sql):
    cols = get_columns(conn)

    if column_name not in cols:
        conn.execute(f"ALTER TABLE users ADD COLUMN {column_name} {column_sql}")


def ensure_schema():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                username TEXT UNIQUE,
                email TEXT,
                role TEXT DEFAULT 'creator',
                status TEXT DEFAULT 'Active',
                verified INTEGER DEFAULT 1,
                followers INTEGER DEFAULT 0,
                bio TEXT DEFAULT '',
                avatar_url TEXT DEFAULT '',
                banner_url TEXT DEFAULT '',
                password_hash TEXT DEFAULT '',
                created_at TEXT,
                updated_at TEXT,
                archived_at TEXT
            )
        """)

        required = {
            "name": "TEXT",
            "username": "TEXT",
            "email": "TEXT",
            "role": "TEXT DEFAULT 'creator'",
            "status": "TEXT DEFAULT 'Active'",
            "verified": "INTEGER DEFAULT 1",
            "followers": "INTEGER DEFAULT 0",
            "bio": "TEXT DEFAULT ''",
            "avatar_url": "TEXT DEFAULT ''",
            "banner_url": "TEXT DEFAULT ''",
            "password_hash": "TEXT DEFAULT ''",
            "created_at": "TEXT",
            "updated_at": "TEXT",
            "archived_at": "TEXT"
        }

        for column_name, column_sql in required.items():
            ensure_column(conn, column_name, column_sql)

        conn.commit()


def user_to_dict(row):
    return {
        "id": row["id"],
        "userId": row["id"],
        "name": row["name"] or "Creator",
        "username": row["username"],
        "email": row["email"] or "",
        "role": row["role"] or "creator",
        "status": row["status"] or "Active",
        "verified": bool(row["verified"] or 0),
        "followers": int(row["followers"] or 0),
        "bio": row["bio"] or "",
        "avatarUrl": row["avatar_url"] or "",
        "bannerUrl": row["banner_url"] or ""
    }


@router.post("/api/v1/auth/login")
def login(payload: dict = Body(...)):
    ensure_schema()

    identifier = str(
        payload.get("identifier") or
        payload.get("email") or
        payload.get("username") or
        payload.get("phone") or
        ""
    ).strip()

    password = str(payload.get("password") or "").strip()

    if not identifier:
        return {
            "success": False,
            "message": "Email, username or phone is required."
        }

    if not password:
        return {
            "success": False,
            "message": "Password is required."
        }

    if len(password) < 6:
        return {
            "success": False,
            "message": "Password must be at least 6 characters."
        }

    username = normalize_username(identifier)
    hashed = password_hash(password)

    with connect_db() as conn:
        row = conn.execute(
            """
            SELECT *
            FROM users
            WHERE username = ? OR email = ?
            LIMIT 1
            """,
            (username, identifier)
        ).fetchone()

        if not row:
            return {
                "success": False,
                "message": "Invalid login details."
            }

        stored_hash = row["password_hash"] if "password_hash" in row.keys() else ""

        if not stored_hash:
            return {
                "success": False,
                "message": "Password is not set for this account. Please register again or reset password."
            }

        if not safe_compare(stored_hash, hashed):
            return {
                "success": False,
                "message": "Invalid login details."
            }

    return {
        "success": True,
        "message": "Login successful.",
        "user": user_to_dict(row)
    }
