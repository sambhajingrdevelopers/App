'use client';

import { useState } from 'react';

type AuthPanel3DProps = {
  initialMode?: 'login' | 'register';
};

export default function AuthPanel3D({ initialMode = 'login' }: AuthPanel3DProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const isRegister = mode === 'register';

  async function handleAuth() {
    setStatus('');
    setLoading(true);

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName,
          email,
          username,
          password
        })
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result?.message || 'Request failed');
      }

      if (isRegister) {
        setStatus('Account created successfully. Now login.');
        setMode('login');
        setPassword('');
      } else {
        localStorage.setItem('vibeloop_user', JSON.stringify(result.data || {}));
        setStatus('Login successful. Opening platform...');
        setTimeout(() => {
          window.location.href = '/home';
        }, 900);
      }
    } catch (error: any) {
      setStatus(error?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="authScene">
      <div className="authGlow authGlowOne" />
      <div className="authGlow authGlowTwo" />

      <div className={`authCard3d ${isRegister ? 'registerMode' : 'loginMode'}`}>
        <div className="authWelcomePanel">
          <div className="authBrandMark">V</div>

          <h1>{isRegister ? 'Join VibeLoop' : 'Welcome Back'}</h1>

          <p>
            {isRegister
              ? 'Create your profile, share moments, post reels and grow your creator identity.'
              : 'Login to continue your creator journey, feed, reels, chats and profile.'}
          </p>

          <div className="authStats">
            <div>
              <b>50K+</b>
              <span>Creators</span>
            </div>
            <div>
              <b>24/7</b>
              <span>Live platform</span>
            </div>
          </div>
        </div>

        <div className="authFormPanel">
          <div className="authTabs">
            <button
              className={!isRegister ? 'active' : ''}
              onClick={() => setMode('login')}
              type="button"
            >
              Login
            </button>

            <button
              className={isRegister ? 'active' : ''}
              onClick={() => setMode('register')}
              type="button"
            >
              Register
            </button>
          </div>

          <h2>{isRegister ? 'Create Account' : 'Secure Login'}</h2>

          <form className="authForm" onSubmit={(event) => event.preventDefault()}>
            {isRegister && (
              <label>
                Full Name
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={fullName}
                  onChange={(event) => setFullName(event.target.value)}
                />
              </label>
            )}

            <label>
              Email
              <input
                type="email"
                placeholder="creator@vibeloop.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </label>

            {isRegister && (
              <label>
                Username
                <input
                  type="text"
                  placeholder="yourusername"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </label>
            )}

            <label>
              Password
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </label>

            {!isRegister && (
              <div className="authMiniRow">
                <label className="rememberRow">
                  <input type="checkbox" />
                  Remember me
                </label>
                <a href="#">Forgot password?</a>
              </div>
            )}

            <button
              className="authSubmit"
              type="button"
              onClick={handleAuth}
              disabled={loading}
            >
              {loading
                ? 'Please wait...'
                : isRegister
                  ? 'Create VibeLoop Account'
                  : 'Login to VibeLoop'}
            </button>
          </form>

          {!!status && <p className="authStatus">{status}</p>}

          <p className="authSwitch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => {
                setStatus('');
                setMode(isRegister ? 'login' : 'register');
              }}
            >
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
