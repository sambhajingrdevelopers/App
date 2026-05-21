from fastapi import APIRouter, Body
from pathlib import Path
import sqlite3

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
ADMIN_DB = BASE_DIR / "vibeloop_admin.db"
SAFETY_DB = BASE_DIR / "vibeloop_safety.db"


def connect_db(path):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_admin_db():
    with connect_db(ADMIN_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS verification_requests (
                id TEXT PRIMARY KEY,
                username TEXT,
                category TEXT,
                status TEXT,
                created_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS ads (
                id TEXT PRIMARY KEY,
                title TEXT,
                budget TEXT,
                status TEXT,
                progress INTEGER,
                created_at TEXT
            )
        """)

        conn.commit()


def ensure_safety_db():
    with connect_db(SAFETY_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                target TEXT,
                reason TEXT,
                details TEXT,
                status TEXT,
                created_at TEXT
            )
        """)

        conn.commit()


def report_to_dict(row):
    return {
        "id": row["id"],
        "target": row["target"],
        "reason": row["reason"],
        "details": row["details"],
        "status": row["status"],
        "createdAt": row["created_at"]
    }


def verification_to_dict(row):
    return {
        "id": row["id"],
        "username": row["username"],
        "category": row["category"],
        "status": row["status"],
        "createdAt": row["created_at"]
    }


def ad_to_dict(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "budget": row["budget"],
        "status": row["status"],
        "progress": row["progress"],
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/admin/moderation")
def admin_moderation_overview():
    ensure_admin_db()
    ensure_safety_db()

    with connect_db(SAFETY_DB) as conn:
        reports = conn.execute(
            "SELECT * FROM reports ORDER BY created_at DESC"
        ).fetchall()

    with connect_db(ADMIN_DB) as conn:
        verification = conn.execute(
            "SELECT * FROM verification_requests ORDER BY created_at DESC"
        ).fetchall()

        ads = conn.execute(
            "SELECT * FROM ads ORDER BY created_at DESC"
        ).fetchall()

    return {
        "success": True,
        "reports": [report_to_dict(row) for row in reports],
        "verification": [verification_to_dict(row) for row in verification],
        "ads": [ad_to_dict(row) for row in ads]
    }


@router.post("/api/v1/admin/safety/reports/{report_id}/status")
def update_report_status(report_id: str, payload: dict = Body(...)):
    ensure_safety_db()

    status = str(payload.get("status") or "Review").strip()

    with connect_db(SAFETY_DB) as conn:
        conn.execute(
            "UPDATE reports SET status = ? WHERE id = ?",
            (status, report_id)
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM reports WHERE id = ?",
            (report_id,)
        ).fetchone()

    if not row:
        return {
            "success": False,
            "message": "Report not found"
        }

    return {
        "success": True,
        "report": report_to_dict(row)
    }


@router.post("/api/v1/admin/verification-requests/{request_id}/status")
def update_verification_request_status(request_id: str, payload: dict = Body(...)):
    ensure_admin_db()

    status = str(payload.get("status") or "Pending").strip()

    with connect_db(ADMIN_DB) as conn:
        conn.execute(
            "UPDATE verification_requests SET status = ? WHERE id = ?",
            (status, request_id)
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM verification_requests WHERE id = ?",
            (request_id,)
        ).fetchone()

    if not row:
        return {
            "success": False,
            "message": "Verification request not found"
        }

    return {
        "success": True,
        "request": verification_to_dict(row)
    }


@router.post("/api/v1/admin/ads/{ad_id}/status")
def update_admin_ad_status(ad_id: str, payload: dict = Body(...)):
    ensure_admin_db()

    status = str(payload.get("status") or "Scheduled").strip()
    progress = int(payload.get("progress") or 0)

    with connect_db(ADMIN_DB) as conn:
        conn.execute(
            "UPDATE ads SET status = ?, progress = ? WHERE id = ?",
            (status, progress, ad_id)
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM ads WHERE id = ?",
            (ad_id,)
        ).fetchone()

    if not row:
        return {
            "success": False,
            "message": "Ad not found"
        }

    return {
        "success": True,
        "ad": ad_to_dict(row)
    }
