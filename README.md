# 💬 ChatConnect — Real-Time Mobile Number Chat Application

ChatConnect is a high-performance, real-time messaging application with a **FastAPI** backend, **SQLAlchemy** ORM, **PostgreSQL / SQLite** database, **WebSockets**, and a modern **WhatsApp-style** responsive web frontend.

---

## 🚀 Key Features

- **📱 Mobile-Number OTP Authentication**: Passwordless login using international format (`+919876543210`). Integrated with SMS providers (Twilio Verify / MSG91) with built-in development auto-approval mode.
- **⚡ Instant Real-Time Messaging**: Built on persistent WebSockets (`/api/ws`), offering instantaneous message transmission with sub-millisecond latency.
- **✓✓ Message Status Tracking**:
  - `✓` Sent (persisted in database)
  - `✓✓` Delivered (recipient connected to WebSocket)
  - `✓✓` (Blue) Read (recipient viewed chat)
- **🟢 Presence & Activity**:
  - Real-time `Online` / `Offline` status
  - Dynamic `Last seen` timestamps
  - Real-time `typing...` indicators
- **🔒 Message Authorization Security**: Enforces conversation membership checks. Non-participants attempting to access a conversation receive **403 Forbidden**.
- **👥 Contact & Search Directory**: Search users by name or mobile number, save contacts with custom nicknames, and start conversations.
- **🔔 Push Notifications**: Architecture-ready integration with Firebase Cloud Messaging (FCM) for offline message alerts.
- **🎨 WhatsApp-Style Responsive Frontend**: Mobile-first dark theme, responsive dual-pane layout for desktop, Web Audio API incoming message chimes, and instant demo account switcher.

---

## 📂 Project Architecture & Folder Structure

```
D:\MyProjects\MobileChat\
│
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py         # App settings & environment variables
│   │   │   ├── security.py       # JWT creation, decoding, get_current_user
│   │   │   └── database.py       # SQLAlchemy engine & sessionmaker
│   │   ├── models/
│   │   │   ├── user.py           # User entity
│   │   │   ├── contact.py        # Contacts & phonebook nicknames
│   │   │   ├── conversation.py   # Conversation & ConversationMember
│   │   │   └── message.py        # Message & OTPRecord models
│   │   ├── schemas/
│   │   │   ├── auth.py           # OTP & JWT Pydantic schemas
│   │   │   ├── user.py           # User profile & search schemas
│   │   │   ├── contact.py        # Contact management schemas
│   │   │   ├── conversation.py   # Chat conversation schemas
│   │   │   └── message.py        # Message payload schemas
│   │   ├── routers/
│   │   │   ├── auth.py           # /api/auth/send-otp, /verify-otp, /me
│   │   │   ├── users.py          # /api/users/me, /search, /{id}
│   │   │   ├── contacts.py       # /api/contacts
│   │   │   ├── conversations.py  # /api/conversations
│   │   │   ├── messages.py       # /api/conversations/{id}/messages
│   │   │   └── ws.py             # /api/ws (Real-time WebSocket)
│   │   ├── services/
│   │   │   ├── otp_service.py    # 6-digit OTP generation, expiry & rate limits
│   │   │   ├── auth_service.py   # Onboarding & JWT issuance
│   │   │   ├── message_service.py# Chat authorization & message persistence
│   │   │   └── notification_service.py # FCM push alerts for offline users
│   │   ├── websocket/
│   │   │   ├── manager.py        # ConnectionManager (multi-device presence pool)
│   │   │   └── chat.py           # Real-time event router (typing, chat, read)
│   │   ├── utils/
│   │   │   └── helpers.py        # Phone normalization (E.164)
│   │   └── main.py               # FastAPI entry point & static file hosting
│   ├── tests/
│   │   ├── test_api.py           # Full automated REST & security test suite
│   │   └── test_websocket.py     # Real-time WebSocket automated test suite
│   ├── .env                      # Active environment configuration
│   ├── .env.example              # Environment variables template
│   └── requirements.txt          # Python dependencies
│
├── frontend/
│   ├── index.html                # WhatsApp-style Web/Mobile application
│   ├── styles.css                # Dark-mode styling, animations, responsive layout
│   └── app.js                    # WebSocket client, presence handler, audio chimes
│
├── docs/
│   └── PROJECT_REPORT.md         # Comprehensive B.Tech project report (Chapters 1 - 12)
│
└── README.md
```

---

## 🛠️ Getting Started

### 1. Requirements
- Python 3.10+
- (Optional) PostgreSQL & Redis if running in production mode. By default, ChatConnect runs immediately with zero-configuration SQLite!

### 2. Install Dependencies
```bash
cd D:\MyProjects\MobileChat
pip install -r backend/requirements.txt
```

### 3. Run Automated Tests
Verify that all unit tests and security checks pass:
```bash
python backend/tests/test_api.py
python backend/tests/test_websocket.py
```

### 4. Start the Application Server
Run the FastAPI backend server using Uvicorn:
```bash
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```

---

## 🌐 Using the Application

Open your browser to:
- **ChatConnect Web App**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
- **Interactive Swagger API Docs**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **Health Check**: [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)

### Quick Testing Walkthrough (2-User Simulation):
1. **Window 1 (Kamal)**:
   - Go to [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
   - Click the test button **"👤 Kamal (+91 9876543210)"** and click **Send OTP**.
   - The OTP auto-fills (or use `123456`). Click **Verify & Continue**.
   - Kamal is logged in!
2. **Window 2 (Rahul - Incognito or another browser)**:
   - Go to [http://127.0.0.1:8000/](http://127.0.0.1:8000/)
   - Click the test button **"👤 Rahul (+91 9123456789)"** and click **Send OTP**.
   - Verify OTP and enter app as Rahul.
3. **Start Chatting**:
   - In Kamal's window, click 🔍 Search and search for **Rahul**.
   - Click **Message**.
   - Type *"Hello Rahul!"* and hit send.
   - Look at Rahul's screen: the message appears instantly with sound!
   - As Rahul types, Kamal sees *"Rahul is typing..."*.
   - When Rahul reads the message, Kamal's checkmarks turn blue (`✓✓`)!

---

## ⚙️ Environment Configuration (`.env`)

Configure `.env` for production deployments:

```ini
PROJECT_NAME=ChatConnect
ENVIRONMENT=development
DEBUG=True
SECRET_KEY=chatconnect_super_secret_jwt_key_2026_change_in_production

# Use PostgreSQL in production:
DATABASE_URL=sqlite:///./chatconnect.db
# DATABASE_URL=postgresql+psycopg2://postgres:postgres@localhost:5432/chatconnect

# SMS Provider ("mock" | "twilio" | "msg91")
SMS_PROVIDER=mock
DEV_OTP_AUTO_APPROVE=True

# Twilio Verify (Optional)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_VERIFY_SERVICE_SID=
```

---

## 📄 Academic B.Tech Project Documentation

A full 12-chapter academic project report is available in:
[`docs/PROJECT_REPORT.md`](docs/PROJECT_REPORT.md)
It includes:
- Chapter 1: Introduction
- Chapter 2: Problem Statement
- Chapter 3: Objectives
- Chapter 4: Technology Stack
- Chapter 5: System Architecture
- Chapter 6: Database Design & ER Diagram
- Chapter 7: Authentication Flow
- Chapter 8: Messaging Lifecycle
- Chapter 9: Real-Time WebSocket Communication
- Chapter 10: Complete API Documentation Table
- Chapter 11: Testing & Verification
- Chapter 12: Production Deployment Strategy
