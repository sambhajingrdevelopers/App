from pydantic import BaseModel
from typing import Optional

class PostCreate(BaseModel):
    caption: Optional[str] = None
    visibility: str = "public"
