from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.schemas.conversation import (
    ConversationCreate,
    ConversationResponse,
    ConversationDetailResponse,
)
from backend.app.services.message_service import MessageService

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.get("", response_model=List[ConversationResponse])
def get_user_conversations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Returns list of all active conversations for the authenticated user,
    including the other party's information, last message, and unread count.
    """
    return MessageService.get_user_conversations(db, current_user.id)


@router.post("", response_model=ConversationResponse)
def create_or_get_conversation(
    payload: ConversationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Creates a new 1-on-1 conversation or retrieves the existing one with the target user.
    """
    conv = MessageService.get_or_create_direct_conversation(
        db, current_user.id, payload.participant_id
    )
    # Return formatted conversation response
    convs = MessageService.get_user_conversations(db, current_user.id)
    for c in convs:
        if c.id == conv.id:
            return c

    # Fallback
    return ConversationResponse(
        id=conv.id,
        is_group=conv.is_group,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
    )


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
def get_conversation_detail(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetches details and participants for a specific conversation."""
    conv = MessageService.validate_membership(db, conversation_id, current_user.id)
    messages = MessageService.get_messages(db, conversation_id, current_user.id, limit=50)

    return ConversationDetailResponse(
        id=conv.id,
        is_group=conv.is_group,
        title=conv.title,
        created_at=conv.created_at,
        updated_at=conv.updated_at,
        members=conv.members,
        messages=messages,
    )
