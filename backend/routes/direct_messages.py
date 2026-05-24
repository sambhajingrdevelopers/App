from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import time

router = APIRouter()
DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_messages.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS threads (
                id TEXT PRIMARY KEY,
                name TEXT,
                username TEXT,
                avatar TEXT,
                last_message TEXT,
                unread INTEGER DEFAULT 0,
                updated_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS messages (
                id TEXT PRIMARY KEY,
                thread_id TEXT,
                sender TEXT,
                text TEXT,
                is_me INTEGER DEFAULT 0,
                created_at TEXT
            )
        """)

        count = conn.execute("SELECT COUNT(*) AS total FROM threads").fetchone()["total"]

        if count == 0:
            now = datetime.utcnow().isoformat()

            threads = [
                ("TH-101", "VibeLoop Creator", "@you", "", "Your reel concept is amazing!", 2, now),
                ("TH-102", "Style Loop", "@styleloop", "", "Can we collaborate on a campaign?", 1, now),
                ("TH-103", "Founder Hub", "@you", "", "Let us discuss creator growth.", 0, now)
            ]

            messages = [
                ("MSG-101", "TH-101", "@you", "Hey, I loved your latest post.", 0, now),
                ("MSG-102", "TH-101", "@you", "Your reel concept is amazing!", 0, now),
                ("MSG-103", "TH-102", "@styleloop", "Can we collaborate on a campaign?", 0, now),
                ("MSG-104", "TH-103", "@you", "Sure, let us discuss creator growth.", 1, now)
            ]

            conn.executemany("INSERT INTO threads VALUES (?, ?, ?, ?, ?, ?, ?)", threads)
            conn.executemany("INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?)", messages)

        conn.commit()


def thread_to_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "username": row["username"],
        "avatar": row["avatar"],
        "lastMessage": row["last_message"],
        "unread": int(row["unread"] or 0),
        "updatedAt": row["updated_at"]
    }


def message_to_dict(row):
    return {
        "id": row["id"],
        "threadId": row["thread_id"],
        "sender": row["sender"],
        "text": row["text"],
        "isMe": bool(row["is_me"]),
        "createdAt": row["created_at"]
    }


@router.get("/api/v1/messages/threads")
def list_message_threads():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM threads ORDER BY updated_at DESC"
        ).fetchall()

        unread_total = conn.execute(
            "SELECT SUM(unread) AS total FROM threads"
        ).fetchone()["total"] or 0

    return {
        "success": True,
        "unreadTotal": int(unread_total),
        "threads": [thread_to_dict(row) for row in rows]
    }


@router.get("/api/v1/messages/threads/{thread_id}")
def get_message_thread(thread_id: str):
    init_db()

    with connect_db() as conn:
        thread = conn.execute(
            "SELECT * FROM threads WHERE id = ?",
            (thread_id,)
        ).fetchone()

        rows = conn.execute(
            "SELECT * FROM messages WHERE thread_id = ? ORDER BY created_at ASC",
            (thread_id,)
        ).fetchall()

    if not thread:
        return {
            "success": False,
            "message": "Thread not found"
        }

    return {
        "success": True,
        "thread": thread_to_dict(thread),
        "messages": [message_to_dict(row) for row in rows]
    }


@router.post("/api/v1/messages/threads/{thread_id}/send")
def send_message(thread_id: str, payload: dict = Body(...)):
    init_db()

    text = str(payload.get("text") or "").strip()
    sender = str(payload.get("sender") or "@you").strip()

    if not text:
        return {
            "success": False,
            "message": "Message text is required"
        }

    now = datetime.utcnow().isoformat()
    message_id = f"MSG-{int(time.time() * 1000)}"

    with connect_db() as conn:
        thread = conn.execute(
            "SELECT * FROM threads WHERE id = ?",
            (thread_id,)
        ).fetchone()

        if not thread:
            return {
                "success": False,
                "message": "Thread not found"
            }

        conn.execute(
            "INSERT INTO messages VALUES (?, ?, ?, ?, ?, ?)",
            (message_id, thread_id, sender, text, 1 if sender == "@you" else 0, now)
        )

        conn.execute(
            "UPDATE threads SET last_message = ?, updated_at = ? WHERE id = ?",
            (text, now, thread_id)
        )

        conn.commit()

        msg = conn.execute(
            "SELECT * FROM messages WHERE id = ?",
            (message_id,)
        ).fetchone()

        updated_thread = conn.execute(
            "SELECT * FROM threads WHERE id = ?",
            (thread_id,)
        ).fetchone()

    return {
        "success": True,
        "thread": thread_to_dict(updated_thread),
        "message": message_to_dict(msg)
    }


@router.post("/api/v1/messages/threads/{thread_id}/read")
def mark_thread_read(thread_id: str):
    init_db()

    with connect_db() as conn:
        conn.execute(
            "UPDATE threads SET unread = 0 WHERE id = ?",
            (thread_id,)
        )
        conn.commit()

        row = conn.execute(
            "SELECT * FROM threads WHERE id = ?",
            (thread_id,)
        ).fetchone()

        unread_total = conn.execute(
            "SELECT SUM(unread) AS total FROM threads"
        ).fetchone()["total"] or 0

    if not row:
        return {
            "success": False,
            "message": "Thread not found"
        }

    return {
        "success": True,
        "thread": thread_to_dict(row),
        "unreadTotal": int(unread_total)
    }