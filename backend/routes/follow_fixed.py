from fastapi import APIRouter, Body, Query
from pathlib import Path
from datetime import datetime
import sqlite3

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_follow.db"


def normalize_username(value):
    clean = str(value or "").strip()
    if not clean:
        return "@guest"
    return clean if clean.startswith("@") else f"@{clean}"


def now_iso():
    return datetime.utcnow().isoformat()


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_schema():
    with connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS follows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                follower TEXT NOT NULL,
                following TEXT NOT NULL,
                created_at TEXT,
                UNIQUE(follower, following)
            )
        """)
        conn.commit()


def is_following(follower, following):
    ensure_schema()
    follower = normalize_username(follower).lower()
    following = normalize_username(following).lower()

    with connect() as conn:
        row = conn.execute(
            "SELECT id FROM follows WHERE lower(follower)=? AND lower(following)=?",
            (follower, following)
        ).fetchone()

    return row is not None


def counts(username):
    ensure_schema()
    username = normalize_username(username).lower()

    with connect() as conn:
        followers = conn.execute(
            "SELECT COUNT(*) AS total FROM follows WHERE lower(following)=?",
            (username,)
        ).fetchone()["total"]

        following = conn.execute(
            "SELECT COUNT(*) AS total FROM follows WHERE lower(follower)=?",
            (username,)
        ).fetchone()["total"]

    return {
        "followers": int(followers or 0),
        "following": int(following or 0)
    }


@router.post("/api/v1/follow/toggle")
def toggle_follow(payload: dict = Body(...)):
    ensure_schema()

    follower = normalize_username(payload.get("follower"))
    following = normalize_username(payload.get("following"))

    if follower.lower() == following.lower():
        return {
            "success": False,
            "message": "You cannot follow yourself.",
            "isFollowing": False,
            **counts(following)
        }

    already = is_following(follower, following)

    with connect() as conn:
        if already:
            conn.execute(
                "DELETE FROM follows WHERE lower(follower)=? AND lower(following)=?",
                (follower.lower(), following.lower())
            )
            message = "Unfollowed."
            next_status = False
        else:
            conn.execute(
                "INSERT OR IGNORE INTO follows (follower, following, created_at) VALUES (?, ?, ?)",
                (follower, following, now_iso())
            )
            message = "Followed."
            next_status = True

        conn.commit()

    return {
        "success": True,
        "message": message,
        "follower": follower,
        "following": following,
        "isFollowing": next_status,
        **counts(following)
    }


@router.get("/api/v1/follow/status")
def follow_status(
    follower: str = Query("@guest"),
    following: str = Query("@creator")
):
    following_clean = normalize_username(following)

    return {
        "success": True,
        "follower": normalize_username(follower),
        "following": following_clean,
        "isFollowing": is_following(follower, following),
        **counts(following_clean)
    }


@router.get("/api/v1/follow/counts")
def follow_counts(username: str = Query("@creator")):
    return {
        "success": True,
        "username": normalize_username(username),
        **counts(username)
    }
