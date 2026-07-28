from typing import Optional

from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    title: str = Field(default="Untitled Note", max_length=255)
    content: str = ""


class NoteUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    content: Optional[str] = None


class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    owner_id: int