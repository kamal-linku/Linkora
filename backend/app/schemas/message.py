from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class MessageCreate(BaseModel):
    content: str
    message_type: str = "text"
    media_url: Optional[str] = None


class MessageResponse(BaseModel):
    id: int
    conversation_id: int
    sender_id: int
    message_type: str
    content: str
    media_url: Optional[str] = None
    created_at: datetime
    delivered_at: Optional[datetime] = None
    read_at: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class MessageStatusUpdate(BaseModel):
    status: str  # "delivered" | "read"


class TypingEvent(BaseModel):
    conversation_id: int
    is_typing: bool
