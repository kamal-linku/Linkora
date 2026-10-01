from datetime import datetime, timezone
from typing import Tuple
from sqlalchemy.orm import Session
from fastapi import HTTPException, status

from backend.app.core.security import create_access_token
from backend.app.models.user import User
from backend.app.services.otp_service import OTPService
from backend.app.schemas.auth import TokenResponse
from backend.app.schemas.user import UserResponse


class AuthService:
    @classmethod
    def authenticate_with_otp(
        cls, db: Session, phone_number: str, otp_code: str
    ) -> TokenResponse:
        """
        Verifies OTP. If valid, fetches existing user or creates a new one,
        and generates a JWT access token.
        """
        # Format phone number or email check
        phone_number = phone_number.strip()
        if "@" not in phone_number and not phone_number.startswith("+"):
            phone_number = "+" + phone_number

        # 1. Verify OTP
        is_valid, msg = OTPService.verify_otp(db, phone_number, otp_code)
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=msg,
            )

        # 2. Check if user already exists
        user = db.query(User).filter(User.phone_number == phone_number).first()
        is_new_user = False

        if not user:
            # First time user -> Register automatically
            is_new_user = True
            now = datetime.now(timezone.utc)
            user = User(
                phone_number=phone_number,
                name=None,  # User will provide name on profile screen
                about="Hey there! I am using ChatConnect.",
                is_online=True,
                last_seen=now,
                created_at=now,
                updated_at=now,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            # Existing user -> mark online
            user.is_online = True
            user.last_seen = datetime.now(timezone.utc)
            db.commit()
            db.refresh(user)

        # 3. Generate JWT Token with user.id as subject
        access_token = create_access_token(subject=user.id)

        user_dict = {
            "id": user.id,
            "phone_number": user.phone_number,
            "name": user.name,
            "profile_photo": user.profile_photo,
            "about": user.about,
            "is_online": user.is_online,
            "last_seen": user.last_seen.isoformat() if user.last_seen else None,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "updated_at": user.updated_at.isoformat() if user.updated_at else None,
        }

        return TokenResponse(
            access_token=access_token,
            token_type="bearer",
            is_new_user=is_new_user,
            user=user_dict,
        )
