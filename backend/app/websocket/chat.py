import logging
from datetime import datetime, timezone
from typing import Dict, Any
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.models.conversation import ConversationMember
from backend.app.models.message import Message
from backend.app.services.message_service import MessageService
from backend.app.services.notification_service import NotificationService
from backend.app.websocket.manager import manager

logger = logging.getLogger(__name__)


async def handle_websocket_message(data: Dict[str, Any], sender_id: int):
    """
    Dispatches and processes events received from WebSocket client.
    Supported types: 'send_message', 'typing', 'message_read'.
    """
    event_type = data.get("type")
    db: Session = SessionLocal()

    try:
        if event_type == "send_message":
            conversation_id = data.get("conversation_id")
            content = data.get("content", "").strip()
            message_type = data.get("message_type", "text")
            media_url = data.get("media_url")

            if not conversation_id or not content:
                await manager.send_personal_message(
                    {"type": "error", "message": "conversation_id and content are required"},
                    sender_id,
                )
                return

            # 1. Validate membership and persist message
            try:
                msg = MessageService.create_message(
                    db,
                    conversation_id=conversation_id,
                    sender_id=sender_id,
                    content=content,
                    message_type=message_type,
                    media_url=media_url,
                )
            except Exception as e:
                await manager.send_personal_message(
                    {"type": "error", "message": str(e)},
                    sender_id,
                )
                return

            # 2. Find conversation members
            members = (
                db.query(ConversationMember)
                .filter(ConversationMember.conversation_id == conversation_id)
                .all()
            )
            recipient_ids = [m.user_id for m in members if m.user_id != sender_id]

            # 3. Check delivery to recipient(s)
            any_recipient_online = False
            for r_id in recipient_ids:
                if manager.is_user_online(r_id):
                    any_recipient_online = True
                    # Message is delivered immediately
                    msg.delivered_at = datetime.now(timezone.utc)
                    db.commit()
                    db.refresh(msg)

                    # Send to online recipient
                    incoming_payload = {
                        "type": "new_message",
                        "message": {
                            "id": msg.id,
                            "conversation_id": msg.conversation_id,
                            "sender_id": msg.sender_id,
                            "content": msg.content,
                            "message_type": msg.message_type,
                            "media_url": msg.media_url,
                            "created_at": msg.created_at.isoformat(),
                            "delivered_at": msg.delivered_at.isoformat() if msg.delivered_at else None,
                            "read_at": None,
                        },
                    }
                    await manager.send_personal_message(incoming_payload, r_id)
                else:
                    # Recipient is offline -> send push notification
                    NotificationService.send_push_notification(
                        user_id=r_id,
                        title="New Message",
                        body=f"{msg.content[:60]}...",
                        data={"conversation_id": conversation_id, "message_id": msg.id},
                    )

            # 4. Send acknowledgment back to sender
            sender_ack = {
                "type": "message_sent",
                "temp_id": data.get("temp_id"),
                "message": {
                    "id": msg.id,
                    "conversation_id": msg.conversation_id,
                    "sender_id": msg.sender_id,
                    "content": msg.content,
                    "message_type": msg.message_type,
                    "media_url": msg.media_url,
                    "created_at": msg.created_at.isoformat(),
                    "delivered_at": msg.delivered_at.isoformat() if msg.delivered_at else None,
                    "read_at": None,
                },
            }
            await manager.send_personal_message(sender_ack, sender_id)

        elif event_type == "typing":
            conversation_id = data.get("conversation_id")
            is_typing = data.get("is_typing", True)

            if conversation_id:
                members = (
                    db.query(ConversationMember)
                    .filter(ConversationMember.conversation_id == conversation_id)
                    .all()
                )
                typing_payload = {
                    "type": "typing",
                    "conversation_id": conversation_id,
                    "user_id": sender_id,
                    "is_typing": is_typing,
                }
                for m in members:
                    if m.user_id != sender_id:
                        await manager.send_personal_message(typing_payload, m.user_id)

        elif event_type == "message_read":
            conversation_id = data.get("conversation_id")
            if conversation_id:
                read_ids = MessageService.mark_conversation_as_read(
                    db, conversation_id=conversation_id, user_id=sender_id
                )
                if read_ids:
                    # Notify the other member that their messages were read
                    members = (
                        db.query(ConversationMember)
                        .filter(ConversationMember.conversation_id == conversation_id)
                        .all()
                    )
                    read_payload = {
                        "type": "messages_read",
                        "conversation_id": conversation_id,
                        "reader_id": sender_id,
                        "read_ids": read_ids,
                        "read_at": datetime.now(timezone.utc).isoformat(),
                    }
                    for m in members:
                        if m.user_id != sender_id:
                            await manager.send_personal_message(read_payload, m.user_id)

        else:
            logger.warning(f"Unknown WebSocket event type: {event_type}")

    except Exception as e:
        logger.error(f"Error handling WebSocket message: {e}", exc_info=True)
    finally:
        db.close()
