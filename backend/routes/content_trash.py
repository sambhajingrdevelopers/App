from fastapi import APIRouter
from pathlib import Path
import sqlite3
import json

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


def safe_json(value):
    try:
        return json.loads(value or "[]")
    except Exception:
        return []


def ensure_archived_column(conn, table):
    cols = [r["name"] for r in conn.execute(f"PRAGMA table_info({table})").fetchall()]
    if "archived_at" not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN archived_at TEXT")
        conn.commit()


def load_archived_posts():
    db = BASE_DIR / "vibeloop_posts.db"
    if not db.exists():
        return []

    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row
    ensure_archived_column(conn, "posts")

    rows = conn.execute("""
        SELECT *
        FROM posts
        WHERE archived_at IS NOT NULL AND archived_at != ''
        ORDER BY archived_at DESC
    """).fetchall()

    items = []
    for row in rows:
        items.append({
            "type": "post",
            "id": row["id"],
            "title": row["title"] if "title" in row.keys() else "Archived Post",
            "caption": row["caption"] if "caption" in row.keys() else "",
            "user": row["user"] if "user" in row.keys() else "@you",
            "name": row["name"] if "name" in row.keys() else "VibeLoop Creator",
            "mediaUrl": row["media_url"] if "media_url" in row.keys() else "",
            "mediaType": row["media_type"] if "media_type" in row.keys() else "image",
            "archivedAt": row["archived_at"] if "archived_at" in row.keys() else ""
        })

    conn.close()
    return items


def load_archived_reels():
    db = BASE_DIR / "vibeloop_reels.db"
    if not db.exists():
        return []

    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row
    ensure_archived_column(conn, "reels")

    rows = conn.execute("""
        SELECT *
        FROM reels
        WHERE archived_at IS NOT NULL AND archived_at != ''
        ORDER BY archived_at DESC
    """).fetchall()

    items = []
    for row in rows:
        items.append({
            "type": "reel",
            "id": row["id"],
            "title": row["title"] if "title" in row.keys() else "Archived Reel",
            "caption": row["caption"] if "caption" in row.keys() else "",
            "user": row["creator"] if "creator" in row.keys() else "@you",
            "name": row["creator"] if "creator" in row.keys() else "@you",
            "mediaUrl": row["video_url"] if "video_url" in row.keys() else "",
            "mediaType": "video",
            "archivedAt": row["archived_at"] if "archived_at" in row.keys() else ""
        })

    conn.close()
    return items


def load_archived_stories():
    db = BASE_DIR / "vibeloop_stories.db"
    if not db.exists():
        return []

    conn = sqlite3.connect(db)
    conn.row_factory = sqlite3.Row
    ensure_archived_column(conn, "stories")

    rows = conn.execute("""
        SELECT *
        FROM stories
        WHERE archived_at IS NOT NULL AND archived_at != ''
        ORDER BY archived_at DESC
    """).fetchall()

    items = []
    for row in rows:
        items.append({
            "type": "story",
            "id": row["id"],
            "title": "Archived Story",
            "caption": row["caption"] if "caption" in row.keys() else "",
            "user": row["username"] if "username" in row.keys() else "@you",
            "name": row["name"] if "name" in row.keys() else "You",
            "mediaUrl": row["media_url"] if "media_url" in row.keys() else "",
            "mediaType": row["media_type"] if "media_type" in row.keys() else "image",
            "archivedAt": row["archived_at"] if "archived_at" in row.keys() else ""
        })

    conn.close()
    return items


@router.get("/api/v1/trash")
def get_trash():
    items = []
    items.extend(load_archived_posts())
    items.extend(load_archived_reels())
    items.extend(load_archived_stories())

    items.sort(key=lambda item: item.get("archivedAt") or "", reverse=True)

    return {
        "success": True,
        "items": items,
        "total": len(items)
    }
