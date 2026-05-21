from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_profile.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS profile (
                id TEXT PRIMARY KEY,
                display_name TEXT,
                username TEXT,
                bio TEXT,
                avatar_url TEXT,
                banner_url TEXT,
                website TEXT,
                location TEXT,
                category TEXT,
                updated_at TEXT
            )
        """)

        count = conn.execute("SELECT COUNT(*) AS total FROM profile").fetchone()["total"]

        if count == 0:
            now = datetime.utcnow().isoformat()
            conn.execute(
                "INSERT INTO profile VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    "default",
                    "VibeLoop Creator",
                    "@you",
                    "Digital creator • Reels • Stories",
                    "",
                    "",
                    "https://vibeloop.app",
                    "India",
                    "Digital Creator",
                    now
                )
            )

        conn.commit()


def row_to_profile(row):
    return {
        "displayName": row["display_name"],
        "username": row["username"],
        "bio": row["bio"],
        "avatarUrl": row["avatar_url"],
        "bannerUrl": row["banner_url"],
        "website": row["website"],
        "location": row["location"],
        "category": row["category"],
        "updatedAt": row["updated_at"]
    }


@router.get("/api/v1/profile-settings")
def get_profile_settings():
    init_db()

    with connect_db() as conn:
        row = conn.execute(
            "SELECT * FROM profile WHERE id = 'default'"
        ).fetchone()

    return {
        "success": True,
        "profile": row_to_profile(row)
    }


@router.post("/api/v1/profile-settings")
def update_profile_settings(payload: dict = Body(...)):
    init_db()

    display_name = str(payload.get("displayName") or "VibeLoop Creator").strip()
    username = str(payload.get("username") or "@you").strip()
    bio = str(payload.get("bio") or "").strip()
    avatar_url = str(payload.get("avatarUrl") or "").strip()
    banner_url = str(payload.get("bannerUrl") or "").strip()
    website = str(payload.get("website") or "").strip()
    location = str(payload.get("location") or "").strip()
    category = str(payload.get("category") or "Digital Creator").strip()

    if not username.startswith("@"):
        username = "@" + username

    now = datetime.utcnow().isoformat()

    with connect_db() as conn:
        conn.execute("""
            INSERT OR REPLACE INTO profile (
                id, display_name, username, bio, avatar_url, banner_url,
                website, location, category, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            "default",
            display_name,
            username,
            bio,
            avatar_url,
            banner_url,
            website,
            location,
            category,
            now
        ))

        conn.commit()

        row = conn.execute(
            "SELECT * FROM profile WHERE id = 'default'"
        ).fetchone()

    return {
        "success": True,
        "profile": row_to_profile(row)
    }
