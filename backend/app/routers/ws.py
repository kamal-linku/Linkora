import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from backend.app.core.security import decode_access_token
from backend.app.websocket.manager import manager
from backend.app.websocket.chat import handle_websocket_message

logger = logging.getLogger(__name__)

router = APIRouter(tags=["WebSocket"])


@router.websocket("/ws")
async def websocket_endpoint(
    websocket: WebSocket,
    token: str = Query(..., description="JWT Bearer access token"),
):
    """
    Real-time WebSocket endpoint for instant messaging, status broadcasting,
    and typing indicators. Authenticates user via JWT query parameter.
    """
    user_id = decode_access_token(token)
    if not user_id:
        logger.warning("Rejected WebSocket connection: invalid or missing JWT token.")
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_json()
            await handle_websocket_message(data, user_id)
    except WebSocketDisconnect:
        await manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"WebSocket exception for user {user_id}: {e}", exc_info=True)
        await manager.disconnect(websocket, user_id)
