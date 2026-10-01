import os
from typing import List, Optional
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Explicitly load backend/.env
backend_env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.exists(backend_env_path):
    load_dotenv(backend_env_path, override=True)



class Settings(BaseSettings):
    PROJECT_NAME: str = "ChatConnect"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Security
    SECRET_KEY: str = "chatconnect_super_secret_jwt_key_2026_change_in_production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database (Defaults to SQLite for instant local dev, switchable to PostgreSQL)
    DATABASE_URL: str = "sqlite:///./chatconnect.db"
    
    # Redis (Optional, fallback to in-memory manager)
    REDIS_URL: Optional[str] = None
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = ["*"]
    
    # OTP Configuration
    # Options: "mock" (logs to console/returns for dev), "twilio", "msg91"
    SMS_PROVIDER: str = "mock"
    DEV_OTP_AUTO_APPROVE: bool = True
    OTP_EXPIRY_MINUTES: int = 5
    OTP_MAX_ATTEMPTS: int = 5
    
    # Twilio (SMS or Verify)
    TWILIO_ACCOUNT_SID: Optional[str] = None
    TWILIO_AUTH_TOKEN: Optional[str] = None
    TWILIO_PHONE_NUMBER: Optional[str] = None
    TWILIO_VERIFY_SERVICE_SID: Optional[str] = None
    
    # MSG91
    MSG91_AUTH_KEY: Optional[str] = None
    MSG91_TEMPLATE_ID: Optional[str] = None

    # Fast2SMS (Real Indian carrier SMS)
    FAST2SMS_API_KEY: Optional[str] = None

    # EmailJS Configuration (Real OTP via Email)
    EMAILJS_SERVICE_ID: Optional[str] = "service_48wjvgi"
    EMAILJS_TEMPLATE_ID: Optional[str] = None
    EMAILJS_PUBLIC_KEY: Optional[str] = None
    EMAILJS_PRIVATE_KEY: Optional[str] = None
    OTP_TARGET_EMAIL: Optional[str] = None

    # Direct Gmail SMTP (Alternative direct real email OTP)
    GMAIL_USER: Optional[str] = None
    GMAIL_APP_PASSWORD: Optional[str] = None
    
    # Firebase Cloud Messaging (Optional)
    FCM_SERVER_KEY: Optional[str] = None

    class Config:
        case_sensitive = True
        env_file = ".env"
        extra = "allow"


settings = Settings()
