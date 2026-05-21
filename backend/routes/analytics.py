from fastapi import APIRouter
from pathlib import Path
import sqlite3
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


def safe_rows(db_name, sql):
    db_path = BASE_DIR / db_name

    if not db_path.exists():
        return []

    try:
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
        rows = conn.execute(sql).fetchall()
        conn.close()
        return rows
    except Exception:
        return []


@router.get("/api/v1/analytics")
def get_analytics():
    posts = safe_rows("vibeloop_posts.db", "SELECT * FROM posts")
    reels = safe_rows("vibeloop_reels.db", "SELECT * FROM reels")
    stories = safe_rows("vibeloop_stories.db", "SELECT * FROM stories")
    creators = safe_rows("vibeloop_creators.db", "SELECT * FROM creators")

    total_likes = sum(parse_count(row["likes"]) for row in posts if "likes" in row.keys())
    total_comments = sum(parse_count(row["comments"]) for row in posts if "comments" in row.keys())
    saved_posts = len([row for row in posts if "saved" in row.keys() and int(row["saved"] or 0) == 1])

    reel_views = sum(parse_count(row["views"]) for row in reels if "views" in row.keys())
    story_views = sum(int(row["views"] or 0) for row in stories if "views" in row.keys())

    followers = sum(int(row["followers"] or 0) for row in creators if "followers" in row.keys())
    following = len([row for row in creators if "is_following" in row.keys() and int(row["is_following"] or 0) == 1])

    total_content = max(len(posts) + len(reels) + len(stories), 1)
    engagement_rate = round(((total_likes + total_comments + saved_posts) / total_content) / 100, 2)

    return {
        "success": True,
        "analytics": {
            "profileViews": 128940 + story_views,
            "totalPosts": len(posts),
            "savedPosts": saved_posts,
            "totalLikes": total_likes,
            "totalComments": total_comments,
            "totalReels": len(reels),
            "reelViews": reel_views,
            "totalStories": len(stories),
            "storyViews": story_views,
            "followers": followers,
            "following": following,
            "engagementRate": engagement_rate,
            "growth": [
                {"label": "Mon", "views": 1200, "likes": 240, "followers": 40},
                {"label": "Tue", "views": 2200, "likes": 420, "followers": 66},
                {"label": "Wed", "views": 3100, "likes": 610, "followers": 88},
                {"label": "Thu", "views": 4200, "likes": 850, "followers": 110},
                {"label": "Fri", "views": 5900, "likes": 1200, "followers": 160},
                {"label": "Sat", "views": 7600, "likes": 1650, "followers": 220},
                {"label": "Sun", "views": 9800, "likes": 2100, "followers": 310}
            ]
        }
    }
