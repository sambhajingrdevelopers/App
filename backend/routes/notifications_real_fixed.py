from fastapi import APIRouter, Body, Query
from pathlib import Path
from datetime import datetime, timezone
import sqlite3
import uuid

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_notifications.db"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean_username(value):
    text = str(value or "").strip()
    if not text:
        return "@guest"
    return text if text.startswith("@") else f"@{text}"


def connect():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_schema():
    with connect() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT PRIMARY KEY,
                user TEXT,
                actor TEXT,
                type TEXT,
                title TEXT,
                message TEXT,
                target_id TEXT,
                target_url TEXT,
                created_at TEXT,
                read_at TEXT,
                archived_at TEXT
            )
        """)

        existing = {row[1] for row in conn.execute("PRAGMA table_info(notifications)").fetchall()}

        required = {
            "id": "TEXT",
            "user": "TEXT",
            "actor": "TEXT",
            "type": "TEXT",
            "title": "TEXT",
            "message": "TEXT",
            "target_id": "TEXT",
            "target_url": "TEXT",
            "created_at": "TEXT",
            "read_at": "TEXT",
            "archived_at": "TEXT",
        }

        for col, col_type in required.items():
            if col not in existing:
                conn.execute(f"ALTER TABLE notifications ADD COLUMN {col} {col_type}")

        conn.commit()


def safe_get(row, key, default=None):
    try:
        return row[key]
    except Exception:
        return default


def row_to_notification(row):
    return {
        "id": safe_get(row, "id", ""),
        "user": clean_username(safe_get(row, "user", "@guest")),
        "actor": clean_username(safe_get(row, "actor", "@system")),
        "type": safe_get(row, "type", "info"),
        "title": safe_get(row, "title", "Notification"),
        "message": safe_get(row, "message", ""),
        "targetId": safe_get(row, "target_id", ""),
        "targetUrl": safe_get(row, "target_url", ""),
        "createdAt": safe_get(row, "created_at", ""),
        "readAt": safe_get(row, "read_at", None),
        "isRead": bool(safe_get(row, "read_at", None)),
    }


@router.get("/api/v1/notifications/list")
def list_notifications(user: str = Query("@guest")):
    ensure_schema()

    username = clean_username(user)

    with connect() as conn:
        rows = conn.execute("""
            SELECT * FROM notifications
            WHERE user = ?
            AND COALESCE(archived_at, '') = ''
            ORDER BY datetime(created_at) DESC
            LIMIT 300
        """, (username,)).fetchall()

        unread = conn.execute("""
            SELECT COUNT(*) AS total FROM notifications
            WHERE user = ?
            AND COALESCE(read_at, '') = ''
            AND COALESCE(archived_at, '') = ''
        """, (username,)).fetchone()["total"]

    return {
        "success": True,
        "user": username,
        "unread": unread,
        "notifications": [row_to_notification(row) for row in rows]
    }


@router.post("/api/v1/notifications/create")
def create_notification(payload: dict = Body(...)):
    ensure_schema()

    user = clean_username(payload.get("user"))
    actor = clean_username(payload.get("actor") or "@system")
    notification_type = str(payload.get("type") or "info").strip()
    title = str(payload.get("title") or "Notification").strip()
    message = str(payload.get("message") or "").strip()
    target_id = str(payload.get("targetId") or payload.get("target_id") or "").strip()
    target_url = str(payload.get("targetUrl") or payload.get("target_url") or "").strip()

    if not user:
        return {"success": False, "message": "Notification user is required."}

    notification_id = f"NTF-{uuid.uuid4().hex[:14]}"
    created_at = now_iso()

    with connect() as conn:
        conn.execute("""
            INSERT INTO notifications (
                id, user, actor, type, title, message,
                target_id, target_url, created_at, read_at, archived_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
        """, (
            notification_id, user, actor, notification_type, title, message,
            target_id, target_url, created_at
        ))
        conn.commit()

    return {
        "success": True,
        "message": "Notification created.",
        "item": {
            "id": notification_id,
            "user": user,
            "actor": actor,
            "type": notification_type,
            "title": title,
            "message": message,
            "targetId": target_id,
            "targetUrl": target_url,
            "createdAt": created_at,
            "readAt": None,
            "isRead": False
        }
    }


@router.post("/api/v1/notifications/mark-read")
def mark_read(payload: dict = Body(...)):
    ensure_schema()

    user = clean_username(payload.get("user"))
    notification_id = str(payload.get("id") or "").strip()
    read_at = now_iso()

    with connect() as conn:
        if notification_id:
            conn.execute("""
                UPDATE notifications
                SET read_at = ?
                WHERE user = ?
                AND id = ?
                AND COALESCE(archived_at, '') = ''
            """, (read_at, user, notification_id))
        else:
            conn.execute("""
                UPDATE notifications
                SET read_at = ?
                WHERE user = ?
                AND COALESCE(archived_at, '') = ''
            """, (read_at, user))

        conn.commit()

    return {
        "success": True,
        "message": "Notification marked as read."
    }


@router.post("/api/v1/notifications/archive")
def archive_notification(payload: dict = Body(...)):
    ensure_schema()

    user = clean_username(payload.get("user"))
    notification_id = str(payload.get("id") or "").strip()

    if not notification_id:
        return {
            "success": False,
            "message": "Notification id is required."
        }

    archived_at = now_iso()

    with connect() as conn:
        conn.execute("""
            UPDATE notifications
            SET archived_at = ?
            WHERE user = ?
            AND id = ?
        """, (archived_at, user, notification_id))
        conn.commit()

    return {
        "success": True,
        "message": "Notification moved to archive."
    }


@router.post("/api/v1/notifications/seed")
def seed_notifications(user: str = Query("@pradip")):
    ensure_schema()

    username = clean_username(user)

    samples = [
        ("@creator", "follow", "New follower", "@creator started following you.", "", "/profile?username=@creator"),
        ("@sambhajingrdevelopers", "like", "Post liked", "@sambhajingrdevelopers liked your post.", "POST-SEED-0001", "/post/POST-SEED-0001"),
        ("@manoj", "comment", "New comment", "@manoj commented on your reel.", "REEL-SEED-0001", "/post/REEL-SEED-0001"),
        ("@system", "account", "Account update", "Your creator profile is active and verified.", "", "/profile"),
    ]

    inserted = []

    with connect() as conn:
        for actor, notification_type, title, message, target_id, target_url in samples:
            notification_id = f"NTF-SEED-{uuid.uuid4().hex[:10]}"
            created_at = now_iso()

            conn.execute("""
                INSERT INTO notifications (
                    id, user, actor, type, title, message,
                    target_id, target_url, created_at, read_at, archived_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL)
            """, (
                notification_id, username, clean_username(actor),
                notification_type, title, message, target_id, target_url, created_at
            ))

            inserted.append(notification_id)

        conn.commit()

    return {
        "success": True,
        "message": "Sample backend notifications added.",
        "items": inserted
    }
