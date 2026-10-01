from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from backend.app.core.database import get_db
from backend.app.core.security import get_current_user
from backend.app.models.user import User
from backend.app.schemas.auth import (
    SendOTPRequest,
    SendOTPResponse,
    VerifyOTPRequest,
    TokenResponse,
)
from backend.app.schemas.user import UserResponse
from backend.app.services.otp_service import OTPService
from backend.app.services.auth_service import AuthService
from backend.app.utils.helpers import normalize_phone_number

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp", response_model=SendOTPResponse)
def send_otp(request: SendOTPRequest, db: Session = Depends(get_db)):
    """
    Sends a 6-digit OTP code to the provided mobile phone number.
    Uses international format (e.g., +919876543210).
    """
    formatted_phone = normalize_phone_number(request.phone_number)
    success, message, dev_otp = OTPService.send_otp(db, formatted_phone)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=message,
        )
    return SendOTPResponse(
        message=message,
        phone_number=formatted_phone,
        dev_otp=dev_otp,
    )


@router.post("/verify-otp", response_model=TokenResponse)
def verify_otp(request: VerifyOTPRequest, db: Session = Depends(get_db)):
    """
    Verifies the OTP code for the mobile phone number.
    Automatically creates the user account if this is their first login.
    Returns a JWT access token.
    """
    formatted_phone = normalize_phone_number(request.phone_number)
    return AuthService.authenticate_with_otp(db, formatted_phone, request.otp_code)


@router.get("/me", response_model=UserResponse)
def get_current_auth_user(current_user: User = Depends(get_current_user)):
    """Returns the authenticated user details for the active session."""
    return current_user
