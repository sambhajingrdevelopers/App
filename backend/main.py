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
