from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_creators.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS creators (
                id TEXT PRIMARY KEY,
                name TEXT,
                username TEXT,
                category TEXT,
                followers INTEGER,
                is_following INTEGER DEFAULT 0,
                created_at TEXT
            )
        """)

        count = conn.execute("SELECT COUNT(*) AS total FROM creators").fetchone()["total"]

        if count == 0:
            now = datetime.utcnow().isoformat()

            seed = [
                ("CR-101", "VibeLoop Creator", "@you", "Digital Creator", 52800, 0, now),
                ("CR-102", "VibeLoop Creator", "@you", "Travel Creator", 42100, 0, now),
                ("CR-103", "VibeLoop Creator", "@you", "Lifestyle Creator", 31800, 0, now),
                ("CR-104", "Style Loop", "@styleloop", "Fashion Brand", 76400, 0, now),
                ("CR-105", "Founder Hub", "@you", "Startup Creator", 28700, 0, now),
                ("CR-106", "Food Spark", "@foodspark", "Food Creator", 64500, 0, now),
            ]

            conn.executemany(
                "INSERT INTO creators VALUES (?, ?, ?, ?, ?, ?, ?)",
                seed
            )

        conn.commit()


def creator_to_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "username": row["username"],
        "category": row["category"],
        "followers": row["followers"],
        "isFollowing": bool(row["is_following"])
    }


@router.get("/api/v1/creators")
def list_creators():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM creators ORDER BY followers DESC"
        ).fetchall()

        following_count = conn.execute(
            "SELECT COUNT(*) AS total FROM creators WHERE is_following = 1"
        ).fetchone()["total"]

    return {
        "success": True,
        "creators": [creator_to_dict(row) for row in rows],
        "followingCount": following_count
    }


@router.post("/api/v1/creators/follow")
def follow_creator(payload: dict = Body(...)):
    init_db()

    creator_id = payload.get("id")
    should_follow = bool(payload.get("follow"))

    if not creator_id:
        return {
            "success": False,
            "message": "Creator id required"
        }

    with connect_db() as conn:
        row = conn.execute(
            "SELECT * FROM creators WHERE id = ?",
            (creator_id,)
        ).fetchone()

        if not row:
            return {
                "success": False,
                "message": "Creator not found"
            }

        current_following = bool(row["is_following"])

        followers = int(row["followers"] or 0)

        if should_follow and not current_following:
            followers += 1
        elif not should_follow and current_following:
            followers = max(followers - 1, 0)

        conn.execute(
            "UPDATE creators SET is_following = ?, followers = ? WHERE id = ?",
            (1 if should_follow else 0, followers, creator_id)
        )
        conn.commit()

        updated = conn.execute(
            "SELECT * FROM creators WHERE id = ?",
            (creator_id,)
        ).fetchone()

        following_count = conn.execute(
            "SELECT COUNT(*) AS total FROM creators WHERE is_following = 1"
        ).fetchone()["total"]

    return {
        "success": True,
        "creator": creator_to_dict(updated),
        "followingCount": following_count
    }