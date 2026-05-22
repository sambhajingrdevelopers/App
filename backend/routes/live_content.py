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


def safe_rows(db_name, sql):
    db_path = BASE_DIR / db_name

    if not db_path.exists():
        return []

    try:
        with connect_db(db_name) as conn:
            return conn.execute(sql).fetchall()
    except Exception:
        return []


def row_value(row, key, default=""):
    try:
        if key in row.keys():
            return row[key]
    except Exception:
        pass
    return default


def post_to_dict(row):
    try:
        comment_list = json.loads(row_value(row, "comment_list", "[]") or "[]")
    except Exception:
        comment_list = []

    return {
        "id": row_value(row, "id"),
        "user": row_value(row, "user", "@you"),
        "name": row_value(row, "name", "VibeLoop Creator"),
        "location": row_value(row, "location", "VibeLoop"),
        "title": row_value(row, "title", "Creator Post"),
        "caption": row_value(row, "caption", ""),
        "likes": row_value(row, "likes", "0"),
        "comments": row_value(row, "comments", "0"),
        "color": row_value(row, "color", "pink"),
        "mediaUrl": row_value(row, "media_url", ""),
        "mediaType": row_value(row, "media_type", "image"),
        "liked": bool(row_value(row, "liked", 0)),
        "saved": bool(row_value(row, "saved", 0)),
        "commentList": comment_list,
        "isOwn": bool(row_value(row, "is_own", 0)),
        "createdAt": row_value(row, "created_at", "")
    }


def reel_to_dict(row):
    return {
        "id": row_value(row, "id"),
        "title": row_value(row, "title", "Creator Reel"),
        "creator": row_value(row, "creator", "@you"),
        "caption": row_value(row, "caption", ""),
        "videoUrl": row_value(row, "video_url", ""),
        "views": row_value(row, "views", "0"),
        "likes": row_value(row, "likes", "0"),
        "comments": row_value(row, "comments", "0"),
        "color": row_value(row, "color", "purple"),
        "createdAt": row_value(row, "created_at", "")
    }


def story_to_dict(row):
    return {
        "id": row_value(row, "id"),
        "name": row_value(row, "name", "Story"),
        "username": row_value(row, "username", "@you"),
        "mediaUrl": row_value(row, "media_url", ""),
        "mediaType": row_value(row, "media_type", "image"),
        "caption": row_value(row, "caption", ""),
        "views": int(row_value(row, "views", 0) or 0),
        "createdAt": row_value(row, "created_at", "")
    }


@router.get("/api/v1/content/home-live")
def home_live_content():
    posts = safe_rows(
        "vibeloop_posts.db",
        "SELECT * FROM posts ORDER BY created_at DESC LIMIT 50"
    )

    stories = safe_rows(
        "vibeloop_stories.db",
        "SELECT * FROM stories ORDER BY created_at DESC LIMIT 20"
    )

    reels = safe_rows(
        "vibeloop_reels.db",
        "SELECT * FROM reels ORDER BY created_at DESC LIMIT 10"
    )

    return {
        "success": True,
        "posts": [post_to_dict(row) for row in posts],
        "stories": [story_to_dict(row) for row in stories],
        "reels": [reel_to_dict(row) for row in reels]
    }


@router.get("/api/v1/content/reels-live")
def reels_live_content():
    reels = safe_rows(
        "vibeloop_reels.db",
        "SELECT * FROM reels ORDER BY created_at DESC LIMIT 80"
    )

    return {
        "success": True,
        "reels": [reel_to_dict(row) for row in reels]
    }


@router.get("/api/v1/content/stories-live")
def stories_live_content():
    stories = safe_rows(
        "vibeloop_stories.db",
        "SELECT * FROM stories ORDER BY created_at DESC LIMIT 80"
    )

    return {
        "success": True,
        "stories": [story_to_dict(row) for row in stories]
    }
