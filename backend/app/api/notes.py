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


from app.schema.note import NoteShare
from app.services.note_service import share_note

@router.post("/{note_id}/share")
def share_note_endpoint(
    note_id: int,
    payload: NoteShare,
    db: Connection = Depends(get_db),
    current_user=Depends(get_current_user),
):
    result = share_note(db, note_id, payload.email, current_user["id"])
    if not result:
        raise HTTPException(status_code=403, detail="Only the note owner can share this note")
    if "error" in result:
        raise HTTPException(status_code=404, detail=result["error"])
    return result


from app.services.note_history_service import get_note_history, restore_note_version

@router.get("/{note_id}/history")
def get_history_endpoint(
    note_id: int,
    db: Connection = Depends(get_db),
    current_user=Depends(get_current_user),
):
    history = get_note_history(db, note_id, current_user["id"])
    if history is None:
        raise HTTPException(status_code=403, detail="Access denied")
    return history


@router.post("/{note_id}/restore/{history_id}")
def restore_version_endpoint(
    note_id: int,
    history_id: int,
    db: Connection = Depends(get_db),
    current_user=Depends(get_current_user),
):
    restored = restore_note_version(db, note_id, history_id, current_user["id"])
    if not restored:
        raise HTTPException(status_code=404, detail="Version not found")
    return restored




from fastapi import WebSocket, WebSocketDisconnect, Query
from app.core.websocket_manager import manager
from app.core.security import verify_token
from app.services.auth_service import get_user_by_email

@router.websocket("/ws/{note_id}")
async def websocket_note_endpoint(
    websocket: WebSocket,
    note_id: int,
    token: str = Query(...)
):
    payload = verify_token(token)
    if not payload or not payload.get("sub"):
        await websocket.close(code=4001)
        return

    db = next(get_db())
    try:
        user = get_user_by_email(db, payload.get("sub"))
        if not user:
            await websocket.close(code=4001)
            return
        
        await manager.connect(websocket, note_id, user)
        
        while True:
            data = await websocket.receive_json()
            # Broadcast edit/cursor events to all connected clients in the note room
            await manager.broadcast_to_room(note_id, data, sender=websocket)
            
            # If edit event contains title/content, persist to database asynchronously
            if data.get("type") == "edit":
                title = data.get("title")
                content = data.get("content")
                update_note(
                    db,
                    note_id,
                    NoteUpdate(title=title, content=content),
                    user["id"]
                )
    except WebSocketDisconnect:
        manager.disconnect(websocket, note_id)
        await manager.broadcast_presence(note_id)
    except Exception as e:
        manager.disconnect(websocket, note_id)
        await manager.broadcast_presence(note_id)
    finally:
        db.close()