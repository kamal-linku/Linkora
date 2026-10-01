import React, { useState } from 'react';
import { userApi } from '../../services/userApi';
import { Avatar } from '../common/Avatar';
import { Loader } from '../common/Loader';

export const SearchUser = ({ onMessage, onAddContact }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    const clean = query.trim();
    if (!clean) return;

    setLoading(true);
    setSearched(true);
    try {
      const data = await userApi.searchUsers(clean);
      setResults(data);
    } catch (err) {
      console.error('Search failed:', err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <form
        onSubmit={handleSearch}
        style={{
          padding: '12px 16px',
          background: 'var(--surface-header)',
          borderBottom: '1px solid var(--border-light)',
          display: 'flex',
          gap: '8px',
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by phone or name..."
          className="input-control"
          style={{ padding: '10px 14px', fontSize: '14px', borderRadius: '20px' }}
        />
        <button
          type="submit"
          className="btn btn-primary"
          style={{ padding: '8px 16px', fontSize: '13px', borderRadius: '20px' }}
        >
          Search
        </button>
      </form>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loading && <Loader message="Searching users..." />}

        {!loading && searched && results.length === 0 && (
          <div
            style={{
              padding: '40px 20px',
              textAlign: 'center',
              color: 'var(--text-muted)',
              fontSize: '13.5px',
            }}
          >
            No users found matching "{query}"
          </div>
        )}

        {!loading &&
          results.map((u) => {
            const displayName = u.saved_name || u.name || u.phone_number;
            return (
              <div
                key={u.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '12px 16px',
                  borderBottom: '1px solid var(--border-light)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Avatar name={displayName} photo={u.profile_photo} isOnline={u.is_online} />
                  <div>
                    <div style={{ fontSize: '15px', fontWeight: '600' }}>{displayName}</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                      {u.phone_number}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  {!u.is_contact && onAddContact && (
                    <button
                      onClick={() => onAddContact(u.id, u.name)}
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '16px' }}
                    >
                      + Add
                    </button>
                  )}
                  <button
                    onClick={() => onMessage(u.id)}
                    className="btn btn-primary"
                    style={{ padding: '6px 14px', fontSize: '12px', borderRadius: '16px' }}
                  >
                    Message
                  </button>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
