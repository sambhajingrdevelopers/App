from fastapi import APIRouter, Body, Query
from pathlib import Path
from datetime import datetime, timezone
import sqlite3
import uuid

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
SOCIAL_DB = BASE_DIR / "vibeloop_social.db"
FOLLOW_DB = BASE_DIR / "vibeloop_follow.db"
SAVED_DB = BASE_DIR / "vibeloop_saved.db"
CONTENT_DB = BASE_DIR / "vibeloop_content.db"


def now_iso():
    return datetime.now(timezone.utc).isoformat()


def clean_username(value):
    text = str(value or "").strip()
    if not text:
        return "@guest"
    return text if text.startswith("@") else f"@{text}"


def connect(path):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_social_schema():
    with connect(SOCIAL_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS content_likes (
                id TEXT PRIMARY KEY,
                user TEXT,
                content_id TEXT,
                kind TEXT,
                created_at TEXT,
                archived_at TEXT
            )
        """)

        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_like_user_content
            ON content_likes(user, content_id)
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS content_comments (
                id TEXT PRIMARY KEY,
                user TEXT,
                content_id TEXT,
                kind TEXT,
                text TEXT,
                created_at TEXT,
                archived_at TEXT
            )
        """)

        conn.commit()


def ensure_follow_schema():
    with connect(FOLLOW_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS follow_edges (
                id TEXT PRIMARY KEY,
                follower TEXT NOT NULL,
                following_user TEXT NOT NULL,
                created_at TEXT,
                archived_at TEXT
            )
        """)

        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_follow_edges_pair
            ON follow_edges(follower, following_user)
        """)

        conn.commit()


def ensure_saved_schema():
    with connect(SAVED_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS saved_items (
                id TEXT PRIMARY KEY,
                user TEXT,
                content_id TEXT,
                kind TEXT,
                created_at TEXT,
                archived_at TEXT
            )
        """)

        conn.execute("""
            CREATE UNIQUE INDEX IF NOT EXISTS idx_saved_user_content
            ON saved_items(user, content_id)
        """)

        conn.commit()


def ensure_content_schema():
    with connect(CONTENT_DB) as conn:
        for table in ["posts", "reels", "stories"]:
            conn.execute(f"""
                CREATE TABLE IF NOT EXISTS {table} (
                    id TEXT PRIMARY KEY,
                    kind TEXT,
                    title TEXT,
                    caption TEXT,
                    username TEXT,
                    user TEXT,
                    name TEXT,
                    media_url TEXT,
                    video_url TEXT,
                    media_type TEXT,
                    location TEXT,
                    likes INTEGER DEFAULT 0,
                    comments INTEGER DEFAULT 0,
                    views INTEGER DEFAULT 0,
                    created_at TEXT,
                    updated_at TEXT,
                    archived_at TEXT
                )
            """)
        conn.commit()


def table_for_kind(kind):
    kind = str(kind or "post").lower()
    if kind == "reel":
        return "reels"
    if kind == "story":
        return "stories"
    return "posts"


def find_content(content_id):
    ensure_content_schema()

    with connect(CONTENT_DB) as conn:
        for table, kind in [("posts", "post"), ("reels", "reel"), ("stories", "story")]:
            row = conn.execute(f"SELECT * FROM {table} WHERE id = ? LIMIT 1", (content_id,)).fetchone()
            if row:
                return table, kind, row

    return None, None, None


def get_base_counts(content_id):
    table, _, row = find_content(content_id)
    if not row:
        return 0, 0, 0

    return int(row["likes"] or 0), int(row["comments"] or 0), int(row["views"] or 0)


def update_content_count(content_id, field, delta):
    table, _, row = find_content(content_id)
    if not table or field not in ["likes", "comments", "views"]:
        return

    current = int(row[field] or 0)
    new_value = max(0, current + int(delta))

    with connect(CONTENT_DB) as conn:
        conn.execute(f"""
            UPDATE {table}
            SET {field} = ?,
                updated_at = ?
            WHERE id = ?
        """, (new_value, now_iso(), content_id))
        conn.commit()


def count_followers(username):
    ensure_follow_schema()
    username = clean_username(username)

    with connect(FOLLOW_DB) as conn:
        followers = conn.execute("""
            SELECT COUNT(*) AS c FROM follow_edges
            WHERE following_user = ?
            AND COALESCE(archived_at, '') = ''
        """, (username,)).fetchone()["c"]

        following = conn.execute("""
            SELECT COUNT(*) AS c FROM follow_edges
            WHERE follower = ?
            AND COALESCE(archived_at, '') = ''
        """, (username,)).fetchone()["c"]

    return int(followers or 0), int(following or 0)


@router.get("/api/v1/social/summary")
def social_summary(
    user: str = Query("@guest"),
    content_id: str = Query(""),
    kind: str = Query("post"),
    owner: str = Query("@creator")
):
    ensure_social_schema()
    ensure_saved_schema()
    ensure_follow_schema()

    user = clean_username(user)
    owner = clean_username(owner)

    base_likes, base_comments, views = get_base_counts(content_id)

    with connect(SOCIAL_DB) as conn:
        liked_row = conn.execute("""
            SELECT id FROM content_likes
            WHERE user = ?
            AND content_id = ?
            AND COALESCE(archived_at, '') = ''
            LIMIT 1
        """, (user, content_id)).fetchone()

        active_likes = conn.execute("""
            SELECT COUNT(*) AS c FROM content_likes
            WHERE content_id = ?
            AND COALESCE(archived_at, '') = ''
        """, (content_id,)).fetchone()["c"]

        active_comments = conn.execute("""
            SELECT COUNT(*) AS c FROM content_comments
            WHERE content_id = ?
            AND COALESCE(archived_at, '') = ''
        """, (content_id,)).fetchone()["c"]

    with connect(SAVED_DB) as conn:
        saved_row = conn.execute("""
            SELECT id FROM saved_items
            WHERE user = ?
            AND content_id = ?
            AND COALESCE(archived_at, '') = ''
            LIMIT 1
        """, (user, content_id)).fetchone()

    with connect(FOLLOW_DB) as conn:
        follow_row = conn.execute("""
            SELECT id FROM follow_edges
            WHERE follower = ?
            AND following_user = ?
            AND COALESCE(archived_at, '') = ''
            LIMIT 1
        """, (user, owner)).fetchone()

    followers, following = count_followers(owner)

    return {
        "success": True,
        "contentId": content_id,
        "kind": kind,
        "isLiked": bool(liked_row),
        "isSaved": bool(saved_row),
        "isFollowing": bool(follow_row),
        "likes": base_likes,
        "extraLikes": int(active_likes or 0),
        "comments": base_comments,
        "extraComments": int(active_comments or 0),
        "views": views,
        "followers": followers,
        "following": following
    }


@router.post("/api/v1/social/like/toggle")
def toggle_like(payload: dict = Body(...)):
    ensure_social_schema()

    user = clean_username(payload.get("user"))
    content_id = str(payload.get("contentId") or payload.get("content_id") or "").strip()
    kind = str(payload.get("kind") or "post").strip()

    if not content_id:
        return {"success": False, "message": "Content id required."}

    now = now_iso()

    with connect(SOCIAL_DB) as conn:
        row = conn.execute("""
            SELECT * FROM content_likes
            WHERE user = ?
            AND content_id = ?
            LIMIT 1
        """, (user, content_id)).fetchone()

        if row and not row["archived_at"]:
            conn.execute("UPDATE content_likes SET archived_at = ? WHERE id = ?", (now, row["id"]))
            conn.commit()
            update_content_count(content_id, "likes", -1)
            liked = False
            message = "Like removed."
        elif row:
            conn.execute("UPDATE content_likes SET archived_at = NULL, created_at = ? WHERE id = ?", (now, row["id"]))
            conn.commit()
            update_content_count(content_id, "likes", 1)
            liked = True
            message = "Liked."
        else:
            conn.execute("""
                INSERT INTO content_likes (id, user, content_id, kind, created_at, archived_at)
                VALUES (?, ?, ?, ?, ?, NULL)
            """, (f"LIK-{uuid.uuid4().hex[:14]}", user, content_id, kind, now))
            conn.commit()
            update_content_count(content_id, "likes", 1)
            liked = True
            message = "Liked."

    likes, comments, views = get_base_counts(content_id)

    return {
        "success": True,
        "isLiked": liked,
        "message": message,
        "likes": likes,
        "comments": comments,
        "views": views
    }


@router.get("/api/v1/social/comments/list")
def list_comments(content_id: str = Query("")):
    ensure_social_schema()

    with connect(SOCIAL_DB) as conn:
        rows = conn.execute("""
            SELECT * FROM content_comments
            WHERE content_id = ?
            AND COALESCE(archived_at, '') = ''
            ORDER BY datetime(created_at) ASC
            LIMIT 500
        """, (content_id,)).fetchall()

    comments = []

    for row in rows:
        comments.append({
            "id": row["id"],
            "user": clean_username(row["user"]),
            "contentId": row["content_id"],
            "kind": row["kind"],
            "text": row["text"],
            "createdAt": row["created_at"]
        })

    return {
        "success": True,
        "comments": comments
    }


@router.post("/api/v1/social/comments/add")
def add_comment(payload: dict = Body(...)):
    ensure_social_schema()

    user = clean_username(payload.get("user"))
    content_id = str(payload.get("contentId") or payload.get("content_id") or "").strip()
    kind = str(payload.get("kind") or "post").strip()
    text = str(payload.get("text") or "").strip()

    if not content_id:
        return {"success": False, "message": "Content id required."}

    if not text:
        return {"success": False, "message": "Comment text required."}

    comment_id = f"CMT-{uuid.uuid4().hex[:14]}"
    created_at = now_iso()

    with connect(SOCIAL_DB) as conn:
        conn.execute("""
            INSERT INTO content_comments (id, user, content_id, kind, text, created_at, archived_at)
            VALUES (?, ?, ?, ?, ?, ?, NULL)
        """, (comment_id, user, content_id, kind, text, created_at))
        conn.commit()

    update_content_count(content_id, "comments", 1)

    likes, comments, views = get_base_counts(content_id)

    return {
        "success": True,
        "message": "Comment added.",
        "item": {
            "id": comment_id,
            "user": user,
            "contentId": content_id,
            "kind": kind,
            "text": text,
            "createdAt": created_at
        },
        "likes": likes,
        "comments": comments,
        "views": views
    }


@router.post("/api/v1/social/save/toggle")
def toggle_save(payload: dict = Body(...)):
    ensure_saved_schema()

    user = clean_username(payload.get("user"))
    content_id = str(payload.get("contentId") or payload.get("content_id") or "").strip()
    kind = str(payload.get("kind") or "post").strip()

    if not content_id:
        return {"success": False, "message": "Content id required."}

    now = now_iso()

    with connect(SAVED_DB) as conn:
        row = conn.execute("""
            SELECT * FROM saved_items
            WHERE user = ?
            AND content_id = ?
            LIMIT 1
        """, (user, content_id)).fetchone()

        if row and not row["archived_at"]:
            conn.execute("UPDATE saved_items SET archived_at = ? WHERE id = ?", (now, row["id"]))
            conn.commit()
            return {"success": True, "isSaved": False, "message": "Removed from saved."}

        if row:
            conn.execute("UPDATE saved_items SET archived_at = NULL, created_at = ? WHERE id = ?", (now, row["id"]))
            conn.commit()
            return {"success": True, "isSaved": True, "message": "Saved again."}

        conn.execute("""
            INSERT INTO saved_items (id, user, content_id, kind, created_at, archived_at)
            VALUES (?, ?, ?, ?, ?, NULL)
        """, (f"SAV-{uuid.uuid4().hex[:14]}", user, content_id, kind, now))
        conn.commit()

    return {"success": True, "isSaved": True, "message": "Saved."}


@router.get("/api/v1/follow/status")
def follow_status(
    follower: str = Query("@guest"),
    following: str = Query("@creator")
):
    ensure_follow_schema()

    follower = clean_username(follower)
    following = clean_username(following)

    with connect(FOLLOW_DB) as conn:
        row = conn.execute("""
            SELECT id FROM follow_edges
            WHERE follower = ?
            AND following_user = ?
            AND COALESCE(archived_at, '') = ''
            LIMIT 1
        """, (follower, following)).fetchone()

    followers, following_count = count_followers(following)

    return {
        "success": True,
        "isFollowing": bool(row),
        "follower": follower,
        "following": following,
        "followers": followers,
        "followingCount": following_count
    }


@router.post("/api/v1/follow/toggle")
def follow_toggle(payload: dict = Body(...)):
    ensure_follow_schema()

    follower = clean_username(payload.get("follower"))
    following = clean_username(payload.get("following"))

    if follower.lower() == following.lower():
        return {"success": False, "message": "You cannot follow yourself.", "isFollowing": False}

    now = now_iso()

    with connect(FOLLOW_DB) as conn:
        row = conn.execute("""
            SELECT * FROM follow_edges
            WHERE follower = ?
            AND following_user = ?
            LIMIT 1
        """, (follower, following)).fetchone()

        if row and not row["archived_at"]:
            conn.execute("UPDATE follow_edges SET archived_at = ? WHERE id = ?", (now, row["id"]))
            conn.commit()
            is_following = False
            message = "Unfollowed."
        elif row:
            conn.execute("UPDATE follow_edges SET archived_at = NULL, created_at = ? WHERE id = ?", (now, row["id"]))
            conn.commit()
            is_following = True
            message = "Following."
        else:
            conn.execute("""
                INSERT INTO follow_edges (id, follower, following_user, created_at, archived_at)
                VALUES (?, ?, ?, ?, NULL)
            """, (f"FOL-{uuid.uuid4().hex[:14]}", follower, following, now))
            conn.commit()
            is_following = True
            message = "Following."

    followers, following_count = count_followers(following)

    return {
        "success": True,
        "isFollowing": is_following,
        "message": message,
        "followers": followers,
        "followingCount": following_count
    }


@router.get("/api/v1/social/health")
def health():
    ensure_social_schema()
    ensure_follow_schema()
    ensure_saved_schema()

    return {
        "success": True,
        "socialDb": str(SOCIAL_DB),
        "followDb": str(FOLLOW_DB),
        "savedDb": str(SAVED_DB)
    }
