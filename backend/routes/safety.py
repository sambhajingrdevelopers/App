from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_safety.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
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

        conn.execute("""
            CREATE TABLE IF NOT EXISTS blocks (
                id TEXT PRIMARY KEY,
                target TEXT UNIQUE,
                note TEXT,
                created_at TEXT
            )
        """)

        conn.commit()


def row_to_report(row):
    return {
        "id": row["id"],
        "target": row["target"],
        "reason": row["reason"],
        "details": row["details"],
        "status": row["status"],
        "createdAt": row["created_at"]
    }


def row_to_block(row):
    return {
        "id": row["id"],
        "target": row["target"],
        "note": row["note"],
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/safety/reports")
def list_reports():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM reports ORDER BY created_at DESC"
        ).fetchall()

    return {
        "success": True,
        "reports": [row_to_report(row) for row in rows]
    }


@router.post("/api/v1/safety/reports")
def create_report(payload: dict = Body(...)):
    init_db()

    target = str(payload.get("target") or "").strip()
    reason = str(payload.get("reason") or "").strip()
    details = str(payload.get("details") or "").strip()

    if not target or not reason:
        return {
            "success": False,
            "message": "Target and reason are required"
        }

    report_id = f"RPT-{int(time.time() * 1000)}"
    now = datetime.utcnow().isoformat()

    with connect_db() as conn:
        conn.execute(
            "INSERT INTO reports VALUES (?, ?, ?, ?, ?, ?)",
            (report_id, target, reason, details, "Pending", now)
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM reports WHERE id = ?",
            (report_id,)
        ).fetchone()

    return {
        "success": True,
        "report": row_to_report(row)
    }


@router.get("/api/v1/safety/blocks")
def list_blocks():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM blocks ORDER BY created_at DESC"
        ).fetchall()

    return {
        "success": True,
        "blocks": [row_to_block(row) for row in rows]
    }


@router.post("/api/v1/safety/block")
def block_user(payload: dict = Body(...)):
    init_db()

    target = str(payload.get("target") or "").strip()
    note = str(payload.get("note") or "").strip()

    if not target:
        return {
            "success": False,
            "message": "Target is required"
        }

    block_id = f"BLK-{int(time.time() * 1000)}"
    now = datetime.utcnow().isoformat()

    with connect_db() as conn:
        conn.execute(
            "INSERT OR REPLACE INTO blocks VALUES (?, ?, ?, ?)",
            (block_id, target, note, now)
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM blocks WHERE target = ?",
            (target,)
        ).fetchone()

    return {
        "success": True,
        "block": row_to_block(row)
    }


@router.post("/api/v1/safety/unblock")
def unblock_user(payload: dict = Body(...)):
    init_db()

    target = str(payload.get("target") or "").strip()

    if not target:
        return {
            "success": False,
            "message": "Target is required"
        }

    with connect_db() as conn:
        conn.execute("DELETE FROM blocks WHERE target = ?", (target,))
        conn.commit()

    return {
        "success": True,
        "target": target
    }