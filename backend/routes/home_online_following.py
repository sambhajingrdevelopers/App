from fastapi import APIRouter, Query
from pathlib import Path
import sqlite3
from datetime import datetime, timedelta

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent
USERS_DB = BASE_DIR / "vibeloop_users.db"


def connect_db():
    conn = sqlite3.connect(USERS_DB)
    conn.row_factory = sqlite3.Row
    return conn


def columns(conn, table):
    try:
        return [row["name"] for row in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    except Exception:
        return []


def ensure_schema():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS follows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                follower_username TEXT,
                following_username TEXT,
                created_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_presence (
                username TEXT PRIMARY KEY,
                online INTEGER DEFAULT 1,
                last_seen TEXT
            )
        """)

        conn.commit()


def user_row_to_dict(row, online=True):
    return {
        "id": row["id"] if "id" in row.keys() else row["username"],
        "name": row["name"] if "name" in row.keys() and row["name"] else "Creator",
        "username": row["username"] if "username" in row.keys() else "@you",
        "avatarUrl": row["avatar_url"] if "avatar_url" in row.keys() else "",
        "online": bool(online),
        "hasStory": True
    }


def is_online(conn, username):
    try:
        row = conn.execute(
            "SELECT online, last_seen FROM user_presence WHERE username = ?",
            (username,)
        ).fetchone()

        if not row:
            return True

        if int(row["online"] or 0) == 1:
            return True

        last_seen = row["last_seen"]
        if not last_seen:
            return False

        try:
            dt = datetime.fromisoformat(last_seen)
            return dt >= datetime.utcnow() - timedelta(minutes=10)
        except Exception:
            return False
    except Exception:
        return True


@router.get("/api/v1/home/online-following")
def online_following(username: str = Query(default="@you")):
    ensure_schema()

    clean_username = (username or "@you").strip()
    if not clean_username.startswith("@"):
        clean_username = f"@{clean_username}"

    if not USERS_DB.exists():
        return {"success": True, "users": []}

    with connect_db() as conn:
        followed = conn.execute(
            """
            SELECT following_username
            FROM follows
            WHERE follower_username = ?
            ORDER BY id DESC
            LIMIT 20
            """,
            (clean_username,)
        ).fetchall()

        usernames = [row["following_username"] for row in followed if row["following_username"]]

        if not usernames:
            current = conn.execute(
                "SELECT * FROM users WHERE username = ?",
                (clean_username,)
            ).fetchone()

            if not current:
                return {"success": True, "users": []}

            return {
                "success": True,
                "users": [user_row_to_dict(current, True)]
            }

        users = []

        for followed_username in usernames:
            row = conn.execute(
                "SELECT * FROM users WHERE username = ?",
                (followed_username,)
            ).fetchone()

            if row:
                users.append(user_row_to_dict(row, is_online(conn, followed_username)))

    return {
        "success": True,
        "users": users
    }
