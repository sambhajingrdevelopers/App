from fastapi import APIRouter, Body, Query
from pathlib import Path
from datetime import datetime, timezone
import sqlite3
import uuid

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
USERS_DB = BASE_DIR / "vibeloop_users.db"
FOLLOW_DB = BASE_DIR / "vibeloop_follow.db"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean_username(value):
    text = str(value or "").strip()
    if not text:
        return "@guest"
    return text if text.startswith("@") else f"@{text}"


def connect(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_users_schema():
    with connect(USERS_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                userId TEXT,
                name TEXT,
                username TEXT UNIQUE,
                email TEXT,
                bio TEXT,
                avatarUrl TEXT,
                bannerUrl TEXT,
                verified INTEGER DEFAULT 1,
                followers INTEGER DEFAULT 0,
                following INTEGER DEFAULT 0,
                status TEXT DEFAULT 'Active',
                role TEXT DEFAULT 'creator',
                is_private INTEGER DEFAULT 0,
                allow_messages INTEGER DEFAULT 1,
                created_at TEXT,
                updated_at TEXT
            )
        """)
        conn.commit()


def ensure_follow_schema():
    with connect(FOLLOW_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS follows (
                id TEXT PRIMARY KEY,
                follower TEXT,
                following TEXT,
                created_at TEXT,
                archived_at TEXT
            )
        """)

        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_follow_pair
            ON follows(follower, following)
        """)

        conn.commit()


def count_followers(username):
    clean = clean_username(username)

    with connect(FOLLOW_DB) as conn:
        followers = conn.execute("""
            SELECT COUNT(*) AS c FROM follows
            WHERE following = ?
            AND COALESCE(archived_at, '') = ''
        """, (clean,)).fetchone()["c"]

        following = conn.execute("""
            SELECT COUNT(*) AS c FROM follows
            WHERE follower = ?
            AND COALESCE(archived_at, '') = ''
        """, (clean,)).fetchone()["c"]

    return followers, following


@router.get("/api/v1/follow/status")
def follow_status(
    follower: str = Query("@guest"),
    following: str = Query("@creator")
):
    ensure_follow_schema()

    follower = clean_username(follower)
    following = clean_username(following)

    with connect(FOLLOW_DB) as conn:
        row = conn.execute("""
            SELECT * FROM follows
            WHERE follower = ?
            AND following = ?
            AND COALESCE(archived_at, '') = ''
            LIMIT 1
        """, (follower, following)).fetchone()

    followers_count, following_count = count_followers(following)

    return {
        "success": True,
        "isFollowing": bool(row),
        "follower": follower,
        "following": following,
        "followers": followers_count,
        "followingCount": following_count
    }


@router.post("/api/v1/follow/toggle")
def follow_toggle(payload: dict = Body(...)):
    ensure_users_schema()
    ensure_follow_schema()

    follower = clean_username(payload.get("follower"))
    following = clean_username(payload.get("following"))

    if follower.lower() == following.lower():
        return {
            "success": False,
            "message": "You cannot follow yourself."
        }

    now = now_iso()

    with connect(FOLLOW_DB) as conn:
        row = conn.execute("""
            SELECT * FROM follows
            WHERE follower = ?
            AND following = ?
            LIMIT 1
        """, (follower, following)).fetchone()

        if row and not row["archived_at"]:
            conn.execute("""
                UPDATE follows
                SET archived_at = ?
                WHERE id = ?
            """, (now, row["id"]))
            conn.commit()

            followers_count, following_count = count_followers(following)

            return {
                "success": True,
                "isFollowing": False,
                "message": "Unfollowed.",
                "followers": followers_count,
                "followingCount": following_count
            }

        if row:
            conn.execute("""
                UPDATE follows
                SET archived_at = NULL,
                    created_at = ?
                WHERE id = ?
            """, (now, row["id"]))
            conn.commit()
        else:
            conn.execute("""
                INSERT INTO follows (
                    id, follower, following, created_at, archived_at
                )
                VALUES (?, ?, ?, ?, NULL)
            """, (f"FOL-{uuid.uuid4().hex[:14]}", follower, following, now))
            conn.commit()

    followers_count, following_count = count_followers(following)

    return {
        "success": True,
        "isFollowing": True,
        "message": "Following.",
        "followers": followers_count,
        "followingCount": following_count
    }
