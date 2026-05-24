from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import json

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_admin.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_admin_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                username TEXT,
                email TEXT,
                status TEXT,
                role TEXT,
                created_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS reports (
                id TEXT PRIMARY KEY,
                username TEXT,
                reason TEXT,
                status TEXT,
                created_at TEXT
            )
        """)

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

        seed_count = conn.execute("SELECT COUNT(*) AS total FROM users").fetchone()["total"]

        if seed_count == 0:
            now = datetime.utcnow().isoformat()

            users = [
                ("USR-YOU-1", "VibeLoop Creator", "@you", "mira@vibeloop.com", "Active", "Creator", now),
                ("USR-YOU-2", "VibeLoop Creator", "@you", "dev@vibeloop.com", "Active", "Creator", now),
                ("USR-103", "VibeLoop Creator", "@you", "sara@vibeloop.com", "Review", "Creator", now),
                ("USR-104", "Style Loop", "@styleloop", "style@vibeloop.com", "Active", "Business", now),
            ]

            reports = [
                ("RPT-101", "@unknown.user", "Spam content", "Pending", now),
                ("RPT-102", "@fake.brand", "Fake business account", "Review", now),
                ("RPT-103", "@reel.copy", "Copyright issue", "Pending", now),
            ]

            verification = [
                ("VR-301", "@you", "Digital Creator", "Pending", now),
                ("VR-302", "@you", "Travel Creator", "Approved", now),
                ("VR-303", "@styleloop", "Fashion Brand", "Pending", now),
            ]

            ads = [
                ("AD-501", "Creator Boost Campaign", "₹12,500", "Running", 72, now),
                ("AD-502", "Reels Discovery Campaign", "₹8,000", "Scheduled", 46, now),
            ]

            conn.executemany(
                "INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?)",
                users
            )
            conn.executemany(
                "INSERT INTO reports VALUES (?, ?, ?, ?, ?)",
                reports
            )
            conn.executemany(
                "INSERT INTO verification_requests VALUES (?, ?, ?, ?, ?)",
                verification
            )
            conn.executemany(
                "INSERT INTO ads VALUES (?, ?, ?, ?, ?, ?)",
                ads
            )

        conn.commit()


def rows_to_list(rows):
    return [dict(row) for row in rows]


@router.get("/api/v1/admin/overview")
def admin_overview():
    init_admin_db()

    with connect_db() as conn:
        users = rows_to_list(conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall())
        reports = rows_to_list(conn.execute("SELECT * FROM reports ORDER BY created_at DESC").fetchall())
        verification = rows_to_list(conn.execute("SELECT * FROM verification_requests ORDER BY created_at DESC").fetchall())
        ads = rows_to_list(conn.execute("SELECT * FROM ads ORDER BY created_at DESC").fetchall())

    pending_reports = len([item for item in reports if item["status"].lower() != "resolved"])
    pending_verification = len([item for item in verification if item["status"].lower() == "pending"])

    analytics = {
        "totalUsers": len(users),
        "totalReports": len(reports),
        "pendingReports": pending_reports,
        "verificationRequests": len(verification),
        "pendingVerification": pending_verification,
        "adsRevenue": "₹48,920",
        "systemHealth": "99%",
        "backendStatus": "Connected"
    }

    return {
        "success": True,
        "analytics": analytics,
        "users": users,
        "reports": reports,
        "verification": verification,
        "ads": ads
    }


@router.get("/api/v1/admin/users")
def admin_users():
    init_admin_db()

    with connect_db() as conn:
        users = rows_to_list(conn.execute("SELECT * FROM users ORDER BY created_at DESC").fetchall())

    return {"success": True, "users": users}


@router.get("/api/v1/admin/reports")
def admin_reports():
    init_admin_db()

    with connect_db() as conn:
        reports = rows_to_list(conn.execute("SELECT * FROM reports ORDER BY created_at DESC").fetchall())

    return {"success": True, "reports": reports}


@router.post("/api/v1/admin/reports/{report_id}/status")
def update_report_status(report_id: str, payload: dict = Body(...)):
    init_admin_db()
    status = payload.get("status") or "Review"

    with connect_db() as conn:
        conn.execute("UPDATE reports SET status = ? WHERE id = ?", (status, report_id))
        conn.commit()

    return {"success": True, "id": report_id, "status": status}


@router.get("/api/v1/admin/verification")
def admin_verification():
    init_admin_db()

    with connect_db() as conn:
        verification = rows_to_list(conn.execute("SELECT * FROM verification_requests ORDER BY created_at DESC").fetchall())

    return {"success": True, "verification": verification}


@router.post("/api/v1/admin/verification/{request_id}/status")
def update_verification_status(request_id: str, payload: dict = Body(...)):
    init_admin_db()
    status = payload.get("status") or "Approved"

    with connect_db() as conn:
        conn.execute("UPDATE verification_requests SET status = ? WHERE id = ?", (status, request_id))
        conn.commit()

    return {"success": True, "id": request_id, "status": status}


@router.get("/api/v1/admin/ads")
def admin_ads():
    init_admin_db()

    with connect_db() as conn:
        ads = rows_to_list(conn.execute("SELECT * FROM ads ORDER BY created_at DESC").fetchall())

    return {"success": True, "ads": ads}