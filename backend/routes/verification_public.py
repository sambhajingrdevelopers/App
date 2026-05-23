from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_admin.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS verification_requests (
                id TEXT PRIMARY KEY,
                username TEXT,
                category TEXT,
                status TEXT,
                created_at TEXT
            )
        """)
        conn.commit()


def row_to_request(row):
    return {
        "id": row["id"],
        "username": row["username"],
        "category": row["category"],
        "status": row["status"],
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/verification-requests")
def list_verification_requests():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM verification_requests ORDER BY created_at DESC"
        ).fetchall()

    return {
        "success": True,
        "requests": [row_to_request(row) for row in rows]
    }


@router.post("/api/v1/verification-requests")
def create_verification_request(payload: dict = Body(...)):
    init_db()

    username = str(payload.get("username") or "").strip()
    category = str(payload.get("category") or "Digital Creator").strip()

    if not username:
        return {
            "success": False,
            "message": "Username is required"
        }

    request_id = f"VR-{int(time.time() * 1000)}"
    now = datetime.utcnow().isoformat()

    with connect_db() as conn:
        conn.execute(
            "INSERT INTO verification_requests VALUES (?, ?, ?, ?, ?)",
            (request_id, username, category, "Pending", now)
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM verification_requests WHERE id = ?",
            (request_id,)
        ).fetchone()

    return {
        "success": True,
        "request": row_to_request(row)
    }