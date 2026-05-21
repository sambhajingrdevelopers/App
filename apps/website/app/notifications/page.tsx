'use client';

import { useEffect, useMemo, useState } from 'react';
import AuthGuard from '../../components/AuthGuard';
import SocialAppShell from '../../components/SocialAppShell';

type NotificationItem = {
  id: string;
  type: string;
  icon: string;
  title: string;
  desc: string;
  isRead: boolean;
  createdAt?: string;
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  const unreadCount = useMemo(() => {
    return notifications.filter((item) => !item.isRead).length;
  }, [notifications]);

  async function loadNotifications() {
    try {
      const response = await fetch('/api/notifications', { cache: 'no-store' });
      const data = await response.json();

      setNotifications(data.notifications || []);
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadNotifications();
  }, []);

  async function markRead(id: string) {
    setNotifications((prev) =>
      prev.map((item) => item.id === id ? { ...item, isRead: true } : item)
    );

    try {
      const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Update failed');
      }

      setMessage('Notification marked as read.');
    } catch {
      setMessage('Backend update failed. UI updated locally.');
    }
  }

  async function markAllRead() {
    setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));

    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data?.message || 'Update failed');
      }

      setMessage('All notifications marked as read.');
    } catch {
      setMessage('Backend update failed. UI updated locally.');
    }
  }

  return (
    <AuthGuard>
      <SocialAppShell
        active="notifications"
        title="Notifications"
        subtitle="Track likes, comments, follows, saves and creator growth alerts."
      >
        <div className="vlNotificationTopActions">
          <span>{source === 'backend' ? 'Live Backend Notifications' : 'Fallback Notifications Ready'}</span>
          <button type="button" onClick={loadNotifications}>Refresh</button>
          <button type="button" onClick={markAllRead}>Mark All Read</button>
        </div>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <div className="vlNotificationStats">
          <div>
            <b>{notifications.length}</b>
            <span>Total</span>
          </div>
          <div>
            <b>{unreadCount}</b>
            <span>Unread</span>
          </div>
          <div>
            <b>{source === 'backend' ? 'Live' : 'Fallback'}</b>
            <span>Source</span>
          </div>
        </div>

        <div className="vlNotificationList">
          {notifications.map((item) => (
            <article
              className={`vlNotificationCard ${item.type} ${item.isRead ? 'read' : 'unread'}`}
              key={item.id}
            >
              <div className="vlNotificationIcon">{item.icon}</div>

              <div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <span>{item.isRead ? 'Read' : 'Unread'}</span>
              </div>

              <button
                type="button"
                onClick={() => markRead(item.id)}
                disabled={item.isRead}
              >
                {item.isRead ? 'Done' : 'Mark Read'}
              </button>
            </article>
          ))}

          {!notifications.length && (
            <div className="adminEmpty">No notifications found.</div>
          )}
        </div>
      </SocialAppShell>
    </AuthGuard>
  );
}
