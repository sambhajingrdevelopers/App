from fastapi import APIRouter, Body, Query
from pathlib import Path
from datetime import datetime
import sqlite3

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent
DB_PATH = BASE_DIR / "vibeloop_users.db"


def now_iso():
    return datetime.utcnow().isoformat()


def connect_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_schema():
    with connect_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT,
                username TEXT UNIQUE,
                email TEXT,
                role TEXT DEFAULT 'creator',
                status TEXT DEFAULT 'Active',
                verified INTEGER DEFAULT 1,
                followers INTEGER DEFAULT 0,
                bio TEXT DEFAULT '',
                avatar_url TEXT DEFAULT '',
                banner_url TEXT DEFAULT '',
                created_at TEXT,
                updated_at TEXT,
                archived_at TEXT
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS follows (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                follower_username TEXT,
                following_username TEXT,
                created_at TEXT,
                UNIQUE(follower_username, following_username)
            )
        """)

        conn.commit()


def normalize(username):
    clean = (username or "").strip()
    if not clean:
        clean = "@you"

    if not clean.startswith("@"):
        clean = f"@{clean}"

    return clean


def ensure_user(conn, username):
    row = conn.execute(
        "SELECT * FROM users WHERE username = ?",
        (username,)
    ).fetchone()

    if row:
        return row

    ts = now_iso()
    user_id = "USR-" + username.replace("@", "").replace(".", "-").upper()

    conn.execute(
        """
        INSERT INTO users (
            id, name, username, email, role, status, verified, followers,
            bio, avatar_url, banner_url, created_at, updated_at, archived_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            user_id,
            username.replace("@", "").replace(".", " ").title() or "Creator",
            username,
            "",
            "creator",
            "Active",
            0,
            0,
            "Digital creator",
            "",
            "",
            ts,
            ts,
            None
        )
    )

    conn.commit()

    return conn.execute(
        "SELECT * FROM users WHERE username = ?",
        (username,)
    ).fetchone()


@router.get("/api/v1/follow/status")
def follow_status(
    follower: str = Query(default="@you"),
    following: str = Query(default="@you")
):
    ensure_schema()

    follower_username = normalize(follower)
    following_username = normalize(following)

    with connect_db() as conn:
        row = conn.execute(
            """
            SELECT id
            FROM follows
            WHERE follower_username = ? AND following_username = ?
            """,
            (follower_username, following_username)
        ).fetchone()

    return {
        "success": True,
        "follower": follower_username,
        "following": following_username,
        "followingStatus": bool(row)
    }


@router.post("/api/v1/follow/toggle")
def toggle_follow(payload: dict = Body(...)):
    ensure_schema()

    follower_username = normalize(payload.get("follower") or "@you")
    following_username = normalize(payload.get("following") or "")

    if not following_username:
        return {
            "success": False,
            "message": "Following username is required."
        }

    if follower_username == following_username:
        return {
            "success": False,
            "message": "You cannot follow yourself."
        }

    with connect_db() as conn:
        ensure_user(conn, follower_username)
        ensure_user(conn, following_username)

        existing = conn.execute(
            """
            SELECT id
            FROM follows
            WHERE follower_username = ? AND following_username = ?
            """,
            (follower_username, following_username)
        ).fetchone()

        if existing:
            conn.execute(
                """
                DELETE FROM follows
                WHERE follower_username = ? AND following_username = ?
                """,
                (follower_username, following_username)
            )

            conn.execute(
                """
                UPDATE users
                SET followers = CASE WHEN followers > 0 THEN followers - 1 ELSE 0 END
                WHERE username = ?
                """,
                (following_username,)
            )

            conn.commit()

            return {
                "success": True,
                "following": False,
                "message": "Unfollowed successfully."
            }

        conn.execute(
            """
            INSERT OR IGNORE INTO follows (follower_username, following_username, created_at)
            VALUES (?, ?, ?)
            """,
            (follower_username, following_username, now_iso())
        )

        conn.execute(
            """
            UPDATE users
            SET followers = COALESCE(followers, 0) + 1
            WHERE username = ?
            """,
            (following_username,)
        )

        conn.commit()

    return {
        "success": True,
        "following": True,
        "message": "Followed successfully."
    }


@router.get("/api/v1/following")
def following_list(username: str = Query(default="@you")):
    ensure_schema()

    follower_username = normalize(username)

    with connect_db() as conn:
        rows = conn.execute(
            """
            SELECT u.id, u.name, u.username, u.avatar_url
            FROM follows f
            LEFT JOIN users u ON u.username = f.following_username
            WHERE f.follower_username = ?
            ORDER BY f.id DESC
            LIMIT 50
            """,
            (follower_username,)
        ).fetchall()

    users = []

    for row in rows:
        users.append({
            "id": row["id"] or row["username"],
            "name": row["name"] or "Creator",
            "username": row["username"],
            "avatarUrl": row["avatar_url"] or "",
            "online": True,
            "hasStory": True
        })

    return {
        "success": True,
        "users": users
    }
