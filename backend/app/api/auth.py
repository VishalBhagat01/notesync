from fastapi import APIRouter, Depends, HTTPException, status
from psycopg import Connection

from app.db.database import get_db
from app.schema.user import UserCreate, UserLogin
from app.services.auth_service import (
    register_user,
    login_user
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"]
)


@router.post("/register", status_code=status.HTTP_201_CREATED)
def register(
    user: UserCreate,
    db: Connection = Depends(get_db)
):

    new_user = register_user(
        db,
        user
    )

    if not new_user:

        raise HTTPException(
            status_code=400,
            detail="Email already registered"
        )

    return new_user


@router.post("/login")
def login(
    user: UserLogin,
    db: Connection = Depends(get_db)
):

    token = login_user(
        db,
        user
    )

    if not token:

        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    return token