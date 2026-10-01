from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict
from backend.app.schemas.user import UserResponse
from backend.app.schemas.message import MessageResponse


class ConversationCreate(BaseModel):
    participant_id: int


class ConversationMemberResponse(BaseModel):
    id: int
    user_id: int
    joined_at: datetime
    user: Optional[UserResponse] = None

    model_config = ConfigDict(from_attributes=True)


class ConversationResponse(BaseModel):
    id: int
    is_group: bool
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    other_user: Optional[UserResponse] = None
    saved_name: Optional[str] = None
    last_message: Optional[MessageResponse] = None
    unread_count: int = 0

    model_config = ConfigDict(from_attributes=True)


class ConversationDetailResponse(BaseModel):
    id: int
    is_group: bool
    title: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    members: List[ConversationMemberResponse] = []
    messages: List[MessageResponse] = []

    model_config = ConfigDict(from_attributes=True)
