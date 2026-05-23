from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).resolve().parent.parent

def ensure_archive_columns():
    for db_name, table_name in [
        ("vibeloop_posts.db", "posts"),
        ("vibeloop_reels.db", "reels"),
        ("vibeloop_stories.db", "stories"),
    ]:
        db_path = BASE_DIR / db_name
        if not db_path.exists():
            continue

        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row

        try:
            columns = [
                row["name"]
                for row in conn.execute(f"PRAGMA table_info({table_name})").fetchall()
            ]

            if "archived_at" not in columns:
                conn.execute(f"ALTER TABLE {table_name} ADD COLUMN archived_at TEXT")
                conn.commit()
        finally:
            conn.close()
