from fastapi import APIRouter
from app.schemas.post import PostCreate

router = APIRouter()

@router.get("/feed")
def feed():
    return {"items": []}

@router.post("")
def create_post(payload: PostCreate):
    return {"message": "post_created", "post": payload}

@router.get("/{post_id}")
def post_detail(post_id: str):
    return {"id": post_id, "caption": "Demo post"}

@router.post("/{post_id}/like")
def like_post(post_id: str):
    return {"message": "liked", "post_id": post_id}

@router.post("/{post_id}/save")
def save_post(post_id: str):
    return {"message": "saved", "post_id": post_id}

@router.get("/{post_id}/comments")
def comments(post_id: str):
    return {"items": []}
