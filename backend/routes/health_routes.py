from fastapi import APIRouter

router = APIRouter()


@router.get("/api/v1/route-health")
def route_health():
    return {
        "success": True,
        "message": "Backend routes are loading correctly"
    }
