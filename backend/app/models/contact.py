from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.core.database import Base


class Contact(Base):
    __tablename__ = "contacts"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    contact_user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    saved_name = Column(String(100), nullable=False)
    created_at = Column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

    __table_args__ = (
        UniqueConstraint("owner_id", "contact_user_id", name="uq_owner_contact_user"),
    )

    # Relationships
    owner = relationship("User", foreign_keys=[owner_id], back_populates="contacts_saved")
    contact_user = relationship("User", foreign_keys=[contact_user_id], back_populates="saved_by")

    def __repr__(self):
        return f"<Contact owner={self.owner_id} target={self.contact_user_id} name={self.saved_name}>"
