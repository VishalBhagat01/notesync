from fastapi import APIRouter, Depends, HTTPException, status

from psycopg import Connection

from app.schema.note import NoteUpdate, NoteCreate
from app.db.database import get_db
from app.dependency import get_current_user
from app.services.note_service import (
    create_note,
    delete_note,
    get_note_by_id,
    get_notes,
    update_note,
)

router = APIRouter(prefix="/notes", tags=["notes"])


@router.post("/", status_code=status.HTTP_201_CREATED)
def create_note_endpoint(
    note: NoteCreate,
    db: Connection = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return create_note(db, note, current_user["id"])


@router.get("/")
def get_all_notes_endpoint(
    db: Connection = Depends(get_db),
    current_user=Depends(get_current_user),
):
    return get_notes(db, current_user["id"])


@router.get("/{id}")
def get_note(id: int, db: Connection = Depends(get_db), current_user=Depends(get_current_user)):
    note = get_note_by_id(db, id, current_user["id"])

    if not note:
        raise HTTPException(status_code=404, detail="Note not found")

    return note


@router.delete("/{id}")
def delete_post(id: int, db: Connection = Depends(get_db), current_user=Depends(get_current_user)):
    deleted_note = delete_note(db, id, current_user["id"])

    if not deleted_note:
        raise HTTPException(status_code=404, detail="Note not found")

    return {"message": "Note deleted successfully"}


@router.patch("/{note_id}")
def edit_note(
    note_id: int,
    note: NoteUpdate,
    db: Connection = Depends(get_db),
    current_user=Depends(get_current_user),
):
    updated_note = update_note(
        db,
        note_id,
        note,
        current_user["id"],
    )

    if not updated_note:
        raise HTTPException(
            status_code=404,
            detail="Note not found",
        )

    return updated_note