from fastapi import APIRouter, Query
from pathlib import Path
import sqlite3
import json
import re

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


def parse_count(value):
    if value is None:
        return 0

    raw = str(value).strip().upper()

    try:
        if raw.endswith("K"):
            return int(float(raw[:-1]) * 1000)
        if raw.endswith("M"):
            return int(float(raw[:-1]) * 1000000)

        numbers = re.sub(r"[^0-9]", "", raw)
        return int(numbers or 0)
    except Exception:
        return 0


def safe_rows(db_name, sql, params=()):
    db_path = BASE_DIR / db_name

    if not db_path.exists():
        return []

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(sql, params).fetchall()
        conn.close()
        return rows
    except Exception:
        return []


def safe_one(db_name, sql, params=()):
    rows = safe_rows(db_name, sql, params)
    return rows[0] if rows else None


def row_value(row, key, default=""):
    try:
        if row and key in row.keys():
            return row[key]
    except Exception:
        pass

    return default


def get_default_profile():
    row = safe_one(
        "vibeloop_profile.db",
        "SELECT * FROM profile WHERE id = 'default'"
    )

    if row:
        return {
            "displayName": row_value(row, "display_name", "VibeLoop Creator"),
            "username": row_value(row, "username", "@you"),
            "bio": row_value(row, "bio", "Digital creator • Reels • Stories"),
            "avatarUrl": row_value(row, "avatar_url", ""),
            "bannerUrl": row_value(row, "banner_url", "")
        }

    return {
        "displayName": "VibeLoop Creator",
        "username": "@you",
        "bio": "Digital creator • Reels • Stories",
        "avatarUrl": "",
        "bannerUrl": ""
    }


def get_creator_profile(username):
    clean_username = username.strip()

    creator = safe_one(
        "vibeloop_creators.db",
        """
        SELECT * FROM creators
        WHERE lower(username) = lower(?)
        LIMIT 1
        """,
        (clean_username,)
    )

    if creator:
        return {
            "displayName": row_value(creator, "name", "Creator"),
            "username": row_value(creator, "username", clean_username),
            "bio": row_value(creator, "category", "Digital Creator"),
            "avatarUrl": "",
            "bannerUrl": "",
            "category": row_value(creator, "category", "Digital Creator"),
            "followers": int(row_value(creator, "followers", 0) or 0),
            "isFollowing": bool(row_value(creator, "is_following", 0))
        }

    return None


def post_to_dict(row):
    comment_raw = row_value(row, "comment_list", "[]")

    try:
        comment_list = json.loads(comment_raw or "[]")
    except Exception:
        comment_list = []

    return {
        "id": row_value(row, "id"),
        "user": row_value(row, "user"),
        "name": row_value(row, "name"),
        "location": row_value(row, "location"),
        "title": row_value(row, "title"),
        "caption": row_value(row, "caption"),
        "likes": row_value(row, "likes", "0"),
        "comments": row_value(row, "comments", "0"),
        "color": row_value(row, "color", "pink"),
        "mediaUrl": row_value(row, "media_url"),
        "mediaType": row_value(row, "media_type"),
        "liked": bool(row_value(row, "liked", 0)),
        "saved": bool(row_value(row, "saved", 0)),
        "commentList": comment_list,
        "isOwn": bool(row_value(row, "is_own", 0)),
        "createdAt": row_value(row, "created_at")
    }


def reel_to_dict(row):
    return {
        "id": row_value(row, "id"),
        "title": row_value(row, "title"),
        "creator": row_value(row, "creator"),
        "caption": row_value(row, "caption"),
        "videoUrl": row_value(row, "video_url"),
        "views": row_value(row, "views", "0"),
        "likes": row_value(row, "likes", "0"),
        "comments": row_value(row, "comments", "0"),
        "color": row_value(row, "color", "pink"),
        "createdAt": row_value(row, "created_at")
    }


def story_to_dict(row):
    return {
        "id": row_value(row, "id"),
        "name": row_value(row, "name"),
        "username": row_value(row, "username"),
        "mediaUrl": row_value(row, "media_url"),
        "mediaType": row_value(row, "media_type", "image"),
        "caption": row_value(row, "caption"),
        "views": int(row_value(row, "views", 0) or 0),
        "createdAt": row_value(row, "created_at")
    }


@router.get("/api/v1/profile-dynamic")
def get_dynamic_profile(username: str = Query(default="@you")):
    requested_username = username.strip() or "@you"

    default_profile = get_default_profile()

    if requested_username in ["@you", default_profile["username"]]:
        profile = {
            **default_profile,
            "category": "Digital Creator",
            "isOwn": True,
            "isFollowing": False
        }
    else:
        creator_profile = get_creator_profile(requested_username)

        if creator_profile:
            profile = {
                **creator_profile,
                "isOwn": False
            }
        else:
            profile = {
                "displayName": requested_username.replace("@", "").replace("-", " ").title(),
                "username": requested_username,
                "bio": "Digital Creator",
                "avatarUrl": "",
                "bannerUrl": "",
                "category": "Creator",
                "isOwn": False,
                "isFollowing": False
            }

    profile_username = profile["username"]

    posts = safe_rows(
        "vibeloop_posts.db",
        """
        SELECT * FROM posts
        WHERE lower(user) = lower(?)
           OR lower(name) = lower(?)
           OR is_own = ?
        ORDER BY created_at DESC
        """,
        (
            profile_username,
            profile.get("displayName", ""),
            1 if profile.get("isOwn") else 0
        )
    )

    reels = safe_rows(
        "vibeloop_reels.db",
        """
        SELECT * FROM reels
        WHERE lower(creator) = lower(?)
        ORDER BY created_at DESC
        """,
        (profile_username,)
    )

    stories = safe_rows(
        "vibeloop_stories.db",
        """
        SELECT * FROM stories
        WHERE lower(username) = lower(?)
           OR lower(name) = lower(?)
        ORDER BY created_at DESC
        """,
        (profile_username, profile.get("displayName", ""))
    )

    creators = safe_rows("vibeloop_creators.db", "SELECT * FROM creators")

    following_count = len([
        row for row in creators
        if "is_following" in row.keys() and int(row["is_following"] or 0) == 1
    ])

    followers = int(profile.get("followers") or 0)

    if profile.get("isOwn"):
        followers = 52800
        creator_row = safe_one(
            "vibeloop_creators.db",
            "SELECT SUM(followers) AS total FROM creators"
        )
        if creator_row and row_value(creator_row, "total", None) is not None:
            followers = int(row_value(creator_row, "total", 52800) or 52800)

    saved_count = len([
        row for row in posts
        if "saved" in row.keys() and int(row["saved"] or 0) == 1
    ])

    total_likes = sum(parse_count(row_value(row, "likes", "0")) for row in posts)
    total_views = sum(parse_count(row_value(row, "views", "0")) for row in reels)

    return {
        "success": True,
        "profile": {
            **profile,
            "stats": {
                "posts": len(posts),
                "reels": len(reels),
                "stories": len(stories),
                "followers": followers,
                "following": following_count,
                "saved": saved_count,
                "likes": total_likes,
                "views": total_views
            }
        },
        "posts": [post_to_dict(row) for row in posts],
        "reels": [reel_to_dict(row) for row in reels],
        "stories": [story_to_dict(row) for row in stories]
    }
