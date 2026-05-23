from fastapi import APIRouter, Body, Query
from pathlib import Path
from datetime import datetime
import sqlite3
import time

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_users.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def now_iso():
    return datetime.utcnow().isoformat()


def ensure_column(conn, table_name, column_name, column_sql):
    columns = [row["name"] for row in conn.execute(f"PRAGMA table_info({table_name})").fetchall()]
    if column_name not in columns:
        conn.execute(f"ALTER TABLE {table_name} ADD COLUMN {column_name} {column_sql}")


def init_db():
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
                created_at TEXT,
                updated_at TEXT,
                archived_at TEXT
            )
        """)

        ensure_column(conn, "users", "bio", "TEXT DEFAULT ''")
        ensure_column(conn, "users", "avatar_url", "TEXT DEFAULT ''")
        ensure_column(conn, "users", "banner_url", "TEXT DEFAULT ''")
        ensure_column(conn, "users", "updated_at", "TEXT")
        ensure_column(conn, "users", "archived_at", "TEXT")

        existing = conn.execute("SELECT id FROM users WHERE username = ?", ("@you",)).fetchone()

        if not existing:
            created_at = now_iso()
            conn.execute(
                """
                INSERT INTO users (
                    id, name, username, email, role, status, verified, followers,
                    bio, avatar_url, banner_url, created_at, updated_at, archived_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    "USR-YOU",
                    "VibeLoop Creator",
                    "@you",
                    "creator@vibeloop.app",
                    "creator",
                    "Active",
                    1,
                    296300,
                    "Digital creator • Reels • Stories",
                    "",
                    "",
                    created_at,
                    created_at,
                    None
                )
            )

        conn.commit()


def user_to_dict(row):
    return {
        "id": row["id"],
        "userId": row["id"],
        "name": row["name"],
        "username": row["username"],
        "email": row["email"],
        "role": row["role"],
        "status": row["status"],
        "verified": bool(row["verified"]),
        "followers": int(row["followers"] or 0),
        "bio": row["bio"] if "bio" in row.keys() else "",
        "avatarUrl": row["avatar_url"] if "avatar_url" in row.keys() else "",
        "bannerUrl": row["banner_url"] if "banner_url" in row.keys() else "",
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"] if "updated_at" in row.keys() else row["created_at"]
    }


@router.get("/api/v1/me")
def get_current_creator(username: str = Query(default="@you")):
    init_db()

    clean_username = (username or "@you").strip()
    if not clean_username.startswith("@"):
        clean_username = f"@{clean_username}"

    with connect_db() as conn:
        row = conn.execute(
            "SELECT * FROM users WHERE username = ? AND (archived_at IS NULL OR archived_at = '')",
            (clean_username,)
        ).fetchone()

        if not row:
            row = conn.execute("SELECT * FROM users WHERE username = ?", ("@you",)).fetchone()

    return {"success": True, "user": user_to_dict(row)}


@router.post("/api/v1/session/use-creator")
def use_creator(payload: dict = Body(...)):
    init_db()

    username = str(payload.get("username") or "@you").strip()
    name = str(payload.get("name") or "VibeLoop Creator").strip()

    if not username.startswith("@"):
        username = f"@{username}"

    created_at = now_iso()
    user_id = f"USR-{int(time.time() * 1000)}"

    with connect_db() as conn:
        existing = conn.execute("SELECT * FROM users WHERE username = ?", (username,)).fetchone()

        if existing:
            return {"success": True, "user": user_to_dict(existing)}

        conn.execute(
            """
            INSERT INTO users (
                id, name, username, email, role, status, verified, followers,
                bio, avatar_url, banner_url, created_at, updated_at, archived_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                name,
                username,
                "",
                "creator",
                "Active",
                0,
                0,
                "Digital creator",
                "",
                "",
                created_at,
                created_at,
                None
            )
        )

        conn.commit()

        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    return {"success": True, "user": user_to_dict(row)}
