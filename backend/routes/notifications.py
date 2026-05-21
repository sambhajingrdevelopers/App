from fastapi import APIRouter
from pathlib import Path
from datetime import datetime
import sqlite3

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_notifications.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                type TEXT,
                icon TEXT,
                title TEXT,
                description TEXT,
                is_read INTEGER DEFAULT 0,
                created_at TEXT
            )
        """)

        count = conn.execute("SELECT COUNT(*) AS total FROM notifications").fetchone()["total"]

        if count == 0:
            now = datetime.utcnow().isoformat()

            seed = [
                ("NT-101", "like", "♡", "Mira liked your post", "Your creator post is getting strong engagement.", 0, now),
                ("NT-102", "comment", "💬", "Dev commented on your reel", "This reel style looks premium and powerful.", 0, now),
                ("NT-103", "follow", "＋", "Sara started following you", "You have a new creator follower.", 0, now),
                ("NT-104", "save", "🔖", "Your post was saved 24 times", "Saved posts help your profile reach more people.", 1, now),
                ("NT-105", "system", "⚡", "Creator growth alert", "Your profile reach increased by 42% this week.", 0, now)
            ]

            conn.executemany(
                "INSERT INTO notifications VALUES (?, ?, ?, ?, ?, ?, ?)",
                seed
            )

        conn.commit()


def row_to_notification(row):
    return {
        "id": row["id"],
        "type": row["type"],
        "icon": row["icon"],
        "title": row["title"],
        "desc": row["description"],
        "isRead": bool(row["is_read"]),
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/notifications")
def list_notifications():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM notifications ORDER BY created_at DESC"
        ).fetchall()

        unread_count = conn.execute(
            "SELECT COUNT(*) AS total FROM notifications WHERE is_read = 0"
        ).fetchone()["total"]

    return {
        "success": True,
        "unreadCount": unread_count,
        "notifications": [row_to_notification(row) for row in rows]
    }


@router.post("/api/v1/notifications/{notification_id}/read")
def mark_notification_read(notification_id: str):
    init_db()

    with connect_db() as conn:
        conn.execute(
            "UPDATE notifications SET is_read = 1 WHERE id = ?",
            (notification_id,)
        )
        conn.commit()

        unread_count = conn.execute(
            "SELECT COUNT(*) AS total FROM notifications WHERE is_read = 0"
        ).fetchone()["total"]

    return {
        "success": True,
        "id": notification_id,
        "unreadCount": unread_count
    }


@router.post("/api/v1/notifications/read-all")
def mark_all_notifications_read():
    init_db()

    with connect_db() as conn:
        conn.execute("UPDATE notifications SET is_read = 1")
        conn.commit()

    return {
        "success": True,
        "unreadCount": 0
    }
