from fastapi import APIRouter, Query
from pathlib import Path
import sqlite3

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_users.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_schema():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                username TEXT UNIQUE,
                email TEXT,
                role TEXT DEFAULT 'creator',
                status TEXT DEFAULT 'Active',
                verified INTEGER DEFAULT 1,
                followers INTEGER DEFAULT 0,
                bio TEXT DEFAULT '',
                avatar_url TEXT DEFAULT '',
                banner_url TEXT DEFAULT '',
                password_hash TEXT DEFAULT '',
                created_at TEXT,
                updated_at TEXT,
                archived_at TEXT
            )
        """)
        conn.commit()


def normalize_username(value):
    clean = str(value or "").strip()
    if not clean:
        return "@creator"
    return clean if clean.startswith("@") else f"@{clean}"


def user_dict(row):
    username = normalize_username(row["username"])
    return {
        "id": row["id"],
        "userId": row["id"],
        "type": "creator",
        "title": row["name"] or username,
        "name": row["name"] or username.replace("@", ""),
        "username": username,
        "email": row["email"] or "",
        "caption": row["bio"] or "Digital Creator",
        "bio": row["bio"] or "Digital Creator",
        "avatarUrl": row["avatar_url"] or "",
        "bannerUrl": row["banner_url"] or "",
        "verified": bool(row["verified"] or 0),
        "followers": int(row["followers"] or 0),
        "status": row["status"] or "Active"
    }


@router.get("/api/v1/users/search")
def search_users(q: str = Query("", alias="q")):
    ensure_schema()

    query = f"%{str(q or '').strip().lower()}%"

    with connect_db() as conn:
        if str(q or "").strip():
            rows = conn.execute(
                """
                SELECT * FROM users
                WHERE archived_at IS NULL
                AND (
                    lower(username) LIKE ?
                    OR lower(name) LIKE ?
                    OR lower(email) LIKE ?
                    OR lower(bio) LIKE ?
                )
                ORDER BY created_at DESC
                LIMIT 50
                """,
                (query, query, query, query)
            ).fetchall()
        else:
            rows = conn.execute(
                """
                SELECT * FROM users
                WHERE archived_at IS NULL
                ORDER BY created_at DESC
                LIMIT 50
                """
            ).fetchall()

    return {
        "success": True,
        "source": "users-db",
        "users": [user_dict(row) for row in rows],
        "results": [user_dict(row) for row in rows],
        "total": len(rows)
    }


@router.get("/api/v1/users/list")
def list_users():
    return search_users("")
