from psycopg import Connection

from app.schema.note import NoteCreate, NoteUpdate
import time

def ensure_collaborators_table(db: Connection):
    with db.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS note_collaborators (
                id SERIAL PRIMARY KEY,
                note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(note_id, user_id)
            );
            """
        )
    db.commit()


def create_note(db: Connection, note: NoteCreate, owner_id: int):
    ensure_collaborators_table(db)
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
    if new_note:
        from app.services.note_history_service import record_note_change
        record_note_change(db, new_note["id"], owner_id, new_note["title"], new_note["content"])
    return new_note


def get_notes(db: Connection, user_id: int):
    ensure_collaborators_table(db)
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT n.id, n.title, n.content, n.owner_id, n.created_at, n.updated_at,
                   (n.owner_id = %s) AS is_owner
            FROM notes n
            LEFT JOIN note_collaborators nc ON n.id = nc.note_id
            WHERE n.owner_id = %s OR nc.user_id = %s
            ORDER BY n.updated_at DESC;
            """,
            (user_id, user_id, user_id),
        )
        return cur.fetchall()


def get_note_by_id(db: Connection, note_id: int, user_id: int):
    ensure_collaborators_table(db)
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT DISTINCT n.id, n.title, n.content, n.owner_id, n.created_at, n.updated_at,
                   (n.owner_id = %s) AS is_owner
            FROM notes n
            LEFT JOIN note_collaborators nc ON n.id = nc.note_id
            WHERE n.id = %s AND (n.owner_id = %s OR nc.user_id = %s);
            """,
            (user_id, note_id, user_id, user_id),
        )
        return cur.fetchone()


def update_note(
    db: Connection,
    note_id: int,
    note: NoteUpdate,
    user_id: int,
):
    ensure_collaborators_table(db)
    with db.cursor() as cur:
        cur.execute(
            """
            UPDATE notes n
            SET title = COALESCE(%s, n.title),
                content = COALESCE(%s, n.content),
                updated_at = CURRENT_TIMESTAMP
            FROM notes n_check
            LEFT JOIN note_collaborators nc ON n_check.id = nc.note_id
            WHERE n.id = %s 
              AND n.id = n_check.id 
              AND (n_check.owner_id = %s OR nc.user_id = %s)
            RETURNING n.id, n.title, n.content, n.owner_id, n.created_at, n.updated_at;
            """,
            (note.title, note.content, note_id, user_id, user_id),
        )
        updated_note = cur.fetchone()

    db.commit()
    if updated_note:
        from app.services.note_history_service import record_note_change
        record_note_change(db, updated_note["id"], user_id, updated_note["title"], updated_note["content"])
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


def share_note(db: Connection, note_id: int, target_email: str, owner_id: int):
    ensure_collaborators_table(db)
    with db.cursor() as cur:
        # Check note ownership or existing access
        cur.execute("SELECT id FROM notes WHERE id = %s AND owner_id = %s;", (note_id, owner_id))
        if not cur.fetchone():
            return None
        
        # Find target user by email
        cur.execute("SELECT id, email FROM users WHERE email = %s;", (target_email,))
        target_user = cur.fetchone()
        if not target_user:
            return {"error": "User with this email not found"}
        
        # Insert into note_collaborators
        cur.execute(
            """
            INSERT INTO note_collaborators (note_id, user_id)
            VALUES (%s, %s)
            ON CONFLICT (note_id, user_id) DO NOTHING
            RETURNING id;
            """,
            (note_id, target_user["id"])
        )
    db.commit()
    return {"message": f"Successfully shared note with {target_email}"}