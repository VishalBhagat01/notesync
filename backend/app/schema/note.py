from pydantic import BaseModel, Field


class NoteCreate(BaseModel):
    title: str = Field(default="Untitled Note", max_length=255)
    content: str = ""


class NoteUpdate(BaseModel):
    title: str = Field(max_length=255)
    content: str


class NoteResponse(BaseModel):
    id: int
    title: str
    content: str
    owner_id: int