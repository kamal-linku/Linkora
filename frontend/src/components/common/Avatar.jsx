import React from 'react';

export const Avatar = ({ name, photo, isOnline, size = 44 }) => {
  const initial = name ? name.trim()[0].toUpperCase() : '?';

  return (
    <div
      className="avatar-container"
      style={{ width: `${size}px`, height: `${size}px`, fontSize: `${Math.round(size * 0.4)}px` }}
    >
      {photo ? (
        <img
          src={photo}
          alt={name || 'Avatar'}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <span>{initial}</span>
      )}
      {typeof isOnline === 'boolean' && (
        <div className={`avatar-online-dot ${isOnline ? 'active' : ''}`} />
      )}
    </div>
  );
};
