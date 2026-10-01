from typing import List
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.contact import Contact
from backend.app.schemas.contact import ContactCreate, ContactUpdate, ContactResponse

router = APIRouter(prefix="/contacts", tags=["Contacts"])


@router.get("", response_model=List[ContactResponse])
def get_my_contacts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retrieves all contacts saved in the user's phonebook."""
    contacts = (
        db.query(Contact)
        .filter(Contact.owner_id == current_user.id)
        .order_by(Contact.saved_name.asc())
        .all()
    )
    return contacts


@router.post("", response_model=ContactResponse)
def add_contact(
    payload: ContactCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Saves another user to the personal contact list with a custom nickname/name.
    """
    if payload.contact_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot add yourself as a contact.",
        )

    # Verify target user exists
    target_user = db.query(User).filter(User.id == payload.contact_user_id).first()
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact user does not exist.",
        )

    # Check if contact already exists
    existing = (
        db.query(Contact)
        .filter(
            Contact.owner_id == current_user.id,
            Contact.contact_user_id == payload.contact_user_id,
        )
        .first()
    )
    if existing:
        # Update existing contact name
        existing.saved_name = payload.saved_name.strip()
        db.commit()
        db.refresh(existing)
        return existing

    # Create new contact
    new_contact = Contact(
        owner_id=current_user.id,
        contact_user_id=payload.contact_user_id,
        saved_name=payload.saved_name.strip(),
        created_at=datetime.now(timezone.utc),
    )
    db.add(new_contact)
    db.commit()
    db.refresh(new_contact)
    return new_contact


@router.put("/{contact_id}", response_model=ContactResponse)
def update_contact(
    contact_id: int,
    payload: ContactUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates the custom saved name for a contact."""
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.owner_id == current_user.id)
        .first()
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )
    contact.saved_name = payload.saved_name.strip()
    db.commit()
    db.refresh(contact)
    return contact


@router.delete("/{contact_id}")
def delete_contact(
    contact_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Removes a user from contacts."""
    contact = (
        db.query(Contact)
        .filter(Contact.id == contact_id, Contact.owner_id == current_user.id)
        .first()
    )
    if not contact:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )
    db.delete(contact)
    db.commit()
    return {"message": "Contact deleted successfully"}
