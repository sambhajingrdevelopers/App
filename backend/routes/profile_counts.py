from fastapi import APIRouter, Query
from pathlib import Path
import sqlite3

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


def get_columns(conn, table_name):
    try:
        return [
            row["name"]
            for row in conn.execute(f"PRAGMA table_info({table_name})").fetchall()
        ]
    except Exception:
        return []


def ensure_archived_column(conn, table_name):
    columns = get_columns(conn, table_name)

    if "archived_at" not in columns:
        conn.execute(f"ALTER TABLE {table_name} ADD COLUMN archived_at TEXT")
        conn.commit()


def count_from_db(db_name: str, table_name: str, username: str = "@you", user_id: str = "USR-YOU") -> int:
    db_path = BASE_DIR / db_name

    if not db_path.exists():
        return 0

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row

        ensure_archived_column(conn, table_name)
        columns = get_columns(conn, table_name)

        archive_filter = "(archived_at IS NULL OR archived_at = '')"

        if "user_id" in columns:
            row = conn.execute(
                f"SELECT COUNT(*) AS total FROM {table_name} WHERE {archive_filter} AND user_id = ?",
                (user_id,)
            ).fetchone()
        elif "user" in columns:
            row = conn.execute(
                f"SELECT COUNT(*) AS total FROM {table_name} WHERE {archive_filter} AND user = ?",
                (username,)
            ).fetchone()
        elif "username" in columns:
            row = conn.execute(
                f"SELECT COUNT(*) AS total FROM {table_name} WHERE {archive_filter} AND username = ?",
                (username,)
            ).fetchone()
        elif "creator" in columns:
            row = conn.execute(
                f"SELECT COUNT(*) AS total FROM {table_name} WHERE {archive_filter} AND creator = ?",
                (username,)
            ).fetchone()
        else:
            row = conn.execute(
                f"SELECT COUNT(*) AS total FROM {table_name} WHERE {archive_filter}"
            ).fetchone()

        conn.close()
        return int(row["total"] or 0)
    except Exception:
        return 0


def get_user(username: str = "@you"):
    db_path = BASE_DIR / "vibeloop_users.db"

    fallback = {
        "id": "USR-YOU",
        "username": username,
        "followers": 0
    }

    if not db_path.exists():
        return fallback

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row

        row = conn.execute(
            "SELECT id, username, followers FROM users WHERE username = ?",
            (username,)
        ).fetchone()

        conn.close()

        if not row:
            return fallback

        return {
            "id": row["id"] or "USR-YOU",
            "username": row["username"] or username,
            "followers": int(row["followers"] or 0)
        }
    except Exception:
        return fallback


@router.get("/api/v1/profile/counts")
def profile_counts(username: str = Query(default="@you")):
    clean_username = (username or "@you").strip()

    if not clean_username.startswith("@"):
        clean_username = f"@{clean_username}"

    user = get_user(clean_username)
    user_id = user["id"]

    posts = count_from_db("vibeloop_posts.db", "posts", clean_username, user_id)
    reels = count_from_db("vibeloop_reels.db", "reels", clean_username, user_id)
    stories = count_from_db("vibeloop_stories.db", "stories", clean_username, user_id)

    return {
        "success": True,
        "username": clean_username,
        "userId": user_id,
        "counts": {
            "posts": posts,
            "reels": reels,
            "stories": stories,
            "followers": int(user["followers"] or 0)
        }
    }
