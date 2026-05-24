from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_reels.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
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

        count = conn.execute("SELECT COUNT(*) AS total FROM reels").fetchone()["total"]

        if count == 0:
            now = datetime.utcnow().isoformat()

            seed = [
                ("REEL-101", "Fashion Drop", "@styleloop", "Premium fashion reel concept.", "", "1.2M", "42K", "1.1K", "pink", now),
                ("REEL-102", "Office Story", "@you", "Startup office creator moment.", "", "889K", "28K", "620", "blue", now),
                ("REEL-103", "Creator Life", "@creatorlife", "Daily creator lifestyle reel.", "", "2.7M", "91K", "2.4K", "purple", now)
            ]

            conn.executemany(
                "INSERT INTO reels VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                seed
            )

        conn.commit()


def row_to_reel(row):
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


@router.get("/api/v1/reels")
def list_reels():
    init_db()

    with connect_db() as conn:
        rows = conn.execute("SELECT * FROM reels WHERE (archived_at IS NULL OR archived_at = '') ORDER BY created_at DESC").fetchall()

    return {
        "success": True,
        "reels": [row_to_reel(row) for row in rows]
    }


@router.post("/api/v1/reels")
def create_reel(payload: dict = Body(...)):
    init_db()

    now = datetime.utcnow().isoformat()
    reel_id = str(payload.get("id") or f"REEL-{int(time.time() * 1000)}")

    reel = {
        "id": reel_id,
        "title": payload.get("title") or "New Creator Reel",
        "creator": payload.get("creator") or "@you",
        "caption": payload.get("caption") or "",
        "video_url": payload.get("videoUrl") or "",
        "views": payload.get("views") or "0",
        "likes": payload.get("likes") or "0",
        "comments": payload.get("comments") or "0",
        "color": payload.get("color") or "pink",
        "created_at": now
    }

    with connect_db() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO reels (
                id, title, creator, caption, video_url, views, likes, comments, color, created_at
            )
            VALUES (
                :id, :title, :creator, :caption, :video_url, :views, :likes, :comments, :color, :created_at
            )
        """, reel)
        conn.commit()

    return {
        "success": True,
        "reel": {
            "id": reel["id"],
            "title": reel["title"],
            "creator": reel["creator"],
            "caption": reel["caption"],
            "videoUrl": reel["video_url"],
            "views": reel["views"],
            "likes": reel["likes"],
            "comments": reel["comments"],
            "color": reel["color"],
            "createdAt": reel["created_at"]
        }
    }