from fastapi import APIRouter
from pathlib import Path
import sqlite3
import json

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_posts.db"


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


@router.get("/api/v1/saved-posts")
def list_saved_posts():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM posts WHERE saved = 1 ORDER BY created_at DESC"
        ).fetchall()

    return {
        "success": True,
        "posts": [row_to_post(row) for row in rows]
    }
