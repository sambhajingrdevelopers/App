from fastapi import APIRouter, Query
from pathlib import Path
import sqlite3

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


def normalize_username(value):
    clean = str(value or "").strip()
    if not clean:
        return "@creator"
    return clean if clean.startswith("@") else f"@{clean}"


def qid(name):
    return '"' + str(name).replace('"', '""') + '"'


def row_value(row, key, default=""):
    try:
        return row[key] if key in row.keys() and row[key] is not None else default
    except Exception:
        return default


def to_user(row, db_name, table_name):
    username = normalize_username(
        row_value(row, "username")
        or row_value(row, "user")
        or row_value(row, "handle")
        or row_value(row, "email")
        or row_value(row, "name")
    )

    name = (
        row_value(row, "name")
        or row_value(row, "fullName")
        or row_value(row, "full_name")
        or row_value(row, "display_name")
        or username.replace("@", "")
        or "Creator"
    )

    user_id = (
        row_value(row, "userId")
        or row_value(row, "user_id")
        or row_value(row, "id")
        or username
    )

    return {
        "id": str(user_id),
        "userId": str(user_id),
        "type": "creator",
        "title": str(name),
        "name": str(name),
        "username": username,
        "email": str(row_value(row, "email")),
        "caption": str(row_value(row, "bio") or "Digital Creator"),
        "bio": str(row_value(row, "bio") or "Digital Creator"),
        "avatarUrl": str(row_value(row, "avatarUrl") or row_value(row, "avatar_url")),
        "bannerUrl": str(row_value(row, "bannerUrl") or row_value(row, "banner_url")),
        "verified": True,
        "followers": int(row_value(row, "followers", 0) or 0),
        "status": str(row_value(row, "status") or "Active"),
        "sourceDb": db_name,
        "sourceTable": table_name
    }


def scan_all_users(q=""):
    query = str(q or "").strip().lower()
    db_files = []
    seen_paths = set()

    for db in list(BASE_DIR.glob("*.db")) + list(BASE_DIR.rglob("*.db")):
        key = str(db.resolve())
        if key not in seen_paths:
            seen_paths.add(key)
            db_files.append(db)

    results = []
    seen_users = set()

    for db_path in db_files:
        conn = None

        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row

            tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()

            for table_row in tables:
                table = table_row["name"]

                if table.startswith("sqlite_"):
                    continue

                cols_info = conn.execute(f"PRAGMA table_info({qid(table)})").fetchall()
                cols = [c["name"] for c in cols_info]
                lower = {c.lower(): c for c in cols}

                identity_cols = ["username", "user", "handle", "name", "fullname", "full_name", "display_name", "email", "userid", "user_id", "id"]
                if not any(c in lower for c in identity_cols):
                    continue

                search_cols = [lower[c] for c in ["username", "user", "handle", "name", "fullname", "full_name", "display_name", "email", "bio"] if c in lower]

                if query and search_cols:
                    where = " OR ".join([
                        f"LOWER(COALESCE(CAST({qid(col)} AS TEXT), '')) LIKE ?"
                        for col in search_cols
                    ])

                    rows = conn.execute(
                        f"SELECT * FROM {qid(table)} WHERE {where} LIMIT 100",
                        [f"%{query}%"] * len(search_cols)
                    ).fetchall()
                else:
                    rows = conn.execute(f"SELECT * FROM {qid(table)} LIMIT 100").fetchall()

                for row in rows:
                    item = to_user(row, db_path.name, table)
                    key = item["username"].lower()

                    if key in seen_users:
                        continue

                    if query:
                        haystack = " ".join([
                            item["username"],
                            item["name"],
                            item["email"],
                            item["bio"]
                        ]).lower()

                        if query not in haystack:
                            continue

                    seen_users.add(key)
                    results.append(item)

        except Exception:
            pass
        finally:
            if conn:
                conn.close()

    return results[:100]


@router.get("/api/v1/public/users/list")
def public_users_list():
    users = scan_all_users("")
    return {
        "success": True,
        "source": "public-universal-users-list",
        "users": users,
        "results": users,
        "total": len(users)
    }


@router.get("/api/v1/public/users/search")
def public_users_search(q: str = Query("", alias="q")):
    users = scan_all_users(q)
    return {
        "success": True,
        "source": "public-universal-users-search",
        "query": q,
        "users": users,
        "results": users,
        "total": len(users)
    }
