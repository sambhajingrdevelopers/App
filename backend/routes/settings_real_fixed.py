from fastapi import APIRouter, Body, Query
from pathlib import Path
from datetime import datetime, timezone
import sqlite3
import uuid

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
USERS_DB = BASE_DIR / "vibeloop_users.db"
CONTENT_DB = BASE_DIR / "vibeloop_content.db"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean_username(value):
    text = str(value or "").strip()
    if not text:
        return "@you"
    return text if text.startswith("@") else f"@{text}"


def connect(db_path):
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_users_schema():
    with connect(USERS_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                userId TEXT,
                name TEXT,
                username TEXT UNIQUE,
                email TEXT,
                bio TEXT,
                avatarUrl TEXT,
                bannerUrl TEXT,
                verified INTEGER DEFAULT 1,
                followers INTEGER DEFAULT 0,
                following INTEGER DEFAULT 0,
                status TEXT DEFAULT 'Active',
                role TEXT DEFAULT 'creator',
                is_private INTEGER DEFAULT 0,
                allow_messages INTEGER DEFAULT 1,
                created_at TEXT,
                updated_at TEXT
            )
        """)

        existing = {row[1] for row in conn.execute("PRAGMA table_info(users)").fetchall()}

        required = {
            "id": "TEXT",
            "userId": "TEXT",
            "name": "TEXT",
            "username": "TEXT",
            "email": "TEXT",
            "bio": "TEXT",
            "avatarUrl": "TEXT",
            "bannerUrl": "TEXT",
            "verified": "INTEGER DEFAULT 1",
            "followers": "INTEGER DEFAULT 0",
            "following": "INTEGER DEFAULT 0",
            "status": "TEXT DEFAULT 'Active'",
            "role": "TEXT DEFAULT 'creator'",
            "is_private": "INTEGER DEFAULT 0",
            "allow_messages": "INTEGER DEFAULT 1",
            "created_at": "TEXT",
            "updated_at": "TEXT",
        }

        for col, col_type in required.items():
            if col not in existing:
                conn.execute(f"ALTER TABLE users ADD COLUMN {col} {col_type}")

        conn.commit()


def ensure_content_schema():
    with connect(CONTENT_DB) as conn:
        for table in ["posts", "reels", "stories"]:
            conn.execute(f"""
                CREATE TABLE IF NOT EXISTS {table} (
                    id TEXT PRIMARY KEY,
                    kind TEXT,
                    title TEXT,
                    caption TEXT,
                    username TEXT,
                    user TEXT,
                    name TEXT,
                    media_url TEXT,
                    video_url TEXT,
                    media_type TEXT,
                    location TEXT,
                    likes INTEGER DEFAULT 0,
                    comments INTEGER DEFAULT 0,
                    views INTEGER DEFAULT 0,
                    created_at TEXT,
                    updated_at TEXT,
                    archived_at TEXT
                )
            """)
        conn.commit()


def safe_get(row, key, default=None):
    try:
        return row[key]
    except Exception:
        return default


def row_to_user(row, viewer="@guest"):
    username = clean_username(safe_get(row, "username", "@you"))
    viewer_username = clean_username(viewer)

    return {
        "id": safe_get(row, "id", username),
        "userId": safe_get(row, "userId", safe_get(row, "id", username)),
        "name": safe_get(row, "name", username.replace("@", "") or "Creator"),
        "username": username,
        "email": safe_get(row, "email", ""),
        "bio": safe_get(row, "bio", "Digital Creator"),
        "avatarUrl": safe_get(row, "avatarUrl", ""),
        "bannerUrl": safe_get(row, "bannerUrl", ""),
        "verified": bool(safe_get(row, "verified", 1)),
        "followers": int(safe_get(row, "followers", 0) or 0),
        "following": int(safe_get(row, "following", 0) or 0),
        "status": safe_get(row, "status", "Active"),
        "role": safe_get(row, "role", "creator"),
        "isPrivate": bool(safe_get(row, "is_private", 0)),
        "allowMessages": bool(safe_get(row, "allow_messages", 1)),
        "isOwner": username.lower() == viewer_username.lower(),
        "createdAt": safe_get(row, "created_at", ""),
        "updatedAt": safe_get(row, "updated_at", ""),
    }


def create_default_user(username):
    clean = clean_username(username)
    uid = f"USR-{uuid.uuid4().hex[:12]}"
    now = now_iso()

    with connect(USERS_DB) as conn:
        conn.execute("""
            INSERT OR IGNORE INTO users (
                id, userId, name, username, email, bio, avatarUrl, bannerUrl,
                verified, followers, following, status, role,
                is_private, allow_messages, created_at, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 0, 'Active', 'creator', 0, 1, ?, ?)
        """, (
            uid,
            uid,
            clean.replace("@", "") or "Creator",
            clean,
            "",
            "Digital Creator",
            "",
            "",
            now,
            now
        ))
        conn.commit()


def get_user(username):
    ensure_users_schema()
    clean = clean_username(username)

    with connect(USERS_DB) as conn:
        row = conn.execute("""
            SELECT * FROM users
            WHERE lower(username) = lower(?)
            LIMIT 1
        """, (clean,)).fetchone()

    if not row:
        create_default_user(clean)

        with connect(USERS_DB) as conn:
            row = conn.execute("""
                SELECT * FROM users
                WHERE lower(username) = lower(?)
                LIMIT 1
            """, (clean,)).fetchone()

    return row


def content_item(row, fallback_kind):
    return {
        "id": safe_get(row, "id", ""),
        "kind": safe_get(row, "kind", fallback_kind),
        "type": safe_get(row, "kind", fallback_kind),
        "title": safe_get(row, "title", fallback_kind),
        "caption": safe_get(row, "caption", ""),
        "username": safe_get(row, "username", safe_get(row, "user", "")),
        "user": safe_get(row, "user", safe_get(row, "username", "")),
        "name": safe_get(row, "name", "Creator"),
        "mediaUrl": safe_get(row, "media_url", ""),
        "videoUrl": safe_get(row, "video_url", ""),
        "mediaType": safe_get(row, "media_type", "image"),
        "likes": safe_get(row, "likes", 0),
        "comments": safe_get(row, "comments", 0),
        "views": safe_get(row, "views", 0),
        "createdAt": safe_get(row, "created_at", ""),
    }


def user_content(username):
    ensure_content_schema()
    clean = clean_username(username)

    result = {}

    with connect(CONTENT_DB) as conn:
        for table, kind in [("posts", "post"), ("reels", "reel"), ("stories", "story")]:
            rows = conn.execute(f"""
                SELECT * FROM {table}
                WHERE COALESCE(archived_at, '') = ''
                AND lower(COALESCE(username, user, '')) = lower(?)
                ORDER BY datetime(created_at) DESC
                LIMIT 200
            """, (clean,)).fetchall()

            result[table] = [content_item(row, kind) for row in rows]

    return result


@router.get("/api/v1/settings/profile")
def get_settings_profile(username: str = Query("@you")):
    row = get_user(username)

    return {
        "success": True,
        "user": row_to_user(row, username)
    }


@router.post("/api/v1/settings/profile/update")
def update_settings_profile(payload: dict = Body(...)):
    ensure_users_schema()

    username = clean_username(payload.get("username"))
    row = get_user(username)

    current = row_to_user(row, username)

    name = str(payload.get("name") or current["name"]).strip()
    bio = str(payload.get("bio") or current["bio"]).strip()
    email = str(payload.get("email") or current["email"]).strip()
    avatar_url = str(payload.get("avatarUrl") or current["avatarUrl"]).strip()
    banner_url = str(payload.get("bannerUrl") or current["bannerUrl"]).strip()
    is_private = 1 if bool(payload.get("isPrivate", current["isPrivate"])) else 0
    allow_messages = 1 if bool(payload.get("allowMessages", current["allowMessages"])) else 0
    updated_at = now_iso()

    with connect(USERS_DB) as conn:
        conn.execute("""
            UPDATE users
            SET name = ?,
                email = ?,
                bio = ?,
                avatarUrl = ?,
                bannerUrl = ?,
                is_private = ?,
                allow_messages = ?,
                updated_at = ?
            WHERE lower(username) = lower(?)
        """, (
            name,
            email,
            bio,
            avatar_url,
            banner_url,
            is_private,
            allow_messages,
            updated_at,
            username
        ))
        conn.commit()

        updated = conn.execute("""
            SELECT * FROM users
            WHERE lower(username) = lower(?)
            LIMIT 1
        """, (username,)).fetchone()

    return {
        "success": True,
        "message": "Profile settings updated.",
        "user": row_to_user(updated, username)
    }


@router.get("/api/v1/public/profile")
def public_profile(
    username: str = Query("@you"),
    viewer: str = Query("@guest")
):
    row = get_user(username)
    user = row_to_user(row, viewer)
    content = user_content(user["username"])

    can_view = user["isOwner"] or not user["isPrivate"]

    return {
        "success": True,
        "user": user,
        "posts": content["posts"] if can_view else [],
        "reels": content["reels"] if can_view else [],
        "stories": content["stories"] if can_view else [],
        "privacy": {
            "isPrivate": user["isPrivate"],
            "allowMessages": user["allowMessages"],
            "canViewContent": can_view
        }
    }
