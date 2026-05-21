from fastapi import APIRouter, Body, Query
from pathlib import Path
from datetime import datetime
import sqlite3
import time

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
                ("CR-101", "Mira Creates", "@mira.creates", "Digital Creator", 52800, 0, now),
                ("CR-102", "Travel Dev", "@travel.dev", "Travel Creator", 42100, 0, now),
                ("CR-103", "Urban Snap", "@urban.snap", "Lifestyle Creator", 31800, 0, now),
                ("CR-104", "Style Loop", "@styleloop", "Fashion Brand", 76400, 0, now),
                ("CR-105", "Founder Hub", "@founderhub", "Startup Creator", 28700, 0, now),
                ("CR-106", "Food Spark", "@foodspark", "Food Creator", 64500, 0, now),
            ]

            conn.executemany(
                "INSERT INTO creators VALUES (?, ?, ?, ?, ?, ?, ?)",
                seed
            )

        conn.commit()


def row_to_creator(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "username": row["username"],
        "category": row["category"],
        "followers": int(row["followers"] or 0),
        "isFollowing": bool(row["is_following"])
    }


def ensure_creator(conn, username):
    clean_username = username.strip()
    if not clean_username.startswith("@"):
        clean_username = f"@{clean_username}"

    row = conn.execute(
        "SELECT * FROM creators WHERE lower(username) = lower(?)",
        (clean_username,)
    ).fetchone()

    if row:
        return row

    now = datetime.utcnow().isoformat()
    creator_id = f"CR-{int(time.time() * 1000)}"
    name = clean_username.replace("@", "").replace(".", " ").replace("-", " ").title()

    conn.execute(
        "INSERT INTO creators VALUES (?, ?, ?, ?, ?, ?, ?)",
        (creator_id, name, clean_username, "Digital Creator", 0, 0, now)
    )
    conn.commit()

    return conn.execute(
        "SELECT * FROM creators WHERE id = ?",
        (creator_id,)
    ).fetchone()


@router.post("/api/v1/profile-follow")
def profile_follow(payload: dict = Body(...)):
    init_db()

    username = str(payload.get("username") or "").strip()
    follow = bool(payload.get("follow"))

    if not username:
        return {
            "success": False,
            "message": "Username is required"
        }

    if username == "@you":
        return {
            "success": False,
            "message": "You cannot follow your own profile"
        }

    with connect_db() as conn:
        row = ensure_creator(conn, username)

        current_following = bool(row["is_following"])
        followers = int(row["followers"] or 0)

        if follow and not current_following:
            followers += 1
        elif not follow and current_following:
            followers = max(followers - 1, 0)

        conn.execute(
            "UPDATE creators SET is_following = ?, followers = ? WHERE id = ?",
            (1 if follow else 0, followers, row["id"])
        )
        conn.commit()

        updated = conn.execute(
            "SELECT * FROM creators WHERE id = ?",
            (row["id"],)
        ).fetchone()

        following_count = conn.execute(
            "SELECT COUNT(*) AS total FROM creators WHERE is_following = 1"
        ).fetchone()["total"]

    return {
        "success": True,
        "creator": row_to_creator(updated),
        "followingCount": following_count
    }


@router.get("/api/v1/profile-connections")
def profile_connections(username: str = Query(default="@you")):
    init_db()

    with connect_db() as conn:
        followers_rows = conn.execute(
            "SELECT * FROM creators ORDER BY followers DESC LIMIT 30"
        ).fetchall()

        following_rows = conn.execute(
            "SELECT * FROM creators WHERE is_following = 1 ORDER BY followers DESC LIMIT 30"
        ).fetchall()

    return {
        "success": True,
        "username": username,
        "followers": [row_to_creator(row) for row in followers_rows],
        "following": [row_to_creator(row) for row in following_rows],
        "followersCount": len(followers_rows),
        "followingCount": len(following_rows)
    }
