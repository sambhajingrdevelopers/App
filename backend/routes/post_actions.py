from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import json
import time
import re

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


def parse_count(value):
    if value is None:
        return 0

    raw = str(value).strip().upper()

    try:
        if raw.endswith("K"):
            return int(float(raw[:-1]) * 1000)
        if raw.endswith("M"):
            return int(float(raw[:-1]) * 1000000)

        numbers = re.sub(r"[^0-9]", "", raw)
        return int(numbers or 0)
    except Exception:
        return 0


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


def get_post(conn, post_id):
    return conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()


@router.post("/api/v1/posts/{post_id}/like")
def like_post(post_id: str, payload: dict = Body(...)):
    init_db()
    liked = bool(payload.get("liked"))

    with connect_db() as conn:
        row = get_post(conn, post_id)

        if not row:
            return {
                "success": False,
                "message": "Post not found in backend database"
            }

        current_liked = bool(row["liked"])
        likes = parse_count(row["likes"])

        if liked and not current_liked:
            likes += 1
        elif not liked and current_liked:
            likes = max(likes - 1, 0)

        conn.execute(
            "UPDATE posts SET liked = ?, likes = ? WHERE id = ?",
            (1 if liked else 0, str(likes), post_id)
        )
        conn.commit()

        updated = get_post(conn, post_id)

    return {
        "success": True,
        "post": row_to_post(updated)
    }


@router.post("/api/v1/posts/{post_id}/save")
def save_post(post_id: str, payload: dict = Body(...)):
    init_db()
    saved = bool(payload.get("saved"))

    with connect_db() as conn:
        row = get_post(conn, post_id)

        if not row:
            return {
                "success": False,
                "message": "Post not found in backend database"
            }

        conn.execute(
            "UPDATE posts SET saved = ? WHERE id = ?",
            (1 if saved else 0, post_id)
        )
        conn.commit()

        updated = get_post(conn, post_id)

    return {
        "success": True,
        "post": row_to_post(updated)
    }


@router.post("/api/v1/posts/{post_id}/comment")
def comment_post(post_id: str, payload: dict = Body(...)):
    init_db()

    text = str(payload.get("text") or "").strip()
    user = str(payload.get("user") or "@you").strip()

    if not text:
        return {
            "success": False,
            "message": "Comment text required"
        }

    with connect_db() as conn:
        row = get_post(conn, post_id)

        if not row:
            return {
                "success": False,
                "message": "Post not found in backend database"
            }

        comment_list = json.loads(row["comment_list"] or "[]")

        comment = {
            "id": int(time.time() * 1000),
            "user": user,
            "text": text,
            "createdAt": datetime.utcnow().isoformat()
        }

        comment_list.append(comment)

        conn.execute(
            "UPDATE posts SET comment_list = ?, comments = ? WHERE id = ?",
            (json.dumps(comment_list), str(len(comment_list)), post_id)
        )
        conn.commit()

        updated = get_post(conn, post_id)

    return {
        "success": True,
        "comment": comment,
        "post": row_to_post(updated)
    }
