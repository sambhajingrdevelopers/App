from fastapi import APIRouter
from pathlib import Path
import sqlite3
import json

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


def connect_db(db_name):
    conn = sqlite3.connect(BASE_DIR / db_name)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_archived_column(conn, table):
    cols = [
        row["name"]
        for row in conn.execute(f"PRAGMA table_info({table})").fetchall()
    ]

    if "archived_at" not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN archived_at TEXT")
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


def load_posts(limit=50):
    db = BASE_DIR / "vibeloop_posts.db"

    if not db.exists():
        return []

    conn = connect_db("vibeloop_posts.db")
    ensure_archived_column(conn, "posts")

    rows = conn.execute(
        """
        SELECT *
        FROM posts
        WHERE archived_at IS NULL OR archived_at = ''
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (limit,)
    ).fetchall()

    posts = []

    for row in rows:
        posts.append({
            "id": value(row, "id"),
            "userId": value(row, "user_id", "USR-YOU"),
            "user": value(row, "user", "@you"),
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


def load_reels(limit=80):
    db = BASE_DIR / "vibeloop_reels.db"

    if not db.exists():
        return []

    conn = connect_db("vibeloop_reels.db")
    ensure_archived_column(conn, "reels")

    rows = conn.execute(
        """
        SELECT *
        FROM reels
        WHERE archived_at IS NULL OR archived_at = ''
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (limit,)
    ).fetchall()

    reels = []

    for row in rows:
        reels.append({
            "id": value(row, "id"),
            "userId": value(row, "user_id", "USR-YOU"),
            "title": value(row, "title", "Creator Reel"),
            "creator": value(row, "creator", "@you"),
            "caption": value(row, "caption", ""),
            "videoUrl": value(row, "video_url", ""),
            "views": value(row, "views", "0"),
            "likes": value(row, "likes", "0"),
            "comments": value(row, "comments", "0"),
            "color": value(row, "color", "purple"),
            "createdAt": value(row, "created_at", "")
        })

    conn.close()
    return reels


def load_stories(limit=80):
    db = BASE_DIR / "vibeloop_stories.db"

    if not db.exists():
        return []

    conn = connect_db("vibeloop_stories.db")
    ensure_archived_column(conn, "stories")

    rows = conn.execute(
        """
        SELECT *
        FROM stories
        WHERE archived_at IS NULL OR archived_at = ''
        ORDER BY created_at DESC
        LIMIT ?
        """,
        (limit,)
    ).fetchall()

    stories = []

    for row in rows:
        stories.append({
            "id": value(row, "id"),
            "userId": value(row, "user_id", "USR-YOU"),
            "name": value(row, "name", "Story"),
            "username": value(row, "username", "@you"),
            "mediaUrl": value(row, "media_url", ""),
            "mediaType": value(row, "media_type", "image"),
            "caption": value(row, "caption", ""),
            "views": int(value(row, "views", 0) or 0),
            "createdAt": value(row, "created_at", "")
        })

    conn.close()
    return stories


@router.get("/api/v1/content/home-live")
def home_live_content():
    return {
        "success": True,
        "source": "backend-soft-filter",
        "posts": load_posts(50),
        "stories": load_stories(20),
        "reels": load_reels(10)
    }


@router.get("/api/v1/content/reels-live")
def reels_live_content():
    return {
        "success": True,
        "source": "backend-soft-filter",
        "reels": load_reels(80)
    }


@router.get("/api/v1/content/stories-live")
def stories_live_content():
    return {
        "success": True,
        "source": "backend-soft-filter",
        "stories": load_stories(80)
    }
