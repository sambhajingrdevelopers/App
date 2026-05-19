from pydantic import BaseModel
import os

class Settings(BaseModel):
    app_name: str = os.getenv("APP_NAME", "VibeLoop")
    database_url: str = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@localhost:5432/vibeloop")
    jwt_secret: str = os.getenv("JWT_SECRET", "change_this_secret")

settings = Settings()
