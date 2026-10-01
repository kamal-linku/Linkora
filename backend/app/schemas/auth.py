from typing import Optional
from pydantic import BaseModel, Field


class SendOTPRequest(BaseModel):
    phone_number: str = Field(..., description="Phone number in international E.164 format, e.g., +919876543210")


class SendOTPResponse(BaseModel):
    message: str
    phone_number: str
    dev_otp: Optional[str] = None


class VerifyOTPRequest(BaseModel):
    phone_number: str
    otp_code: str = Field(..., min_length=4, max_length=10)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    is_new_user: bool
    user: dict
