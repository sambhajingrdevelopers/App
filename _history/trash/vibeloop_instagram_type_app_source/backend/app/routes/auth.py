from fastapi import APIRouter
from app.schemas.auth import RegisterRequest, LoginRequest
from app.core.security import create_access_token

router = APIRouter()

@router.post("/register")
def register(payload: RegisterRequest):
    token = create_access_token(payload.email)
    return {"message": "registered", "access_token": token, "user": {"email": payload.email, "username": payload.username}}

@router.post("/login")
def login(payload: LoginRequest):
    token = create_access_token(payload.email)
    return {"message": "logged_in", "access_token": token}

@router.post("/verify-otp")
def verify_otp():
    return {"message": "otp_verified"}

@router.post("/logout")
def logout():
    return {"message": "logged_out"}
