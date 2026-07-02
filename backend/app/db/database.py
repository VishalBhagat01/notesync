from psycopg import connect
from psycopg.rows import dict_row

from app.core.config import settings


def get_db():
    conn = connect(
        settings.DATABASE_URL,
        row_factory=dict_row
    )

    try:
        yield conn
    finally:
        conn.close()