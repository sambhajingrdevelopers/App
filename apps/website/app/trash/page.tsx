'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

type TrashItem = {
  type: 'post' | 'reel' | 'story';
  id: string;
  title: string;
  caption: string;
  user: string;
  name: string;
  mediaUrl: string;
  mediaType: string;
  archivedAt: string;
};

export default function TrashPage() {
  const [items, setItems] = useState<TrashItem[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [restoringId, setRestoringId] = useState('');

  async function loadTrash() {
    setLoading(true);

    try {
      const response = await fetch('/api/trash', { cache: 'no-store' });
      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Trash load failed.');
      }

      setItems(data.items || []);
    } catch (error: any) {
      setMessage(error?.message || 'Trash load failed.');
    } finally {
      setLoading(false);
    }
  }

  async function restoreItem(item: TrashItem) {
    setRestoringId(item.id);
    setMessage('Restoring item...');

    try {
      const response = await fetch('/api/trash', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: item.type, id: item.id })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Restore failed.');
      }

      setItems((current) => current.filter((entry) => entry.id !== item.id));
      setMessage('Item restored successfully.');
    } catch (error: any) {
      setMessage(error?.message || 'Restore failed.');
    } finally {
      setRestoringId('');
    }
  }

  useEffect(() => {
    loadTrash();
  }, []);

  return (
    <AuthGuard>
      <SocialAppShell
        active="profile"
        title="Trash"
        subtitle="Archived content is safely stored here and can be restored."
      >
        <section className="createHero">
          <div>
            <span>Soft Delete Vault</span>
            <h2>Trash & Restore</h2>
            <p>Deleted posts, reels and stories are archived here instead of being permanently removed.</p>
          </div>

          <button type="button" onClick={loadTrash} disabled={loading}>
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="dpGrid">
          {loading && (
            <div className="createPanel">
              <h3>Loading trash...</h3>
              <p>Please wait while archived items are loaded.</p>
            </div>
          )}

          {!loading && items.length === 0 && (
            <div className="createPanel">
              <h3>Trash is empty</h3>
              <p>No archived content found.</p>
            </div>
          )}

          {!loading && items.map((item) => (
            <article className="dpPost" key={`${item.type}-${item.id}`}>
              <div className="dpMedia">
                {item.mediaUrl ? (
                  item.mediaType === 'video' ? (
                    <video src={item.mediaUrl} controls />
                  ) : (
                    <img src={item.mediaUrl} alt={item.title} />
                  )
                ) : (
                  <div>
                    <b>{item.type.toUpperCase()}</b>
                    <span>{item.id}</span>
                  </div>
                )}
              </div>

              <div className="dpPostBody">
                <span>{item.type.toUpperCase()} • {item.user}</span>
                <h3>{item.title}</h3>
                <p>{item.caption || 'No caption available.'}</p>
                <small>Archived: {item.archivedAt || 'Unknown time'}</small>

                <button
                  type="button"
                  onClick={() => restoreItem(item)}
                  disabled={restoringId === item.id}
                >
                  {restoringId === item.id ? 'Restoring...' : 'Restore'}
                </button>
              </div>
            </article>
          ))}
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
