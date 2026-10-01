import logging
from typing import Dict, Any, Optional
import httpx
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class NotificationService:
    @staticmethod
    def send_push_notification(
        user_id: int,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
    ) -> bool:
        """
        Dispatches push notification when recipient is offline.
        Uses Firebase Cloud Messaging (FCM) or logs simulation in dev.
        """
        if not settings.FCM_SERVER_KEY:
            # Simulated FCM Notification
            logger.info(
                f"[FCM PUSH] User {user_id} is OFFLINE. Sent notification: '{title}' - '{body}'"
            )
            print(f"[Push Notification -> User #{user_id}]: {title} - {body}")
            return True

        try:
            url = "https://fcm.googleapis.com/fcm/send"
            headers = {
                "Authorization": f"key={settings.FCM_SERVER_KEY}",
                "Content-Type": "application/json",
            }
            payload = {
                "to": f"/topics/user_{user_id}",
                "notification": {
                    "title": title,
                    "body": body,
                    "sound": "default",
                },
                "data": data or {},
            }
            with httpx.Client() as client:
                res = client.post(url, headers=headers, json=payload, timeout=5.0)
                return res.status_code == 200
        except Exception as e:
            logger.error(f"Failed to dispatch FCM push notification: {e}")
            return False
