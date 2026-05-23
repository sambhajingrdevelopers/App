from fastapi import APIRouter, Query
from pathlib import Path
import sqlite3

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


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


def row_value(row, key, default=""):
    try:
        if key in row.keys():
            return row[key]
    except Exception:
        pass
    return default


def creator_to_result(row):
    username = row_value(row, "username", "")
    clean = username.replace("@", "")

    return {
        "id": row_value(row, "id"),
        "type": "creator",
        "title": row_value(row, "name", "Creator"),
        "subtitle": f"{username} • {row_value(row, 'category', 'Creator')}",
        "meta": f"{row_value(row, 'followers', 0)} followers",
        "href": f"/u/{clean}",
        "color": "blue"
    }


def post_to_result(row):
    return {
        "id": row_value(row, "id"),
        "type": "post",
        "title": row_value(row, "title", "Post"),
        "subtitle": row_value(row, "caption", ""),
        "meta": f"{row_value(row, 'likes', '0')} likes • {row_value(row, 'comments', '0')} comments",
        "href": f"/post/{row_value(row, 'id')}",
        "color": row_value(row, "color", "pink")
    }


def reel_to_result(row):
    return {
        "id": row_value(row, "id"),
        "type": "reel",
        "title": row_value(row, "title", "Reel"),
        "subtitle": row_value(row, "caption", ""),
        "meta": f"{row_value(row, 'views', '0')} views • {row_value(row, 'likes', '0')} likes",
        "href": f"/reel/{row_value(row, 'id')}",
        "color": row_value(row, "color", "purple")
    }


def story_to_result(row):
    return {
        "id": row_value(row, "id"),
        "type": "story",
        "title": row_value(row, "name", "Story"),
        "subtitle": row_value(row, "caption", ""),
        "meta": f"{row_value(row, 'views', 0)} views • {row_value(row, 'username', '@you')}",
        "href": f"/story/{row_value(row, 'id')}",
        "color": "orange"
    }


@router.get("/api/v1/search/all")
def global_search(q: str = Query(default="")):
    query = (q or "").strip()
    like = f"%{query}%"

    if not query:
        creators = safe_rows(
            "vibeloop_creators.db",
            "SELECT * FROM creators ORDER BY followers DESC LIMIT 8"
        )

        posts = safe_rows(
            "vibeloop_posts.db",
            "SELECT * FROM posts WHERE (archived_at IS NULL OR archived_at = '') ORDER BY created_at DESC LIMIT 8"
        )

        reels = safe_rows(
            "vibeloop_reels.db",
            "SELECT * FROM reels WHERE (archived_at IS NULL OR archived_at = '') ORDER BY created_at DESC LIMIT 8"
        )

        stories = safe_rows(
            "vibeloop_stories.db",
            "SELECT * FROM stories WHERE (archived_at IS NULL OR archived_at = '') ORDER BY created_at DESC LIMIT 8"
        )
    else:
        creators = safe_rows(
            "vibeloop_creators.db",
            """
            SELECT * FROM creators
            WHERE lower(name) LIKE lower(?)
               OR lower(username) LIKE lower(?)
               OR lower(category) LIKE lower(?)
            ORDER BY followers DESC
            LIMIT 20
            """,
            (like, like, like)
        )

        posts = safe_rows(
            "vibeloop_posts.db",
            """
            SELECT * FROM posts
            WHERE lower(user) LIKE lower(?)
               OR lower(name) LIKE lower(?)
               OR lower(title) LIKE lower(?)
               OR lower(caption) LIKE lower(?)
               OR lower(location) LIKE lower(?)
            ORDER BY created_at DESC
            LIMIT 20
            """,
            (like, like, like, like, like)
        )

        reels = safe_rows(
            "vibeloop_reels.db",
            """
            SELECT * FROM reels
            WHERE lower(title) LIKE lower(?)
               OR lower(creator) LIKE lower(?)
               OR lower(caption) LIKE lower(?)
            ORDER BY created_at DESC
            LIMIT 20
            """,
            (like, like, like)
        )

        stories = safe_rows(
            "vibeloop_stories.db",
            """
            SELECT * FROM stories
            WHERE lower(name) LIKE lower(?)
               OR lower(username) LIKE lower(?)
               OR lower(caption) LIKE lower(?)
            ORDER BY created_at DESC
            LIMIT 20
            """,
            (like, like, like)
        )

    creator_results = [creator_to_result(row) for row in creators]
    post_results = [post_to_result(row) for row in posts]
    reel_results = [reel_to_result(row) for row in reels]
    story_results = [story_to_result(row) for row in stories]

    all_results = creator_results + post_results + reel_results + story_results

    return {
        "success": True,
        "query": query,
        "total": len(all_results),
        "creators": creator_results,
        "posts": post_results,
        "reels": reel_results,
        "stories": story_results,
        "results": all_results
    }