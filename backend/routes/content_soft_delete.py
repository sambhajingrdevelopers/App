from fastapi import APIRouter
from pathlib import Path
from datetime import datetime
import sqlite3

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


def now_iso():
    return datetime.utcnow().isoformat()


def connect_db(db_name):
    conn = sqlite3.connect(BASE_DIR / db_name)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_archive_column(conn, table_name):
    columns = [
        row["name"]
        for row in conn.execute(f"PRAGMA table_info({table_name})").fetchall()
    ]

    if "archived_at" not in columns:
        conn.execute(f"ALTER TABLE {table_name} ADD COLUMN archived_at TEXT")


def archive_item(db_name, table_name, item_id):
    db_path = BASE_DIR / db_name

    if not db_path.exists():
        return {
            "success": False,
            "message": "Storage not found."
        }

    with connect_db(db_name) as conn:
        ensure_archive_column(conn, table_name)

        row = conn.execute(
            f"SELECT id FROM {table_name} WHERE id = ?",
            (item_id,)
        ).fetchone()

        if not row:
            return {
                "success": False,
                "message": "Item not found."
            }

        conn.execute(
            f"UPDATE {table_name} SET archived_at = ? WHERE id = ?",
            (now_iso(), item_id)
        )

        conn.commit()

    return {
        "success": True,
        "message": "Item archived successfully.",
        "id": item_id
    }


def restore_item(db_name, table_name, item_id):
    db_path = BASE_DIR / db_name

    if not db_path.exists():
        return {
            "success": False,
            "message": "Storage not found."
        }

    with connect_db(db_name) as conn:
        ensure_archive_column(conn, table_name)

        row = conn.execute(
            f"SELECT id FROM {table_name} WHERE id = ?",
            (item_id,)
        ).fetchone()

        if not row:
            return {
                "success": False,
                "message": "Item not found."
            }

        conn.execute(
            f"UPDATE {table_name} SET archived_at = NULL WHERE id = ?",
            (item_id,)
        )

        conn.commit()

    return {
        "success": True,
        "message": "Item restored successfully.",
        "id": item_id
    }


@router.post("/api/v1/posts/{post_id}/archive")
def archive_post(post_id: str):
    return archive_item("vibeloop_posts.db", "posts", post_id)


@router.post("/api/v1/posts/{post_id}/restore")
def restore_post(post_id: str):
    return restore_item("vibeloop_posts.db", "posts", post_id)


@router.post("/api/v1/reels/{reel_id}/archive")
def archive_reel(reel_id: str):
    return archive_item("vibeloop_reels.db", "reels", reel_id)


@router.post("/api/v1/reels/{reel_id}/restore")
def restore_reel(reel_id: str):
    return restore_item("vibeloop_reels.db", "reels", reel_id)


@router.post("/api/v1/stories/{story_id}/archive")
def archive_story(story_id: str):
    return archive_item("vibeloop_stories.db", "stories", story_id)


@router.post("/api/v1/stories/{story_id}/restore")
def restore_story(story_id: str):
    return restore_item("vibeloop_stories.db", "stories", story_id)
