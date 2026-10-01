// ChatConnect Frontend Application Logic
const API_BASE = window.location.origin + "/api";
const WS_BASE = (window.location.protocol === "https:" ? "wss://" : "ws://") + window.location.host + "/api/ws";

// Application State
let token = localStorage.getItem("chatconnect_token");
let currentUser = null;
let activeConversation = null;
let conversations = [];
let contacts = [];
let socket = null;
let typingTimeout = null;
let partnerTypingTimeout = null;
let searchDebounce = null;
let pendingPhone = "";

// Web Audio API for message chime
function playChime() {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
    osc.frequency.exponentialRampToValueAtTime(880.0, audioCtx.currentTime + 0.1); // A5
    gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.25);
  } catch (e) {
    // Audio context not allowed before interaction
  }
}

// ----------------- AUTHENTICATION -----------------

function fillTestAccount(code, number) {
  document.getElementById("country-code").value = code;
  document.getElementById("phone-number").value = number;
}

async function handleSendOtp(event) {
  event.preventDefault();
  const countryCode = document.getElementById("country-code").value;
  const rawNumber = document.getElementById("phone-number").value.trim();
  pendingPhone = countryCode + rawNumber;

  const btn = document.getElementById("btn-send-otp");
  btn.disabled = true;
  btn.innerText = "Sending OTP...";

  try {
    const res = await fetch(`${API_BASE}/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone_number: pendingPhone }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to send OTP");

    // Move to Step 2: OTP
    document.getElementById("auth-phone-card").style.display = "none";
    document.getElementById("auth-otp-card").style.display = "block";
    document.getElementById("otp-subtitle").innerText = `Code sent to ${pendingPhone}`;

    if (data.dev_otp) {
      const banner = document.getElementById("dev-otp-banner");
      banner.style.display = "block";
      banner.innerText = `💡 Development Mode OTP: ${data.dev_otp}`;
      document.getElementById("otp-input").value = data.dev_otp;
    }
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "Send OTP Verification";
  }
}

function backToPhoneStep() {
  document.getElementById("auth-otp-card").style.display = "none";
  document.getElementById("auth-phone-card").style.display = "block";
}

async function handleVerifyOtp(event) {
  event.preventDefault();
  const otpCode = document.getElementById("otp-input").value.trim();
  const btn = document.getElementById("btn-verify-otp");
  btn.disabled = true;
  btn.innerText = "Verifying...";

  try {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone_number: pendingPhone,
        otp_code: otpCode,
      }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Verification failed");

    token = data.access_token;
    currentUser = data.user;
    localStorage.setItem("chatconnect_token", token);

    // If new user and name is not set, prompt profile setup
    if (data.is_new_user || !currentUser.name) {
      document.getElementById("auth-otp-card").style.display = "none";
      document.getElementById("auth-profile-card").style.display = "block";
    } else {
      enterApp();
    }
  } catch (err) {
    alert(err.message);
  } finally {
    btn.disabled = false;
    btn.innerText = "Verify & Continue";
  }
}

async function handleSaveProfile(event) {
  event.preventDefault();
  const name = document.getElementById("profile-name-input").value.trim();
  const about = document.getElementById("profile-about-input").value.trim();

  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, about }),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || "Failed to update profile");

    currentUser = data;
    enterApp();
  } catch (err) {
    alert(err.message);
  }
}

function handleLogout() {
  if (confirm("Are you sure you want to log out of ChatConnect?")) {
    localStorage.removeItem("chatconnect_token");
    token = null;
    currentUser = null;
    activeConversation = null;
    if (socket) socket.close();
    document.getElementById("auth-overlay").style.display = "flex";
    document.getElementById("auth-phone-card").style.display = "block";
    document.getElementById("auth-otp-card").style.display = "none";
    document.getElementById("auth-profile-card").style.display = "none";
  }
}

function enterApp() {
  document.getElementById("auth-overlay").style.display = "none";
  renderUserProfile();
  initWebSocket();
  loadConversations();
  loadContacts();
}

function renderUserProfile() {
  if (!currentUser) return;
  const initials = currentUser.name ? currentUser.name[0].toUpperCase() : "U";
  document.getElementById("my-avatar-initials").innerText = initials;
  document.getElementById("my-display-name").innerText = currentUser.name || "Set Name";
  document.getElementById("my-display-phone").innerText = currentUser.phone_number;
}

// ----------------- WEBSOCKET -----------------

function initWebSocket() {
  if (!token) return;
  if (socket) {
    try { socket.close(); } catch (e) {}
  }

  socket = new WebSocket(`${WS_BASE}?token=${encodeURIComponent(token)}`);

  socket.onopen = () => {
    console.log("WebSocket connected to ChatConnect");
    document.getElementById("my-status-dot").classList.add("online");
  };

  socket.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    } catch (e) {
      console.error("Failed to parse WS message", e);
    }
  };

  socket.onclose = () => {
    console.warn("WebSocket disconnected. Reconnecting in 3s...");
    document.getElementById("my-status-dot").classList.remove("online");
    setTimeout(() => {
      if (token) initWebSocket();
    }, 3000);
  };
}

function handleWebSocketMessage(data) {
  switch (data.type) {
    case "new_message":
      onIncomingMessage(data.message);
      break;

    case "message_sent":
      onMessageSentAck(data);
      break;

    case "typing":
      onTypingStatus(data);
      break;

    case "user_status":
      onUserStatusUpdate(data);
      break;

    case "messages_read":
      onMessagesRead(data);
      break;

    default:
      console.log("WS event:", data);
  }
}

function onIncomingMessage(msg) {
  playChime();

  // If message belongs to active chat, render immediately
  if (activeConversation && msg.conversation_id === activeConversation.id) {
    renderMessageBubble(msg, false);
    scrollToBottom();
    // Mark as read immediately
    markConversationAsRead(activeConversation.id);
  }

  // Refresh conversation list to update last message & unread badge
  loadConversations();
}

function onMessageSentAck(data) {
  const { temp_id, message } = data;
  const bubble = document.querySelector(`[data-temp-id="${temp_id}"]`);
  if (bubble) {
    bubble.removeAttribute("data-temp-id");
    bubble.setAttribute("data-msg-id", message.id);
    const tick = bubble.querySelector(".tick-icon");
    if (tick) {
      tick.className = `tick-icon ${message.delivered_at ? "delivered" : "sent"}`;
      tick.innerText = message.delivered_at ? "✓✓" : "✓";
    }
  }
  loadConversations();
}

function onTypingStatus(data) {
  if (activeConversation && data.conversation_id === activeConversation.id) {
    const typingBar = document.getElementById("typing-indicator-bar");
    const statusText = document.getElementById("active-chat-status");

    if (data.is_typing) {
      typingBar.style.display = "block";
      statusText.innerText = "typing...";
      statusText.className = "chat-header-status typing";

      clearTimeout(partnerTypingTimeout);
      partnerTypingTimeout = setTimeout(() => {
        typingBar.style.display = "none";
        statusText.innerText = "online";
        statusText.className = "chat-header-status online";
      }, 3000);
    } else {
      typingBar.style.display = "none";
      statusText.innerText = "online";
      statusText.className = "chat-header-status online";
    }
  }
}

function onUserStatusUpdate(data) {
  // If active chat participant status changed, update header
  if (activeConversation && activeConversation.other_user && activeConversation.other_user.id === data.user_id) {
    const dot = document.getElementById("active-chat-dot");
    const statusText = document.getElementById("active-chat-status");

    if (data.is_online) {
      dot.classList.add("online");
      statusText.innerText = "online";
      statusText.className = "chat-header-status online";
    } else {
      dot.classList.remove("online");
      statusText.innerText = formatLastSeen(data.last_seen);
      statusText.className = "chat-header-status";
    }
  }
  loadConversations();
}

function onMessagesRead(data) {
  if (activeConversation && data.conversation_id === activeConversation.id) {
    const bubbles = document.querySelectorAll(".message-bubble.outgoing");
    bubbles.forEach((b) => {
      const tick = b.querySelector(".tick-icon");
      if (tick) {
        tick.className = "tick-icon read";
        tick.innerText = "✓✓";
      }
    });
  }
}

// ----------------- CONVERSATIONS -----------------

async function loadConversations() {
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/conversations`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    conversations = await res.json();
    renderConversationsList();
  } catch (e) {
    console.error("Failed to load conversations", e);
  }
}

function renderConversationsList() {
  const container = document.getElementById("conversations-list");
  container.innerHTML = "";

  if (conversations.length === 0) {
    container.innerHTML = `
      <div style="padding: 32px 20px; text-align: center; color: var(--text-muted); font-size: 13.5px;">
        No active chats yet.<br>Click the 🔍 search button above to start a conversation!
      </div>
    `;
    return;
  }

  conversations.forEach((conv) => {
    const item = document.createElement("div");
    item.className = `chat-item ${activeConversation && activeConversation.id === conv.id ? "active" : ""}`;
    item.onclick = () => selectConversation(conv);

    const displayName = conv.saved_name || (conv.other_user ? conv.other_user.name : "Chat") || conv.other_user.phone_number;
    const initials = displayName ? displayName[0].toUpperCase() : "?";
    const isOnline = conv.other_user && conv.other_user.is_online;
    const lastSnippet = conv.last_message ? conv.last_message.content : "Tap to chat";
    const lastTime = conv.last_message ? formatMessageTime(conv.last_message.created_at) : "";

    item.innerHTML = `
      <div class="avatar">
        <span>${initials}</span>
        <div class="status-dot ${isOnline ? "online" : ""}"></div>
      </div>
      <div class="chat-item-content">
        <div class="chat-item-header">
          <div class="chat-item-name">${displayName}</div>
          <div class="chat-item-time">${lastTime}</div>
        </div>
        <div class="chat-item-preview-row">
          <div class="chat-item-snippet">${escapeHtml(lastSnippet)}</div>
          ${conv.unread_count > 0 ? `<div class="unread-badge">${conv.unread_count}</div>` : ""}
        </div>
      </div>
    `;
    container.appendChild(item);
  });
}

async function selectConversation(conv) {
  activeConversation = conv;
  renderConversationsList();

  // Show active view on mobile/desktop
  document.getElementById("chat-empty-state").style.display = "none";
  const activeView = document.getElementById("chat-active-state");
  activeView.style.display = "flex";
  document.getElementById("chat-window").classList.add("active");

  // Render header
  const displayName = conv.saved_name || (conv.other_user ? conv.other_user.name : "Chat") || conv.other_user.phone_number;
  document.getElementById("active-chat-name").innerText = displayName;
  document.getElementById("active-chat-initials").innerText = displayName[0].toUpperCase();

  const isOnline = conv.other_user && conv.other_user.is_online;
  const dot = document.getElementById("active-chat-dot");
  const statusText = document.getElementById("active-chat-status");

  if (isOnline) {
    dot.classList.add("online");
    statusText.innerText = "online";
    statusText.className = "chat-header-status online";
  } else {
    dot.classList.remove("online");
    statusText.innerText = formatLastSeen(conv.other_user ? conv.other_user.last_seen : null);
    statusText.className = "chat-header-status";
  }

  // Load messages
  loadMessages(conv.id);

  // Mark read
  markConversationAsRead(conv.id);
}

function closeChatOnMobile() {
  document.getElementById("chat-window").classList.remove("active");
}

async function loadMessages(conversationId) {
  const container = document.getElementById("messages-container");
  container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 20px;">Loading chat history...</div>`;

  try {
    const res = await fetch(`${API_BASE}/conversations/${conversationId}/messages?limit=100`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Could not load messages");
    const messages = await res.json();
    container.innerHTML = "";

    messages.forEach((msg) => {
      const isOutgoing = msg.sender_id === currentUser.id;
      renderMessageBubble(msg, isOutgoing);
    });

    scrollToBottom();
  } catch (e) {
    container.innerHTML = `<div style="text-align: center; color: var(--danger); padding: 20px;">Error loading messages</div>`;
  }
}

function renderMessageBubble(msg, isOutgoing) {
  const container = document.getElementById("messages-container");
  const bubble = document.createElement("div");
  bubble.className = `message-bubble ${isOutgoing ? "outgoing" : "incoming"}`;
  bubble.setAttribute("data-msg-id", msg.id);

  let tickHtml = "";
  if (isOutgoing) {
    if (msg.read_at) {
      tickHtml = `<span class="tick-icon read" title="Read">✓✓</span>`;
    } else if (msg.delivered_at) {
      tickHtml = `<span class="tick-icon delivered" title="Delivered">✓✓</span>`;
    } else {
      tickHtml = `<span class="tick-icon sent" title="Sent">✓</span>`;
    }
  }

  bubble.innerHTML = `
    <div>${escapeHtml(msg.content)}</div>
    <div class="message-meta">
      <span>${formatMessageTime(msg.created_at)}</span>
      ${tickHtml}
    </div>
  `;
  container.appendChild(bubble);
}

function handleSendMessage(event) {
  event.preventDefault();
  if (!activeConversation || !socket || socket.readyState !== WebSocket.OPEN) return;

  const input = document.getElementById("message-input");
  const content = input.value.trim();
  if (!content) return;

  const tempId = "temp-" + Date.now();
  input.value = "";

  // Render optimistic outgoing bubble
  const optimisticMsg = {
    id: tempId,
    content: content,
    created_at: new Date().toISOString(),
    delivered_at: null,
    read_at: null,
  };
  renderMessageBubble(optimisticMsg, true);
  const bubble = document.querySelector(`[data-msg-id="${tempId}"]`);
  if (bubble) bubble.setAttribute("data-temp-id", tempId);
  scrollToBottom();

  // Send via WebSocket
  socket.send(
    JSON.stringify({
      type: "send_message",
      conversation_id: activeConversation.id,
      content: content,
      temp_id: tempId,
    })
  );

  // Stop typing
  socket.send(
    JSON.stringify({
      type: "typing",
      conversation_id: activeConversation.id,
      is_typing: false,
    })
  );
}

function handleTypingKeypress() {
  if (!activeConversation || !socket || socket.readyState !== WebSocket.OPEN) return;

  socket.send(
    JSON.stringify({
      type: "typing",
      conversation_id: activeConversation.id,
      is_typing: true,
    })
  );

  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    if (socket && socket.readyState === WebSocket.OPEN && activeConversation) {
      socket.send(
        JSON.stringify({
          type: "typing",
          conversation_id: activeConversation.id,
          is_typing: false,
        })
      );
    }
  }, 2000);
}

async function markConversationAsRead(convId) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(
      JSON.stringify({
        type: "message_read",
        conversation_id: convId,
      })
    );
  }
}

// ----------------- CONTACTS & SEARCH -----------------

function switchTab(tabName) {
  ["chats", "contacts", "search"].forEach((t) => {
    document.getElementById(`tab-${t}`).classList.remove("active");
    document.getElementById(`pane-${t}`).style.display = "none";
  });
  document.getElementById(`tab-${tabName}`).classList.add("active");
  document.getElementById(`pane-${tabName}`).style.display = "block";

  if (tabName === "contacts") loadContacts();
  if (tabName === "search") document.getElementById("search-input").focus();
}

async function loadContacts() {
  if (!token) return;
  try {
    const res = await fetch(`${API_BASE}/contacts`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    contacts = await res.json();
    renderContactsList();
  } catch (e) {
    console.error("Failed to load contacts", e);
  }
}

function renderContactsList() {
  const container = document.getElementById("contacts-list");
  container.innerHTML = "";

  if (contacts.length === 0) {
    container.innerHTML = `
      <div style="padding: 30px; text-align: center; color: var(--text-muted); font-size: 13px;">
        No saved contacts.<br>Search users to add them!
      </div>
    `;
    return;
  }

  contacts.forEach((c) => {
    const item = document.createElement("div");
    item.className = "search-item";
    const initials = c.saved_name ? c.saved_name[0].toUpperCase() : "?";

    item.innerHTML = `
      <div class="search-user-info">
        <div class="avatar"><span>${initials}</span></div>
        <div>
          <div style="font-weight: 600; font-size: 14.5px;">${escapeHtml(c.saved_name)}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${c.contact_user ? c.contact_user.phone_number : ""}</div>
        </div>
      </div>
      <div class="search-actions">
        <button class="btn-primary" style="padding: 6px 14px; font-size: 12.5px;" onclick="startChatWithUser(${c.contact_user_id})">Message</button>
      </div>
    `;
    container.appendChild(item);
  });
}

function handleSearchInput(event) {
  const query = event.target.value.trim();
  switchTab("search");

  clearTimeout(searchDebounce);
  if (!query) {
    document.getElementById("search-results-list").innerHTML = `
      <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 13px;">
        Type a name or phone number above to discover users
      </div>
    `;
    return;
  }

  searchDebounce = setTimeout(async () => {
    try {
      const res = await fetch(`${API_BASE}/users/search?q=${encodeURIComponent(query)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const results = await res.json();
      renderSearchResults(results);
    } catch (e) {
      console.error("Search failed", e);
    }
  }, 300);
}

function renderSearchResults(results) {
  const container = document.getElementById("search-results-list");
  container.innerHTML = "";

  if (results.length === 0) {
    container.innerHTML = `
      <div style="padding: 28px; text-align: center; color: var(--text-muted); font-size: 13px;">
        No users found matching that search.
      </div>
    `;
    return;
  }

  results.forEach((u) => {
    const item = document.createElement("div");
    item.className = "search-item";
    const displayName = u.saved_name || u.name || u.phone_number;
    const initials = displayName ? displayName[0].toUpperCase() : "?";

    item.innerHTML = `
      <div class="search-user-info">
        <div class="avatar">
          <span>${initials}</span>
          <div class="status-dot ${u.is_online ? "online" : ""}"></div>
        </div>
        <div>
          <div style="font-weight: 600; font-size: 14.5px;">${escapeHtml(displayName)}</div>
          <div style="font-size: 12px; color: var(--text-muted);">${u.phone_number}</div>
        </div>
      </div>
      <div class="search-actions">
        ${!u.is_contact ? `<button class="btn-secondary" style="padding: 6px 12px; font-size: 12px;" onclick="addContactModal(${u.id}, '${escapeHtml(u.name || "")}')">+ Add</button>` : ""}
        <button class="btn-primary" style="padding: 6px 14px; font-size: 12.5px;" onclick="startChatWithUser(${u.id})">Message</button>
      </div>
    `;
    container.appendChild(item);
  });
}

async function startChatWithUser(targetUserId) {
  try {
    const res = await fetch(`${API_BASE}/conversations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ participant_id: targetUserId }),
    });

    if (!res.ok) throw new Error("Could not start conversation");
    const conv = await res.json();
    switchTab("chats");
    await loadConversations();
    selectConversation(conv);
  } catch (err) {
    alert(err.message);
  }
}

async function addContactModal(userId, initialName) {
  const savedName = prompt("Enter a nickname or name to save this contact:", initialName);
  if (!savedName) return;

  try {
    const res = await fetch(`${API_BASE}/contacts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        contact_user_id: userId,
        saved_name: savedName.trim(),
      }),
    });

    if (!res.ok) throw new Error("Failed to save contact");
    alert("Contact saved successfully!");
    loadContacts();
    loadConversations();
  } catch (e) {
    alert(e.message);
  }
}

function promptSaveContact() {
  if (!activeConversation || !activeConversation.other_user) return;
  addContactModal(activeConversation.other_user.id, activeConversation.other_user.name || "");
}

// ----------------- PROFILE MODAL -----------------

function openProfileModal() {
  if (!currentUser) return;
  document.getElementById("modal-phone").value = currentUser.phone_number;
  document.getElementById("modal-name").value = currentUser.name || "";
  document.getElementById("modal-about").value = currentUser.about || "";
  document.getElementById("profile-modal").style.display = "flex";
}

function closeProfileModal() {
  document.getElementById("profile-modal").style.display = "none";
}

async function handleUpdateProfileModal(event) {
  event.preventDefault();
  const name = document.getElementById("modal-name").value.trim();
  const about = document.getElementById("modal-about").value.trim();

  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, about }),
    });

    if (!res.ok) throw new Error("Failed to update profile");
    currentUser = await res.json();
    renderUserProfile();
    closeProfileModal();
    alert("Profile updated successfully!");
  } catch (e) {
    alert(e.message);
  }
}

// ----------------- HELPERS -----------------

function formatMessageTime(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
}

function formatLastSeen(isoString) {
  if (!isoString) return "offline";
  const d = new Date(isoString);
  const now = new Date();
  const diffMinutes = Math.floor((now - d) / (1000 * 60));

  if (diffMinutes < 1) return "last seen just now";
  if (diffMinutes < 60) return `last seen ${diffMinutes}m ago`;
  return `last seen today at ${formatMessageTime(isoString)}`;
}

function scrollToBottom() {
  const container = document.getElementById("messages-container");
  container.scrollTop = container.scrollHeight;
}

function escapeHtml(text) {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// ----------------- INITIALIZATION -----------------

async function init() {
  if (token) {
    try {
      const res = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        currentUser = await res.json();
        enterApp();
        return;
      }
    } catch (e) {
      console.warn("Session expired", e);
    }
  }

  // Not logged in -> show auth modal
  document.getElementById("auth-overlay").style.display = "flex";
  document.getElementById("auth-phone-card").style.display = "block";
}

window.addEventListener("DOMContentLoaded", init);
