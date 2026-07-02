from dataclasses import dataclass
from datetime import datetime


@dataclass
class User:
    id: int | None = None
    username: str = ""
    email: str = ""
    hashed_password: str = ""
    created_at: datetime | None = None
    updated_at: datetime | None = None