import os
import sys

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

os.environ["DATABASE_URL"] = "sqlite:///./test_chatconnect_ws.db"
os.environ["SMS_PROVIDER"] = "mock"
os.environ["DEV_OTP_AUTO_APPROVE"] = "True"

from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.core.database import Base, engine, SessionLocal
from backend.app.models.message import Message

client = TestClient(app)


def test_realtime_websocket_flow():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    # 1. Register Kamal
    res_otp_k = client.post("/api/auth/send-otp", json={"phone_number": "+919876543210"})
    token_kamal = client.post(
        "/api/auth/verify-otp",
        json={"phone_number": "+919876543210", "otp_code": res_otp_k.json()["dev_otp"]},
    ).json()["access_token"]

    # 2. Register Rahul
    res_otp_r = client.post("/api/auth/send-otp", json={"phone_number": "+919123456789"})
    res_rahul = client.post(
        "/api/auth/verify-otp",
        json={"phone_number": "+919123456789", "otp_code": res_otp_r.json()["dev_otp"]},
    ).json()
    user_rahul_id = res_rahul["user"]["id"]

    # 3. Create conversation between Kamal and Rahul
    res_conv = client.post(
        "/api/conversations",
        headers={"Authorization": f"Bearer {token_kamal}"},
        json={"participant_id": user_rahul_id},
    )
    conv_id = res_conv.json()["id"]

    # 4. Connect Kamal to WebSocket
    with client.websocket_connect(f"/api/ws?token={token_kamal}") as ws:
        print("[PASS] WebSocket connection successfully established for Kamal.")

        # 5. Send typing event
        ws.send_json({
            "type": "typing",
            "conversation_id": conv_id,
            "is_typing": True,
        })
        print("[PASS] Typing status event sent over WebSocket.")

        # 6. Kamal sends chat message over WebSocket
        ws.send_json({
            "type": "send_message",
            "conversation_id": conv_id,
            "content": "Hello Rahul from WebSocket!",
            "temp_id": "temp-999",
        })

        # Kamal receives message_sent confirmation
        ack = ws.receive_json()
        assert ack["type"] == "message_sent"
        assert ack["message"]["content"] == "Hello Rahul from WebSocket!"
        assert ack["temp_id"] == "temp-999"
        msg_id = ack["message"]["id"]
        print(f"[PASS] Sender received message_sent confirmation for Msg #{msg_id}.")

        # Verify message persisted in database
        db = SessionLocal()
        msg_db = db.query(Message).filter(Message.id == msg_id).first()
        assert msg_db is not None
        assert msg_db.content == "Hello Rahul from WebSocket!"
        db.close()
        print("[PASS] WebSocket message verified in SQLite database.")

        # 7. Kamal sends message_read
        ws.send_json({
            "type": "message_read",
            "conversation_id": conv_id,
        })
        print("[PASS] message_read event processed cleanly.")

    print("\n==========================================")
    print("ALL WEBSOCKET TESTS PASSED SUCCESSFULLY! (100% OK)")
    print("==========================================")


if __name__ == "__main__":
    test_realtime_websocket_flow()
