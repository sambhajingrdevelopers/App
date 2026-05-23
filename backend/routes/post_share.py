from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
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
            CREATE TABLE IF NOT EXISTS post_shares (
                id TEXT PRIMARY KEY,
                post_id TEXT,
                shared_by TEXT,
                platform TEXT,
                created_at TEXT
            )
        """)

        conn.commit()


@router.get("/api/v1/posts/{post_id}/shares")
def get_post_shares(post_id: str):
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM post_shares WHERE post_id = ? ORDER BY created_at DESC",
            (post_id,)
        ).fetchall()

    return {
        "success": True,
        "postId": post_id,
        "shareCount": len(rows),
        "shares": [
            {
                "id": row["id"],
                "postId": row["post_id"],
                "sharedBy": row["shared_by"],
                "platform": row["platform"],
                "createdAt": row["created_at"]
            }
            for row in rows
        ]
    }


@router.post("/api/v1/posts/{post_id}/share")
def share_post(post_id: str, payload: dict = Body(default={})):
    init_db()

    shared_by = str(payload.get("sharedBy") or "@you").strip()
    platform = str(payload.get("platform") or "copy-link").strip()
    share_id = f"SH-{int(time.time() * 1000)}"
    now = datetime.utcnow().isoformat()

    with connect_db() as conn:
        conn.execute(
            "INSERT INTO post_shares VALUES (?, ?, ?, ?, ?)",
            (share_id, post_id, shared_by, platform, now)
        )
        conn.commit()

        count = conn.execute(
            "SELECT COUNT(*) AS total FROM post_shares WHERE post_id = ?",
            (post_id,)
        ).fetchone()["total"]

    return {
        "success": True,
        "share": {
            "id": share_id,
            "postId": post_id,
            "sharedBy": shared_by,
            "platform": platform,
            "createdAt": now
        },
        "shareCount": count
    }