from fastapi import APIRouter

router = APIRouter()

@router.get("/me")
def me():
    return {"id": "demo-user", "username": "demo", "display_name": "Demo User"}

@router.patch("/me")
def update_me():
    return {"message": "profile_updated"}

@router.get("/{user_id}")
def get_user(user_id: str):
    return {"id": user_id, "username": "creator"}

@router.post("/{user_id}/follow")
def follow_user(user_id: str):
    return {"message": "followed", "user_id": user_id}

@router.delete("/{user_id}/follow")
def unfollow_user(user_id: str):
    return {"message": "unfollowed", "user_id": user_id}
