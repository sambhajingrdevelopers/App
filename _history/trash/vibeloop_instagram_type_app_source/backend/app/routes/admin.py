from fastapi import APIRouter

router = APIRouter()

@router.get("/dashboard")
def dashboard():
    return {"users": 0, "posts": 0, "reports": 0, "revenue": 0}

@router.get("/users")
def users():
    return {"items": []}

@router.get("/reports")
def reports():
    return {"items": []}

@router.post("/broadcast")
def broadcast():
    return {"message": "broadcast_sent"}
