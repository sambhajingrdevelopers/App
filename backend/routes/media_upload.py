from fastapi import APIRouter, UploadFile, File, Request
from fastapi.responses import JSONResponse
from pathlib import Path
from datetime import datetime
import sqlite3
import shutil
import time
import os
import re

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
MEDIA_DIR = BASE_DIR / "media" / "uploads"
DB_PATH = BASE_DIR / "vibeloop_media.db"

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".gif",
    ".mp4", ".mov", ".webm"
}

MAX_SIZE_MB = int(os.getenv("UPLOAD_MAX_SIZE_MB", "80"))
PUBLIC_BACKEND_URL = os.getenv("PUBLIC_BACKEND_URL", "").rstrip("/")


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)

    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS media_files (
                id TEXT PRIMARY KEY,
                original_name TEXT,
                stored_name TEXT,
                media_url TEXT,
                media_type TEXT,
                size_bytes INTEGER,
                created_at TEXT
            )
        """)
        conn.commit()


def safe_filename(filename: str):
    name = Path(filename or "upload").stem
    ext = Path(filename or "").suffix.lower()

    name = re.sub(r"[^a-zA-Z0-9_-]+", "-", name).strip("-").lower()

    if not name:
        name = "media"

    return name, ext


def get_media_type(ext: str):
    if ext in [".mp4", ".mov", ".webm"]:
        return "video"

    return "image"


def row_to_media(row):
    return {
        "id": row["id"],
        "originalName": row["original_name"],
        "storedName": row["stored_name"],
        "mediaUrl": row["media_url"],
        "mediaType": row["media_type"],
        "sizeBytes": row["size_bytes"],
        "createdAt": row["created_at"]
    }


@router.post("/api/v1/upload")
async def upload_media(request: Request, file: UploadFile = File(...)):
    init_db()

    original_name = file.filename or "upload"
    base, ext = safe_filename(original_name)

    if ext not in ALLOWED_EXTENSIONS:
        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "message": "Only image/video files are allowed"
            }
        )

    now = datetime.utcnow()
    month_dir = MEDIA_DIR / str(now.year) / f"{now.month:02d}"
    month_dir.mkdir(parents=True, exist_ok=True)

    media_id = f"MEDIA-{int(time.time() * 1000)}"
    stored_name = f"{base}-{media_id}{ext}"
    target_path = month_dir / stored_name

    size = 0
    max_bytes = MAX_SIZE_MB * 1024 * 1024

    with target_path.open("wb") as buffer:
        while True:
            chunk = await file.read(1024 * 1024)

            if not chunk:
                break

            size += len(chunk)

            if size > max_bytes:
                try:
                    target_path.unlink()
                except Exception:
                    pass

                return JSONResponse(
                    status_code=413,
                    content={
                        "success": False,
                        "message": f"File too large. Max allowed size is {MAX_SIZE_MB}MB"
                    }
                )

            buffer.write(chunk)

    media_type = get_media_type(ext)
    relative_url = f"/media/uploads/{now.year}/{now.month:02d}/{stored_name}"

    if PUBLIC_BACKEND_URL:
        media_url = f"{PUBLIC_BACKEND_URL}{relative_url}"
    else:
        base_url = str(request.base_url).rstrip("/")
        media_url = f"{base_url}{relative_url}"

    created_at = now.isoformat()

    with connect_db() as conn:
        conn.execute(
            "INSERT INTO media_files VALUES (?, ?, ?, ?, ?, ?, ?)",
            (
                media_id,
                original_name,
                stored_name,
                media_url,
                media_type,
                size,
                created_at
            )
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM media_files WHERE id = ?",
            (media_id,)
        ).fetchone()

    return {
        "success": True,
        "media": row_to_media(row),
        "mediaUrl": media_url,
        "mediaType": media_type
    }


@router.get("/api/v1/media/library")
def media_library():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM media_files ORDER BY created_at DESC LIMIT 200"
        ).fetchall()

    return {
        "success": True,
        "media": [row_to_media(row) for row in rows]
    }
