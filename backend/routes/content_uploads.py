from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time
import json

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


def connect_db(db_name):
    conn = sqlite3.connect(BASE_DIR / db_name)
    conn.row_factory = sqlite3.Row
    return conn


def now_iso():
    return datetime.utcnow().isoformat()


def init_posts():
    with connect_db("vibeloop_posts.db") as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                user TEXT,
                name TEXT,
                location TEXT,
                title TEXT,
                caption TEXT,
                likes TEXT,
                comments TEXT,
                color TEXT,
                media_url TEXT,
                media_type TEXT,
                liked INTEGER DEFAULT 0,
                saved INTEGER DEFAULT 0,
                comment_list TEXT DEFAULT '[]',
                is_own INTEGER DEFAULT 0,
                created_at TEXT
            )
        """)
        conn.commit()


def init_reels():
    with connect_db("vibeloop_reels.db") as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reels (
                id TEXT PRIMARY KEY,
                title TEXT,
                creator TEXT,
                caption TEXT,
                video_url TEXT,
                views TEXT,
                likes TEXT,
                comments TEXT,
                color TEXT,
                created_at TEXT
            )
        """)
        conn.commit()


def init_stories():
    with connect_db("vibeloop_stories.db") as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS stories (
                id TEXT PRIMARY KEY,
                name TEXT,
                username TEXT,
                media_url TEXT,
                media_type TEXT,
                caption TEXT,
                views INTEGER DEFAULT 0,
                created_at TEXT
            )
        """)
        conn.commit()


def post_to_dict(row):
    return {
        "id": row["id"],
        "user": row["user"],
        "name": row["name"],
        "location": row["location"],
        "title": row["title"],
        "caption": row["caption"],
        "likes": row["likes"],
        "comments": row["comments"],
        "color": row["color"],
        "mediaUrl": row["media_url"],
        "mediaType": row["media_type"],
        "liked": bool(row["liked"]),
        "saved": bool(row["saved"]),
        "commentList": json.loads(row["comment_list"] or "[]"),
        "isOwn": bool(row["is_own"]),
        "createdAt": row["created_at"]
    }


def reel_to_dict(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "creator": row["creator"],
        "caption": row["caption"],
        "videoUrl": row["video_url"],
        "views": row["views"],
        "likes": row["likes"],
        "comments": row["comments"],
        "color": row["color"],
        "createdAt": row["created_at"]
    }


def story_to_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "username": row["username"],
        "mediaUrl": row["media_url"],
        "mediaType": row["media_type"],
        "caption": row["caption"],
        "views": int(row["views"] or 0),
        "createdAt": row["created_at"]
    }


@router.post("/api/v1/content/post")
def create_post(payload: dict = Body(...)):
    init_posts()

    post_id = f"POST-{int(time.time() * 1000)}"
    title = str(payload.get("title") or "New Post").strip()
    caption = str(payload.get("caption") or "").strip()
    media_url = str(payload.get("mediaUrl") or "").strip()
    media_type = str(payload.get("mediaType") or "image").strip()
    location = str(payload.get("location") or "VibeLoop").strip()
    username = str(payload.get("username") or "@you").strip()
    name = str(payload.get("name") or "VibeLoop Creator").strip()
    color = str(payload.get("color") or "pink").strip()
    created_at = now_iso()

    with connect_db("vibeloop_posts.db") as conn:
        conn.execute(
            """
            INSERT INTO posts VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                post_id,
                username,
                name,
                location,
                title,
                caption,
                "0",
                "0",
                color,
                media_url,
                media_type,
                0,
                0,
                "[]",
                1,
                created_at
            )
        )
        conn.commit()

        row = conn.execute("SELECT * FROM posts WHERE (archived_at IS NULL OR archived_at = '') AND id = ?", (post_id,)).fetchone()

    return {
        "success": True,
        "post": post_to_dict(row)
    }


@router.post("/api/v1/content/reel")
def create_reel(payload: dict = Body(...)):
    init_reels()

    reel_id = f"RL-{int(time.time() * 1000)}"
    title = str(payload.get("title") or "New Reel").strip()
    caption = str(payload.get("caption") or "").strip()
    video_url = str(payload.get("mediaUrl") or "").strip()
    creator = str(payload.get("username") or "@you").strip()
    color = str(payload.get("color") or "purple").strip()
    created_at = now_iso()

    with connect_db("vibeloop_reels.db") as conn:
        conn.execute(
            "INSERT INTO reels VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                reel_id,
                title,
                creator,
                caption,
                video_url,
                "0",
                "0",
                "0",
                color,
                created_at
            )
        )
        conn.commit()

        row = conn.execute("SELECT * FROM reels WHERE (archived_at IS NULL OR archived_at = '') AND id = ?", (reel_id,)).fetchone()

    return {
        "success": True,
        "reel": reel_to_dict(row)
    }


@router.post("/api/v1/content/story")
def create_story(payload: dict = Body(...)):
    init_stories()

    story_id = f"ST-{int(time.time() * 1000)}"
    name = str(payload.get("name") or "You").strip()
    username = str(payload.get("username") or "@you").strip()
    media_url = str(payload.get("mediaUrl") or "").strip()
    media_type = str(payload.get("mediaType") or "image").strip()
    caption = str(payload.get("caption") or "").strip()
    created_at = now_iso()

    with connect_db("vibeloop_stories.db") as conn:
        conn.execute(
            "INSERT INTO stories VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            (
                story_id,
                name,
                username,
                media_url,
                media_type,
                caption,
                0,
                created_at
            )
        )
        conn.commit()

        row = conn.execute("SELECT * FROM stories WHERE (archived_at IS NULL OR archived_at = '') AND id = ?", (story_id,)).fetchone()

    return {
        "success": True,
        "story": story_to_dict(row)
    }