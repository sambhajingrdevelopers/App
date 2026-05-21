from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import json
import time

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
                comment_list TEXT DEFAULT '[]',
                is_own INTEGER DEFAULT 0,
                created_at TEXT
            )
        """)

        columns = [row["name"] for row in conn.execute("PRAGMA table_info(posts)").fetchall()]

        if "comment_list" not in columns:
            conn.execute("ALTER TABLE posts ADD COLUMN comment_list TEXT DEFAULT '[]'")

        if "liked" not in columns:
            conn.execute("ALTER TABLE posts ADD COLUMN liked INTEGER DEFAULT 0")

        if "saved" not in columns:
            conn.execute("ALTER TABLE posts ADD COLUMN saved INTEGER DEFAULT 0")

        conn.commit()


def get_post(conn, post_id):
    return conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()


def load_comments(row):
    try:
        return json.loads(row["comment_list"] or "[]")
    except Exception:
        return []


def row_to_post(row):
    comment_list = load_comments(row)

    return {
        "id": row["id"],
        "user": row["user"],
        "name": row["name"],
        "location": row["location"],
        "title": row["title"],
        "caption": row["caption"],
        "likes": row["likes"],
        "comments": str(len(comment_list)),
        "color": row["color"],
        "mediaUrl": row["media_url"],
        "mediaType": row["media_type"],
        "liked": bool(row["liked"]),
        "saved": bool(row["saved"]),
        "commentList": comment_list,
        "isOwn": bool(row["is_own"]),
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/posts/{post_id}/detail")
def post_detail(post_id: str):
    init_db()

    with connect_db() as conn:
        row = get_post(conn, post_id)

    if not row:
        return {
            "success": False,
            "message": "Post not found"
        }

    return {
        "success": True,
        "post": row_to_post(row),
        "comments": load_comments(row)
    }


@router.get("/api/v1/posts/{post_id}/comments")
def post_comments(post_id: str):
    init_db()

    with connect_db() as conn:
        row = get_post(conn, post_id)

    if not row:
        return {
            "success": False,
            "message": "Post not found",
            "comments": []
        }

    return {
        "success": True,
        "comments": load_comments(row)
    }


@router.post("/api/v1/posts/{post_id}/comment")
def add_post_comment(post_id: str, payload: dict = Body(...)):
    init_db()

    text = str(payload.get("text") or "").strip()
    user = str(payload.get("user") or "@you").strip()

    if not text:
        return {
            "success": False,
            "message": "Comment text is required"
        }

    with connect_db() as conn:
        row = get_post(conn, post_id)

        if not row:
            return {
                "success": False,
                "message": "Post not found"
            }

        comments = load_comments(row)

        comment = {
            "id": int(time.time() * 1000),
            "user": user,
            "text": text,
            "createdAt": datetime.utcnow().isoformat()
        }

        comments.append(comment)

        conn.execute(
            "UPDATE posts SET comment_list = ?, comments = ? WHERE id = ?",
            (json.dumps(comments), str(len(comments)), post_id)
        )
        conn.commit()

        updated = get_post(conn, post_id)

    return {
        "success": True,
        "comment": comment,
        "post": row_to_post(updated)
    }


@router.delete("/api/v1/posts/{post_id}/comments/{comment_id}")
def delete_post_comment(post_id: str, comment_id: str):
    init_db()

    with connect_db() as conn:
        row = get_post(conn, post_id)

        if not row:
            return {
                "success": False,
                "message": "Post not found"
            }

        comments = load_comments(row)

        next_comments = [
            item for item in comments
            if str(item.get("id")) != str(comment_id)
        ]

        conn.execute(
            "UPDATE posts SET comment_list = ?, comments = ? WHERE id = ?",
            (json.dumps(next_comments), str(len(next_comments)), post_id)
        )
        conn.commit()

        updated = get_post(conn, post_id)

    return {
        "success": True,
        "post": row_to_post(updated),
        "comments": next_comments
    }
