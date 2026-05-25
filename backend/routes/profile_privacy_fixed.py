from fastapi import APIRouter, Query, Body
from pathlib import Path
from datetime import datetime
import sqlite3

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent.parent
PRIVACY_DB = BASE_DIR / "vibeloop_privacy.db"
USERS_DB = BASE_DIR / "vibeloop_users.db"
CONTENT_DB = BASE_DIR / "vibeloop_content.db"


def normalize_username(value):
    clean = str(value or "").strip()
    if not clean:
        return "@you"
    return clean if clean.startswith("@") else f"@{clean}"


def now_iso():
    return datetime.utcnow().isoformat()


def connect(path):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


def ensure_privacy_schema():
    with connect(PRIVACY_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS profile_privacy (
                username TEXT PRIMARY KEY,
                is_private INTEGER DEFAULT 0,
                show_posts INTEGER DEFAULT 1,
                show_reels INTEGER DEFAULT 1,
                show_stories INTEGER DEFAULT 1,
                allow_messages INTEGER DEFAULT 1,
                show_followers INTEGER DEFAULT 1,
                show_following INTEGER DEFAULT 1,
                updated_at TEXT
            )
        """)
        conn.commit()


def default_privacy(username):
    return {
        "username": username,
        "isPrivate": False,
        "showPosts": True,
        "showReels": True,
        "showStories": True,
        "allowMessages": True,
        "showFollowers": True,
        "showFollowing": True,
    }


def get_privacy(username):
    ensure_privacy_schema()
    username = normalize_username(username)

    with connect(PRIVACY_DB) as conn:
        row = conn.execute(
            "SELECT * FROM profile_privacy WHERE username = ?",
            (username,)
        ).fetchone()

    if not row:
        return default_privacy(username)

    return {
        "username": username,
        "isPrivate": bool(row["is_private"]),
        "showPosts": bool(row["show_posts"]),
        "showReels": bool(row["show_reels"]),
        "showStories": bool(row["show_stories"]),
        "allowMessages": bool(row["allow_messages"]),
        "showFollowers": bool(row["show_followers"]),
        "showFollowing": bool(row["show_following"]),
    }


def save_privacy(username, payload):
    ensure_privacy_schema()
    username = normalize_username(username)

    existing = get_privacy(username)

    next_privacy = {
        "isPrivate": bool(payload.get("isPrivate", existing["isPrivate"])),
        "showPosts": bool(payload.get("showPosts", existing["showPosts"])),
        "showReels": bool(payload.get("showReels", existing["showReels"])),
        "showStories": bool(payload.get("showStories", existing["showStories"])),
        "allowMessages": bool(payload.get("allowMessages", existing["allowMessages"])),
        "showFollowers": bool(payload.get("showFollowers", existing["showFollowers"])),
        "showFollowing": bool(payload.get("showFollowing", existing["showFollowing"])),
    }

    with connect(PRIVACY_DB) as conn:
        conn.execute(
            """
            INSERT OR REPLACE INTO profile_privacy (
                username, is_private, show_posts, show_reels, show_stories,
                allow_messages, show_followers, show_following, updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                username,
                int(next_privacy["isPrivate"]),
                int(next_privacy["showPosts"]),
                int(next_privacy["showReels"]),
                int(next_privacy["showStories"]),
                int(next_privacy["allowMessages"]),
                int(next_privacy["showFollowers"]),
                int(next_privacy["showFollowing"]),
                now_iso(),
            )
        )
        conn.commit()

    return get_privacy(username)


def row_value(row, key, default=""):
    try:
        return row[key] if key in row.keys() and row[key] is not None else default
    except Exception:
        return default


def safe_public_user(row):
    username = normalize_username(row_value(row, "username") or row_value(row, "user") or row_value(row, "email") or row_value(row, "name"))
    name = row_value(row, "name") or row_value(row, "fullName") or row_value(row, "full_name") or username.replace("@", "") or "Creator"

    return {
        "username": username,
        "name": name,
        "bio": row_value(row, "bio") or "Digital Creator",
        "avatarUrl": row_value(row, "avatarUrl") or row_value(row, "avatar_url") or "",
        "bannerUrl": row_value(row, "bannerUrl") or row_value(row, "banner_url") or "",
        "verified": True,
        "followers": int(row_value(row, "followers", 0) or 0),
        "following": int(row_value(row, "following", 0) or 0),
    }


def find_user(username):
    username = normalize_username(username).lower()

    db_files = list(BASE_DIR.glob("*.db")) + list(BASE_DIR.rglob("*.db"))
    seen = set()

    for db in db_files:
        key = str(db.resolve())
        if key in seen:
            continue
        seen.add(key)

        try:
            conn = connect(db)
            tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()

            for table_row in tables:
                table = table_row["name"]
                if table.startswith("sqlite_"):
                    continue

                cols = conn.execute(f'PRAGMA table_info("{table}")').fetchall()
                col_names = [c["name"] for c in cols]
                lower = {c.lower(): c for c in col_names}

                if "username" not in lower and "email" not in lower and "name" not in lower:
                    continue

                checks = []
                params = []

                for col_key in ["username", "user", "email", "name"]:
                    if col_key in lower:
                        checks.append(f'LOWER(COALESCE(CAST("{lower[col_key]}" AS TEXT), "")) = ?')
                        params.append(username.replace("@", "") if col_key == "email" else username)

                if not checks:
                    continue

                rows = conn.execute(
                    f'SELECT * FROM "{table}" WHERE {" OR ".join(checks)} LIMIT 1',
                    params
                ).fetchall()

                if rows:
                    return safe_public_user(rows[0])

        except Exception:
            pass
        finally:
            try:
                conn.close()
            except Exception:
                pass

    return {
        "username": normalize_username(username),
        "name": normalize_username(username).replace("@", "") or "Creator",
        "bio": "Digital Creator",
        "avatarUrl": "",
        "bannerUrl": "",
        "verified": True,
        "followers": 0,
        "following": 0,
    }


def read_content_table(table, username):
    if not CONTENT_DB.exists():
        return []

    username = normalize_username(username)

    try:
        with connect(CONTENT_DB) as conn:
            rows = conn.execute(
                f"""
                SELECT * FROM {table}
                WHERE archived_at IS NULL
                AND (
                    username = ?
                    OR user = ?
                    OR name = ?
                )
                ORDER BY created_at DESC
                LIMIT 80
                """,
                (username, username, username.replace("@", ""))
            ).fetchall()

        items = []
        for row in rows:
            item = {
                "id": row_value(row, "id"),
                "title": row_value(row, "title"),
                "caption": row_value(row, "caption"),
                "username": row_value(row, "username") or row_value(row, "user"),
                "user": row_value(row, "user") or row_value(row, "username"),
                "name": row_value(row, "name"),
                "mediaUrl": row_value(row, "media_url") or row_value(row, "mediaUrl"),
                "videoUrl": row_value(row, "video_url") or row_value(row, "videoUrl") or row_value(row, "media_url"),
                "mediaType": row_value(row, "media_type") or row_value(row, "mediaType"),
                "likes": row_value(row, "likes", 0),
                "comments": row_value(row, "comments", 0),
                "views": row_value(row, "views", 0),
                "createdAt": row_value(row, "created_at"),
            }
            items.append(item)

        return items
    except Exception:
        return []


@router.get("/api/v1/public/profile")
def public_profile(
    username: str = Query("@you"),
    viewer: str = Query("@guest")
):
    target = normalize_username(username)
    viewer_username = normalize_username(viewer)
    is_owner = target.lower() == viewer_username.lower()

    privacy = get_privacy(target)
    user = find_user(target)

    posts = read_content_table("posts", target)
    reels = read_content_table("reels", target)
    stories = read_content_table("stories", target)

    # Privacy rules for public view
    if not is_owner:
        if privacy["isPrivate"]:
            posts = []
            reels = []
            stories = []
        else:
            if not privacy["showPosts"]:
                posts = []
            if not privacy["showReels"]:
                reels = []
            if not privacy["showStories"]:
                stories = []

    public_user = {
        "name": user["name"],
        "username": user["username"],
        "bio": user["bio"],
        "avatarUrl": user["avatarUrl"],
        "bannerUrl": user["bannerUrl"],
        "verified": user["verified"],
        "followers": user["followers"] if (is_owner or privacy["showFollowers"]) else None,
        "following": user["following"] if (is_owner or privacy["showFollowing"]) else None,
        "isOwner": is_owner,
        "isPrivate": privacy["isPrivate"],
        "allowMessages": privacy["allowMessages"] if not is_owner else True,
    }

    return {
        "success": True,
        "source": "privacy-profile",
        "user": public_user,
        "privacy": privacy if is_owner else {
            "isPrivate": privacy["isPrivate"],
            "allowMessages": privacy["allowMessages"],
        },
        "posts": posts,
        "reels": reels,
        "stories": stories,
        "counts": {
            "posts": len(posts),
            "reels": len(reels),
            "stories": len(stories),
            "followers": public_user["followers"],
            "following": public_user["following"],
        }
    }


@router.get("/api/v1/profile/privacy")
def profile_privacy(username: str = Query("@you")):
    return {
        "success": True,
        "privacy": get_privacy(username)
    }


@router.post("/api/v1/profile/privacy")
def update_profile_privacy(payload: dict = Body(...)):
    username = payload.get("username") or "@you"
    privacy = save_privacy(username, payload)

    return {
        "success": True,
        "message": "Profile privacy updated.",
        "privacy": privacy
    }
