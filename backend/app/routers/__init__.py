from backend.app.routers.auth import router as auth_router
from backend.app.routers.users import router as users_router
from backend.app.routers.contacts import router as contacts_router
from backend.app.routers.conversations import router as conversations_router
from backend.app.routers.messages import router as messages_router
from backend.app.routers.ws import router as ws_router

__all__ = [
    "auth_router",
    "users_router",
    "contacts_router",
    "conversations_router",
    "messages_router",
    "ws_router",
]
