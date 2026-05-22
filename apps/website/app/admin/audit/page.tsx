'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import AdminLogoutButton from '../../../components/AdminLogoutButton';
import SocialAppShell from '../../../components/SocialAppShell';

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [total, setTotal] = useState(0);
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  async function loadLogs(value = query) {
    setMessage('Loading audit logs...');

    try {
      const response = await fetch(
        `/api/admin/audit-logs?q=${encodeURIComponent(value)}&limit=150`,
        { cache: 'no-store' }
      );

      const data = await response.json();

      setLogs(data.logs || []);
      setTotal(data.total || 0);
      setSource(data.source || 'fallback');
      setMessage('');
    } catch {
      setSource('fallback');
      setMessage('Audit logs could not load.');
    }
  }

  useEffect(() => {
    loadLogs('');
  }, []);

  return (
    <AdminGuard>
      <SocialAppShell
        active="admin"
        title="Admin Audit Logs"
        subtitle="Track every role, verification, block and archive action."
      >
        <section className="auditHero">
          <div>
            <span>{source === 'backend' ? 'Live Backend Audit' : 'Fallback Audit Ready'}</span>
            <h2>Security audit log viewer</h2>
            <p>Review admin actions with old value, new value and exact timestamp.</p>
          </div>

          <div className="auditHeroActions">
            <button type="button" onClick={() => loadLogs()}>Refresh</button>
            <AdminLogoutButton />
          </div>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="auditStats">
          <div>
            <b>{total}</b>
            <span>Total audit logs</span>
          </div>
          <div>
            <b>{logs.length}</b>
            <span>Showing now</span>
          </div>
          <div>
            <b>{source === 'backend' ? 'Live' : 'Fallback'}</b>
            <span>Data source</span>
          </div>
        </section>

        <section className="auditSearch">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') loadLogs();
            }}
            placeholder="Search action, user, username, old/new value..."
          />

          <button type="button" onClick={() => loadLogs()}>Search</button>
        </section>

        <section className="auditList">
          {logs.map((log) => (
            <article className="auditCard" key={log.id}>
              <div className="auditIcon">🛡</div>

              <div className="auditMain">
                <div className="auditTitle">
                  <b>{log.action}</b>
                  <span>{log.userName || 'Unknown user'} {log.username ? `• ${log.username}` : ''}</span>
                </div>

                <div className="auditValues">
                  <p>
                    <strong>Old:</strong> {String(log.oldValue || '—')}
                  </p>
                  <p>
                    <strong>New:</strong> {String(log.newValue || '—')}
                  </p>
                </div>

                <small>{log.createdAt ? new Date(log.createdAt).toLocaleString() : 'No time'}</small>
              </div>
            </article>
          ))}

          {!logs.length && (
            <div className="adminEmpty">No audit logs found.</div>
          )}
        </section>
      </SocialAppShell>
    </AdminGuard>
  );
}
