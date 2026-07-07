from fastapi import APIRouter

from app.schema.note import notecreate

router=APIRouter(prefix="/notes",tags=['notes'])
@router.post("/")
def create_note(note:notecreate):
    return note

@router.get("/")
def get_all_notes():
    return {
        "message":"note created successfully"

    }

@router.get("/{id}")
def get_note(id:int):
    return{
        "message":f"note {id} updated successfully"
    }

@router.delete("/{id}")
def delete_post(id:int):
    return {
        "message": f"Note {id} deleted successfully"
    }
    

