from psycopg import Connection

from app.schema.note import NoteCreate, NoteUpdate
import time

def create_note(db: Connection, note: NoteCreate, owner_id: int):
    with db.cursor() as cur:
        cur.execute(
            """
            INSERT INTO notes (title, content, owner_id)
            VALUES (%s, %s, %s)
            RETURNING id, title, content, owner_id, created_at, updated_at;
            """,
            (note.title, note.content, owner_id),
        )
        new_note = cur.fetchone()

    db.commit()
    return new_note


def get_notes(db: Connection, owner_id: int):
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT id, title, content, owner_id, created_at, updated_at
            FROM notes
            WHERE owner_id = %s
            ORDER BY updated_at DESC;
            """,
            (owner_id,),
        )
        return cur.fetchall()


def get_note_by_id(db: Connection, note_id: int, owner_id: int):
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT id, title, content, owner_id, created_at, updated_at
            FROM notes
            WHERE id = %s AND owner_id = %s;
            """,
            (note_id, owner_id),
        )
        return cur.fetchone()


def update_note(
    db: Connection,
    note_id: int,
    note: NoteUpdate,
    owner_id: int,
):
    with db.cursor() as cur:
        cur.execute(
            """
            UPDATE notes
            SET title = COALESCE(%s, title),
                content = COALESCE(%s, content),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND owner_id = %s
            RETURNING id, title, content, owner_id, created_at, updated_at;
            """,
            (note.title, note.content, note_id, owner_id),
        )
        updated_note = cur.fetchone()

    db.commit()
    return updated_note


def delete_note(db: Connection, note_id: int, owner_id: int):
    with db.cursor() as cur:
        cur.execute(
            """
            DELETE FROM notes
            WHERE id = %s AND owner_id = %s
            RETURNING id;
            """,
            (note_id, owner_id),
        )
        deleted_note = cur.fetchone()

    db.commit()
    return deleted_note