from fastapi import APIRouter, Body, Request
from fastapi.responses import JSONResponse
from jose import jwt, JWTError
from datetime import datetime, timedelta
import os

router = APIRouter()

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "change-this-secret-key-now")
ALGORITHM = "HS256"
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@vibeloop.app")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "Admin@12345")
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "CHANGE_ME_ADMIN_KEY")


def create_token(payload: dict):
    data = payload.copy()
    data["exp"] = datetime.utcnow() + timedelta(days=7)
    data["iat"] = datetime.utcnow()
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token: str):
    return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])


def is_admin_request(request: Request):
    api_key = request.headers.get("x-admin-api-key", "")

    if api_key and api_key == ADMIN_API_KEY:
        return True

    auth = request.headers.get("authorization", "")

    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()

        try:
            payload = decode_token(token)
            return payload.get("role") == "admin"
        except JWTError:
            return False

    return False


@router.post("/api/v1/auth/admin-login")
def admin_login(payload: dict = Body(...)):
    email = str(payload.get("email") or "").strip()
    password = str(payload.get("password") or "").strip()

    if email != ADMIN_EMAIL or password != ADMIN_PASSWORD:
        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "message": "Invalid admin email or password"
            }
        )

    token = create_token({
        "sub": email,
        "role": "admin",
        "name": "VibeLoop Admin"
    })

    return {
        "success": True,
        "token": token,
        "user": {
            "email": email,
            "role": "admin",
            "name": "VibeLoop Admin"
        }
    }


@router.get("/api/v1/auth/me")
def auth_me(request: Request):
    auth = request.headers.get("authorization", "")

    if not auth.lower().startswith("bearer "):
        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "message": "Missing token"
            }
        )

    token = auth.split(" ", 1)[1].strip()

    try:
        payload = decode_token(token)
    except JWTError:
        return JSONResponse(
            status_code=401,
            content={
                "success": False,
                "message": "Invalid token"
            }
        )

    return {
        "success": True,
        "user": {
            "email": payload.get("sub"),
            "role": payload.get("role"),
            "name": payload.get("name", "Admin")
        }
    }
