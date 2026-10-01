# ChatConnect — Mobile App Frontend

ChatConnect is a real-time mobile chat application built with **React 18**, **Vite**, and **WebSockets**, designed specifically in a **Mobile App Shell** format with carrier-grade phone authentication.

---

## 📱 Mobile App Architecture

The frontend is designed like a native mobile app (iOS / Android):
- **Native Status Bar**: Dynamic live time, signal status, battery indicator.
- **Bottom Tab Navigation Bar**: `Chats` (with live unread badge counters), `Contacts`, `Profile`, `Settings`.
- **Full Viewport on Mobile Devices**: Adapts 100% to screen height and width with smooth touch scrolling and responsive layouts.
- **Mobile Device Frame on Desktop**: On desktop monitors, centers the mobile application in a native app container.

---

## 📂 Folder Structure

```
frontend/
├── public/
│   ├── favicon.ico
│   └── logo.png
│
├── src/
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│   │
│   ├── components/
│   │   ├── common/
│   │   │   ├── Button.jsx          # Styled mobile button with primary/secondary variants
│   │   │   ├── Input.jsx           # Clean input control with floating labels and error state
│   │   │   ├── Avatar.jsx          # User initials/photo avatar with online status dot
│   │   │   ├── Loader.jsx          # Smooth animated spinner
│   │   │   ├── Modal.jsx           # Mobile popover modal
│   │   │   └── Toast.jsx           # Floating status toasts
│   │   │
│   │   ├── auth/
│   │   │   ├── PhoneInput.jsx      # Mobile number input with country code picker
│   │   │   └── OTPInput.jsx        # 6-box auto-advancing OTP digit boxes
│   │   │
│   │   ├── chat/
│   │   │   ├── ChatHeader.jsx      # Mobile chat header (back, avatar, name, online/typing)
│   │   │   ├── MessageList.jsx     # Scrollable message bubbles stream
│   │   │   ├── MessageBubble.jsx   # Sent/delivered/read status ticks
│   │   │   ├── MessageInput.jsx    # Typing emitter & send button
│   │   │   ├── TypingIndicator.jsx # Live wave animation ("Rahul is typing...")
│   │   │   └── ChatWindow.jsx      # Chat orchestrator component
│   │   │
│   │   ├── contacts/
│   │   │   ├── ContactItem.jsx     # Phonebook entry row
│   │   │   ├── ContactList.jsx     # Saved contacts list
│   │   │   └── SearchUser.jsx      # Real-time search across registered users
│   │   │
│   │   └── layout/
│   │       ├── Navbar.jsx          # Top mobile bar with connection status dot
│   │       ├── Sidebar.jsx         # Conversations list with unread counter badges
│   │       └── MainLayout.jsx      # Shell container with bottom tab navigation
│   │
│   ├── pages/
│   │   ├── Login.jsx               # Mobile number submission & SMS dispatch
│   │   ├── VerifyOTP.jsx           # 6-digit OTP verification with countdown timer
│   │   ├── CreateProfile.jsx       # First-time onboarding: display name & status
│   │   ├── Home.jsx                # Active chats list with floating action button
│   │   ├── Chat.jsx                # Active 1-on-1 real-time messaging screen
│   │   ├── Contacts.jsx            # Saved contacts and user discovery search
│   │   ├── Profile.jsx             # View/edit name, about, and verified phone number
│   │   └── Settings.jsx            # Carrier specs, audio notification details, and logout
│   │
│   ├── services/
│   │   ├── api.js                  # Base API client with JWT bearer interceptor
│   │   ├── authApi.js              # /auth/send-otp, /verify-otp, /me
│   │   ├── userApi.js              # /users/me, /search, /{id}
│   │   ├── contactApi.js           # /contacts (GET, POST, DELETE)
│   │   ├── conversationApi.js      # /conversations
│   │   └── messageApi.js           # /conversations/{id}/messages
│   │
│   ├── websocket/
│   │   ├── websocket.js            # Low-level persistent WebSocket with auto-reconnect
│   │   └── chatSocket.js           # Chat event dispatching (typing, sent, read)
│   │
│   ├── context/
│   │   ├── AuthContext.jsx         # Authentication, user profile, and JWT session state
│   │   └── ChatContext.jsx         # Real-time message streaming, presence, audio chimes
│   │
│   ├── hooks/
│   │   ├── useAuth.js              # Hook for authentication state
│   │   ├── useChat.js              # Hook for active chat & conversations
│   │   └── useWebSocket.js         # Hook for socket connection health
│   │
│   ├── routes/
│   │   └── AppRoutes.jsx           # Public & protected mobile app routes
│   │
│   ├── utils/
│   │   ├── formatTime.js           # ISO timestamp formatting ("7:10 PM", "Yesterday")
│   │   ├── validators.js           # Phone number and OTP validators
│   │   └── storage.js              # LocalStorage helper for token and user profile
│   │
│   ├── App.jsx                     # Root application with context providers
│   ├── main.jsx                    # Application entry point
│   └── index.css                   # Mobile app CSS styling and theme
│
├── .env                            # Local frontend environment config
├── .env.example
├── .gitignore
├── index.html
├── package.json
└── vite.config.js
```

---

## 🚀 Running the Frontend

### Method 1: Development Server (with Hot Reloading)
```bash
cd D:\MyProjects\MobileChat\frontend
npm run dev
```
Open **[http://localhost:3000](http://localhost:3000)** in your browser or mobile phone browser.

### Method 2: Unified Production Run via FastAPI
The production build is already pre-compiled into `frontend/dist/`.
Simply start the backend server:
```bash
python -m uvicorn backend.app.main:app --port 8000 --reload
```
And open **[http://127.0.0.1:8000](http://127.0.0.1:8000)**! FastAPI automatically serves the React mobile app shell.
