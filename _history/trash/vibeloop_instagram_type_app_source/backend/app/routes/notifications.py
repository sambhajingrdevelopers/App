from fastapi import APIRouter

router = APIRouter()

@router.get("")
def notifications():
    return {"items": []}
