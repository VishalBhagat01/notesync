from psycopg import Connection, errors
from fastapi import HTTPException

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
            WHERE LOWER(email)=LOWER(%s);
            """,
            (email.strip(),)
        )
        return cur.fetchone()


def get_user_by_username(db: Connection, username: str):
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT *
            FROM users
            WHERE LOWER(username)=LOWER(%s);
            """,
            (username.strip(),)
        )
        return cur.fetchone()


def get_user_by_identifier(db: Connection, identifier: str):
    val = identifier.strip()
    with db.cursor() as cur:
        cur.execute(
            """
            SELECT *
            FROM users
            WHERE LOWER(email)=LOWER(%s) OR LOWER(username)=LOWER(%s);
            """,
            (val, val)
        )
        return cur.fetchone()


def register_user(db: Connection, user: UserCreate):
    if get_user_by_email(db, user.email):
        raise HTTPException(
            status_code=400,
            detail="Email is already registered. Please sign in."
        )

    if get_user_by_username(db, user.username):
        raise HTTPException(
            status_code=400,
            detail=f"Username '{user.username}' is already taken. Please choose another username."
        )

    hashed_password = hash_password(user.password)

    try:
        with db.cursor() as cur:
            cur.execute(
                """
                INSERT INTO users
                (
                    username,
                    email,
                    hashed_password
                )
                VALUES (%s, %s, %s)
                RETURNING
                    id,
                    username,
                    email;
                """,
                (
                    user.username.strip(),
                    user.email.strip(),
                    hashed_password
                )
            )
            new_user = cur.fetchone()

        db.commit()
        return new_user
    except errors.UniqueViolation as e:
        db.rollback()
        err_str = str(e).lower()
        if "username" in err_str:
            raise HTTPException(
                status_code=400,
                detail=f"Username '{user.username}' is already taken."
            )
        elif "email" in err_str:
            raise HTTPException(
                status_code=400,
                detail="Email is already registered. Please sign in."
            )
        raise HTTPException(
            status_code=400,
            detail="User already exists with this username or email."
        )


def login_user(db: Connection, user: UserLogin):
    identifier = user.email.strip()
    db_user = get_user_by_identifier(db, identifier)

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