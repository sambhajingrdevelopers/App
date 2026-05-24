from fastapi import APIRouter, Query
from pathlib import Path
import sqlite3
import json

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


def connect_db(db_name):
    conn = sqlite3.connect(BASE_DIR / db_name)
    conn.row_factory = sqlite3.Row
    return conn


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


def safe_json(value):
    try:
        return json.loads(value or "[]")
    except Exception:
        return []


def value(row, key, default=""):
    try:
        if key in row.keys():
            return row[key]
    except Exception:
        pass

    return default


def load_posts(username, user_id):
    db_path = BASE_DIR / "vibeloop_posts.db"

    if not db_path.exists():
        return []

    conn = connect_db("vibeloop_posts.db")
    ensure_archived_column(conn, "posts")
    columns = get_columns(conn, "posts")

    if "user_id" in columns:
        rows = conn.execute(
            """
            SELECT *
            FROM posts
            WHERE (archived_at IS NULL OR archived_at = '') AND user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,)
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT *
            FROM posts
            WHERE (archived_at IS NULL OR archived_at = '') AND user = ?
            ORDER BY created_at DESC
            """,
            (username,)
        ).fetchall()

    posts = []

    for row in rows:
        posts.append({
            "id": value(row, "id"),
            "type": "post",
            "userId": value(row, "user_id", user_id),
            "user": value(row, "user", username),
            "name": value(row, "name", "VibeLoop Creator"),
            "location": value(row, "location", "VibeLoop"),
            "title": value(row, "title", "Creator Post"),
            "caption": value(row, "caption", ""),
            "likes": value(row, "likes", "0"),
            "comments": value(row, "comments", "0"),
            "color": value(row, "color", "pink"),
            "mediaUrl": value(row, "media_url", ""),
            "mediaType": value(row, "media_type", "image"),
            "liked": bool(value(row, "liked", 0)),
            "saved": bool(value(row, "saved", 0)),
            "commentList": safe_json(value(row, "comment_list", "[]")),
            "isOwn": bool(value(row, "is_own", 0)),
            "createdAt": value(row, "created_at", "")
        })

    conn.close()
    return posts


def load_reels(username, user_id):
    db_path = BASE_DIR / "vibeloop_reels.db"

    if not db_path.exists():
        return []

    conn = connect_db("vibeloop_reels.db")
    ensure_archived_column(conn, "reels")
    columns = get_columns(conn, "reels")

    if "user_id" in columns:
        rows = conn.execute(
            """
            SELECT *
            FROM reels
            WHERE (archived_at IS NULL OR archived_at = '') AND user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,)
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT *
            FROM reels
            WHERE (archived_at IS NULL OR archived_at = '') AND creator = ?
            ORDER BY created_at DESC
            """,
            (username,)
        ).fetchall()

    reels = []

    for row in rows:
        reels.append({
            "id": value(row, "id"),
            "type": "reel",
            "userId": value(row, "user_id", user_id),
            "title": value(row, "title", "Creator Reel"),
            "creator": value(row, "creator", username),
            "caption": value(row, "caption", ""),
            "videoUrl": value(row, "video_url", ""),
            "mediaUrl": value(row, "video_url", ""),
            "mediaType": "video",
            "views": value(row, "views", "0"),
            "likes": value(row, "likes", "0"),
            "comments": value(row, "comments", "0"),
            "color": value(row, "color", "purple"),
            "createdAt": value(row, "created_at", "")
        })

    conn.close()
    return reels


def load_stories(username, user_id):
    db_path = BASE_DIR / "vibeloop_stories.db"

    if not db_path.exists():
        return []

    conn = connect_db("vibeloop_stories.db")
    ensure_archived_column(conn, "stories")
    columns = get_columns(conn, "stories")

    if "user_id" in columns:
        rows = conn.execute(
            """
            SELECT *
            FROM stories
            WHERE (archived_at IS NULL OR archived_at = '') AND user_id = ?
            ORDER BY created_at DESC
            """,
            (user_id,)
        ).fetchall()
    else:
        rows = conn.execute(
            """
            SELECT *
            FROM stories
            WHERE (archived_at IS NULL OR archived_at = '') AND username = ?
            ORDER BY created_at DESC
            """,
            (username,)
        ).fetchall()

    stories = []

    for row in rows:
        stories.append({
            "id": value(row, "id"),
            "type": "story",
            "userId": value(row, "user_id", user_id),
            "name": value(row, "name", "Story"),
            "username": value(row, "username", username),
            "title": "Story",
            "caption": value(row, "caption", ""),
            "mediaUrl": value(row, "media_url", ""),
            "mediaType": value(row, "media_type", "image"),
            "views": int(value(row, "views", 0) or 0),
            "createdAt": value(row, "created_at", "")
        })

    conn.close()
    return stories


def get_user(username):
    db_path = BASE_DIR / "vibeloop_users.db"

    fallback = {
        "id": "USR-YOU",
        "username": username
    }

    if not db_path.exists():
        return fallback

    try:
        conn = connect_db("vibeloop_users.db")

        row = conn.execute(
            "SELECT id, username FROM users WHERE username = ?",
            (username,)
        ).fetchone()

        conn.close()

        if not row:
            return fallback

        return {
            "id": row["id"] or "USR-YOU",
            "username": row["username"] or username
        }
    except Exception:
        return fallback


@router.get("/api/v1/profile/content")
def profile_content(username: str = Query(default="@you")):
    clean_username = (username or "@you").strip()

    if not clean_username.startswith("@"):
        clean_username = f"@{clean_username}"

    user = get_user(clean_username)
    user_id = user["id"]

    posts = load_posts(clean_username, user_id)
    reels = load_reels(clean_username, user_id)
    stories = load_stories(clean_username, user_id)

    return {
        "success": True,
        "username": clean_username,
        "userId": user_id,
        "posts": posts,
        "reels": reels,
        "stories": stories,
        "total": len(posts) + len(reels) + len(stories)
    }
