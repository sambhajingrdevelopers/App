from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time

router = APIRouter()
DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_stories.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
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

        conn.execute("""
            CREATE TABLE IF NOT EXISTS story_replies (
                id TEXT PRIMARY KEY,
                story_id TEXT,
                user TEXT,
                text TEXT,
                created_at TEXT
            )
        """)

        count = conn.execute("SELECT COUNT(*) AS total FROM stories").fetchone()["total"]

        if count == 0:
            now = datetime.utcnow().isoformat()
            seed = [
                ("ST-101", "You", "@you", "", "image", "Behind the scenes today", 12, now),
                ("ST-102", "Mira", "@mira.creates", "", "image", "New creator setup", 240, now),
                ("ST-103", "Style Loop", "@styleloop", "", "image", "Fashion drop preview", 510, now)
            ]

            conn.executemany(
                "INSERT INTO stories VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                seed
            )

        conn.commit()


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


def reply_to_dict(row):
    return {
        "id": row["id"],
        "storyId": row["story_id"],
        "user": row["user"],
        "text": row["text"],
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/stories/{story_id}/detail")
def story_detail(story_id: str):
    init_db()

    with connect_db() as conn:
        story = conn.execute(
            "SELECT * FROM stories WHERE id = ?",
            (story_id,)
        ).fetchone()

        replies = conn.execute(
            "SELECT * FROM story_replies WHERE story_id = ? ORDER BY created_at ASC",
            (story_id,)
        ).fetchall()

    if not story:
        return {
            "success": False,
            "message": "Story not found"
        }

    return {
        "success": True,
        "story": story_to_dict(story),
        "replies": [reply_to_dict(row) for row in replies]
    }


@router.post("/api/v1/stories/{story_id}/view")
def story_view(story_id: str):
    init_db()

    with connect_db() as conn:
        story = conn.execute(
            "SELECT * FROM stories WHERE id = ?",
            (story_id,)
        ).fetchone()

        if not story:
            return {
                "success": False,
                "message": "Story not found"
            }

        views = int(story["views"] or 0) + 1

        conn.execute(
            "UPDATE stories SET views = ? WHERE id = ?",
            (views, story_id)
        )
        conn.commit()

        updated = conn.execute(
            "SELECT * FROM stories WHERE id = ?",
            (story_id,)
        ).fetchone()

    return {
        "success": True,
        "story": story_to_dict(updated)
    }


@router.get("/api/v1/stories/{story_id}/replies")
def story_replies(story_id: str):
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM story_replies WHERE story_id = ? ORDER BY created_at ASC",
            (story_id,)
        ).fetchall()

    return {
        "success": True,
        "replies": [reply_to_dict(row) for row in rows]
    }


@router.post("/api/v1/stories/{story_id}/reply")
def story_reply(story_id: str, payload: dict = Body(...)):
    init_db()

    text = str(payload.get("text") or "").strip()
    user = str(payload.get("user") or "@you").strip()

    if not text:
        return {
            "success": False,
            "message": "Reply text is required"
        }

    now = datetime.utcnow().isoformat()
    reply_id = f"SR-{int(time.time() * 1000)}"

    with connect_db() as conn:
        story = conn.execute(
            "SELECT * FROM stories WHERE id = ?",
            (story_id,)
        ).fetchone()

        if not story:
            return {
                "success": False,
                "message": "Story not found"
            }

        conn.execute(
            "INSERT INTO story_replies VALUES (?, ?, ?, ?, ?)",
            (reply_id, story_id, user, text, now)
        )
        conn.commit()

        reply = conn.execute(
            "SELECT * FROM story_replies WHERE id = ?",
            (reply_id,)
        ).fetchone()

    return {
        "success": True,
        "reply": reply_to_dict(reply)
    }
