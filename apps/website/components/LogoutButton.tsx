'use client';

export default function LogoutButton() {
  function logout() {
    localStorage.removeItem('vibeloop_user');
        fetch('/api/auth/session', { method: 'DELETE' }).catch(() => {});
    window.location.href = '/login';
  }

  return (
    <button className="logoutButton" onClick={logout} type="button">
      Logout
    </button>
  );
}
