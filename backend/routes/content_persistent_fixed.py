from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_content.db"


def now_iso():
    return datetime.utcnow().isoformat()


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_schema():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                username TEXT,
                user TEXT,
                name TEXT,
                title TEXT,
                caption TEXT,
                location TEXT,
                media_url TEXT,
                media_type TEXT DEFAULT 'image',
                color TEXT DEFAULT 'pink',
                likes INTEGER DEFAULT 0,
                comments INTEGER DEFAULT 0,
                saved INTEGER DEFAULT 0,
                archived_at TEXT,
                created_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS reels (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                username TEXT,
                user TEXT,
                name TEXT,
                title TEXT,
                caption TEXT,
                media_url TEXT,
                video_url TEXT,
                media_type TEXT DEFAULT 'video',
                color TEXT DEFAULT 'purple',
                views INTEGER DEFAULT 0,
                likes INTEGER DEFAULT 0,
                comments INTEGER DEFAULT 0,
                archived_at TEXT,
                created_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS stories (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                username TEXT,
                user TEXT,
                name TEXT,
                title TEXT,
                caption TEXT,
                media_url TEXT,
                media_type TEXT DEFAULT 'image',
                color TEXT DEFAULT 'pink',
                views INTEGER DEFAULT 0,
                archived_at TEXT,
                created_at TEXT
            )
        """)

        conn.commit()


def clean_username(payload):
    username = (
        payload.get("username")
        or payload.get("user")
        or payload.get("handle")
        or "@you"
    )

    username = str(username).strip()

    if not username:
        username = "@you"

    if not username.startswith("@"):
        username = f"@{username}"

    return username


def clean_name(payload, username):
    return str(payload.get("name") or username.replace("@", "") or "Creator").strip()


def post_dict(row):
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "username": row["username"],
        "user": row["user"] or row["username"],
        "name": row["name"],
        "title": row["title"],
        "caption": row["caption"],
        "location": row["location"],
        "mediaUrl": row["media_url"],
        "mediaType": row["media_type"],
        "color": row["color"],
        "likes": row["likes"],
        "comments": row["comments"],
        "saved": bool(row["saved"]),
        "createdAt": row["created_at"],
        "archivedAt": row["archived_at"],
        "isOwn": True
    }


def reel_dict(row):
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "username": row["username"],
        "user": row["user"] or row["username"],
        "creator": row["username"],
        "name": row["name"],
        "title": row["title"],
        "caption": row["caption"],
        "mediaUrl": row["media_url"],
        "videoUrl": row["video_url"] or row["media_url"],
        "mediaType": row["media_type"],
        "color": row["color"],
        "views": row["views"],
        "likes": row["likes"],
        "comments": row["comments"],
        "createdAt": row["created_at"],
        "archivedAt": row["archived_at"]
    }


def story_dict(row):
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "username": row["username"],
        "user": row["user"] or row["username"],
        "name": row["name"],
        "title": row["title"],
        "caption": row["caption"],
        "mediaUrl": row["media_url"],
        "mediaType": row["media_type"],
        "color": row["color"],
        "views": row["views"],
        "createdAt": row["created_at"],
        "archivedAt": row["archived_at"]
    }


@router.post("/api/v1/content/post")
def create_post(payload: dict = Body(...)):
    ensure_schema()

    ts = now_iso()
    username = clean_username(payload)
    name = clean_name(payload, username)
    item_id = str(payload.get("id") or f"POST-{int(time.time() * 1000)}")

    with connect_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO posts (
                id, user_id, username, user, name, title, caption, location,
                media_url, media_type, color, likes, comments, saved,
                archived_at, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item_id,
                str(payload.get("userId") or payload.get("user_id") or "USR-YOU"),
                username,
                str(payload.get("user") or username),
                name,
                str(payload.get("title") or "Creator Post"),
                str(payload.get("caption") or ""),
                str(payload.get("location") or "VibeLoop"),
                str(payload.get("mediaUrl") or payload.get("media_url") or ""),
                str(payload.get("mediaType") or payload.get("media_type") or "image"),
                str(payload.get("color") or "pink"),
                int(payload.get("likes") or 0),
                int(payload.get("comments") or 0),
                int(payload.get("saved") or 0),
                None,
                ts
            )
        )
        conn.commit()
        row = conn.execute("SELECT * FROM posts WHERE id = ?", (item_id,)).fetchone()

    return {
        "success": True,
        "message": "Post created successfully.",
        "post": post_dict(row)
    }


@router.post("/api/v1/content/reel")
def create_reel(payload: dict = Body(...)):
    ensure_schema()

    ts = now_iso()
    username = clean_username(payload)
    name = clean_name(payload, username)
    item_id = str(payload.get("id") or f"RL-{int(time.time() * 1000)}")
    media_url = str(payload.get("mediaUrl") or payload.get("videoUrl") or payload.get("media_url") or "")

    with connect_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO reels (
                id, user_id, username, user, name, title, caption,
                media_url, video_url, media_type, color, views, likes, comments,
                archived_at, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item_id,
                str(payload.get("userId") or payload.get("user_id") or "USR-YOU"),
                username,
                str(payload.get("user") or username),
                name,
                str(payload.get("title") or "Creator Reel"),
                str(payload.get("caption") or ""),
                media_url,
                str(payload.get("videoUrl") or media_url),
                "video",
                str(payload.get("color") or "purple"),
                int(payload.get("views") or 0),
                int(payload.get("likes") or 0),
                int(payload.get("comments") or 0),
                None,
                ts
            )
        )
        conn.commit()
        row = conn.execute("SELECT * FROM reels WHERE id = ?", (item_id,)).fetchone()

    return {
        "success": True,
        "message": "Reel created successfully.",
        "reel": reel_dict(row)
    }


@router.post("/api/v1/content/story")
def create_story(payload: dict = Body(...)):
    ensure_schema()

    ts = now_iso()
    username = clean_username(payload)
    name = clean_name(payload, username)
    item_id = str(payload.get("id") or f"ST-{int(time.time() * 1000)}")

    with connect_db() as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO stories (
                id, user_id, username, user, name, title, caption,
                media_url, media_type, color, views, archived_at, created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item_id,
                str(payload.get("userId") or payload.get("user_id") or "USR-YOU"),
                username,
                str(payload.get("user") or username),
                name,
                str(payload.get("title") or "Story"),
                str(payload.get("caption") or ""),
                str(payload.get("mediaUrl") or payload.get("media_url") or ""),
                str(payload.get("mediaType") or payload.get("media_type") or "image"),
                str(payload.get("color") or "pink"),
                int(payload.get("views") or 0),
                None,
                ts
            )
        )
        conn.commit()
        row = conn.execute("SELECT * FROM stories WHERE id = ?", (item_id,)).fetchone()

    return {
        "success": True,
        "message": "Story created successfully.",
        "story": story_dict(row)
    }


@router.get("/api/v1/content/home-live")
def home_live():
    ensure_schema()

    with connect_db() as conn:
        posts = conn.execute(
            "SELECT * FROM posts WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 80"
        ).fetchall()

        reels = conn.execute(
            "SELECT * FROM reels WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 40"
        ).fetchall()

        stories = conn.execute(
            "SELECT * FROM stories WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 40"
        ).fetchall()

    return {
        "success": True,
        "source": "persistent-content-db",
        "posts": [post_dict(row) for row in posts],
        "reels": [reel_dict(row) for row in reels],
        "stories": [story_dict(row) for row in stories],
        "total": len(posts) + len(reels) + len(stories)
    }


@router.get("/api/v1/content/reels-live")
def reels_live():
    ensure_schema()

    with connect_db() as conn:
        reels = conn.execute(
            "SELECT * FROM reels WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 100"
        ).fetchall()

    return {
        "success": True,
        "source": "persistent-content-db",
        "reels": [reel_dict(row) for row in reels],
        "total": len(reels)
    }


@router.get("/api/v1/content/stories-live")
def stories_live():
    ensure_schema()

    with connect_db() as conn:
        stories = conn.execute(
            "SELECT * FROM stories WHERE archived_at IS NULL ORDER BY created_at DESC LIMIT 100"
        ).fetchall()

    return {
        "success": True,
        "source": "persistent-content-db",
        "stories": [story_dict(row) for row in stories],
        "total": len(stories)
    }
