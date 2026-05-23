from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time
import re

router = APIRouter()
DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_reels.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def parse_count(value):
    raw = str(value or "0").strip().upper()

    try:
        if raw.endswith("K"):
            return int(float(raw[:-1]) * 1000)
        if raw.endswith("M"):
            return int(float(raw[:-1]) * 1000000)

        numbers = re.sub(r"[^0-9]", "", raw)
        return int(numbers or 0)
    except Exception:
        return 0


def format_count(value):
    value = int(value or 0)

    if value >= 1000000:
        return f"{round(value / 1000000, 1)}M"

    if value >= 1000:
        return f"{round(value / 1000, 1)}K"

    return str(value)


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

        conn.execute("""
            CREATE TABLE IF NOT EXISTS reel_actions (
                reel_id TEXT PRIMARY KEY,
                liked INTEGER DEFAULT 0,
                share_count INTEGER DEFAULT 0
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS reel_comments (
                id TEXT PRIMARY KEY,
                reel_id TEXT,
                user TEXT,
                text TEXT,
                created_at TEXT
            )
        """)

        count = conn.execute("SELECT COUNT(*) AS total FROM reels").fetchone()["total"]

        if count == 0:
            now = datetime.utcnow().isoformat()
            seed = [
                ("RL-101", "Neon Creator Drop", "@mira.creates", "A cinematic creator moment with neon lights.", "", "12.4K", "2.1K", "18", "pink", now),
                ("RL-102", "Travel Motion Reel", "@travel.dev", "Fast travel edit with smooth transitions.", "", "8.7K", "1.4K", "11", "blue", now),
                ("RL-103", "Style Loop Fit Check", "@styleloop", "Fashion reel for trending outfit inspiration.", "", "22.5K", "3.8K", "42", "purple", now)
            ]

            conn.executemany(
                "INSERT INTO reels VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                seed
            )

        conn.commit()


def get_reel(conn, reel_id):
    return conn.execute(
        "SELECT * FROM reels WHERE (archived_at IS NULL OR archived_at = '') AND id = ?",
        (reel_id,)
    ).fetchone()


def get_actions(conn, reel_id):
    row = conn.execute(
        "SELECT * FROM reel_actions WHERE reel_id = ?",
        (reel_id,)
    ).fetchone()

    if row:
        return row

    conn.execute(
        "INSERT INTO reel_actions VALUES (?, ?, ?)",
        (reel_id, 0, 0)
    )
    conn.commit()

    return conn.execute(
        "SELECT * FROM reel_actions WHERE reel_id = ?",
        (reel_id,)
    ).fetchone()


def row_to_reel(row, actions=None):
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
        "createdAt": row["created_at"],
        "liked": bool(actions["liked"]) if actions else False,
        "shareCount": int(actions["share_count"] or 0) if actions else 0
    }


def comment_to_dict(row):
    return {
        "id": row["id"],
        "reelId": row["reel_id"],
        "user": row["user"],
        "text": row["text"],
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/reels/{reel_id}/detail")
def reel_detail(reel_id: str):
    init_db()

    with connect_db() as conn:
        row = get_reel(conn, reel_id)

        if not row:
            return {
                "success": False,
                "message": "Reel not found"
            }

        actions = get_actions(conn, reel_id)

        comments = conn.execute(
            "SELECT * FROM reel_comments WHERE reel_id = ? ORDER BY created_at ASC",
            (reel_id,)
        ).fetchall()

    return {
        "success": True,
        "reel": row_to_reel(row, actions),
        "comments": [comment_to_dict(row) for row in comments]
    }


@router.post("/api/v1/reels/{reel_id}/view")
def add_reel_view(reel_id: str):
    init_db()

    with connect_db() as conn:
        row = get_reel(conn, reel_id)

        if not row:
            return {
                "success": False,
                "message": "Reel not found"
            }

        views = parse_count(row["views"]) + 1

        conn.execute(
            "UPDATE reels SET views = ? WHERE id = ?",
            (format_count(views), reel_id)
        )
        conn.commit()

        updated = get_reel(conn, reel_id)
        actions = get_actions(conn, reel_id)

    return {
        "success": True,
        "reel": row_to_reel(updated, actions)
    }


@router.post("/api/v1/reels/{reel_id}/like")
def like_reel(reel_id: str, payload: dict = Body(default={})):
    init_db()

    liked = bool(payload.get("liked"))

    with connect_db() as conn:
        row = get_reel(conn, reel_id)

        if not row:
            return {
                "success": False,
                "message": "Reel not found"
            }

        actions = get_actions(conn, reel_id)

        current_liked = bool(actions["liked"])
        likes = parse_count(row["likes"])

        if liked and not current_liked:
            likes += 1
        elif not liked and current_liked:
            likes = max(likes - 1, 0)

        conn.execute(
            "UPDATE reel_actions SET liked = ? WHERE reel_id = ?",
            (1 if liked else 0, reel_id)
        )

        conn.execute(
            "UPDATE reels SET likes = ? WHERE id = ?",
            (format_count(likes), reel_id)
        )

        conn.commit()

        updated = get_reel(conn, reel_id)
        updated_actions = get_actions(conn, reel_id)

    return {
        "success": True,
        "reel": row_to_reel(updated, updated_actions)
    }


@router.get("/api/v1/reels/{reel_id}/comments")
def reel_comments(reel_id: str):
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM reel_comments WHERE reel_id = ? ORDER BY created_at ASC",
            (reel_id,)
        ).fetchall()

    return {
        "success": True,
        "comments": [comment_to_dict(row) for row in rows]
    }


@router.post("/api/v1/reels/{reel_id}/comment")
def add_reel_comment(reel_id: str, payload: dict = Body(...)):
    init_db()

    text = str(payload.get("text") or "").strip()
    user = str(payload.get("user") or "@you").strip()

    if not text:
        return {
            "success": False,
            "message": "Comment text is required"
        }

    now = datetime.utcnow().isoformat()
    comment_id = f"RC-{int(time.time() * 1000)}"

    with connect_db() as conn:
        row = get_reel(conn, reel_id)

        if not row:
            return {
                "success": False,
                "message": "Reel not found"
            }

        conn.execute(
            "INSERT INTO reel_comments VALUES (?, ?, ?, ?, ?)",
            (comment_id, reel_id, user, text, now)
        )

        count = conn.execute(
            "SELECT COUNT(*) AS total FROM reel_comments WHERE reel_id = ?",
            (reel_id,)
        ).fetchone()["total"]

        conn.execute(
            "UPDATE reels SET comments = ? WHERE id = ?",
            (str(count), reel_id)
        )

        conn.commit()

        comment = conn.execute(
            "SELECT * FROM reel_comments WHERE id = ?",
            (comment_id,)
        ).fetchone()

        updated = get_reel(conn, reel_id)
        actions = get_actions(conn, reel_id)

    return {
        "success": True,
        "comment": comment_to_dict(comment),
        "reel": row_to_reel(updated, actions)
    }


@router.post("/api/v1/reels/{reel_id}/share")
def share_reel(reel_id: str):
    init_db()

    with connect_db() as conn:
        row = get_reel(conn, reel_id)

        if not row:
            return {
                "success": False,
                "message": "Reel not found"
            }

        actions = get_actions(conn, reel_id)
        share_count = int(actions["share_count"] or 0) + 1

        conn.execute(
            "UPDATE reel_actions SET share_count = ? WHERE reel_id = ?",
            (share_count, reel_id)
        )
        conn.commit()

        updated_actions = get_actions(conn, reel_id)

    return {
        "success": True,
        "shareCount": share_count,
        "reel": row_to_reel(row, updated_actions)
    }