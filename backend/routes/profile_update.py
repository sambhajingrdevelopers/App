from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3

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
            ts = now_iso()
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
                    ts,
                    ts,
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


@router.post("/api/v1/profile/update")
def update_profile(payload: dict = Body(...)):
    init_db()

    old_username = str(payload.get("oldUsername") or payload.get("username") or "@you").strip()
    username = str(payload.get("username") or old_username).strip()
    name = str(payload.get("name") or "VibeLoop Creator").strip()
    bio = str(payload.get("bio") or "").strip()
    avatar_url = str(payload.get("avatarUrl") or "").strip()
    banner_url = str(payload.get("bannerUrl") or "").strip()

    if not old_username.startswith("@"):
        old_username = f"@{old_username}"

    if not username.startswith("@"):
        username = f"@{username}"

    if not name:
        name = "VibeLoop Creator"

    if len(username) < 2:
        return {"success": False, "message": "Username is required."}

    with connect_db() as conn:
        current = conn.execute(
            "SELECT * FROM users WHERE username = ?",
            (old_username,)
        ).fetchone()

        if not current:
            current = conn.execute(
                "SELECT * FROM users WHERE username = ?",
                ("@you",)
            ).fetchone()

        duplicate = conn.execute(
            "SELECT id FROM users WHERE username = ? AND id != ?",
            (username, current["id"])
        ).fetchone()

        if duplicate:
            return {"success": False, "message": "Username already exists."}

        conn.execute(
            """
            UPDATE users
            SET name = ?, username = ?, bio = ?, avatar_url = ?, banner_url = ?, updated_at = ?
            WHERE id = ?
            """,
            (name, username, bio, avatar_url, banner_url, now_iso(), current["id"])
        )

        conn.commit()

        row = conn.execute(
            "SELECT * FROM users WHERE id = ?",
            (current["id"],)
        ).fetchone()

    return {
        "success": True,
        "message": "Profile updated successfully.",
        "user": user_to_dict(row)
    }
