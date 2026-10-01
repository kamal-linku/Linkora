// Low-level persistent WebSocket client with automatic reconnection
import { storage } from '../utils/storage';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.listeners = new Map();
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 10000;
    this.reconnectTimer = null;
    this.isManualClose = false;
  }

  connect() {
    const token = storage.getToken();
    if (!token) return;

    this.isManualClose = false;
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const custom = typeof window !== 'undefined' ? localStorage.getItem('chatconnect_server_url') : null;
    const configuredWsUrl = import.meta.env.VITE_WS_URL;
    let wsUrl;
    if (custom) {
      const clean = custom.trim().replace(/\/+$/, '').replace(/^http/, 'ws');
      wsUrl = `${clean}/api/ws?token=${encodeURIComponent(token)}`;
    } else if (configuredWsUrl) {
      wsUrl = `${configuredWsUrl}?token=${encodeURIComponent(token)}`;
    } else if (
      typeof window !== 'undefined' &&
      (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:')
    ) {
      wsUrl = `ws://10.0.2.2:8000/api/ws?token=${encodeURIComponent(token)}`;
    } else {
      const host = window.location.host;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      wsUrl = `${protocol}//${host}/api/ws?token=${encodeURIComponent(token)}`;
    }

    try {
      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
        this.emit('connection_status', { isConnected: true });
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data && data.type) {
            this.emit(data.type, data);
            this.emit('*', data);
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e);
        }
      };

      this.ws.onclose = () => {
        this.emit('connection_status', { isConnected: false });
        if (!this.isManualClose) {
          this.scheduleReconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.warn('WebSocket error observed', err);
      };
    } catch (err) {
      console.error('WebSocket connection initialization error', err);
      this.scheduleReconnect();
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    const delay = Math.min(1000 * Math.pow(1.5, this.reconnectAttempts), this.maxReconnectDelay);
    this.reconnectAttempts++;
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  send(payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(payload));
      return true;
    }
    return false;
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event).add(callback);
    return () => this.off(event, callback);
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(callback);
    }
  }

  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach((cb) => {
        try {
          cb(data);
        } catch (e) {
          console.error(`Error in WebSocket listener for ${event}:`, e);
        }
      });
    }
  }

  disconnect() {
    this.isManualClose = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }
}

export const wsService = new WebSocketService();
