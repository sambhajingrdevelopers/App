from fastapi import APIRouter, Body, UploadFile, File, Request
from pathlib import Path
from datetime import datetime
import sqlite3
import uuid
import shutil

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_content.db"
MEDIA_DIR = BASE_DIR / "media_uploads"
MEDIA_DIR.mkdir(parents=True, exist_ok=True)

TABLES = {
    "post": "posts",
    "posts": "posts",
    "reel": "reels",
    "reels": "reels",
    "story": "stories",
    "stories": "stories",
}


def now_iso():
    return datetime.utcnow().isoformat()


def normalize_username(value):
    clean = str(value or "").strip()
    if not clean:
        return "@you"
    return clean if clean.startswith("@") else f"@{clean}"


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_schema():
    with connect() as conn:
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


def row_value(row, key, default=""):
    try:
        return row[key] if key in row.keys() and row[key] is not None else default
    except Exception:
        return default


def item_from_row(row, table_name):
    kind = "post"
    if table_name == "reels":
        kind = "reel"
    if table_name == "stories":
        kind = "story"

    media_url = row_value(row, "media_url")
    video_url = row_value(row, "video_url")

    return {
        "id": row_value(row, "id"),
        "kind": kind,
        "type": kind,
        "title": row_value(row, "title") or kind.title(),
        "caption": row_value(row, "caption") or "",
        "username": normalize_username(row_value(row, "username") or row_value(row, "user")),
        "user": normalize_username(row_value(row, "user") or row_value(row, "username")),
        "name": row_value(row, "name") or normalize_username(row_value(row, "username")).replace("@", ""),
        "mediaUrl": media_url or video_url,
        "videoUrl": video_url or media_url,
        "mediaType": row_value(row, "media_type") or ("video" if kind == "reel" else "image"),
        "location": row_value(row, "location") or "",
        "likes": int(row_value(row, "likes", 0) or 0),
        "comments": int(row_value(row, "comments", 0) or 0),
        "views": int(row_value(row, "views", 0) or 0),
        "createdAt": row_value(row, "created_at"),
    }


def list_table(table_name, limit=80):
    ensure_schema()

    with connect() as conn:
        rows = conn.execute(
            f"""
            SELECT * FROM {table_name}
            WHERE archived_at IS NULL
            ORDER BY datetime(created_at) DESC
            LIMIT ?
            """,
            (limit,)
        ).fetchall()

    return [item_from_row(row, table_name) for row in rows]


def insert_content(payload):
    ensure_schema()

    kind = str(payload.get("kind") or payload.get("type") or "post").lower()
    table = TABLES.get(kind, "posts")

    content_id = str(payload.get("id") or f"{kind.upper()}-{uuid.uuid4().hex[:14]}")
    username = normalize_username(payload.get("username") or payload.get("user") or "@you")
    name = payload.get("name") or username.replace("@", "") or "Creator"

    media_url = str(payload.get("mediaUrl") or payload.get("media_url") or "").strip()
    video_url = str(payload.get("videoUrl") or payload.get("video_url") or "").strip()
    media_type = str(payload.get("mediaType") or payload.get("media_type") or "").strip()

    if not media_type:
        media_type = "video" if table == "reels" or video_url.lower().endswith((".mp4", ".webm", ".mov")) else "image"

    if table == "reels" and not video_url:
        video_url = media_url

    with connect() as conn:
        conn.execute(
            f"""
            INSERT OR REPLACE INTO {table} (
                id, kind, title, caption, username, user, name,
                media_url, video_url, media_type, location,
                likes, comments, views, created_at, updated_at, archived_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
            """,
            (
                content_id,
                table[:-1],
                payload.get("title") or table[:-1].title(),
                payload.get("caption") or "",
                username,
                username,
                name,
                media_url,
                video_url,
                media_type,
                payload.get("location") or "VibeLoop",
                int(payload.get("likes") or 0),
                int(payload.get("comments") or 0),
                int(payload.get("views") or 0),
                payload.get("createdAt") or payload.get("created_at") or now_iso(),
                now_iso(),
            )
        )
        conn.commit()

    return get_detail(content_id)


def get_detail(content_id):
    ensure_schema()

    with connect() as conn:
        for table in ["posts", "reels", "stories"]:
            row = conn.execute(
                f"SELECT * FROM {table} WHERE id = ? AND archived_at IS NULL LIMIT 1",
                (content_id,)
            ).fetchone()

            if row:
                return item_from_row(row, table)

    return None


@router.post("/api/v1/content/upload-media")
async def upload_media(request: Request, file: UploadFile = File(...)):
    ensure_schema()

    original = file.filename or "media"
    suffix = Path(original).suffix.lower()

    if not suffix:
        content_type = file.content_type or ""
        if "video" in content_type:
            suffix = ".mp4"
        elif "png" in content_type:
            suffix = ".png"
        elif "webp" in content_type:
            suffix = ".webp"
        else:
            suffix = ".jpg"

    safe_name = f"{uuid.uuid4().hex}{suffix}"
    target = MEDIA_DIR / safe_name

    with target.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    base = str(request.base_url).rstrip("/")
    media_url = f"{base}/media/{safe_name}"
    media_type = "video" if (file.content_type or "").startswith("video") or suffix in [".mp4", ".webm", ".mov"] else "image"

    return {
        "success": True,
        "mediaUrl": media_url,
        "videoUrl": media_url if media_type == "video" else "",
        "mediaType": media_type,
        "filename": safe_name
    }


@router.post("/api/v1/content/create")
def create_content(payload: dict = Body(...)):
    item = insert_content(payload)

    return {
        "success": True,
        "message": "Content saved.",
        "item": item
    }


@router.get("/api/v1/content/home-live")
def home_live():
    posts = list_table("posts", 80)
    reels = list_table("reels", 30)
    stories = list_table("stories", 30)

    return {
        "success": True,
        "source": "backend-content-db",
        "posts": posts,
        "reels": reels,
        "stories": stories
    }


@router.get("/api/v1/content/reels-live")
def reels_live():
    reels = list_table("reels", 120)

    return {
        "success": True,
        "source": "backend-content-db",
        "reels": reels
    }


@router.get("/api/v1/content/stories-live")
def stories_live():
    stories = list_table("stories", 120)

    return {
        "success": True,
        "source": "backend-content-db",
        "stories": stories
    }


@router.get("/api/v1/content/detail")
def content_detail(id: str):
    item = get_detail(id)

    if not item:
        return {
            "success": False,
            "message": "Content not found.",
            "item": None
        }

    return {
        "success": True,
        "source": "backend-content-db",
        "item": item
    }


@router.post("/api/v1/content/seed")
def seed_content():
    sample = [
        {
            "id": "POST-CREATOR-001",
            "kind": "post",
            "title": "Creator Workspace",
            "caption": "Behind the scenes from the creator desk.",
            "username": "@pradip",
            "name": "Pradip Kumar",
            "mediaUrl": "https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200",
            "mediaType": "image",
            "likes": 12,
            "comments": 3,
        },
        {
            "id": "POST-BUSINESS-002",
            "kind": "post",
            "title": "Business Website Design",
            "caption": "A premium website layout for local business.",
            "username": "@sambhajingrdevelopers",
            "name": "Sambhajingr Developers",
            "mediaUrl": "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=1200",
            "mediaType": "image",
            "likes": 25,
            "comments": 5,
        },
        {
            "id": "REEL-DEMO-001",
            "kind": "reel",
            "title": "Reel Route Test",
            "caption": "Backend saved video reel.",
            "username": "@pradip",
            "name": "Pradip Kumar",
            "mediaUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
            "videoUrl": "https://www.w3schools.com/html/mov_bbb.mp4",
            "mediaType": "video",
            "views": 128,
        },
        {
            "id": "REEL-CREATOR-002",
            "kind": "reel",
            "title": "Creative Motion",
            "caption": "Video content from backend.",
            "username": "@sambhajingrdevelopers",
            "name": "Sambhajingr Developers",
            "mediaUrl": "https://www.w3schools.com/html/movie.mp4",
            "videoUrl": "https://www.w3schools.com/html/movie.mp4",
            "mediaType": "video",
            "views": 87,
        },
        {
            "id": "STORY-001",
            "kind": "story",
            "title": "Today Story",
            "caption": "Short story update.",
            "username": "@pradip",
            "name": "Pradip Kumar",
            "mediaUrl": "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=900",
            "mediaType": "image",
        },
    ]

    items = [insert_content(item) for item in sample]

    return {
        "success": True,
        "message": "Backend posts, reels and stories added.",
        "items": items
    }
