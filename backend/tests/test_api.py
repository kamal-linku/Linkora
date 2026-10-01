import os
import sys
from fastapi.testclient import TestClient

# Ensure root directory is on PYTHONPATH
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

# Use temporary test database
os.environ["DATABASE_URL"] = "sqlite:///./test_chatconnect.db"
os.environ["SMS_PROVIDER"] = "mock"
os.environ["DEV_OTP_AUTO_APPROVE"] = "True"

from backend.app.main import app
from backend.app.core.database import Base, engine, SessionLocal
from backend.app.models.user import User

client = TestClient(app)


def setup_database():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)



def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["service"] == "ChatConnect"


def test_auth_send_and_verify_otp():
    # 1. Send OTP for Kamal (+919876543210)
    res_otp = client.post("/api/auth/send-otp", json={"phone_number": "+919876543210"})
    assert res_otp.status_code == 200
    otp_data = res_otp.json()
    assert otp_data["phone_number"] == "+919876543210"
    otp_code = otp_data["dev_otp"]
    assert otp_code is not None

    # 2. Verify with wrong OTP
    res_bad = client.post("/api/auth/verify-otp", json={"phone_number": "+919876543210", "otp_code": "000000"})
    assert res_bad.status_code == 400

    # 3. Verify with correct OTP
    res_verify = client.post("/api/auth/verify-otp", json={"phone_number": "+919876543210", "otp_code": otp_code})
    assert res_verify.status_code == 200
    data = res_verify.json()
    assert "access_token" == "access_token" in data
    assert data["is_new_user"] is True
    assert data["user"]["phone_number"] == "+919876543210"

    token = data["access_token"]

    # 4. Check /api/auth/me with bearer token
    res_me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert res_me.status_code == 200
    assert res_me.json()["phone_number"] == "+919876543210"


def test_profile_update_and_user_search():
    # Authenticate Kamal
    res_otp = client.post("/api/auth/send-otp", json={"phone_number": "+919876543210"})
    token_kamal = client.post(
        "/api/auth/verify-otp",
        json={"phone_number": "+919876543210", "otp_code": res_otp.json()["dev_otp"]}
    ).json()["access_token"]

    # Authenticate Rahul (+919123456789)
    res_otp2 = client.post("/api/auth/send-otp", json={"phone_number": "+919123456789"})
    token_rahul = client.post(
        "/api/auth/verify-otp",
        json={"phone_number": "+919123456789", "otp_code": res_otp2.json()["dev_otp"]}
    ).json()["access_token"]

    # Update Kamal's Profile
    res_update = client.put(
        "/api/users/me",
        headers={"Authorization": f"Bearer {token_kamal}"},
        json={"name": "Kamal", "about": "Coding ChatConnect!"}
    )
    assert res_update.status_code == 200
    assert res_update.json()["name"] == "Kamal"

    # Update Rahul's Profile
    res_update2 = client.put(
        "/api/users/me",
        headers={"Authorization": f"Bearer {token_rahul}"},
        json={"name": "Rahul Kumar", "about": "Available"}
    )
    assert res_update2.status_code == 200
    assert res_update2.json()["name"] == "Rahul Kumar"

    # Search: Kamal searches for Rahul
    res_search = client.get(
        "/api/users/search?q=Rahul",
        headers={"Authorization": f"Bearer {token_kamal}"}
    )
    assert res_search.status_code == 200
    results = res_search.json()
    assert len(results) >= 1
    assert results[0]["name"] == "Rahul Kumar"
    assert results[0]["phone_number"] == "+919123456789"


def test_contact_management():
    # Login Kamal
    res_otp = client.post("/api/auth/send-otp", json={"phone_number": "+919876543210"})
    token_kamal = client.post(
        "/api/auth/verify-otp",
        json={"phone_number": "+919876543210", "otp_code": res_otp.json()["dev_otp"]}
    ).json()["access_token"]

    # Get Rahul's user id
    search_res = client.get(
        "/api/users/search?q=Rahul",
        headers={"Authorization": f"Bearer {token_kamal}"}
    ).json()
    rahul_id = search_res[0]["id"]

    # Kamal saves Rahul with custom nickname "Rahul Bro"
    res_contact = client.post(
        "/api/contacts",
        headers={"Authorization": f"Bearer {token_kamal}"},
        json={"contact_user_id": rahul_id, "saved_name": "Rahul Bro"}
    )
    assert res_contact.status_code == 200
    assert res_contact.json()["saved_name"] == "Rahul Bro"

    # List contacts
    res_list = client.get("/api/contacts", headers={"Authorization": f"Bearer {token_kamal}"})
    assert res_list.status_code == 200
    contacts = res_list.json()
    assert len(contacts) == 1
    assert contacts[0]["saved_name"] == "Rahul Bro"


def test_conversations_and_messaging():
    # Login Kamal & Rahul
    res_otp1 = client.post("/api/auth/send-otp", json={"phone_number": "+919876543210"})
    token_kamal = client.post(
        "/api/auth/verify-otp",
        json={"phone_number": "+919876543210", "otp_code": res_otp1.json()["dev_otp"]}
    ).json()["access_token"]

    res_otp2 = client.post("/api/auth/send-otp", json={"phone_number": "+919123456789"})
    token_rahul = client.post(
        "/api/auth/verify-otp",
        json={"phone_number": "+919123456789", "otp_code": res_otp2.json()["dev_otp"]}
    ).json()["access_token"]

    # Get Rahul id
    rahul_id = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token_rahul}"}).json()["id"]

    # 1. Create 1-on-1 Conversation
    res_conv = client.post(
        "/api/conversations",
        headers={"Authorization": f"Bearer {token_kamal}"},
        json={"participant_id": rahul_id}
    )
    assert res_conv.status_code == 200
    conv_id = res_conv.json()["id"]

    # 2. Kamal sends message: "Hello Rahul!"
    res_msg1 = client.post(
        f"/api/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {token_kamal}"},
        json={"content": "Hello Rahul!"}
    )
    assert res_msg1.status_code == 201
    msg1_data = res_msg1.json()
    assert msg1_data["content"] == "Hello Rahul!"

    # 3. Rahul gets conversation list and sees Kamal's message + unread count = 1
    res_rahul_convs = client.get("/api/conversations", headers={"Authorization": f"Bearer {token_rahul}"})
    assert res_rahul_convs.status_code == 200
    rahul_convs = res_rahul_convs.json()
    assert len(rahul_convs) == 1
    assert rahul_convs[0]["unread_count"] == 1
    assert rahul_convs[0]["last_message"]["content"] == "Hello Rahul!"

    # 4. Rahul reads messages
    res_read = client.post(
        f"/api/conversations/{conv_id}/messages/read",
        headers={"Authorization": f"Bearer {token_rahul}"}
    )
    assert res_read.status_code == 200

    # 5. Authorization security check:
    # Authenticate a 3rd user (Priya: +919999988888)
    res_otp3 = client.post("/api/auth/send-otp", json={"phone_number": "+919999988888"})
    token_priya = client.post(
        "/api/auth/verify-otp",
        json={"phone_number": "+919999988888", "otp_code": res_otp3.json()["dev_otp"]}
    ).json()["access_token"]

    # Priya tries to read Kamal and Rahul's conversation messages -> MUST return 403 Forbidden!
    res_forbidden = client.get(
        f"/api/conversations/{conv_id}/messages",
        headers={"Authorization": f"Bearer {token_priya}"}
    )
    assert res_forbidden.status_code == 403
    print("Security verification passed: 403 Forbidden correctly returned for unauthorized user.")


if __name__ == "__main__":
    print("--- Running ChatConnect Test Suite ---")
    setup_database()
    test_health_check()
    print("[PASS] test_health_check")
    test_auth_send_and_verify_otp()
    print("[PASS] test_auth_send_and_verify_otp")
    test_profile_update_and_user_search()
    print("[PASS] test_profile_update_and_user_search")
    test_contact_management()
    print("[PASS] test_contact_management")
    test_conversations_and_messaging()
    print("[PASS] test_conversations_and_messaging")
    print("\n==========================================")
    print("ALL TESTS PASSED SUCCESSFULLY! (100% OK)")
    print("==========================================")


