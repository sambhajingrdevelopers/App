from fastapi import APIRouter, Body, Query
from pathlib import Path
from datetime import datetime
import sqlite3
import time

router = APIRouter()
DB_PATH = Path(__file__).resolve().parent.parent / "vibeloop_users.db"


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def now_iso():
    return datetime.utcnow().isoformat()


def init_db():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                username TEXT UNIQUE,
                email TEXT,
                role TEXT,
                status TEXT,
                verified INTEGER DEFAULT 0,
                followers INTEGER DEFAULT 0,
                created_at TEXT,
                updated_at TEXT,
                archived_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS user_audit_logs (
                id TEXT PRIMARY KEY,
                user_id TEXT,
                action TEXT,
                old_value TEXT,
                new_value TEXT,
                created_at TEXT
            )
        """)

        count = conn.execute("SELECT COUNT(*) AS total FROM users").fetchone()["total"]

        if count == 0:
            now = now_iso()
            seed = [
                ("USR-101", "VibeLoop Creator", "@you", "you@vibeloop.app", "creator", "Active", 1, 52800, now, now, ""),
                ("USR-102", "Mira Creates", "@mira.creates", "mira@vibeloop.app", "creator", "Active", 1, 52800, now, now, ""),
                ("USR-103", "Style Loop", "@styleloop", "style@vibeloop.app", "brand", "Active", 1, 76400, now, now, ""),
                ("USR-104", "Travel Dev", "@travel.dev", "travel@vibeloop.app", "creator", "Active", 0, 42100, now, now, ""),
                ("USR-105", "Founder Hub", "@founderhub", "founder@vibeloop.app", "creator", "Blocked", 0, 28700, now, now, ""),
            ]

            conn.executemany(
                "INSERT OR IGNORE INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                seed
            )

        conn.commit()


def user_to_dict(row):
    return {
        "id": row["id"],
        "name": row["name"],
        "username": row["username"],
        "email": row["email"],
        "role": row["role"],
        "status": row["status"],
        "verified": bool(row["verified"]),
        "followers": int(row["followers"] or 0),
        "createdAt": row["created_at"],
        "updatedAt": row["updated_at"],
        "archivedAt": row["archived_at"]
    }


def add_audit(conn, user_id, action, old_value, new_value):
    conn.execute(
        "INSERT INTO user_audit_logs VALUES (?, ?, ?, ?, ?, ?)",
        (
            f"AUD-{int(time.time() * 1000)}",
            user_id,
            action,
            str(old_value),
            str(new_value),
            now_iso()
        )
    )


@router.get("/api/v1/admin/users")
def list_admin_users(q: str = Query(default=""), include_archived: bool = Query(default=False)):
    init_db()

    query = (q or "").strip()
    like = f"%{query}%"

    with connect_db() as conn:
        if query:
            if include_archived:
                rows = conn.execute(
                    """
                    SELECT * FROM users
                    WHERE lower(name) LIKE lower(?)
                       OR lower(username) LIKE lower(?)
                       OR lower(email) LIKE lower(?)
                       OR lower(role) LIKE lower(?)
                       OR lower(status) LIKE lower(?)
                    ORDER BY updated_at DESC
                    """,
                    (like, like, like, like, like)
                ).fetchall()
            else:
                rows = conn.execute(
                    """
                    SELECT * FROM users
                    WHERE status != 'Archived'
                      AND (
                        lower(name) LIKE lower(?)
                        OR lower(username) LIKE lower(?)
                        OR lower(email) LIKE lower(?)
                        OR lower(role) LIKE lower(?)
                        OR lower(status) LIKE lower(?)
                      )
                    ORDER BY updated_at DESC
                    """,
                    (like, like, like, like, like)
                ).fetchall()
        else:
            if include_archived:
                rows = conn.execute("SELECT * FROM users ORDER BY updated_at DESC").fetchall()
            else:
                rows = conn.execute("SELECT * FROM users WHERE status != 'Archived' ORDER BY updated_at DESC").fetchall()

        total = conn.execute("SELECT COUNT(*) AS total FROM users WHERE status != 'Archived'").fetchone()["total"]
        active = conn.execute("SELECT COUNT(*) AS total FROM users WHERE status = 'Active'").fetchone()["total"]
        blocked = conn.execute("SELECT COUNT(*) AS total FROM users WHERE status = 'Blocked'").fetchone()["total"]
        verified = conn.execute("SELECT COUNT(*) AS total FROM users WHERE verified = 1 AND status != 'Archived'").fetchone()["total"]
        archived = conn.execute("SELECT COUNT(*) AS total FROM users WHERE status = 'Archived'").fetchone()["total"]

    return {
        "success": True,
        "users": [user_to_dict(row) for row in rows],
        "summary": {
            "total": total,
            "active": active,
            "blocked": blocked,
            "verified": verified,
            "archived": archived
        }
    }


@router.post("/api/v1/admin/users")
def create_admin_user(payload: dict = Body(...)):
    init_db()

    name = str(payload.get("name") or "").strip()
    username = str(payload.get("username") or "").strip()
    email = str(payload.get("email") or "").strip()
    role = str(payload.get("role") or "creator").strip()

    if not name:
        return {"success": False, "message": "Name is required"}

    if not username:
        return {"success": False, "message": "Username is required"}

    if not username.startswith("@"):
        username = "@" + username

    user_id = f"USR-{int(time.time() * 1000)}"
    now = now_iso()

    try:
        with connect_db() as conn:
            conn.execute(
                "INSERT INTO users VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (user_id, name, username, email, role, "Active", 0, 0, now, now, "")
            )
            add_audit(conn, user_id, "create-user", "", f"{name} {username}")
            conn.commit()

            row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

        return {"success": True, "user": user_to_dict(row)}
    except sqlite3.IntegrityError:
        return {"success": False, "message": "Username already exists"}


@router.post("/api/v1/admin/users/{user_id}/status")
def update_user_status(user_id: str, payload: dict = Body(...)):
    init_db()

    status = str(payload.get("status") or "Active").strip()

    if status not in ["Active", "Blocked", "Suspended"]:
        return {"success": False, "message": "Invalid status"}

    with connect_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

        if not row:
            return {"success": False, "message": "User not found"}

        old_status = row["status"]

        conn.execute(
            "UPDATE users SET status = ?, updated_at = ? WHERE id = ?",
            (status, now_iso(), user_id)
        )
        add_audit(conn, user_id, "update-status", old_status, status)
        conn.commit()

        updated = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    return {"success": True, "user": user_to_dict(updated)}


@router.post("/api/v1/admin/users/{user_id}/role")
def update_user_role(user_id: str, payload: dict = Body(...)):
    init_db()

    role = str(payload.get("role") or "creator").strip()

    if role not in ["user", "creator", "brand", "moderator", "admin"]:
        return {"success": False, "message": "Invalid role"}

    with connect_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

        if not row:
            return {"success": False, "message": "User not found"}

        old_role = row["role"]

        conn.execute(
            "UPDATE users SET role = ?, updated_at = ? WHERE id = ?",
            (role, now_iso(), user_id)
        )
        add_audit(conn, user_id, "update-role", old_role, role)
        conn.commit()

        updated = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    return {"success": True, "user": user_to_dict(updated)}


@router.post("/api/v1/admin/users/{user_id}/verify")
def update_user_verification(user_id: str, payload: dict = Body(...)):
    init_db()

    verified = bool(payload.get("verified"))

    with connect_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

        if not row:
            return {"success": False, "message": "User not found"}

        old_value = bool(row["verified"])

        conn.execute(
            "UPDATE users SET verified = ?, updated_at = ? WHERE id = ?",
            (1 if verified else 0, now_iso(), user_id)
        )
        add_audit(conn, user_id, "update-verification", old_value, verified)
        conn.commit()

        updated = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    return {"success": True, "user": user_to_dict(updated)}


@router.post("/api/v1/admin/users/{user_id}/archive")
def archive_user(user_id: str):
    init_db()

    with connect_db() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

        if not row:
            return {"success": False, "message": "User not found"}

        archived_at = now_iso()

        conn.execute(
            "UPDATE users SET status = 'Archived', archived_at = ?, updated_at = ? WHERE id = ?",
            (archived_at, archived_at, user_id)
        )
        add_audit(conn, user_id, "soft-archive-user", row["status"], "Archived")
        conn.commit()

        updated = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()

    return {
        "success": True,
        "message": "User archived safely. No hard delete performed.",
        "user": user_to_dict(updated)
    }