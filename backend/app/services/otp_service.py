import secrets
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import httpx
from sqlalchemy.orm import Session

from backend.app.core.config import settings
from backend.app.models.message import OTPRecord

logger = logging.getLogger(__name__)


class OTPService:
    @staticmethod
    def generate_otp() -> str:
        """Generates a secure 6-digit numeric OTP."""
        # Cryptographically strong 6-digit code
        return f"{secrets.randbelow(900000) + 100000}"

    @classmethod
    def send_otp(cls, db: Session, phone_number: str) -> Tuple[bool, str, Optional[str]]:
        """
        Generates and stores OTP with rate limiting and expiration.
        Dispatches via SMS provider or mock dev logger.
        Returns: (success: bool, message: str, dev_otp: Optional[str])
        """
        now = datetime.now(timezone.utc)
        
        # 1. Rate limiting check: Max 5 requests in last 15 minutes
        fifteen_mins_ago = now - timedelta(minutes=15)
        recent_requests = (
            db.query(OTPRecord)
            .filter(
                OTPRecord.phone_number == phone_number,
                OTPRecord.created_at >= fifteen_mins_ago,
            )
            .count()
        )
        if recent_requests >= 5:
            return (
                False,
                "Too many OTP requests. Please wait 15 minutes before requesting again.",
                None,
            )

        # 2. Invalidate any existing active OTPs for this phone number
        db.query(OTPRecord).filter(
            OTPRecord.phone_number == phone_number,
            OTPRecord.is_verified == False,
        ).delete()

        # 3. Generate new OTP and set expiration (default 5 minutes)
        otp_code = cls.generate_otp()
        expires_at = now + timedelta(minutes=settings.OTP_EXPIRY_MINUTES)

        record = OTPRecord(
            phone_number=phone_number,
            otp_code=otp_code,
            expires_at=expires_at,
            is_verified=False,
            attempts=0,
            created_at=now,
        )
        db.add(record)
        db.commit()

        # 4. Dispatch OTP depending on SMS / Email provider
        dev_otp = None
        if settings.SMS_PROVIDER == "emailjs" or (settings.EMAILJS_SERVICE_ID and settings.EMAILJS_TEMPLATE_ID):
            cls._send_via_emailjs(phone_number, otp_code)
        elif settings.SMS_PROVIDER == "gmail" and settings.GMAIL_USER:
            cls._send_via_gmail_smtp(phone_number, otp_code)
        elif settings.SMS_PROVIDER == "fast2sms" and settings.FAST2SMS_API_KEY:
            cls._send_via_fast2sms(phone_number, otp_code)
        elif settings.SMS_PROVIDER == "twilio" and settings.TWILIO_ACCOUNT_SID:
            cls._send_via_twilio(phone_number, otp_code)
        elif settings.SMS_PROVIDER == "msg91" and settings.MSG91_AUTH_KEY:
            cls._send_via_msg91(phone_number, otp_code)
        else:
            # Mock / Dev mode fallback: print to console and log
            logger.info(f"[MOCK SMS] OTP for {phone_number} is: {otp_code} (Valid for {settings.OTP_EXPIRY_MINUTES} mins)")
            print("\n==========================================")
            print("[ChatConnect SMS Gateway - DEV MODE]")
            print(f"Identifier: {phone_number}")
            print(f"OTP Code: {otp_code}")
            print(f"Expires: {settings.OTP_EXPIRY_MINUTES} minutes")
            print("To send real OTP via EmailJS or carrier SMS, configure .env")
            print("==========================================\n")
            if settings.SMS_PROVIDER == "mock" and settings.DEV_OTP_AUTO_APPROVE:
                dev_otp = otp_code

        # Never return dev_otp if a real provider like EmailJS is enabled
        if settings.SMS_PROVIDER != "mock":
            dev_otp = None

        return True, "OTP sent successfully to your email", dev_otp

    @classmethod
    def verify_otp(cls, db: Session, phone_number: str, otp_code: str) -> Tuple[bool, str]:
        """
        Validates OTP against active database record.
        Enforces maximum attempt limit and expiration.
        """
        now = datetime.now(timezone.utc)
        record = (
            db.query(OTPRecord)
            .filter(
                OTPRecord.phone_number == phone_number,
                OTPRecord.is_verified == False,
            )
            .order_by(OTPRecord.created_at.desc())
            .first()
        )

        if not record:
            return False, "No active OTP request found. Please request a new OTP."

        # Check maximum retry attempts (prevent brute force)
        if record.attempts >= settings.OTP_MAX_ATTEMPTS:
            db.delete(record)
            db.commit()
            return False, "Maximum verification attempts exceeded. Please request a new OTP."

        # Check expiration (ensure tz-aware comparison)
        expires_at = record.expires_at
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)

        if now > expires_at:
            db.delete(record)
            db.commit()
            return False, "OTP has expired. Please request a new OTP."

        # Dev back-door only allowed if provider is explicitly "mock"
        if settings.SMS_PROVIDER == "mock" and settings.DEV_OTP_AUTO_APPROVE and otp_code == "123456":
            record.is_verified = True
            db.commit()
            return True, "OTP verified successfully."

        # Check OTP match
        if record.otp_code != otp_code:
            record.attempts += 1
            db.commit()
            remaining = settings.OTP_MAX_ATTEMPTS - record.attempts
            return False, f"Invalid OTP code. {remaining} attempt(s) remaining."

        # Verified successfully
        record.is_verified = True
        db.commit()
        return True, "OTP verified successfully."

    @staticmethod
    def _send_via_fast2sms(phone_number: str, otp_code: str):
        """Fast2SMS API: Sends real instant SMS to mobile numbers in India."""
        try:
            clean_number = phone_number.replace("+91", "").replace("+", "").strip()
            url = "https://www.fast2sms.com/dev/bulkV2"
            headers = {
                "authorization": settings.FAST2SMS_API_KEY,
                "Content-Type": "application/x-www-form-urlencoded",
            }
            payload = {
                "variables_values": otp_code,
                "route": "otp",
                "numbers": clean_number,
            }
            with httpx.Client() as client:
                res = client.post(url, headers=headers, data=payload, timeout=10.0)
                logger.info(f"Fast2SMS response: {res.status_code} - {res.text}")
                print(f"[Fast2SMS Real SMS Gateway] Dispatched OTP to {clean_number}: Status {res.status_code}")
        except Exception as e:
            logger.error(f"Failed to dispatch Fast2SMS OTP: {e}")

    @staticmethod
    def _send_via_twilio(phone_number: str, otp_code: str):
        """Twilio: Sends real SMS via Twilio Programmable SMS or Twilio Verify."""
        try:
            if settings.TWILIO_VERIFY_SERVICE_SID:
                url = f"https://verify.twilio.com/v2/Services/{settings.TWILIO_VERIFY_SERVICE_SID}/Verifications"
                data = {"To": phone_number, "Channel": "sms"}
            else:
                url = f"https://api.twilio.com/2010-04-01/Accounts/{settings.TWILIO_ACCOUNT_SID}/Messages.json"
                sender = settings.TWILIO_PHONE_NUMBER or "ChatConnect"
                data = {
                    "To": phone_number,
                    "From": sender,
                    "Body": f"Your ChatConnect verification code is {otp_code}. Valid for 5 minutes.",
                }
            with httpx.Client() as client:
                res = client.post(
                    url,
                    data=data,
                    auth=(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN or ""),
                    timeout=10.0,
                )
                logger.info(f"Twilio SMS response: {res.status_code}")
                print(f"[Twilio Real SMS Gateway] Dispatched SMS to {phone_number}: Status {res.status_code}")
        except Exception as e:
            logger.error(f"Failed to dispatch Twilio SMS: {e}")

    @staticmethod
    def _send_via_msg91(phone_number: str, otp_code: str):
        """MSG91 OTP dispatch implementation."""
        try:
            clean_phone = phone_number.replace("+", "")
            url = f"https://control.msg91.com/api/v5/otp?template_id={settings.MSG91_TEMPLATE_ID}&mobile={clean_phone}&authkey={settings.MSG91_AUTH_KEY}&otp={otp_code}"
            with httpx.Client() as client:
                res = client.post(url, timeout=10.0)
                print(f"[MSG91 Real SMS Gateway] Dispatched OTP to {clean_phone}: Status {res.status_code}")
        except Exception as e:
            logger.error(f"Failed to dispatch MSG91 OTP: {e}")

    @staticmethod
    def _send_via_emailjs(target_identifier: str, otp_code: str):
        """
        Dispatches real OTP via EmailJS REST API.
        Works with user's Service ID: service_48wjvgi
        """
        recipient_email = target_identifier if "@" in target_identifier else (settings.OTP_TARGET_EMAIL or "")
        if not recipient_email:
            print("[EmailJS Gateway] Please enter a valid email address to receive the OTP.")
            return

        service_id = settings.EMAILJS_SERVICE_ID or "service_48wjvgi"
        template_id = settings.EMAILJS_TEMPLATE_ID or "template_o8433w8"
        public_key = settings.EMAILJS_PUBLIC_KEY or ""
        private_key = settings.EMAILJS_PRIVATE_KEY or ""

        url = "https://api.emailjs.com/api/v1.0/email/send"
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
            "Origin": "http://localhost:3000",
            "Referer": "http://localhost:3000/",
        }
        payload_dict = {
            "service_id": service_id,
            "template_id": template_id,
            "user_id": public_key,
            "template_params": {
                "to_email": recipient_email,
                "email": recipient_email,
                "user_email": recipient_email,
                "recipient": recipient_email,
                "reply_to": recipient_email,
                "to_name": recipient_email.split("@")[0],
                "user_name": recipient_email.split("@")[0],
                "name": recipient_email.split("@")[0],
                "otp": otp_code,
                "otp_code": otp_code,
                "code": otp_code,
                "passcode": otp_code,
                "verification_code": otp_code,
                "message": f"Your ChatConnect verification OTP code is: {otp_code}. Valid for 5 minutes.",
            },
        }
        if private_key:
            payload_dict["accessToken"] = private_key

        try:
            import urllib.request
            import json

            data = json.dumps(payload_dict).encode("utf-8")
            req = urllib.request.Request(url, data=data, headers=headers)
            res = urllib.request.urlopen(req, timeout=15)
            
            if res.status in (200, 201):
                print(f"\n==========================================")
                print(f"[EmailJS Real Email Gateway] OTP SENT!")
                print(f"To: {recipient_email}")
                print(f"Service ID: {service_id}")
                print(f"Status: {res.status} OK (Check your email inbox/spam)")
                print(f"==========================================\n")
            else:
                body = res.read().decode()
                print(f"\n[EmailJS Warning]: Response status {res.status}: {body}\n")
        except urllib.error.HTTPError as e:
            err_body = e.read().decode() if e.fp else ""
            logger.error(f"EmailJS HTTP error {e.code}: {err_body}")
            print(f"[EmailJS HTTP Error {e.code}]: {err_body}")
        except Exception as e:
            logger.error(f"Failed to dispatch EmailJS OTP: {e}")
            print(f"[EmailJS Error]: {e}")

    @staticmethod
    def _send_via_gmail_smtp(target_identifier: str, otp_code: str):
        """Sends real OTP via direct Gmail SMTP using App Password."""
        import smtplib
        from email.mime.text import MIMEText
        recipient_email = target_identifier if "@" in target_identifier else (settings.OTP_TARGET_EMAIL or "")
        if not recipient_email or not settings.GMAIL_USER or not settings.GMAIL_APP_PASSWORD:
            print("[Gmail SMTP] Please set GMAIL_USER and GMAIL_APP_PASSWORD in .env")
            return
        try:
            msg = MIMEText(f"Your ChatConnect verification OTP code is: {otp_code}\n\nThis code is valid for 5 minutes.\nDo not share this code with anyone.")
            msg["Subject"] = f"ChatConnect Verification Code: {otp_code}"
            msg["From"] = settings.GMAIL_USER
            msg["To"] = recipient_email

            with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
                server.login(settings.GMAIL_USER, settings.GMAIL_APP_PASSWORD)
                server.send_message(msg)
                print(f"[Gmail SMTP Gateway] Successfully sent real OTP email to {recipient_email}!")
        except Exception as e:
            logger.error(f"Failed to send Gmail SMTP: {e}")
            print(f"[Gmail SMTP Error]: {e}")


