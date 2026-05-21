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
            CREATE TABLE IF NOT EXISTS ads (
                id TEXT PRIMARY KEY,
                title TEXT,
                budget TEXT,
                status TEXT,
                progress INTEGER,
                created_at TEXT
            )
        """)

        count = conn.execute("SELECT COUNT(*) AS total FROM ads").fetchone()["total"]

        if count == 0:
            now = datetime.utcnow().isoformat()
            seed = [
                ("AD-501", "Creator Boost Campaign", "₹12,500", "Running", 72, now),
                ("AD-502", "Reels Discovery Campaign", "₹8,000", "Scheduled", 46, now),
            ]
            conn.executemany("INSERT INTO ads VALUES (?, ?, ?, ?, ?, ?)", seed)

        conn.commit()


def row_to_ad(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "budget": row["budget"],
        "status": row["status"],
        "progress": row["progress"],
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/ads")
def list_ads():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM ads ORDER BY created_at DESC"
        ).fetchall()

    return {
        "success": True,
        "ads": [row_to_ad(row) for row in rows]
    }


@router.post("/api/v1/ads")
def create_ad(payload: dict = Body(...)):
    init_db()

    title = str(payload.get("title") or "").strip()
    budget = str(payload.get("budget") or "₹0").strip()
    status = str(payload.get("status") or "Scheduled").strip()

    if not title:
        return {
            "success": False,
            "message": "Ad title is required"
        }

    ad_id = f"AD-{int(time.time() * 1000)}"
    now = datetime.utcnow().isoformat()

    with connect_db() as conn:
        conn.execute(
            "INSERT INTO ads VALUES (?, ?, ?, ?, ?, ?)",
            (ad_id, title, budget, status, 0, now)
        )
        conn.commit()

        row = conn.execute("SELECT * FROM ads WHERE id = ?", (ad_id,)).fetchone()

    return {
        "success": True,
        "ad": row_to_ad(row)
    }


@router.post("/api/v1/ads/{ad_id}/status")
def update_ad_status(ad_id: str, payload: dict = Body(...)):
    init_db()

    status = str(payload.get("status") or "Scheduled").strip()
    progress = int(payload.get("progress") or 0)

    with connect_db() as conn:
        conn.execute(
            "UPDATE ads SET status = ?, progress = ? WHERE id = ?",
            (status, progress, ad_id)
        )
        conn.commit()

        row = conn.execute("SELECT * FROM ads WHERE id = ?", (ad_id,)).fetchone()

    if not row:
        return {
            "success": False,
            "message": "Ad not found"
        }

    return {
        "success": True,
        "ad": row_to_ad(row)
    }
