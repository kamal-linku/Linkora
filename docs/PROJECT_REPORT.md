# ChatConnect: Real-Time Mobile Number Chat Application
## Comprehensive Engineering & B.Tech Project Report

---

### Table of Contents
1. **Chapter 1 — Introduction**
2. **Chapter 2 — Problem Statement**
3. **Chapter 3 — Objectives**
4. **Chapter 4 — Technology Stack**
5. **Chapter 5 — System Architecture**
6. **Chapter 6 — Database Design**
7. **Chapter 7 — Authentication System**
8. **Chapter 8 — Messaging System**
9. **Chapter 9 — Real-Time Communication**
10. **Chapter 10 — API Documentation**
11. **Chapter 11 — Testing and Verification**
12. **Chapter 12 — Deployment & Scaling Architecture**

---

### Chapter 1 — Introduction

#### 1.1 What is a Messaging Application?
A messaging application is an interactive communication system that enables individuals or groups to transmit textual, audiovisual, or multimedia data across computer networks. Unlike legacy store-and-forward systems (such as email or traditional SMS), modern messaging systems are defined by **real-time bi-directional interactivity**, persistent conversation state, and rich delivery metadata.

#### 1.2 Why Real-Time Communication is Needed
In contemporary social and enterprise communication, millisecond latency between message transmission and receipt is paramount. Traditional HTTP pull paradigms (short polling) introduce unacceptable server overhead, high battery consumption on mobile devices, and perceptible transmission delays. By employing persistent duplex protocols like WebSockets, communication occurs instantaneously when an event happens on the server.

#### 1.3 Problems with Traditional Systems
- **Legacy SMS**: Incurs per-carrier fees, offers no end-to-end delivery tracking, lacks rich-media support, and suffers from carrier throttling and spam vulnerability.
- **Polling HTTP Systems**: Suffer from the $O(N)$ query load per user, resulting in severe database connection exhaustion and latency penalties.
- **Closed Ecosystems**: Major platforms (WhatsApp, Telegram) operate proprietary, opaque servers. Developing an open, Python-driven, standards-compliant platform provides complete transparency, customizable security, and auditable data sovereignty.

#### 1.4 Purpose of ChatConnect
ChatConnect is a production-grade, asynchronous Python-powered messaging platform built using FastAPI, SQLAlchemy, PostgreSQL, and WebSockets. It replaces password-based authentication with mobile-number OTP verification, implements fine-grained conversation authorization, delivers instant real-time message broadcasting with typing indicators and read receipts, and provides full persistent storage.

---

### Chapter 2 — Problem Statement

Existing communication platforms provide real-time messaging but operate as complex, closed-source ecosystems with heavyweight dependencies. Developing custom enterprise or localized communication tools requires a clean, scalable, and secure architecture that combines:
1. Passwordless mobile-first onboarding via SMS One-Time Passwords (OTP).
2. Contact discovery and address book isolation.
3. Sub-millisecond message delivery with delivery (`✓✓`) and read (`✓✓` blue) status tracking.
4. Robust server-side authorization ensuring users cannot snoop on conversations they are not members of.
5. High concurrency capable of scaling horizontally across distributed application instances.

---

### Chapter 3 — Objectives

The core objectives fulfilled by ChatConnect include:
- **Mobile-Number Authentication**: Eliminating user passwords through international E.164 phone verification.
- **OTP Verification Engine**: Integrating multi-provider verification (Twilio Verify, MSG91) with built-in brute-force protection, request rate-limiting, and development mock modes.
- **JWT Session Security**: Issuing cryptographically signed JSON Web Tokens (HS256) with strict expiration limits.
- **User Discovery**: Enabling telephone and name-based search with privacy controls.
- **Custom Contact Management**: Enabling users to store contacts with personalized aliases and phonebook indexing.
- **One-to-One Persistent Messaging**: Creating distinct conversations with message ordering and history retention.
- **Persistent WebSocket Duplexing**: Maintaining persistent active connection pools with automatic reconnection and heartbeat capabilities.
- **Presence & Activity Tracking**: Instantaneous propagation of `online`, `offline`, `last_seen`, and `is_typing` statuses.
- **Strict Authorization Guardrails**: Ensuring non-members receive HTTP 403 Forbidden upon attempting to access or manipulate unauthorized conversation threads.
- **Offline Message Queuing**: Routing offline alerts through push notification gateways (Firebase Cloud Messaging).

---

### Chapter 4 — Technology Stack

| Component | Selected Technology | Rationale & Justification |
| :--- | :--- | :--- |
| **Language** | Python 3.10+ | Clean syntax, mature asynchronous asyncio ecosystem, extensive community libraries. |
| **Backend Framework** | FastAPI (Starlette) | High-performance asynchronous execution, automated OpenAPI (Swagger) documentation, native WebSocket support. |
| **ASGI Server** | Uvicorn (uvloop) | Lightning-fast ASGI web server implementation built on uvloop and httptools. |
| **Database** | PostgreSQL (Prod) / SQLite (Dev) | Enterprise relational integrity, ACID compliance, foreign-key cascade semantics, flexible JSON support. |
| **ORM** | SQLAlchemy 2.0 | Declarative data mapping, robust connection pooling, schema generation. |
| **Authentication** | JWT (python-jose) | Stateless bearer token authentication containing user claims, reducing database lookups on authenticated requests. |
| **Real-time Transport**| WebSocket (RFC 6455) | Full-duplex bidirectional persistent TCP channel minimizing per-message overhead. |
| **Caching / Pub-Sub** | Redis (Optional) | In-memory message broker enabling horizontal scaling across multiple FastAPI ASGI worker processes. |
| **SMS Verification** | Twilio Verify / MSG91 | Telecom carrier-grade SMS delivery, rate limiting, and regulatory compliance. |
| **Frontend** | Modern Vanilla JS + CSS3 | Zero-dependency, responsive mobile-first UI with WhatsApp dark/light aesthetic, Web Audio API chimes. |

---

### Chapter 5 — System Architecture

The ChatConnect architecture follows a layered micro-service ready design pattern:

```
┌─────────────────────────────────────────────────────────────┐
│                 Client Layer (Mobile / Web)                 │
│  - Phone OTP Authentication                                  │
│  - Contacts & User Search                                    │
│  - Active Chat & Message Bubbles                             │
│  - Audio Notification Synthesizer (Web Audio API)            │
└──────────────┬───────────────────────────────▲──────────────┘
               │ HTTPS (REST)                  │ WSS (WebSocket)
               ▼                               │
┌──────────────────────────────────────────────┴──────────────┐
│                   FastAPI Application Layer                 │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │ Routers: /auth, /users, /contacts, /conversations,  │   │
│   │          /messages, /ws                             │   │
│   └──────────┬───────────────────────────────┬──────────┘   │
│              │                               │              │
│   ┌──────────▼──────────────┐   ┌────────────▼──────────┐   │
│   │     Services Layer      │   │  WebSocket Subsystem  │   │
│   │ - OTPService            │   │ - ConnectionManager   │   │
│   │ - AuthService           │   │ - Event Dispatcher    │   │
│   │ - MessageService        │   │ - Presence Broker     │   │
│   │ - NotificationService   │   │ - Ack & Receipt Engine│   │
│   └──────────┬──────────────┘   └────────────┬──────────┘   │
│              │                               │              │
└──────────────┼───────────────────────────────┼──────────────┘
               │                               │
               ▼                               ▼
┌─────────────────────────────┐ ┌─────────────────────────────┐
│   Relational Persistence    │ │   Presence & Notification   │
│      (PostgreSQL/SQLite)    │ │   (Redis & Firebase FCM)    │
│  - Users & Profiles         │ │  - Active WebSocket Pool   │
│  - Contacts Directory       │ │  - Ephemeral Presence Cache │
│  - Conversations & Members  │ │  - Push Notifications       │
│  - Messages & Timestamps    │ │  - Distributed Pub/Sub      │
│  - OTP Verification Audit   │ │                             │
└─────────────────────────────┘ └─────────────────────────────┘
```

---

### Chapter 6 — Database Design

#### 6.1 Entity-Relationship Diagram (ERD)

```mermaid
erDiagram
    USERS ||--o{ CONTACTS : "owns"
    USERS ||--o{ CONVERSATION_MEMBERS : "participates_in"
    USERS ||--o{ MESSAGES : "sends"
    CONVERSATIONS ||--o{ CONVERSATION_MEMBERS : "has"
    CONVERSATIONS ||--o{ MESSAGES : "contains"
    USERS ||--o{ OTP_RECORDS : "generates"

    USERS {
        int id PK
        string phone_number UK
        string name
        string profile_photo
        string about
        boolean is_online
        datetime last_seen
        datetime created_at
        datetime updated_at
    }

    CONTACTS {
        int id PK
        int owner_id FK
        int contact_user_id FK
        string saved_name
        datetime created_at
    }

    CONVERSATIONS {
        int id PK
        boolean is_group
        string title
        datetime created_at
        datetime updated_at
    }

    CONVERSATION_MEMBERS {
        int id PK
        int conversation_id FK
        int user_id FK
        datetime joined_at
    }

    MESSAGES {
        int id PK
        int conversation_id FK
        int sender_id FK
        string message_type
        text content
        string media_url
        datetime created_at
        datetime delivered_at
        datetime read_at
    }

    OTP_RECORDS {
        int id PK
        string phone_number
        string otp_code
        datetime expires_at
        boolean is_verified
        int attempts
        datetime created_at
    }
```

#### 6.2 Data Schema Specifications

1. **`users` Table**:
   - `id`: Auto-incrementing primary key.
   - `phone_number`: Unique E.164 formatted telephone number (e.g., `+919876543210`).
   - `name`: User's self-chosen display name.
   - `profile_photo`: URL/path to stored image avatar.
   - `about`: User status message (defaults to *"Hey there! I am using ChatConnect."*).
   - `is_online`: Boolean presence flag.
   - `last_seen`: UTC timestamp of last disconnect or interaction.
   - `created_at` / `updated_at`: Audit timestamps.

2. **`contacts` Table**:
   - `id`: Auto-incrementing primary key.
   - `owner_id`: User owning the phonebook entry (`ForeignKey("users.id", ondelete="CASCADE")`).
   - `contact_user_id`: Target registered user (`ForeignKey("users.id", ondelete="CASCADE")`).
   - `saved_name`: Localized nickname assigned by owner (e.g., *"Rahul Bro"*).
   - Constraint: `UniqueConstraint("owner_id", "contact_user_id")`.

3. **`conversations` & `conversation_members` Tables**:
   - Isolates message threads from direct peer coupling.
   - Enables seamless future expansion to group chats without altering message tables.
   - Enforces unique membership per conversation.

4. **`messages` Table**:
   - `id`: Unique identifier.
   - `conversation_id`: Foreign key referencing conversation.
   - `sender_id`: Foreign key referencing author.
   - `message_type`: Enum string (`text`, `image`, `audio`, `file`).
   - `content`: Message body text.
   - `media_url`: Optional link for media payloads.
   - `created_at`: UTC timestamp when server received message.
   - `delivered_at`: UTC timestamp when recipient client acknowledged receipt.
   - `read_at`: UTC timestamp when recipient viewed the message.

---

### Chapter 7 — Authentication System

#### 7.1 Passwordless OTP Flow
```
User Enters Phone (+919876543210)
              │
              ▼
FastAPI POST /api/auth/send-otp
              │
   ┌──────────┴──────────┐
   │ Check Rate Limits   │ ──> Exceeded? 429 Too Many Requests
   └──────────┬──────────┘
              ▼
   Generate 6-Digit Cryptographic Code
              │
   Store in `otp_records` with 5-min Expiration
              │
   Dispatch SMS (Twilio / MSG91 / Mock Logger)
              │
              ▼
User Submits OTP via POST /api/auth/verify-otp
              │
   ┌──────────┴──────────┐
   │ Validate Code & Exp │ ──> Failed? Increment Attempts -> 400 Bad Request
   └──────────┬──────────┘
              ▼
Does User Record Exist in `users`?
   ├── No  ──> Create User (`is_new_user=True`)
   └── Yes ──> Mark User Online (`is_new_user=False`)
              │
              ▼
Sign & Issue JWT Access Token (HS256)
              │
              ▼
Client Stores Token in Secure Storage
```

#### 7.2 Security Safeguards
- **Brute-Force Counter**: Every failed OTP attempt increments `attempts`. Upon reaching 5 failed attempts, the record is invalidated.
- **Windowed Rate-Limiting**: A single telephone number is restricted to at most 5 OTP requests per 15-minute rolling window.
- **Stateless Bearer Tokens**: Tokens are verified at the gateway using cryptographic HMAC signatures, extracting user identity without database roundtrips.

---

### Chapter 8 — Messaging System

#### 8.1 Message Lifecycle & Verification Checks
```
Sender (Kamal)              FastAPI Gateway               Database                Recipient (Rahul)
     │                             │                          │                           │
     │ 1. WS: send_message         │                          │                           │
     ├────────────────────────────>│                          │                           │
     │                             │ 2. Validate Membership   │                           │
     │                             │ 3. Save Message          │                           │
     │                             ├─────────────────────────>│                           │
     │                             │<─────────────────────────┤ (Saved as ID: 501)        │
     │                             │                                                      │
     │                             │ 4. Check Recipient Online Status                     │
     │                             │    - Is Rahul in active_connections?                 │
     │                             │                                                      │
     │                             │───[ CASE A: Rahul is Online ]───────────────────────>│
     │                             │                                                      │ 5. Deliver WS msg
     │                             │ 6. Set delivered_at = now                            │
     │ 7. WS: message_sent         │<─────────────────────────────────────────────────────┤
     │<────────────────────────────┤                                                      │
     │    (Status: delivered ✓✓)   │                                                      │
     │                             │                                                      │
     │                             │───[ CASE B: Rahul is Offline ]                       │
     │                             │ 8. Trigger FCM Push Notification                     │
     │ 9. WS: message_sent         │                                                      │
     │<────────────────────────────┤                                                      │
     │    (Status: sent ✓)         │                                                      │
```

#### 8.2 Conversation Authorization Guard
ChatConnect enforces strict authorization:
```python
membership = db.query(ConversationMember).filter(
    ConversationMember.conversation_id == conversation_id,
    ConversationMember.user_id == current_user.id
).first()
if not membership:
    raise HTTPException(status_code=403, detail="Unauthorized")
```
An attacker guessing another user's conversation ID receives HTTP 403 Forbidden.

---

### Chapter 9 — Real-Time Communication

#### 9.1 WebSocket Connection Lifecycle
1. **Handshake & Auth**: The client establishes a WebSocket connection with `ws://host/api/ws?token=<JWT>`. The server decodes and validates the token. If invalid or expired, the socket is immediately closed with status code `1008 Policy Violation`.
2. **Connection Registration**: The authenticated user ID is stored in the `ConnectionManager.active_connections[user_id]` set.
3. **Multi-Tab / Multi-Device Support**: A single user may open multiple tabs or mobile devices. The manager stores a `Set[WebSocket]` per user ID, ensuring messages synchronize seamlessly across all active devices.
4. **Presence Broadcasting**: Upon connection or disconnection, the manager dispatches `user_status` events:
```json
{
  "type": "user_status",
  "user_id": 102,
  "is_online": true,
  "last_seen": "2026-09-30T19:40:00Z"
}
```
5. **Real-time Typing Indicators**: When a user inputs text, a debounced ephemeral event is transmitted:
```json
{
  "type": "typing",
  "conversation_id": 5001,
  "user_id": 101,
  "is_typing": true
}
```
6. **Read Receipts**: When a user views a conversation, `message_read` events are triggered. The backend commits `read_at = UTC` in the database and broadcasts `messages_read` to the sender, turning the checkmarks blue (`✓✓`).

---

### Chapter 10 — API Documentation

#### 10.1 Authentication Endpoints
| Method | Endpoint | Request Body | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | `{"phone_number": "+919876543210"}` | Dispatches 6-digit OTP code to phone number |
| `POST` | `/api/auth/verify-otp`| `{"phone_number": "+91...", "otp_code": "123456"}` | Validates OTP and returns JWT Bearer Token |
| `GET` | `/api/auth/me` | *Headers: Bearer <Token>* | Returns current authenticated user record |

#### 10.2 User Management Endpoints
| Method | Endpoint | Query / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/users/me` | *Headers: Bearer <Token>* | Retrieves user profile |
| `PUT` | `/api/users/me` | `{"name": "...", "about": "..."}` | Updates profile details |
| `GET` | `/api/users/search` | `?q=Rahul` | Searches users by name or phone |
| `GET` | `/api/users/{id}` | *Path Parameter: user_id* | Retrieves public profile of specific user |

#### 10.3 Contact Endpoints
| Method | Endpoint | Query / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/contacts` | *Headers: Bearer <Token>* | Lists all saved contacts with custom names |
| `POST` | `/api/contacts` | `{"contact_user_id": 102, "saved_name": "Rahul Bro"}` | Adds user to contacts directory |
| `DELETE`| `/api/contacts/{id}`| *Path Parameter: contact_id* | Removes user from contacts |

#### 10.4 Conversation & Message Endpoints
| Method | Endpoint | Query / Body | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/conversations` | *Headers: Bearer <Token>* | Lists user chats with last message & unread badge |
| `POST` | `/api/conversations` | `{"participant_id": 102}` | Creates or retrieves direct 1-on-1 chat |
| `GET` | `/api/conversations/{id}/messages` | `?limit=50&offset=0` | Paginated message history |
| `POST` | `/api/conversations/{id}/messages` | `{"content": "Hello"}` | Sends message via REST API fallback |
| `POST` | `/api/conversations/{id}/messages/read`| None | Marks conversation messages as read |
| `WS` | `/api/ws` | `?token=<JWT>` | Real-time bi-directional messaging socket |

---

### Chapter 11 — Testing and Verification

ChatConnect includes a full automated test suite verifying every component end-to-end:

#### 11.1 Test Suite Breakdown (`backend/tests/`)
1. **`test_health_check`**: Asserts system availability and configuration parameters.
2. **`test_auth_send_and_verify_otp`**: Validates rate-limiting, expiration, invalid OTP rejection, and successful JWT issuance.
3. **`test_profile_update_and_user_search`**: Confirms name updates and database user search indexing.
4. **`test_contact_management`**: Verifies phonebook contact creation and custom nickname binding.
5. **`test_conversations_and_messaging`**: Creates conversations, asserts message ordering, validates unread counts, and performs security tests confirming **HTTP 403 Forbidden** when an unauthorized user attempts to read another user's chat.
6. **`test_websocket.py`**: Connects via WebSocket, verifies real-time typing indicators, asserts message persistence, delivery status timestamps, and read receipts.

#### 11.2 Verification Results
All tests execute cleanly and report `100% OK`:
```
--- Running ChatConnect Test Suite ---
[PASS] test_health_check
[PASS] test_auth_send_and_verify_otp
[PASS] test_profile_update_and_user_search
[PASS] test_contact_management
[PASS] test_conversations_and_messaging
[PASS] test_realtime_websocket_flow
==========================================
ALL TESTS PASSED SUCCESSFULLY! (100% OK)
==========================================
```

---

### Chapter 12 — Deployment & Scaling Architecture

#### 12.1 Production Deployment Strategy
For cloud deployment (e.g. Render, Railway, AWS, DigitalOcean):
- **ASGI Process**: Run `uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4`
- **Database**: Managed PostgreSQL (15+) instance connected via `DATABASE_URL=postgresql+psycopg2://...`
- **Reverse Proxy**: NGINX / Cloudflare for SSL termination (`https://` and `wss://`).
- **Redis Cluster**: Enables multi-node WebSocket Pub/Sub broadcasting when scaling beyond a single server instance.

#### 12.2 Production Environment File Template (`.env`)
```ini
PROJECT_NAME=ChatConnect
ENVIRONMENT=production
DEBUG=False
SECRET_KEY=<32-byte-cryptographic-hex-secret>
DATABASE_URL=postgresql+psycopg2://user:password@db-host:5432/chatconnect
REDIS_URL=redis://redis-host:6379/0
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=AC...
TWILIO_AUTH_TOKEN=...
TWILIO_VERIFY_SERVICE_SID=VA...
FCM_SERVER_KEY=AAA...
```

---
*Report prepared for B.Tech Major Project Submission — ChatConnect Real-Time Messaging Platform.*
