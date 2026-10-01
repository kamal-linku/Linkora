from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class UserBase(BaseModel):
    phone_number: str
    name: Optional[str] = None
    profile_photo: Optional[str] = None
    about: Optional[str] = "Hey there! I am using ChatConnect."


class UserCreate(UserBase):
    pass


class UserUpdate(BaseModel):
    name: Optional[str] = None
    profile_photo: Optional[str] = None
    about: Optional[str] = None


class UserResponse(UserBase):
    id: int
    is_online: bool
    last_seen: Optional[datetime] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserSearchResult(BaseModel):
    id: int
    phone_number: str
    name: Optional[str] = None
    profile_photo: Optional[str] = None
    about: Optional[str] = None
    is_online: bool = False
    is_contact: bool = False
    saved_name: Optional[str] = None

    model_config = ConfigDict(from_attributes=True)
