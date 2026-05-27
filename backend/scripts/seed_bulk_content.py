from pathlib import Path
from datetime import datetime, timedelta
import sqlite3
import uuid
import random

BASE_DIR = Path(__file__).resolve().parent.parent
CONTENT_DB = BASE_DIR / "vibeloop_content.db"
USERS_DB = BASE_DIR / "vibeloop_users.db"

CREATORS = [
    ("@pradip", "Pradip Kumar", "Digital Creator • Designer • Developer"),
    ("@sambhajingrdevelopers", "Sambhajingr Developers", "Website, app and software development"),
    ("@manoj", "Manoj", "Video creator and social storyteller"),
    ("@creator", "Creator", "Creative content maker"),
    ("@ananya", "Ananya", "Lifestyle and reels creator"),
    ("@rahul", "Rahul", "Business growth and marketing"),
    ("@kiran", "Kiran", "Travel and photography"),
    ("@vaishali", "Vaishali Mundhe", "UI UX designer"),
    ("@vibeloop", "VibeLoop Creative", "Official creator channel"),
    ("@studiox", "Studio X", "Brand design studio"),
]

POST_TITLES = [
    "Business Website Design",
    "Creator Workspace",
    "Mobile App UI Concept",
    "3D Login Page Design",
    "Shop Owner Website Offer",
    "Banking App Dashboard",
    "Temple Trust App Design",
    "Grocery App Screen",
    "Steel Railing Showcase",
    "Glass Showroom UI",
    "Office Setup Preview",
    "Creative Branding Post",
]

REEL_TITLES = [
    "Website Reveal Reel",
    "App Design Motion",
    "3D UI Animation",
    "Creator Desk Video",
    "Business Promo Reel",
    "Design Before After",
    "Fast UI Preview",
    "Client Project Reel",
    "Brand Growth Reel",
    "Mobile App Walkthrough",
]

STORY_TITLES = [
    "Today Work",
    "Behind the Scenes",
    "New Upload",
    "Design Mood",
    "Office Update",
    "Client Preview",
    "Daily Creator Story",
]

VIDEO_URLS = [
    "https://www.w3schools.com/html/mov_bbb.mp4",
    "https://www.w3schools.com/html/movie.mp4",
    "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4",
]

def now_iso(offset_minutes=0):
    return (datetime.utcnow() - timedelta(minutes=offset_minutes)).isoformat()

def normalize_username(value):
    clean = str(value or "").strip()
    if not clean:
        return "@creator"
    return clean if clean.startswith("@") else f"@{clean}"

def connect(path):
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn

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

def ensure_users_schema():
    with connect(USERS_DB) as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                userId TEXT,
                name TEXT,
                username TEXT UNIQUE,
                email TEXT,
                bio TEXT,
                avatarUrl TEXT,
                bannerUrl TEXT,
                verified INTEGER DEFAULT 1,
                followers INTEGER DEFAULT 0,
                following INTEGER DEFAULT 0,
                status TEXT DEFAULT 'Active',
                role TEXT DEFAULT 'creator',
                created_at TEXT
            )
        """)
        conn.commit()

def seed_users():
    ensure_users_schema()

    with connect(USERS_DB) as conn:
        for index, (username, name, bio) in enumerate(CREATORS, start=1):
            clean = normalize_username(username)
            user_id = f"USR-SEED-{index:03d}"

            conn.execute("""
                INSERT OR IGNORE INTO users (
                    id, userId, name, username, email, bio, avatarUrl, bannerUrl,
                    verified, followers, following, status, role, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                user_id,
                user_id,
                name,
                clean,
                clean.replace("@", "") + "@vibeloop.local",
                bio,
                "",
                "",
                1,
                random.randint(25, 2500),
                random.randint(5, 500),
                "Active",
                "creator",
                now_iso(index)
            ))
        conn.commit()

def soft_archive_broken_media():
    ensure_content_schema()

    with connect(CONTENT_DB) as conn:
        for table in ["posts", "reels", "stories"]:
            conn.execute(f"""
                UPDATE {table}
                SET archived_at = ?
                WHERE archived_at IS NULL
                AND (
                    (COALESCE(media_url, '') = '' AND COALESCE(video_url, '') = '')
                    OR (
                        COALESCE(media_url, '') NOT LIKE 'http%'
                        AND COALESCE(media_url, '') NOT LIKE '/media/%'
                        AND COALESCE(media_url, '') NOT LIKE 'data:%'
                        AND COALESCE(video_url, '') NOT LIKE 'http%'
                        AND COALESCE(video_url, '') NOT LIKE '/media/%'
                        AND COALESCE(video_url, '') NOT LIKE 'data:%'
                    )
                )
            """, (now_iso(),))
        conn.commit()

def insert_item(table, item):
    with connect(CONTENT_DB) as conn:
        conn.execute(f"""
            INSERT OR REPLACE INTO {table} (
                id, kind, title, caption, username, user, name,
                media_url, video_url, media_type, location,
                likes, comments, views, created_at, updated_at, archived_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
        """, (
            item["id"],
            item["kind"],
            item["title"],
            item["caption"],
            item["username"],
            item["username"],
            item["name"],
            item["media_url"],
            item["video_url"],
            item["media_type"],
            item["location"],
            item["likes"],
            item["comments"],
            item["views"],
            item["created_at"],
            now_iso(),
        ))
        conn.commit()

def seed_posts(total=80):
    ensure_content_schema()

    for i in range(1, total + 1):
        username, name, _bio = CREATORS[(i - 1) % len(CREATORS)]
        title = POST_TITLES[(i - 1) % len(POST_TITLES)]
        image = f"https://picsum.photos/seed/vibeloop-post-{i}/1200/900"

        insert_item("posts", {
            "id": f"POST-SEED-{i:04d}",
            "kind": "post",
            "title": title,
            "caption": f"{title} created for VibeLoop social feed. Real backend post #{i}.",
            "username": normalize_username(username),
            "name": name,
            "media_url": image,
            "video_url": "",
            "media_type": "image",
            "location": "India",
            "likes": random.randint(5, 500),
            "comments": random.randint(0, 80),
            "views": random.randint(50, 5000),
            "created_at": now_iso(i * 8),
        })

def seed_reels(total=45):
    ensure_content_schema()

    for i in range(1, total + 1):
        username, name, _bio = CREATORS[(i - 1) % len(CREATORS)]
        title = REEL_TITLES[(i - 1) % len(REEL_TITLES)]
        video = VIDEO_URLS[(i - 1) % len(VIDEO_URLS)]

        insert_item("reels", {
            "id": f"REEL-SEED-{i:04d}",
            "kind": "reel",
            "title": title,
            "caption": f"{title} uploaded as backend video reel #{i}.",
            "username": normalize_username(username),
            "name": name,
            "media_url": video,
            "video_url": video,
            "media_type": "video",
            "location": "VibeLoop",
            "likes": random.randint(15, 900),
            "comments": random.randint(0, 150),
            "views": random.randint(200, 25000),
            "created_at": now_iso(i * 5),
        })

def seed_stories(total=35):
    ensure_content_schema()

    for i in range(1, total + 1):
        username, name, _bio = CREATORS[(i - 1) % len(CREATORS)]
        title = STORY_TITLES[(i - 1) % len(STORY_TITLES)]
        image = f"https://picsum.photos/seed/vibeloop-story-{i}/900/1600"

        insert_item("stories", {
            "id": f"STORY-SEED-{i:04d}",
            "kind": "story",
            "title": title,
            "caption": f"{title} story from backend.",
            "username": normalize_username(username),
            "name": name,
            "media_url": image,
            "video_url": "",
            "media_type": "image",
            "location": "VibeLoop",
            "likes": random.randint(1, 120),
            "comments": random.randint(0, 25),
            "views": random.randint(50, 6000),
            "created_at": now_iso(i * 3),
        })

def count_table(db, table):
    with connect(db) as conn:
        return conn.execute(f"SELECT COUNT(*) AS total FROM {table} WHERE archived_at IS NULL" if table in ["posts", "reels", "stories"] else f"SELECT COUNT(*) AS total FROM {table}").fetchone()["total"]

def main():
    ensure_users_schema()
    ensure_content_schema()

    seed_users()
    soft_archive_broken_media()
    seed_posts(80)
    seed_reels(45)
    seed_stories(35)

    print("Bulk backend content seeded successfully.")
    print("Users:", count_table(USERS_DB, "users"))
    print("Posts:", count_table(CONTENT_DB, "posts"))
    print("Reels:", count_table(CONTENT_DB, "reels"))
    print("Stories:", count_table(CONTENT_DB, "stories"))
    print("Broken/empty media items were soft-archived, not hard-deleted.")

if __name__ == "__main__":
    main()
