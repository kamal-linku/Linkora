from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    phone_number = Column(String(120), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=True)
    profile_photo = Column(String(500), nullable=True)
    about = Column(String(255), default="Hey there! I am using ChatConnect.")
    is_online = Column(Boolean, default=False)
    last_seen = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    contacts_saved = relationship("Contact", foreign_keys="Contact.owner_id", back_populates="owner", cascade="all, delete-orphan")
    saved_by = relationship("Contact", foreign_keys="Contact.contact_user_id", back_populates="contact_user", cascade="all, delete-orphan")
    conversation_memberships = relationship("ConversationMember", back_populates="user", cascade="all, delete-orphan")
    messages_sent = relationship("Message", back_populates="sender", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<User id={self.id} phone={self.phone_number} name={self.name}>"
