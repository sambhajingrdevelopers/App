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
