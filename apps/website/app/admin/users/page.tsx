'use client';

import { useEffect, useState } from 'react';
import AdminGuard from '../../../components/AdminGuard';
import SocialAppShell from '../../../components/SocialAppShell';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({ total: 0, active: 0, blocked: 0, verified: 0, archived: 0 });
  const [query, setQuery] = useState('');
  const [includeArchived, setIncludeArchived] = useState(false);
  const [source, setSource] = useState('loading');
  const [message, setMessage] = useState('');

  const [newUser, setNewUser] = useState({
    name: '',
    username: '',
    email: '',
    role: 'creator'
  });

  async function loadUsers(value = query) {
    try {
      const response = await fetch(
        `/api/admin/users?q=${encodeURIComponent(value)}&includeArchived=${includeArchived}`,
        { cache: 'no-store' }
      );

      const data = await response.json();

      setUsers(data.users || []);
      setSummary(data.summary || {});
      setSource(data.source || 'fallback');
    } catch {
      setSource('fallback');
    }
  }

  useEffect(() => {
    loadUsers('');
  }, [includeArchived]);

  function patchUser(updated: any) {
    setUsers((prev) => prev.map((item) => item.id === updated.id ? updated : item));
  }

  async function createUser() {
    if (!newUser.name.trim() || !newUser.username.trim()) {
      setMessage('Name and username are required.');
      return;
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newUser)
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Create failed');
      }

      setUsers((prev) => [data.user, ...prev]);
      setNewUser({ name: '', username: '', email: '', role: 'creator' });
      setMessage('User created successfully.');
      loadUsers();
    } catch (error: any) {
      setMessage(error?.message || 'User create failed.');
    }
  }

  async function updateStatus(user: any, status: string) {
    patchUser({ ...user, status });

    try {
      const response = await fetch(`/api/admin/users/${user.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });

      const data = await response.json();

      if (response.ok && data.success) patchUser(data.user);
      setMessage(`User status updated to ${status}.`);
      loadUsers();
    } catch {
      setMessage('Status updated locally.');
    }
  }

  async function updateRole(user: any, role: string) {
    patchUser({ ...user, role });

    try {
      const response = await fetch(`/api/admin/users/${user.id}/role`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role })
      });

      const data = await response.json();

      if (response.ok && data.success) patchUser(data.user);
      setMessage(`Role updated to ${role}.`);
    } catch {
      setMessage('Role updated locally.');
    }
  }

  async function updateVerify(user: any) {
    const verified = !user.verified;
    patchUser({ ...user, verified });

    try {
      const response = await fetch(`/api/admin/users/${user.id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verified })
      });

      const data = await response.json();

      if (response.ok && data.success) patchUser(data.user);
      setMessage(verified ? 'User verified.' : 'Verification removed.');
      loadUsers();
    } catch {
      setMessage('Verification updated locally.');
    }
  }

  async function archiveUser(user: any) {
    patchUser({ ...user, status: 'Archived' });

    try {
      const response = await fetch(`/api/admin/users/${user.id}/archive`, {
        method: 'POST'
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setUsers((prev) => includeArchived ? prev.map((item) => item.id === user.id ? data.user : item) : prev.filter((item) => item.id !== user.id));
      }

      setMessage('User safely archived. No hard delete performed.');
      loadUsers();
    } catch {
      setMessage('User archived locally.');
    }
  }

  return (
    <AdminGuard>
      <SocialAppShell
        active="admin"
        title="Admin Users"
        subtitle="Manage users, roles, verification, blocking and soft archive."
      >
        <section className="adminUsersHero">
          <div>
            <span>{source === 'platform' ? 'Live Users' : 'Fallback Users Ready'}</span>
            <h2>User management control center</h2>
            <p>Control creators, brands, admins, verification and account safety.</p>
          </div>

          <button type="button" onClick={() => loadUsers()}>Refresh</button>
        </section>

        {message && <div className="vlSettingsMessage">{message}</div>}

        <section className="adminUsersStats">
          <div><b>{summary.total || 0}</b><span>Total</span></div>
          <div><b>{summary.active || 0}</b><span>Active</span></div>
          <div><b>{summary.blocked || 0}</b><span>Blocked</span></div>
          <div><b>{summary.verified || 0}</b><span>Verified</span></div>
          <div><b>{summary.archived || 0}</b><span>Archived</span></div>
        </section>

        <section className="adminUsersToolbar">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') loadUsers();
            }}
            placeholder="Search name, username, email, role..."
          />

          <button type="button" onClick={() => loadUsers()}>Search</button>

          <label>
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(event) => setIncludeArchived(event.target.checked)}
            />
            Show archived
          </label>
        </section>

        <section className="adminCreateUser">
          <h3>Create User</h3>

          <input
            value={newUser.name}
            onChange={(event) => setNewUser({ ...newUser, name: event.target.value })}
            placeholder="Name"
          />

          <input
            value={newUser.username}
            onChange={(event) => setNewUser({ ...newUser, username: event.target.value })}
            placeholder="@username"
          />

          <input
            value={newUser.email}
            onChange={(event) => setNewUser({ ...newUser, email: event.target.value })}
            placeholder="email@example.com"
          />

          <select
            value={newUser.role}
            onChange={(event) => setNewUser({ ...newUser, role: event.target.value })}
          >
            <option value="user">User</option>
            <option value="creator">Creator</option>
            <option value="brand">Brand</option>
            <option value="moderator">Moderator</option>
            <option value="admin">Admin</option>
          </select>

          <button type="button" onClick={createUser}>Create</button>
        </section>

        <section className="adminUsersList">
          {users.map((user) => (
            <article className={`adminUserCard ${user.status?.toLowerCase()}`} key={user.id}>
              <div className="adminUserAvatar">
                {user.name?.[0] || 'U'}
              </div>

              <div className="adminUserMain">
                <div className="adminUserName">
                  <b>{user.name}</b>
                  {user.verified && <span>✓ Verified</span>}
                </div>

                <p>{user.username} • {user.email || 'No email'}</p>

                <div className="adminUserBadges">
                  <em>{user.role}</em>
                  <em>{user.status}</em>
                  <em>{Number(user.followers || 0).toLocaleString()} followers</em>
                </div>
              </div>

              <div className="adminUserControls">
                <select value={user.role} onChange={(event) => updateRole(user, event.target.value)}>
                  <option value="user">User</option>
                  <option value="creator">Creator</option>
                  <option value="brand">Brand</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>

                <button type="button" onClick={() => updateVerify(user)}>
                  {user.verified ? 'Unverify' : 'Verify'}
                </button>

                {user.status !== 'Blocked' ? (
                  <button type="button" onClick={() => updateStatus(user, 'Blocked')}>Block</button>
                ) : (
                  <button type="button" onClick={() => updateStatus(user, 'Active')}>Unblock</button>
                )}

                <button type="button" onClick={() => archiveUser(user)}>Archive</button>
              </div>
            </article>
          ))}

          {!users.length && <div className="adminEmpty">No users found.</div>}
        </section>
      </SocialAppShell>
    </AdminGuard>
  );
}
