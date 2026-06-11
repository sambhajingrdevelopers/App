'use client';

export default function AdminLogoutButton() {
  async function logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST'
      });
    } catch {
      // ignore
    }

    window.location.href = '/admin-login';
  }

  return (
    <button type="button" className="adminLogoutBtn" onClick={logout}>
      Logout
    </button>
  );
}
