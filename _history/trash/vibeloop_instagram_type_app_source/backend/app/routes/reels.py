from fastapi import APIRouter

router = APIRouter()

@router.get("/feed")
def reels_feed():
    return {"items": []}

@router.post("")
def create_reel():
    return {"message": "reel_created"}
