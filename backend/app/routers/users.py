from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.models.contact import Contact
from backend.app.schemas.user import UserResponse, UserUpdate, UserSearchResult

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("/me", response_model=UserResponse)
def get_my_profile(current_user: User = Depends(get_current_user)):
    """Fetches the profile of the current authenticated user."""
    return current_user


@router.put("/me", response_model=UserResponse)
def update_my_profile(
    update_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Updates profile fields such as name, profile photo, and about text."""
    if update_data.name is not None:
        current_user.name = update_data.name.strip()
    if update_data.profile_photo is not None:
        current_user.profile_photo = update_data.profile_photo
    if update_data.about is not None:
        current_user.about = update_data.about.strip()

    db.commit()
    db.refresh(current_user)
    return current_user


@router.get("/search", response_model=List[UserSearchResult])
def search_users(
    q: str = Query(..., min_length=1, description="Search query: phone number or name"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Searches registered users by mobile number or name.
    Indicates whether each user is already saved in the caller's contacts list.
    """
    clean_query = q.strip()
    users = (
        db.query(User)
        .filter(
            User.id != current_user.id,
            or_(
                User.name.ilike(f"%{clean_query}%"),
                User.phone_number.ilike(f"%{clean_query}%"),
            ),
        )
        .limit(20)
        .all()
    )

    # Get contacts of current user
    user_contacts = {
        c.contact_user_id: c.saved_name
        for c in db.query(Contact).filter(Contact.owner_id == current_user.id).all()
    }

    results: List[UserSearchResult] = []
    for u in users:
        is_contact = u.id in user_contacts
        saved_name = user_contacts.get(u.id)
        results.append(
            UserSearchResult(
                id=u.id,
                phone_number=u.phone_number,
                name=u.name,
                profile_photo=u.profile_photo,
                about=u.about,
                is_online=u.is_online,
                is_contact=is_contact,
                saved_name=saved_name,
            )
        )

    return results


@router.get("/{user_id}", response_model=UserResponse)
def get_user_by_id(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Fetches user information by ID."""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    return user
