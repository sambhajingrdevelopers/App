from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_wallet.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS wallet_summary (
                id TEXT PRIMARY KEY,
                total_earnings INTEGER,
                available_balance INTEGER,
                pending_payout INTEGER,
                this_month INTEGER,
                currency TEXT,
                updated_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS wallet_transactions (
                id TEXT PRIMARY KEY,
                title TEXT,
                type TEXT,
                amount INTEGER,
                status TEXT,
                created_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS payout_requests (
                id TEXT PRIMARY KEY,
                amount INTEGER,
                method TEXT,
                account TEXT,
                status TEXT,
                created_at TEXT
            )
        """)

        summary_count = conn.execute(
            "SELECT COUNT(*) AS total FROM wallet_summary"
        ).fetchone()["total"]

        if summary_count == 0:
            now = datetime.utcnow().isoformat()

            conn.execute(
                "INSERT INTO wallet_summary VALUES (?, ?, ?, ?, ?, ?, ?)",
                ("default", 42800, 18500, 7000, 12400, "₹", now)
            )

            transactions = [
                ("TX-101", "Reels creator bonus", "credit", 5400, "Completed", now),
                ("TX-102", "Post engagement reward", "credit", 2200, "Completed", now),
                ("TX-103", "Ad revenue share", "credit", 4800, "Completed", now),
                ("TX-104", "Payout request", "debit", 7000, "Pending", now)
            ]

            conn.executemany(
                "INSERT INTO wallet_transactions VALUES (?, ?, ?, ?, ?, ?)",
                transactions
            )

        conn.commit()


def transaction_to_dict(row):
    return {
        "id": row["id"],
        "title": row["title"],
        "type": row["type"],
        "amount": row["amount"],
        "status": row["status"],
        "createdAt": row["created_at"]
    }


def payout_to_dict(row):
    return {
        "id": row["id"],
        "amount": row["amount"],
        "method": row["method"],
        "account": row["account"],
        "status": row["status"],
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/wallet")
def get_wallet():
    init_db()

    with connect_db() as conn:
        summary = conn.execute(
            "SELECT * FROM wallet_summary WHERE id = 'default'"
        ).fetchone()

        transactions = conn.execute(
            "SELECT * FROM wallet_transactions ORDER BY created_at DESC"
        ).fetchall()

        payouts = conn.execute(
            "SELECT * FROM payout_requests ORDER BY created_at DESC"
        ).fetchall()

    return {
        "success": True,
        "wallet": {
            "totalEarnings": summary["total_earnings"],
            "availableBalance": summary["available_balance"],
            "pendingPayout": summary["pending_payout"],
            "thisMonth": summary["this_month"],
            "currency": summary["currency"],
            "updatedAt": summary["updated_at"]
        },
        "transactions": [transaction_to_dict(row) for row in transactions],
        "payouts": [payout_to_dict(row) for row in payouts]
    }


@router.post("/api/v1/wallet/payout-request")
def create_payout_request(payload: dict = Body(...)):
    init_db()

    amount = int(payload.get("amount") or 0)
    method = str(payload.get("method") or "UPI").strip()
    account = str(payload.get("account") or "").strip()

    if amount <= 0:
        return {
            "success": False,
            "message": "Valid payout amount required"
        }

    if not account:
        return {
            "success": False,
            "message": "Payout account is required"
        }

    now = datetime.utcnow().isoformat()
    payout_id = f"PO-{int(time.time() * 1000)}"
    tx_id = f"TX-{int(time.time() * 1000)}"

    with connect_db() as conn:
        summary = conn.execute(
            "SELECT * FROM wallet_summary WHERE id = 'default'"
        ).fetchone()

        available = int(summary["available_balance"] or 0)

        if amount > available:
            return {
                "success": False,
                "message": "Insufficient available balance"
            }

        new_available = available - amount
        new_pending = int(summary["pending_payout"] or 0) + amount

        conn.execute(
            "UPDATE wallet_summary SET available_balance = ?, pending_payout = ?, updated_at = ? WHERE id = 'default'",
            (new_available, new_pending, now)
        )

        conn.execute(
            "INSERT INTO payout_requests VALUES (?, ?, ?, ?, ?, ?)",
            (payout_id, amount, method, account, "Pending", now)
        )

        conn.execute(
            "INSERT INTO wallet_transactions VALUES (?, ?, ?, ?, ?, ?)",
            (tx_id, "Payout request created", "debit", amount, "Pending", now)
        )

        conn.commit()

        payout = conn.execute(
            "SELECT * FROM payout_requests WHERE id = ?",
            (payout_id,)
        ).fetchone()

    return {
        "success": True,
        "payout": payout_to_dict(payout)
    }