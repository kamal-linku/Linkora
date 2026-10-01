// Base API client with JWT interception and error formatting
import { storage } from '../utils/storage';

export function getApiBase() {
  const custom = typeof window !== 'undefined' ? localStorage.getItem('chatconnect_server_url') : null;
  if (custom) {
    let clean = custom.trim().replace(/\/+$/, '');
    if (!clean.endsWith('/api')) clean += '/api';
    return clean;
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/+$/, '');
  }
  if (
    typeof window !== 'undefined' &&
    (window.location.protocol === 'capacitor:' || window.location.protocol === 'ionic:')
  ) {
    return 'http://10.0.2.2:8000/api';
  }
  return '/api';
}

export async function request(endpoint, options = {}) {
  const base = getApiBase();
  const url = `${base}${endpoint}`;
  const token = storage.getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data = null;
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    if (response.status === 401) {
      storage.clear();
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    const message = (data && data.detail) || response.statusText || 'Request failed';
    throw new Error(message);
  }

  return data;
}

export const api = {
  get: (endpoint, headers) => request(endpoint, { method: 'GET', headers }),
  post: (endpoint, body, headers) =>
    request(endpoint, { method: 'POST', body: JSON.stringify(body), headers }),
  put: (endpoint, body, headers) =>
    request(endpoint, { method: 'PUT', body: JSON.stringify(body), headers }),
  delete: (endpoint, headers) => request(endpoint, { method: 'DELETE', headers }),
};
