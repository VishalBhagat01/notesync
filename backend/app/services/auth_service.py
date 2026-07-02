from psycopg import Connection

from app.schema.user import UserCreate, UserLogin
from app.core.security import (
    hash_password,
    verify_password,
    create_access_token
)


def get_user_by_email(db: Connection, email: str):
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT *
            FROM users
            WHERE email=%s;
            """,
            (email,)
        )
        return cur.fetchone()


def register_user(db: Connection, user: UserCreate):

    if get_user_by_email(db, user.email):
        return None

    hashed_password = hash_password(user.password)

    with db.cursor() as cur:

        cur.execute(
            """
            INSERT INTO users
            (
                username,
                email,
                hashed_password
            )

            VALUES(%s,%s,%s)

            RETURNING
                id,
                username,
                email;
            """,
            (
                user.username,
                user.email,
                hashed_password
            )
        )

        new_user = cur.fetchone()

    db.commit()

    return new_user


def login_user(db: Connection, user: UserLogin):

    db_user = get_user_by_email(
        db,
        user.email
    )

    if not db_user:
        return None

    if not verify_password(
        user.password,
        db_user["hashed_password"]
    ):
        return None

    token = create_access_token(
        {
            "sub": db_user["email"]
        }
    )

    return {
        "access_token": token,
        "token_type": "bearer"
    }