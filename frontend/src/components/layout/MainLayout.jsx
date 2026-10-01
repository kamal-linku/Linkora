import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useChat } from '../../hooks/useChat';

export const MainLayout = () => {
  const { conversations } = useChat();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState('');

  // Mobile status bar clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, '0');
      const mins = now.getMinutes().toString().padStart(2, '0');
      setCurrentTime(`${hours}:${mins}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  const totalUnread = conversations.reduce((acc, c) => acc + (c.unread_count || 0), 0);

  // Hide bottom tab bar if currently inside a specific active chat screen on mobile
  const isInsideChat = location.pathname.startsWith('/chat/');

  return (
    <div className="app-viewport">
      {/* Mobile Top Status Bar */}
      <div className="mobile-status-bar">
        <span>{currentTime}</span>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <span>5G</span>
          <span>📶</span>
          <span>🔋 100%</span>
        </div>
      </div>

      {/* Screen Content Container */}
      <div className="app-screen-content">
        <Outlet />
      </div>

      {/* Mobile Bottom Tab Bar */}
      {!isInsideChat && (
        <nav className="mobile-tab-bar">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
          >
            <span className="tab-icon">💬</span>
            <span>Chats</span>
            {totalUnread > 0 && <span className="badge-count">{totalUnread}</span>}
          </NavLink>

          <NavLink
            to="/contacts"
            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
          >
            <span className="tab-icon">👥</span>
            <span>Contacts</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
          >
            <span className="tab-icon">👤</span>
            <span>Profile</span>
          </NavLink>

          <NavLink
            to="/settings"
            className={({ isActive }) => `tab-item ${isActive ? 'active' : ''}`}
          >
            <span className="tab-icon">⚙️</span>
            <span>Settings</span>
          </NavLink>
        </nav>
      )}
    </div>
  );
};
