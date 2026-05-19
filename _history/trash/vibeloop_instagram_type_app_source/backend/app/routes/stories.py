from fastapi import APIRouter

router = APIRouter()

@router.get("/feed")
def stories_feed():
    return {"items": []}

@router.post("")
def create_story():
    return {"message": "story_created"}
