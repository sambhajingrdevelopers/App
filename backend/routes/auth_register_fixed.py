from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import hashlib
import time

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_users.db"


def now_iso():
    return datetime.utcnow().isoformat()


def password_hash(password: str):
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def normalize_username(value: str):
    clean = (value or "").strip().lower()

    if not clean:
        return ""

    if "@" in clean and not clean.startswith("@"):
        clean = clean.split("@", 1)[0]

    clean = clean.replace(" ", "")

    if not clean.startswith("@"):
        clean = f"@{clean}"

    return clean


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


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


@router.post("/api/v1/auth/register")
def register(payload: dict = Body(...)):
    ensure_schema()

    name = str(payload.get("name") or payload.get("fullName") or "Creator").strip()
    email = str(payload.get("email") or "").strip().lower()
    username = normalize_username(payload.get("username") or email or name)
    password = str(payload.get("password") or "").strip()

    if not name:
        return {"success": False, "message": "Name is required."}

    if not username:
        return {"success": False, "message": "Username is required."}

    if not password:
        return {"success": False, "message": "Password is required."}

    if len(password) < 6:
        return {"success": False, "message": "Password must be at least 6 characters."}

    user_id = f"USR-{int(time.time() * 1000)}"
    ts = now_iso()

    with connect_db() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
            (username, email)
        ).fetchone()

        if existing:
            return {"success": False, "message": "User already exists. Please login."}

        conn.execute(
            """
            INSERT INTO users (
                id, name, username, email, role, status, verified, followers,
                bio, avatar_url, banner_url, password_hash, created_at, updated_at, archived_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                name,
                username,
                email,
                "creator",
                "Active",
                1,
                0,
                "Digital creator",
                "",
                "",
                password_hash(password),
                ts,
                ts,
                None
            )
        )

        conn.commit()

        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    return {
        "success": True,
        "message": "Registration successful.",
        "user": user_to_dict(row)
    }
