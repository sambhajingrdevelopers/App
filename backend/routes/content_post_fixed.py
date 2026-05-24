from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time
import json

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


def now_iso():
    return datetime.utcnow().isoformat()


def connect_db():
    conn = sqlite3.connect(BASE_DIR / "vibeloop_posts.db")
    conn.row_factory = sqlite3.Row
    return conn


def get_columns(conn):
    return [row["name"] for row in conn.execute("PRAGMA table_info(posts)").fetchall()]


def ensure_column(conn, column_name, column_sql):
    cols = get_columns(conn)
    if column_name not in cols:
        conn.execute(f"ALTER TABLE posts ADD COLUMN {column_name} {column_sql}")


def ensure_schema():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS posts (
                id TEXT PRIMARY KEY,
                user_id TEXT DEFAULT 'USR-YOU',
                user TEXT,
                name TEXT,
                location TEXT,
                title TEXT,
                caption TEXT,
                likes TEXT DEFAULT '0',
                comments TEXT DEFAULT '0',
                color TEXT DEFAULT 'pink',
                media_url TEXT DEFAULT '',
                media_type TEXT DEFAULT 'image',
                liked INTEGER DEFAULT 0,
                saved INTEGER DEFAULT 0,
                comment_list TEXT DEFAULT '[]',
                is_own INTEGER DEFAULT 0,
                created_at TEXT,
                archived_at TEXT
            )
        """)

        required = {
            "user_id": "TEXT DEFAULT 'USR-YOU'",
            "user": "TEXT",
            "name": "TEXT",
            "location": "TEXT",
            "title": "TEXT",
            "caption": "TEXT",
            "likes": "TEXT DEFAULT '0'",
            "comments": "TEXT DEFAULT '0'",
            "color": "TEXT DEFAULT 'pink'",
            "media_url": "TEXT DEFAULT ''",
            "media_type": "TEXT DEFAULT 'image'",
            "liked": "INTEGER DEFAULT 0",
            "saved": "INTEGER DEFAULT 0",
            "comment_list": "TEXT DEFAULT '[]'",
            "is_own": "INTEGER DEFAULT 0",
            "created_at": "TEXT",
            "archived_at": "TEXT"
        }

        for column_name, column_sql in required.items():
            ensure_column(conn, column_name, column_sql)

        conn.commit()


def safe_json(value):
    try:
        return json.loads(value or "[]")
    except Exception:
        return []


def row_value(row, key, default=""):
    try:
        if key in row.keys():
            return row[key]
    except Exception:
        pass
    return default


def post_to_dict(row):
    return {
        "id": row_value(row, "id"),
        "userId": row_value(row, "user_id", "USR-YOU"),
        "user": row_value(row, "user", "@you"),
        "name": row_value(row, "name", "VibeLoop Creator"),
        "location": row_value(row, "location", "VibeLoop"),
        "title": row_value(row, "title", "New Post"),
        "caption": row_value(row, "caption", ""),
        "likes": row_value(row, "likes", "0"),
        "comments": row_value(row, "comments", "0"),
        "color": row_value(row, "color", "pink"),
        "mediaUrl": row_value(row, "media_url", ""),
        "mediaType": row_value(row, "media_type", "image"),
        "liked": bool(row_value(row, "liked", 0)),
        "saved": bool(row_value(row, "saved", 0)),
        "commentList": safe_json(row_value(row, "comment_list", "[]")),
        "isOwn": bool(row_value(row, "is_own", 0)),
        "createdAt": row_value(row, "created_at", ""),
        "archivedAt": row_value(row, "archived_at", None)
    }


@router.post("/api/v1/content/post")
def create_post_fixed(payload: dict = Body(...)):
    ensure_schema()

    post_id = f"POST-{int(time.time() * 1000)}"
    created_at = now_iso()

    post_data = {
        "id": post_id,
        "user_id": str(payload.get("userId") or "USR-YOU").strip(),
        "user": str(payload.get("username") or "@you").strip(),
        "name": str(payload.get("name") or "VibeLoop Creator").strip(),
        "location": str(payload.get("location") or "VibeLoop").strip(),
        "title": str(payload.get("title") or "New Post").strip(),
        "caption": str(payload.get("caption") or "").strip(),
        "likes": "0",
        "comments": "0",
        "color": str(payload.get("color") or "pink").strip(),
        "media_url": str(payload.get("mediaUrl") or "").strip(),
        "media_type": str(payload.get("mediaType") or "image").strip(),
        "liked": 0,
        "saved": 0,
        "comment_list": "[]",
        "is_own": 1,
        "created_at": created_at,
        "archived_at": None
    }

    with connect_db() as conn:
        columns = get_columns(conn)
        insert_data = {key: value for key, value in post_data.items() if key in columns}

        col_sql = ", ".join(insert_data.keys())
        placeholders = ", ".join(["?"] * len(insert_data))
        values = list(insert_data.values())

        conn.execute(
            f"INSERT INTO posts ({col_sql}) VALUES ({placeholders})",
            values
        )
        conn.commit()

        row = conn.execute("SELECT * FROM posts WHERE id = ?", (post_id,)).fetchone()

    return {
        "success": True,
        "post": post_to_dict(row)
    }
