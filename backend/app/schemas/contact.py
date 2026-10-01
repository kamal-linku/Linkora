from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.user import UserResponse


class ContactCreate(BaseModel):
    contact_user_id: int
    saved_name: str


class ContactUpdate(BaseModel):
    saved_name: str


class ContactResponse(BaseModel):
    id: int
    owner_id: int
    contact_user_id: int
    saved_name: str
    created_at: datetime
    contact_user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)
