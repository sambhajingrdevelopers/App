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


def quote_identifier(name):
    return '"' + str(name).replace('"', '""') + '"'


def safe_row_value(row, key, default=""):
    try:
        return row[key] if key in row.keys() and row[key] is not None else default
    except Exception:
        return default


def user_dict(row, source_db="", source_table=""):
    username = normalize_username(
        safe_row_value(row, "username")
        or safe_row_value(row, "user")
        or safe_row_value(row, "handle")
        or safe_row_value(row, "email")
        or safe_row_value(row, "name")
    )

    name = (
        safe_row_value(row, "name")
        or safe_row_value(row, "fullName")
        or safe_row_value(row, "full_name")
        or safe_row_value(row, "display_name")
        or username.replace("@", "")
        or "Creator"
    )

    user_id = (
        safe_row_value(row, "userId")
        or safe_row_value(row, "user_id")
        or safe_row_value(row, "id")
        or username
    )

    return {
        "id": str(user_id),
        "userId": str(user_id),
        "type": "creator",
        "title": str(name),
        "name": str(name),
        "username": username,
        "email": str(safe_row_value(row, "email")),
        "caption": str(safe_row_value(row, "bio") or "Digital Creator"),
        "bio": str(safe_row_value(row, "bio") or "Digital Creator"),
        "avatarUrl": str(safe_row_value(row, "avatarUrl") or safe_row_value(row, "avatar_url")),
        "bannerUrl": str(safe_row_value(row, "bannerUrl") or safe_row_value(row, "banner_url")),
        "verified": True,
        "followers": int(safe_row_value(row, "followers", 0) or 0),
        "status": str(safe_row_value(row, "status") or "Active"),
        "sourceDb": source_db,
        "sourceTable": source_table
    }


def scan_users(q=""):
    query = str(q or "").strip().lower()
    db_files = list(BASE_DIR.glob("*.db")) + list(BASE_DIR.rglob("*.db"))

    seen_dbs = []
    for db in db_files:
        if db not in seen_dbs:
            seen_dbs.append(db)

    results = []
    seen_users = set()

    for db_path in seen_dbs:
        try:
            conn = sqlite3.connect(db_path)
            conn.row_factory = sqlite3.Row

            tables = conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table'"
            ).fetchall()

            for table_row in tables:
                table = table_row["name"]
                if table.startswith("sqlite_"):
                    continue

                columns_info = conn.execute(
                    f"PRAGMA table_info({quote_identifier(table)})"
                ).fetchall()

                columns = [col["name"] for col in columns_info]
                lower_cols = {c.lower(): c for c in columns}

                user_like_cols = [
                    "username", "user", "handle", "name", "fullname", "full_name",
                    "display_name", "email", "bio", "role", "status"
                ]

                available_search_cols = [
                    lower_cols[c] for c in user_like_cols if c in lower_cols
                ]

                has_identity = any(c in lower_cols for c in [
                    "username", "user", "handle", "name", "email", "userid", "user_id", "id"
                ])

                if not has_identity:
                    continue

                if query and available_search_cols:
                    where = " OR ".join([
                        f"LOWER(COALESCE(CAST({quote_identifier(col)} AS TEXT), '')) LIKE ?"
                        for col in available_search_cols
                    ])
                    params = [f"%{query}%"] * len(available_search_cols)

                    rows = conn.execute(
                        f"SELECT * FROM {quote_identifier(table)} WHERE {where} LIMIT 80",
                        params
                    ).fetchall()
                else:
                    rows = conn.execute(
                        f"SELECT * FROM {quote_identifier(table)} LIMIT 80"
                    ).fetchall()

                for row in rows:
                    item = user_dict(row, db_path.name, table)
                    key = item["username"].lower()

                    if key in seen_users:
                        continue

                    if query:
                        searchable = " ".join([
                            item["username"],
                            item["name"],
                            item["email"],
                            item["bio"]
                        ]).lower()

                        if query not in searchable:
                            continue

                    seen_users.add(key)
                    results.append(item)

        except Exception:
            pass
        finally:
            try:
                conn.close()
            except Exception:
                pass

    return results[:80]


@router.get("/api/v1/users/search")
def search_users(q: str = Query("", alias="q")):
    users = scan_users(q)

    return {
        "success": True,
        "source": "universal-sqlite-user-search",
        "query": q,
        "users": users,
        "results": users,
        "total": len(users)
    }


@router.get("/api/v1/users/list")
def list_users():
    users = scan_users("")

    return {
        "success": True,
        "source": "universal-sqlite-user-list",
        "users": users,
        "results": users,
        "total": len(users)
    }
