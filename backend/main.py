from fastapi.staticfiles import StaticFiles
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routes import auth, users, posts, reels, stories, chats, notifications, admin

app = FastAPI(title="VibeLoop API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(users.router, prefix="/api/v1/users", tags=["Users"])
app.include_router(posts.router, prefix="/api/v1/posts", tags=["Posts"])
app.include_router(reels.router, prefix="/api/v1/reels", tags=["Reels"])
app.include_router(stories.router, prefix="/api/v1/stories", tags=["Stories"])
app.include_router(chats.router, prefix="/api/v1/chats", tags=["Chats"])
app.include_router(notifications.router, prefix="/api/v1/notifications", tags=["Notifications"])
app.include_router(admin.router, prefix="/api/v1/admin", tags=["Admin"])

@app.get("/")
def root():
    return {"app": "VibeLoop", "status": "running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)


# VibeLoop posts/feed routes
try:
    from .routes.posts import router as posts_router
except ImportError:
    from routes.posts import router as posts_router

app.include_router(posts_router)


# VibeLoop uploaded media static files
UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")


# VibeLoop media upload routes
try:
    from .routes.media import router as media_router
except ImportError:
    from routes.media import router as media_router

app.include_router(media_router)


# VibeLoop admin routes
try:
    from .routes.admin import router as admin_router
except ImportError:
    from routes.admin import router as admin_router

app.include_router(admin_router)


# VibeLoop creators/follow routes
try:
    from .routes.creators import router as creators_router
except ImportError:
    from routes.creators import router as creators_router

app.include_router(creators_router)


# VibeLoop chat/message routes
try:
    from .routes.chats import router as chats_router
except ImportError:
    from routes.chats import router as chats_router

app.include_router(chats_router)


# VibeLoop reels routes
try:
    from .routes.reels import router as reels_router
except ImportError:
    from routes.reels import router as reels_router

app.include_router(reels_router)


# VibeLoop notification routes
try:
    from .routes.notifications import router as notifications_router
except ImportError:
    from routes.notifications import router as notifications_router

app.include_router(notifications_router)


# VibeLoop stories routes
try:
    from .routes.stories import router as stories_router
except ImportError:
    from routes.stories import router as stories_router

app.include_router(stories_router)


# VibeLoop global search routes
try:
    from .routes.search import router as search_router
except ImportError:
    from routes.search import router as search_router

app.include_router(search_router)


# VibeLoop post interaction routes
try:
    from .routes.post_actions import router as post_actions_router
except ImportError:
    from routes.post_actions import router as post_actions_router

app.include_router(post_actions_router)


# VibeLoop saved posts routes
try:
    from .routes.saved_posts import router as saved_posts_router
except ImportError:
    from routes.saved_posts import router as saved_posts_router

app.include_router(saved_posts_router)


# VibeLoop analytics routes
try:
    from .routes.analytics import router as analytics_router
except ImportError:
    from routes.analytics import router as analytics_router

app.include_router(analytics_router)


# Auto route loader - keeps all backend route files active
def _vibeloop_auto_load_routes():
    import importlib
    import pkgutil

    try:
        import routes
    except Exception as exc:
        print("Route package load skipped:", exc)
        return

    for module_info in pkgutil.iter_modules(routes.__path__):
        module_name = module_info.name

        if module_name.startswith("_"):
            continue

        try:
            module = importlib.import_module(f"routes.{module_name}")
            router = getattr(module, "router", None)

            if router is not None:
                app.include_router(router)
                print(f"Loaded route module: routes.{module_name}")
        except Exception as exc:
            print(f"Skipped route module routes.{module_name}: {exc}")


_vibeloop_auto_load_routes()


# VibeLoop safety/report/block routes
try:
    from routes.safety import router as safety_router
except ImportError:
    from .routes.safety import router as safety_router

app.include_router(safety_router)


# VibeLoop public verification request routes
try:
    from routes.verification_public import router as verification_public_router
except ImportError:
    from .routes.verification_public import router as verification_public_router

app.include_router(verification_public_router)


# VibeLoop admin moderation routes
try:
    from routes.admin_moderation import router as admin_moderation_router
except ImportError:
    from .routes.admin_moderation import router as admin_moderation_router

app.include_router(admin_moderation_router)


# VibeLoop wallet routes
try:
    from routes.wallet import router as wallet_router
except ImportError:
    from .routes.wallet import router as wallet_router

app.include_router(wallet_router)


# VibeLoop dynamic profile routes
try:
    from routes.dynamic_profile import router as dynamic_profile_router
except ImportError:
    from .routes.dynamic_profile import router as dynamic_profile_router

app.include_router(dynamic_profile_router)


# VibeLoop profile follow routes
try:
    from routes.profile_follow import router as profile_follow_router
except ImportError:
    from .routes.profile_follow import router as profile_follow_router

app.include_router(profile_follow_router)


# VibeLoop profile settings routes
try:
    from routes.profile_settings import router as profile_settings_router
except ImportError:
    from .routes.profile_settings import router as profile_settings_router

app.include_router(profile_settings_router)


# VibeLoop post detail routes
try:
    from routes.post_detail import router as post_detail_router
except ImportError:
    from .routes.post_detail import router as post_detail_router

app.include_router(post_detail_router)


# VibeLoop post share routes
try:
    from routes.post_share import router as post_share_router
except ImportError:
    from .routes.post_share import router as post_share_router

app.include_router(post_share_router)


# VibeLoop direct messages routes
try:
    from routes.direct_messages import router as direct_messages_router
except ImportError:
    from .routes.direct_messages import router as direct_messages_router

app.include_router(direct_messages_router)


# VibeLoop reel action routes
try:
    from routes.reel_actions import router as reel_actions_router
except ImportError:
    from .routes.reel_actions import router as reel_actions_router

app.include_router(reel_actions_router)


# VibeLoop story action routes
try:
    from routes.story_actions import router as story_actions_router
except ImportError:
    from .routes.story_actions import router as story_actions_router

app.include_router(story_actions_router)


# VibeLoop global search routes
try:
    from routes.global_search import router as global_search_router
except ImportError:
    from .routes.global_search import router as global_search_router

app.include_router(global_search_router)


# VibeLoop admin user management routes
try:
    from routes.admin_users import router as admin_users_router
except ImportError:
    from .routes.admin_users import router as admin_users_router

app.include_router(admin_users_router)


# VibeLoop auth security routes
try:
    from routes.auth_security import router as auth_security_router
except ImportError:
    from .routes.auth_security import router as auth_security_router

app.include_router(auth_security_router)


# VibeLoop admin API protection middleware
@app.middleware("http")
async def protect_admin_api_routes(request, call_next):
    path = request.url.path

    if path.startswith("/api/v1/admin"):
        try:
            from routes.auth_security import is_admin_request
        except ImportError:
            from .routes.auth_security import is_admin_request

        if not is_admin_request(request):
            from fastapi.responses import JSONResponse
            return JSONResponse(
                status_code=401,
                content={
                    "success": False,
                    "message": "Admin authorization required"
                }
            )

    return await call_next(request)


# VibeLoop permanent media static hosting
MEDIA_ROOT = Path(__file__).resolve().parent / "media"
MEDIA_ROOT.mkdir(parents=True, exist_ok=True)

try:
    app.mount("/media", StaticFiles(directory=str(MEDIA_ROOT)), name="media")
except RuntimeError:
    pass


# VibeLoop media upload routes
try:
    from routes.media_upload import router as media_upload_router
except ImportError:
    from .routes.media_upload import router as media_upload_router

app.include_router(media_upload_router)


# VibeLoop content uploads routes
try:
    from routes.content_uploads import router as content_uploads_router
except ImportError:
    from .routes.content_uploads import router as content_uploads_router

app.include_router(content_uploads_router)


# VibeLoop live content routes
try:
    from routes.live_content import router as live_content_router
except ImportError:
    from .routes.live_content import router as live_content_router

app.include_router(live_content_router)


# VibeLoop health routes
try:
    from routes.health_routes import router as health_routes_router
except ImportError:
    from .routes.health_routes import router as health_routes_router

app.include_router(health_routes_router)


# VibeLoop creator identity routes
try:
    from routes.creator_identity import router as creator_identity_router
except ImportError:
    from .routes.creator_identity import router as creator_identity_router

app.include_router(creator_identity_router)


# VibeLoop profile update route
try:
    from routes.profile_update import router as profile_update_router
except ImportError:
    from .routes.profile_update import router as profile_update_router

app.include_router(profile_update_router)


# VibeLoop soft delete archive routes
try:
    from routes.content_soft_delete import router as content_soft_delete_router
except ImportError:
    from .routes.content_soft_delete import router as content_soft_delete_router

app.include_router(content_soft_delete_router)
