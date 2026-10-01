from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.conversation import ConversationMember
from backend.app.schemas.message import MessageCreate, MessageResponse
from backend.app.services.message_service import MessageService
from backend.app.websocket.manager import manager

router = APIRouter(prefix="/conversations/{conversation_id}/messages", tags=["Messages"])


@router.get("", response_model=List[MessageResponse])
def get_messages(
    conversation_id: int,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves paginated message history for a conversation."""
    return MessageService.get_messages(
        db, conversation_id, current_user.id, limit=limit, offset=offset
    )


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def send_message_rest(
    conversation_id: int,
    payload: MessageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Sends a message via REST API (fallback for non-WebSocket clients).
    Notifies online participants via WebSocket if connected.
    """
    msg = MessageService.create_message(
        db,
        conversation_id=conversation_id,
        sender_id=current_user.id,
        content=payload.content,
        message_type=payload.message_type,
        media_url=payload.media_url,
    )

    # Deliver to online members via WebSocket
    members = (
        db.query(ConversationMember)
        .filter(ConversationMember.conversation_id == conversation_id)
        .all()
    )
    for m in members:
        if m.user_id != current_user.id and manager.is_user_online(m.user_id):
            msg.delivered_at = datetime.now(timezone.utc)
            db.commit()
            db.refresh(msg)
            await manager.send_personal_message(
                {
                    "type": "new_message",
                    "message": MessageResponse.model_validate(msg).model_dump(mode="json"),
                },
                m.user_id,
            )

    return MessageResponse.model_validate(msg)


@router.post("/read")
async def mark_messages_read(
    conversation_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Marks all received messages in this conversation as read."""
    read_ids = MessageService.mark_conversation_as_read(
        db, conversation_id=conversation_id, user_id=current_user.id
    )

    if read_ids:
        # Broadcast read receipt to other members
        members = (
            db.query(ConversationMember)
            .filter(ConversationMember.conversation_id == conversation_id)
            .all()
        )
        for m in members:
            if m.user_id != current_user.id:
                await manager.send_personal_message(
                    {
                        "type": "messages_read",
                        "conversation_id": conversation_id,
                        "reader_id": current_user.id,
                        "read_ids": read_ids,
                        "read_at": datetime.now(timezone.utc).isoformat(),
                    },
                    m.user_id,
                )

    return {"status": "success", "read_message_ids": read_ids}
