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

        count = conn.execute("SELECT COUNT(*) AS total FROM stories").fetchone()["total"]

        if count == 0:
            now = datetime.utcnow().isoformat()

            seed = [
                ("ST-101", "Creator", "@you", "", "image", "Creator studio update.", 1240, now),
                ("ST-102", "Creator", "@you", "", "image", "Travel reel behind the scenes.", 980, now),
                ("ST-103", "Creator", "@you", "", "image", "Urban snap story.", 1540, now),
                ("ST-104", "Creator", "@you", "", "image", "Creator workspace story.", 740, now),
            ]

            conn.executemany(
                "INSERT INTO stories VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
                seed
            )

        conn.commit()


def row_to_story(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "username": row["username"],
        "mediaUrl": row["media_url"],
        "mediaType": row["media_type"],
        "caption": row["caption"],
        "views": row["views"],
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/stories")
def list_stories():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM stories WHERE (archived_at IS NULL OR archived_at = '') ORDER BY created_at DESC"
        ).fetchall()

    return {
        "success": True,
        "stories": [row_to_story(row) for row in rows]
    }


@router.post("/api/v1/stories")
def create_story(payload: dict = Body(...)):
    init_db()

    now = datetime.utcnow().isoformat()
    story_id = str(payload.get("id") or f"ST-{int(time.time() * 1000)}")

    story = {
        "id": story_id,
        "name": payload.get("name") or "You",
        "username": payload.get("username") or "@you",
        "media_url": payload.get("mediaUrl") or "",
        "media_type": payload.get("mediaType") or "image",
        "caption": payload.get("caption") or "",
        "views": int(payload.get("views") or 0),
        "created_at": now
    }

    with connect_db() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO stories (
                id, name, username, media_url, media_type, caption, views, created_at
            )
            VALUES (
                :id, :name, :username, :media_url, :media_type, :caption, :views, :created_at
            )
        """, story)
        conn.commit()

    return {
        "success": True,
        "story": {
            "id": story["id"],
            "name": story["name"],
            "username": story["username"],
            "mediaUrl": story["media_url"],
            "mediaType": story["media_type"],
            "caption": story["caption"],
            "views": story["views"],
            "createdAt": story["created_at"]
        }
    }