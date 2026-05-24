from fastapi import APIRouter, Request, Header, HTTPException
from pathlib import Path
import os

router = APIRouter()
BASE_DIR = Path(__file__).resolve().parent.parent


REQUIRED_ROUTES = [
    "/api/v1/route-health",
    "/api/v1/feed",
    "/api/v1/content/post",
    "/api/v1/profile/content",
    "/api/v1/profile/counts",
    "/api/v1/trash",
    "/api/v1/posts/{post_id}/archive",
    "/api/v1/posts/{post_id}/restore",
    "/api/v1/content/home-live",
    "/api/v1/content/reels-live",
    "/api/v1/content/stories-live",
    "/api/v1/admin/system/qa",
]


def check_admin_key(x_admin_api_key: str | None):
    expected = os.getenv("ADMIN_API_KEY", "").strip()

    if expected and x_admin_api_key != expected:
        raise HTTPException(status_code=401, detail="Admin authorization required")


def db_status():
    result = {}

    for name in [
        "vibeloop_users.db",
        "vibeloop_posts.db",
        "vibeloop_reels.db",
        "vibeloop_stories.db",
        "vibeloop_notifications.db",
        "vibeloop_messages.db",
    ]:
        path = BASE_DIR / name
        result[name] = {
            "exists": path.exists(),
            "path": str(path),
            "error": "" if path.exists() else "Missing"
        }

    return result


def env_status():
    return {
        "EC2_BACKEND_URL": {
            "value": "Set" if os.getenv("EC2_BACKEND_URL") else "Missing"
        },
        "ADMIN_API_KEY": {
            "value": "Set" if os.getenv("ADMIN_API_KEY") else "Missing"
        },
        "ADMIN_PASSWORD": {
            "value": "Set" if os.getenv("ADMIN_PASSWORD") else "Missing"
        },
    }


def media_status():
    media_dir = BASE_DIR / "media"

    return {
        "exists": media_dir.exists(),
        "path": str(media_dir),
        "fileCount": len(list(media_dir.glob("*"))) if media_dir.exists() else 0
    }


@router.get("/api/v1/admin/system/qa")
def admin_system_qa(
    request: Request,
    x_admin_api_key: str | None = Header(default=None, alias="X-Admin-Api-Key")
):
    check_admin_key(x_admin_api_key)

    loaded_paths = [
        getattr(route, "path", "")
        for route in request.app.routes
    ]

    route_checks = []

    for path in REQUIRED_ROUTES:
        route_checks.append({
            "path": path,
            "loaded": path in loaded_paths
        })

    missing = [
        item["path"]
        for item in route_checks
        if not item["loaded"]
    ]

    return {
        "success": True,
        "source": "backend",
        "routeChecks": route_checks,
        "database": db_status(),
        "environment": env_status(),
        "media": media_status(),
        "warnings": missing,
        "summary": {
            "totalRoutesChecked": len(route_checks),
            "missingRoutes": len(missing)
        }
    }
