from datetime import datetime, timezone
from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, desc
from fastapi import HTTPException, status

from backend.app.models.conversation import Conversation, ConversationMember
from backend.app.models.message import Message
from backend.app.models.user import User
from backend.app.models.contact import Contact
from backend.app.schemas.conversation import ConversationResponse
from backend.app.schemas.message import MessageResponse
from backend.app.schemas.user import UserResponse


class MessageService:
    @staticmethod
    def validate_membership(db: Session, conversation_id: int, user_id: int) -> Conversation:
        """
        Validates that user is a member of the conversation.
        Raises 403 Forbidden if not authorized.
        """
        membership = (
            db.query(ConversationMember)
            .filter(
                ConversationMember.conversation_id == conversation_id,
                ConversationMember.user_id == user_id,
            )
            .first()
        )
        if not membership:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not authorized to access this conversation.",
            )
        return membership.conversation

    @staticmethod
    def get_or_create_direct_conversation(
        db: Session, user_a_id: int, user_b_id: int
    ) -> Conversation:
        """
        Gets existing 1-on-1 conversation between user_a and user_b,
        or creates a new one.
        """
        if user_a_id == user_b_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot start a conversation with yourself.",
            )

        # Check if recipient exists
        recipient = db.query(User).filter(User.id == user_b_id).first()
        if not recipient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Target user not found.",
            )

        # Find existing shared direct conversation
        convs_a = [
            m[0] for m in db.query(ConversationMember.conversation_id)
            .filter(ConversationMember.user_id == user_a_id).all()
        ]
        if convs_a:
            existing_conv = (
                db.query(Conversation)
                .join(ConversationMember, Conversation.id == ConversationMember.conversation_id)
                .filter(
                    Conversation.is_group == False,
                    Conversation.id.in_(convs_a),
                    ConversationMember.user_id == user_b_id,
                )
                .first()
            )
            if existing_conv:
                return existing_conv

        # Create new 1-on-1 conversation
        now = datetime.now(timezone.utc)
        conversation = Conversation(
            is_group=False,
            created_at=now,
            updated_at=now,
        )
        db.add(conversation)
        db.commit()
        db.refresh(conversation)

        # Add both members
        member_a = ConversationMember(
            conversation_id=conversation.id,
            user_id=user_a_id,
            joined_at=now,
        )
        member_b = ConversationMember(
            conversation_id=conversation.id,
            user_id=user_b_id,
            joined_at=now,
        )
        db.add_all([member_a, member_b])
        db.commit()

        return conversation

    @staticmethod
    def get_user_conversations(db: Session, user_id: int) -> List[ConversationResponse]:
        """
        Returns all conversations for a user, populated with:
        - other user details (for 1-on-1 chats)
        - contact saved_name if user saved them
        - last message
        - unread messages count
        """
        memberships = (
            db.query(ConversationMember)
            .filter(ConversationMember.user_id == user_id)
            .all()
        )
        conv_ids = [m.conversation_id for m in memberships]

        conversations = (
            db.query(Conversation)
            .filter(Conversation.id.in_(conv_ids))
            .order_by(Conversation.updated_at.desc())
            .all()
        )

        result: List[ConversationResponse] = []

        for conv in conversations:
            other_user = None
            saved_name = None

            if not conv.is_group:
                # Find other participant
                other_member = (
                    db.query(ConversationMember)
                    .filter(
                        ConversationMember.conversation_id == conv.id,
                        ConversationMember.user_id != user_id,
                    )
                    .first()
                )
                if other_member:
                    other_u = db.query(User).filter(User.id == other_member.user_id).first()
                    if other_u:
                        other_user = UserResponse.model_validate(other_u)
                        # Check if current user saved this contact
                        contact_entry = (
                            db.query(Contact)
                            .filter(
                                Contact.owner_id == user_id,
                                Contact.contact_user_id == other_u.id,
                            )
                            .first()
                        )
                        if contact_entry:
                            saved_name = contact_entry.saved_name

            # Last message
            last_msg = (
                db.query(Message)
                .filter(Message.conversation_id == conv.id)
                .order_by(Message.created_at.desc())
                .first()
            )
            last_message_schema = (
                MessageResponse.model_validate(last_msg) if last_msg else None
            )

            # Unread count (messages sent by others where read_at is null)
            unread_count = (
                db.query(Message)
                .filter(
                    Message.conversation_id == conv.id,
                    Message.sender_id != user_id,
                    Message.read_at.is_(None),
                )
                .count()
            )

            result.append(
                ConversationResponse(
                    id=conv.id,
                    is_group=conv.is_group,
                    title=conv.title,
                    created_at=conv.created_at,
                    updated_at=conv.updated_at,
                    other_user=other_user,
                    saved_name=saved_name,
                    last_message=last_message_schema,
                    unread_count=unread_count,
                )
            )

        return result

    @staticmethod
    def get_messages(
        db: Session, conversation_id: int, user_id: int, limit: int = 50, offset: int = 0
    ) -> List[MessageResponse]:
        """Validates membership and retrieves paginated messages."""
        MessageService.validate_membership(db, conversation_id, user_id)

        messages = (
            db.query(Message)
            .filter(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .offset(offset)
            .limit(limit)
            .all()
        )
        return [MessageResponse.model_validate(m) for m in messages]

    @staticmethod
    def create_message(
        db: Session,
        conversation_id: int,
        sender_id: int,
        content: str,
        message_type: str = "text",
        media_url: Optional[str] = None,
    ) -> Message:
        """Validates membership, saves new message, and updates conversation timestamp."""
        conv = MessageService.validate_membership(db, conversation_id, sender_id)
        now = datetime.now(timezone.utc)

        msg = Message(
            conversation_id=conversation_id,
            sender_id=sender_id,
            message_type=message_type,
            content=content,
            media_url=media_url,
            created_at=now,
        )
        db.add(msg)
        conv.updated_at = now
        db.commit()
        db.refresh(msg)
        return msg

    @staticmethod
    def mark_conversation_as_read(
        db: Session, conversation_id: int, user_id: int
    ) -> List[int]:
        """
        Marks unread messages sent by others in this conversation as read.
        Returns list of message IDs marked as read.
        """
        MessageService.validate_membership(db, conversation_id, user_id)
        now = datetime.now(timezone.utc)

        unread_messages = (
            db.query(Message)
            .filter(
                Message.conversation_id == conversation_id,
                Message.sender_id != user_id,
                Message.read_at.is_(None),
            )
            .all()
        )

        read_ids = []
        for msg in unread_messages:
            msg.read_at = now
            if not msg.delivered_at:
                msg.delivered_at = now
            read_ids.append(msg.id)

        if read_ids:
            db.commit()

        return read_ids
