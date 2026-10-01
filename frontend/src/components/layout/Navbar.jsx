import React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useWebSocket } from '../../hooks/useWebSocket';

export const Navbar = ({ title = 'ChatConnect', rightAction }) => {
  const { isConnected } = useWebSocket();

  return (
    <header className="app-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: '800', letterSpacing: '-0.3px' }}>{title}</h2>
        <div
          title={isConnected ? 'Connected' : 'Reconnecting...'}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isConnected ? 'var(--accent-green)' : '#eab308',
          }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {rightAction}
      </div>
    </header>
  );
};
