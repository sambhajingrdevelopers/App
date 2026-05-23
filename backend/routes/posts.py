from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import json
import time

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_posts.db"

DEFAULT_STORIES = ["You", "Mira", "Dev", "Sara", "Aarav", "Zayn", "Riya"]

DEFAULT_POSTS = [
    {
        "id": "seed-1",
        "user": "@mira.creates",
        "name": "Mira",
        "location": "Mumbai",
        "title": "Creator Studio Setup",
        "caption": "A premium creator workspace built for posts, reels, stories and audience growth.",
        "likes": "12800",
        "comments": "342",
        "color": "pink",
        "liked": False,
        "saved": False,
        "commentList": [],
        "isOwn": False
    },
    {
        "id": "seed-2",
        "user": "@travel.dev",
        "name": "Dev",
        "location": "Pune Hills",
        "title": "Travel Reel Moment",
        "caption": "Discover short-form creator content with a clean and immersive reels experience.",
        "likes": "8400",
        "comments": "119",
        "color": "blue",
        "liked": False,
        "saved": False,
        "commentList": [],
        "isOwn": False
    },
    {
        "id": "seed-3",
        "user": "@urban.snap",
        "name": "Sara",
        "location": "Bengaluru",
        "title": "Urban Creator Drop",
        "caption": "A premium post interface designed for creator engagement and brand discovery.",
        "likes": "21100",
        "comments": "901",
        "color": "purple",
        "liked": False,
        "saved": False,
        "commentList": [],
        "isOwn": False
    }
]


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
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
                comment_list TEXT,
                is_own INTEGER DEFAULT 0,
                created_at TEXT
            )
        """)
        conn.commit()


def row_to_post(row):
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
        "createdAt": row["created_at"],
    }


def get_db_posts():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM posts WHERE (archived_at IS NULL OR archived_at = '') ORDER BY created_at DESC"
        ).fetchall()

    return [row_to_post(row) for row in rows]


@router.get("/api/v1/posts")
def list_posts():
    posts = get_db_posts()
    return {
        "success": True,
        "posts": posts
    }


@router.get("/api/v1/feed")
def get_feed():
    posts = get_db_posts()

    return {
        "success": True,
        "source": "backend",
        "stories": DEFAULT_STORIES,
        "posts": posts + DEFAULT_POSTS
    }


@router.post("/api/v1/posts")
def create_post(payload: dict = Body(...)):
    init_db()

    post_id = str(payload.get("id") or int(time.time() * 1000))
    now = datetime.utcnow().isoformat()

    post = {
        "id": post_id,
        "user": payload.get("user") or "@you",
        "name": payload.get("name") or "You",
        "location": payload.get("location") or "VibeLoop",
        "title": payload.get("title") or "New Creator Post",
        "caption": payload.get("caption") or "",
        "likes": str(payload.get("likes") or "0"),
        "comments": str(payload.get("comments") or "0"),
        "color": payload.get("color") or "pink",
        "media_url": payload.get("mediaUrl") or payload.get("media_url") or "",
        "media_type": payload.get("mediaType") or payload.get("media_type") or "",
        "liked": 1 if payload.get("liked") else 0,
        "saved": 1 if payload.get("saved") else 0,
        "comment_list": json.dumps(payload.get("commentList") or []),
        "is_own": 1 if payload.get("isOwn", True) else 0,
        "created_at": now
    }

    with connect_db() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO posts (
                id, user, name, location, title, caption, likes, comments,
                color, media_url, media_type, liked, saved, comment_list,
                is_own, created_at
            )
            VALUES (
                :id, :user, :name, :location, :title, :caption, :likes, :comments,
                :color, :media_url, :media_type, :liked, :saved, :comment_list,
                :is_own, :created_at
            )
        """, post)
        conn.commit()

    return {
        "success": True,
        "post": {
            "id": post_id,
            "user": post["user"],
            "name": post["name"],
            "location": post["location"],
            "title": post["title"],
            "caption": post["caption"],
            "likes": post["likes"],
            "comments": post["comments"],
            "color": post["color"],
            "mediaUrl": post["media_url"],
            "mediaType": post["media_type"],
            "liked": bool(post["liked"]),
            "saved": bool(post["saved"]),
            "commentList": json.loads(post["comment_list"]),
            "isOwn": bool(post["is_own"]),
            "createdAt": now
        }
    }


@router.delete("/api/v1/posts/{post_id}")
def delete_post(post_id: str):
    init_db()

    with connect_db() as conn:
        conn.execute("DELETE FROM posts WHERE (archived_at IS NULL OR archived_at = '') AND id = ?", (post_id,))
        conn.commit()

    return {
        "success": True,
        "deletedId": post_id
    }