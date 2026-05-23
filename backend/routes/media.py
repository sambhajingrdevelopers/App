from fastapi import APIRouter, UploadFile, File, HTTPException
from pathlib import Path
import uuid

router = APIRouter()

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_PREFIXES = ("image/", "video/")


@router.post("/api/v1/uploads")
async def upload_media(file: UploadFile = File(...)):
    content_type = file.content_type or ""

    if not content_type.startswith(ALLOWED_PREFIXES):
        raise HTTPException(status_code=400, detail="Only image and video uploads are allowed")

    suffix = Path(file.filename or "").suffix.lower()
    if not suffix:
        suffix = ".bin"

    file_name = f"{uuid.uuid4().hex}{suffix}"
    file_path = UPLOAD_DIR / file_name

    content = await file.read()

    max_size = 50 * 1024 * 1024
    if len(content) > max_size:
        raise HTTPException(status_code=400, detail="File too large. Max 50MB allowed")

    file_path.write_bytes(content)

    media_type = "video" if content_type.startswith("video/") else "image"

    return {
        "success": True,
        "fileName": file_name,
        "mediaUrl": f"/uploads/{file_name}",
        "mediaType": media_type,
        "contentType": content_type
    }