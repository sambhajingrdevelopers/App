from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


def now_iso():
    return datetime.utcnow().isoformat()


def connect_db():
    conn = sqlite3.connect(BASE_DIR / "vibeloop_stories.db")
    conn.row_factory = sqlite3.Row
    return conn


def get_columns(conn):
    return [row["name"] for row in conn.execute("PRAGMA table_info(stories)").fetchall()]


def ensure_column(conn, column_name, column_sql):
    cols = get_columns(conn)
    if column_name not in cols:
        conn.execute(f"ALTER TABLE stories ADD COLUMN {column_name} {column_sql}")


def ensure_schema():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS stories (
                id TEXT PRIMARY KEY,
                user_id TEXT DEFAULT 'USR-YOU',
                name TEXT,
                username TEXT,
                media_url TEXT DEFAULT '',
                media_type TEXT DEFAULT 'image',
                caption TEXT DEFAULT '',
                views INTEGER DEFAULT 0,
                created_at TEXT,
                archived_at TEXT
            )
        """)

        required = {
            "user_id": "TEXT DEFAULT 'USR-YOU'",
            "name": "TEXT",
            "username": "TEXT",
            "media_url": "TEXT DEFAULT ''",
            "media_type": "TEXT DEFAULT 'image'",
            "caption": "TEXT DEFAULT ''",
            "views": "INTEGER DEFAULT 0",
            "created_at": "TEXT",
            "archived_at": "TEXT"
        }

        for column_name, column_sql in required.items():
            ensure_column(conn, column_name, column_sql)

        conn.commit()


def row_value(row, key, default=""):
    try:
        if key in row.keys():
            return row[key]
    except Exception:
        pass

    return default


def story_to_dict(row):
    return {
        "id": row_value(row, "id"),
        "userId": row_value(row, "user_id", "USR-YOU"),
        "name": row_value(row, "name", "VibeLoop Creator"),
        "username": row_value(row, "username", "@you"),
        "mediaUrl": row_value(row, "media_url", ""),
        "mediaType": row_value(row, "media_type", "image"),
        "caption": row_value(row, "caption", ""),
        "views": int(row_value(row, "views", 0) or 0),
        "createdAt": row_value(row, "created_at", ""),
        "archivedAt": row_value(row, "archived_at", None)
    }


@router.post("/api/v1/content/story")
def create_story_fixed(payload: dict = Body(...)):
    ensure_schema()

    story_id = f"ST-{int(time.time() * 1000)}"
    created_at = now_iso()

    story_data = {
        "id": story_id,
        "user_id": str(payload.get("userId") or "USR-YOU").strip(),
        "name": str(payload.get("name") or "VibeLoop Creator").strip(),
        "username": str(payload.get("username") or "@you").strip(),
        "media_url": str(payload.get("mediaUrl") or "").strip(),
        "media_type": str(payload.get("mediaType") or "image").strip(),
        "caption": str(payload.get("caption") or payload.get("title") or "").strip(),
        "views": 0,
        "created_at": created_at,
        "archived_at": None
    }

    with connect_db() as conn:
        columns = get_columns(conn)
        insert_data = {key: value for key, value in story_data.items() if key in columns}

        col_sql = ", ".join(insert_data.keys())
        placeholders = ", ".join(["?"] * len(insert_data))
        values = list(insert_data.values())

        conn.execute(
            f"INSERT INTO stories ({col_sql}) VALUES ({placeholders})",
            values
        )
        conn.commit()

        row = conn.execute("SELECT * FROM stories WHERE id = ?", (story_id,)).fetchone()

    return {
        "success": True,
        "story": story_to_dict(row)
    }
