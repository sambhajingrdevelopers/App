from fastapi import APIRouter, Body
from pathlib import Path
from datetime import datetime
import sqlite3
import json
import time

router = APIRouter()

DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_chats.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS chats (
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
                chat_id TEXT,
                sender TEXT,
                text TEXT,
                created_at TEXT
            )
        """)

        count = conn.execute("SELECT COUNT(*) AS total FROM chats").fetchone()["total"]

        if count == 0:
            now = datetime.utcnow().isoformat()

            chats = [
                ("CHAT-101", "Mira", "@mira.creates", "M", "Design looks powerful 🔥", 2, now),
                ("CHAT-102", "Dev", "@travel.dev", "D", "Send me the reel preview.", 0, now),
                ("CHAT-103", "Sara", "@urban.snap", "S", "New post idea ready?", 1, now),
                ("CHAT-104", "Aarav", "@founderhub", "A", "Let us build this platform.", 0, now),
            ]

            messages = [
                ("MSG-101", "CHAT-101", "them", "Design looks powerful 🔥", now),
                ("MSG-102", "CHAT-101", "me", "Yes, now we are making it real.", now),
                ("MSG-103", "CHAT-101", "them", "Add reels and creator dashboard next.", now),

                ("MSG-201", "CHAT-102", "them", "Send me the reel preview.", now),
                ("MSG-202", "CHAT-102", "me", "I am preparing the final UI.", now),

                ("MSG-301", "CHAT-103", "them", "New post idea ready?", now),
                ("MSG-401", "CHAT-104", "them", "Let us build this platform.", now),
            ]

            conn.executemany(
                "INSERT INTO chats VALUES (?, ?, ?, ?, ?, ?, ?)",
                chats
            )

            conn.executemany(
                "INSERT INTO messages VALUES (?, ?, ?, ?, ?)",
                messages
            )

        conn.commit()


def get_chat_messages(conn, chat_id):
    rows = conn.execute(
        "SELECT * FROM messages WHERE chat_id = ? ORDER BY created_at ASC",
        (chat_id,)
    ).fetchall()

    return [
        {
            "id": row["id"],
            "chatId": row["chat_id"],
            "sender": row["sender"],
            "text": row["text"],
            "createdAt": row["created_at"]
        }
        for row in rows
    ]


@router.get("/api/v1/chats")
def list_chats():
    init_db()

    with connect_db() as conn:
        rows = conn.execute(
            "SELECT * FROM chats ORDER BY updated_at DESC"
        ).fetchall()

        chats = []

        for row in rows:
            chats.append({
                "id": row["id"],
                "name": row["name"],
                "username": row["username"],
                "avatar": row["avatar"],
                "lastMessage": row["last_message"],
                "unread": row["unread"],
                "updatedAt": row["updated_at"],
                "messages": get_chat_messages(conn, row["id"])
            })

    return {
        "success": True,
        "chats": chats
    }


@router.post("/api/v1/chats/messages")
def send_message(payload: dict = Body(...)):
    init_db()

    chat_id = payload.get("chatId")
    text = payload.get("text")
    sender = payload.get("sender") or "me"

    if not chat_id or not text:
        return {
            "success": False,
            "message": "chatId and text required"
        }

    now = datetime.utcnow().isoformat()
    message_id = f"MSG-{int(time.time() * 1000)}"

    with connect_db() as conn:
        conn.execute(
            "INSERT INTO messages VALUES (?, ?, ?, ?, ?)",
            (message_id, chat_id, sender, text, now)
        )

        conn.execute(
            "UPDATE chats SET last_message = ?, unread = 0, updated_at = ? WHERE id = ?",
            (text, now, chat_id)
        )

        conn.commit()

        row = conn.execute(
            "SELECT * FROM messages WHERE id = ?",
            (message_id,)
        ).fetchone()

    return {
        "success": True,
        "message": {
            "id": row["id"],
            "chatId": row["chat_id"],
            "sender": row["sender"],
            "text": row["text"],
            "createdAt": row["created_at"]
        }
    }