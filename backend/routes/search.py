from fastapi import APIRouter, Query
from pathlib import Path
import sqlite3

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent


def safe_query(db_name, sql, params=()):
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


@router.get("/api/v1/search")
def global_search(q: str = Query(default="")):
    query = f"%{q.strip().lower()}%"

    if not q.strip():
        return {
            "success": True,
            "query": q,
            "results": []
        }

    results = []

    creators = safe_query(
        "vibeloop_creators.db",
        """
        SELECT id, name, username, category, followers
        FROM creators
        WHERE lower(name) LIKE ? OR lower(username) LIKE ? OR lower(category) LIKE ?
        ORDER BY followers DESC
        LIMIT 10
        """,
        (query, query, query)
    )

    for row in creators:
        results.append({
            "type": "creator",
            "id": row["id"],
            "title": row["name"],
            "subtitle": f'{row["username"]} • {row["category"]}',
            "meta": f'{row["followers"]} followers',
            "href": "/explore"
        })

    posts = safe_query(
        "vibeloop_posts.db",
        """
        SELECT id, user, title, caption, likes
        FROM posts
        WHERE lower(title) LIKE ? OR lower(caption) LIKE ? OR lower(user) LIKE ?
        ORDER BY created_at DESC
        LIMIT 10
        """,
        (query, query, query)
    )

    for row in posts:
        results.append({
            "type": "post",
            "id": row["id"],
            "title": row["title"],
            "subtitle": f'{row["user"]} • {row["caption"][:80]}',
            "meta": f'{row["likes"]} likes',
            "href": "/home"
        })

    reels = safe_query(
        "vibeloop_reels.db",
        """
        SELECT id, title, creator, caption, views
        FROM reels
        WHERE lower(title) LIKE ? OR lower(caption) LIKE ? OR lower(creator) LIKE ?
        ORDER BY created_at DESC
        LIMIT 10
        """,
        (query, query, query)
    )

    for row in reels:
        results.append({
            "type": "reel",
            "id": row["id"],
            "title": row["title"],
            "subtitle": f'{row["creator"]} • {row["caption"][:80]}',
            "meta": f'{row["views"]} views',
            "href": "/reels"
        })

    stories = safe_query(
        "vibeloop_stories.db",
        """
        SELECT id, name, username, caption, views
        FROM stories
        WHERE lower(name) LIKE ? OR lower(username) LIKE ? OR lower(caption) LIKE ?
        ORDER BY created_at DESC
        LIMIT 10
        """,
        (query, query, query)
    )

    for row in stories:
        results.append({
            "type": "story",
            "id": row["id"],
            "title": row["name"],
            "subtitle": f'{row["username"]} • {row["caption"][:80]}',
            "meta": f'{row["views"]} views',
            "href": "/stories"
        })

    return {
        "success": True,
        "query": q,
        "count": len(results),
        "results": results
    }