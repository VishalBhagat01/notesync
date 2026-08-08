from psycopg import Connection
from typing import List, Dict, Any

def ensure_history_table(db: Connection):
    with db.cursor() as cur:
        cur.execute(
            """
            CREATE TABLE IF NOT EXISTS note_history (
                id SERIAL PRIMARY KEY,
                note_id INTEGER NOT NULL REFERENCES notes(id) ON DELETE CASCADE,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            """
        )
    db.commit()


def record_note_change(db: Connection, note_id: int, user_id: int, title: str, content: str):
    ensure_history_table(db)
    with db.cursor() as cur:
        # Check last snapshot to avoid saving identical duplicate revisions consecutively
        cur.execute(
            """
            SELECT title, content FROM note_history 
            WHERE note_id = %s 
            ORDER BY created_at DESC LIMIT 1;
            """,
            (note_id,)
        )
        last_entry = cur.fetchone()
        
        if last_entry and last_entry["title"] == title and last_entry["content"] == content:
            return None # Skip identical snapshot
        
        cur.execute(
            """
            INSERT INTO note_history (note_id, user_id, title, content)
            VALUES (%s, %s, %s, %s)
            RETURNING id, note_id, user_id, title, content, created_at;
            """,
            (note_id, user_id, title, content)
        )
        history_entry = cur.fetchone()
    db.commit()
    return history_entry


def get_note_history(db: Connection, note_id: int, user_id: int) -> List[Dict[str, Any]]:
    ensure_history_table(db)
    with db.cursor() as cur:
        # Verify access permission first
        cur.execute(
            """
            SELECT DISTINCT n.id FROM notes n
            LEFT JOIN note_collaborators nc ON n.id = nc.note_id
            WHERE n.id = %s AND (n.owner_id = %s OR nc.user_id = %s);
            """,
            (note_id, user_id, user_id)
        )
        if not cur.fetchone():
            return None
        
        cur.execute(
            """
            SELECT nh.id, nh.note_id, nh.user_id, u.email as user_email, nh.title, nh.content, nh.created_at
            FROM note_history nh
            JOIN users u ON nh.user_id = u.id
            WHERE nh.note_id = %s
            ORDER BY nh.created_at DESC
            LIMIT 50;
            """,
            (note_id,)
        )
        return cur.fetchall()


def restore_note_version(db: Connection, note_id: int, history_id: int, user_id: int):
    ensure_history_table(db)
    with db.cursor() as cur:
        # Fetch target history entry
        cur.execute(
            """
            SELECT title, content FROM note_history
            WHERE id = %s AND note_id = %s;
            """,
            (history_id, note_id)
        )
        version = cur.fetchone()
        if not version:
            return None
        
        # Update current note
        cur.execute(
            """
            UPDATE notes
            SET title = %s, content = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s
            RETURNING id, title, content, owner_id, updated_at;
            """,
            (version["title"], version["content"], note_id)
        )
        updated_note = cur.fetchone()
    db.commit()
    
    # Record restoration as a new history entry
    record_note_change(db, note_id, user_id, version["title"], version["content"])
    return updated_note
