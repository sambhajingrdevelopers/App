'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, unread: 0, read: 0 });
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  async function loadNotifications() {
    try {
      const [listResponse, summaryResponse] = await Promise.all([
        fetch('/api/notifications', { cache: 'no-store' }),
        fetch('/api/notification-summary', { cache: 'no-store' })
      ]);

      const listData = await listResponse.json();
      const summaryData = await summaryResponse.json();

      setNotifications(listData.notifications || []);
      setSummary(summaryData.summary || { total: 0, unread: 0, read: 0 });

      setSource(
        listData.source === 'backend' || summaryData.source === 'backend'
          ? 'backend'
          : 'fallback'
      );
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isRead: true } : item
      )
    );

    setSummary((prev: any) => ({
      ...prev,
      unread: Math.max((prev.unread || 0) - 1, 0),
      read: (prev.read || 0) + 1
    }));

    try {
      const response = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNotifications((prev) =>
          prev.map((item) =>
            item.id === id ? data.notification : item
          )
        );

        setSummary((prev: any) => ({
          ...prev,
          unread: data.unread || 0,
          read: Math.max((prev.total || 0) - (data.unread || 0), 0)
        }));
      }

      setMessage('Notification marked as read.');
    } catch {
      setMessage('Notification marked locally.');
    }
  }

  async function markAllRead() {
    setNotifications((prev) =>
      prev.map((item) => ({ ...item, isRead: true }))
    );

    setSummary((prev: any) => ({
      ...prev,
      unread: 0,
      read: prev.total || notifications.length
    }));

    try {
      const response = await fetch('/api/notifications/mark-all-read', {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setNotifications(data.notifications || []);
        setSummary((prev: any) => ({
          ...prev,
          unread: 0,
          read: prev.total || data.notifications?.length || 0
        }));
      }

      setMessage('All notifications marked as read.');
    } catch {
      setMessage('All notifications marked locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="notifications"
        title="Notifications"
        subtitle="Track follows, likes, comments, wallet and account updates."
      >
        <section className="notifHero">
          <div>
            <span>{source === 'backend' ? 'Live Backend Notifications' : 'Fallback Notifications Ready'}</span>
            <h2>Notification center</h2>
            <p>Manage all updates and unread alerts in one place.</p>
          </div>

          <div className="notifHeroActions">
            <button type="button" onClick={loadNotifications}>Refresh</button>
            <button type="button" onClick={markAllRead}>Mark All Read</button>
          </div>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="notifStats">
          <div>
            <b>{summary.total || notifications.length}</b>
            <span>Total</span>
          </div>
          <div>
            <b>{summary.unread || 0}</b>
            <span>Unread</span>
          </div>
          <div>
            <b>{summary.read || 0}</b>
            <span>Read</span>
          </div>
        </section>

        <section className="notifList">
          {notifications.map((item) => (
            <article className={`notifItem ${item.isRead ? 'read' : 'unread'}`} key={item.id}>
              <div className="notifIcon">
                {item.type === 'follow' ? '👤' : item.type === 'like' ? '♡' : item.type === 'comment' ? '💬' : item.type === 'wallet' ? '💰' : '🔔'}
              </div>

              <div>
                <b>{item.title}</b>
                <p>{item.message}</p>
                <span>{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}</span>
              </div>

              <div className="notifActions">
                {!item.isRead && (
                  <button type="button" onClick={() => markRead(item.id)}>
                    Mark Read
                  </button>
                )}

                {item.isRead && <em>Read</em>}
              </div>
            </article>
          ))}

          {!notifications.length && (
            <div className="adminEmpty">No notifications yet.</div>
          )}
        </section>
      </SocialAppShell>
    </AuthGuard>
  );
}
