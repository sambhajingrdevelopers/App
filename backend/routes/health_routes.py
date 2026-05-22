from fastapi import APIRouter, Request
from pathlib import Path
import sqlite3
import os

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


REQUIRED_ROUTES = [
    "/api/v1/auth/admin-login",
    "/api/v1/auth/me",

    "/api/v1/upload",
    "/api/v1/media/library",

    "/api/v1/content/post",
    "/api/v1/content/reel",
    "/api/v1/content/story",
    "/api/v1/content/home-live",
    "/api/v1/content/reels-live",
    "/api/v1/content/stories-live",

    "/api/v1/profile-dynamic",
    "/api/v1/profile-follow",
    "/api/v1/profile-settings",

    "/api/v1/search/all",
    "/api/v1/messages/threads",
    "/api/v1/notifications",
    "/api/v1/notification-summary",

    "/api/v1/wallet",
    "/api/v1/ads",
    "/api/v1/verification-requests",

    "/api/v1/admin/users",
    "/api/v1/admin/moderation",
    "/api/v1/admin/audit-logs",
    "/api/v1/admin/system/qa",
]


def count_table(db_name, table_name):
    path = BASE_DIR / db_name

    if not path.exists():
        return {
            "exists": False,
            "count": 0,
            "error": "database file missing"
        }

    try:
        conn = sqlite3.connect(path)
        conn.row_factory = sqlite3.Row
        count = conn.execute(f"SELECT COUNT(*) AS total FROM {table_name}").fetchone()["total"]
        conn.close()

        return {
            "exists": True,
            "count": int(count or 0),
            "error": ""
        }
    except Exception as exc:
        return {
            "exists": True,
            "count": 0,
            "error": str(exc)
        }


@router.get("/api/v1/route-health")
def route_health(request: Request):
    loaded_paths = sorted(set(getattr(route, "path", "") for route in request.app.routes))

    checks = []

    for required in REQUIRED_ROUTES:
        checks.append({
            "path": required,
            "loaded": required in loaded_paths
        })

    missing = [item["path"] for item in checks if not item["loaded"]]

    return {
        "success": len(missing) == 0,
        "totalLoadedRoutes": len(loaded_paths),
        "requiredTotal": len(REQUIRED_ROUTES),
        "missingTotal": len(missing),
        "missing": missing,
        "checks": checks
    }


@router.get("/api/v1/admin/system/qa")
def admin_system_qa(request: Request):
    route_result = route_health(request)

    media_root = BASE_DIR / "media" / "uploads"

    db_checks = {
        "posts": count_table("vibeloop_posts.db", "posts"),
        "reels": count_table("vibeloop_reels.db", "reels"),
        "stories": count_table("vibeloop_stories.db", "stories"),
        "users": count_table("vibeloop_users.db", "users"),
        "auditLogs": count_table("vibeloop_users.db", "user_audit_logs"),
        "notifications": count_table("vibeloop_notifications.db", "notifications"),
        "messages": count_table("vibeloop_messages.db", "threads"),
        "walletTransactions": count_table("vibeloop_wallet.db", "wallet_transactions"),
        "mediaFiles": count_table("vibeloop_media.db", "media_files"),
    }

    env_checks = {
        "JWT_SECRET_KEY": bool(os.getenv("JWT_SECRET_KEY")),
        "ADMIN_EMAIL": bool(os.getenv("ADMIN_EMAIL")),
        "ADMIN_PASSWORD": bool(os.getenv("ADMIN_PASSWORD")),
        "ADMIN_API_KEY": bool(os.getenv("ADMIN_API_KEY")),
        "PUBLIC_BACKEND_URL": bool(os.getenv("PUBLIC_BACKEND_URL")),
    }

    warnings = []

    if os.getenv("ADMIN_API_KEY") in ["", None, "CHANGE_ME_ADMIN_KEY"]:
        warnings.append("ADMIN_API_KEY is still default or missing.")

    if os.getenv("ADMIN_PASSWORD") in ["", None, "Admin@12345"]:
        warnings.append("ADMIN_PASSWORD is still default or missing.")

    if route_result["missingTotal"] > 0:
        warnings.append("Some required API routes are missing.")

    return {
        "success": route_result["missingTotal"] == 0 and len(warnings) == 0,
        "routes": route_result,
        "databases": db_checks,
        "media": {
            "path": str(media_root),
            "exists": media_root.exists(),
            "fileCount": len(list(media_root.rglob("*"))) if media_root.exists() else 0
        },
        "environment": env_checks,
        "warnings": warnings
    }
