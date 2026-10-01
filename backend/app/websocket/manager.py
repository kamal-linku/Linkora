import json
import logging
from datetime import datetime, timezone
from typing import Dict, Set, Optional, Any
from fastapi import WebSocket
from sqlalchemy.orm import Session

from backend.app.core.database import SessionLocal
from backend.app.models.user import User

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        # Maps user_id -> Set[WebSocket] (allows multiple tabs/devices per user)
        self.active_connections: Dict[int, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: int):
        """Accepts WebSocket connection and marks user online."""
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
            self._update_user_status(user_id, is_online=True)
            await self.broadcast_user_status(user_id, is_online=True)
        self.active_connections[user_id].add(websocket)
        logger.info(f"User {user_id} connected. Active connections: {len(self.active_connections.get(user_id, set()))}")

    async def disconnect(self, websocket: WebSocket, user_id: int):
        """Removes WebSocket connection and marks offline if no more active connections."""
        if user_id in self.active_connections:
            self.active_connections[user_id].discard(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                now = datetime.now(timezone.utc)
                self._update_user_status(user_id, is_online=False, last_seen=now)
                await self.broadcast_user_status(user_id, is_online=False, last_seen=now)
        logger.info(f"User {user_id} disconnected.")

    def is_user_online(self, user_id: int) -> bool:
        """Checks if a user currently has an active WebSocket connection."""
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0

    async def send_personal_message(self, message: Dict[str, Any], user_id: int) -> bool:
        """Sends a JSON message to all connected clients for a given user."""
        if user_id in self.active_connections:
            dead_sockets = set()
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    dead_sockets.add(connection)
            
            for dead in dead_sockets:
                self.active_connections[user_id].discard(dead)
            return True
        return False

    async def broadcast_user_status(
        self, user_id: int, is_online: bool, last_seen: Optional[datetime] = None
    ):
        """Broadcasts user presence change to all active connections."""
        payload = {
            "type": "user_status",
            "user_id": user_id,
            "is_online": is_online,
            "last_seen": last_seen.isoformat() if last_seen else datetime.now(timezone.utc).isoformat(),
        }
        for uid, connections in list(self.active_connections.items()):
            for conn in list(connections):
                try:
                    await conn.send_json(payload)
                except Exception:
                    pass

    def _update_user_status(
        self, user_id: int, is_online: bool, last_seen: Optional[datetime] = None
    ):
        """Synchronously updates user presence in DB."""
        db: Session = SessionLocal()
        try:
            user = db.query(User).filter(User.id == user_id).first()
            if user:
                user.is_online = is_online
                if last_seen:
                    user.last_seen = last_seen
                elif is_online:
                    user.last_seen = datetime.now(timezone.utc)
                db.commit()
        except Exception as e:
            logger.error(f"Failed to update user status in DB: {e}")
            db.rollback()
        finally:
            db.close()


manager = ConnectionManager()
