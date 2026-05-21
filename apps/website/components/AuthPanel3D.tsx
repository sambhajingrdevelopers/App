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
        headers: { 'Content-Type': 'application/json' },
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
    <main className="zAuthScene">
      <div className="zAuthBgLine zLineOne" />
      <div className="zAuthBgLine zLineTwo" />
      <div className="zAuthOrb zOrbOne" />
      <div className="zAuthOrb zOrbTwo" />

      <section className={`zAuthShell ${isRegister ? 'zRegisterMode' : 'zLoginMode'}`}>
        <div className="zGlassSurface" />

        <div className="zWelcomeSide">
          <div className="zLogo3d">V</div>
          <h1>{isRegister ? 'WELCOME!' : 'WELCOME BACK!'}</h1>
          <p>
            {isRegister
              ? 'Create your VibeLoop account and start your creator journey.'
              : 'Login to continue your feed, reels, profile and creator tools.'}
          </p>

          <div className="zMiniStats">
            <div>
              <b>50K+</b>
              <span>Creators</span>
            </div>
            <div>
              <b>24/7</b>
              <span>Live</span>
            </div>
          </div>
        </div>

        <div className="zFormSide">
          <div className="zFormBox">
            <div className="zModeSwitch">
              <button
                type="button"
                className={!isRegister ? 'active' : ''}
                onClick={() => {
                  setMode('login');
                  setStatus('');
                }}
              >
                Login
              </button>

              <button
                type="button"
                className={isRegister ? 'active' : ''}
                onClick={() => {
                  setMode('register');
                  setStatus('');
                }}
              >
                Register
              </button>
            </div>

            <h2>{isRegister ? 'Register' : 'Login'}</h2>

            <form className="zForm" onSubmit={(event) => event.preventDefault()}>
              {isRegister && (
                <label>
                  <span>Full Name</span>
                  <div className="zInputWrap">
                    <input
                      type="text"
                      placeholder="Enter full name"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                    />
                    <i>👤</i>
                  </div>
                </label>
              )}

              <label>
                <span>Email</span>
                <div className="zInputWrap">
                  <input
                    type="email"
                    placeholder="creator@vibeloop.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                  <i>✉</i>
                </div>
              </label>

              {isRegister && (
                <label>
                  <span>Username</span>
                  <div className="zInputWrap">
                    <input
                      type="text"
                      placeholder="yourusername"
                      value={username}
                      onChange={(event) => setUsername(event.target.value)}
                    />
                    <i>@</i>
                  </div>
                </label>
              )}

              <label>
                <span>Password</span>
                <div className="zInputWrap">
                  <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <i>🔒</i>
                </div>
              </label>

              {!isRegister && (
                <div className="zForgotRow">
                  <span />
                  <a href="#">Forgot Password?</a>
                </div>
              )}

              <button
                type="button"
                className="zSubmit"
                onClick={handleAuth}
                disabled={loading}
              >
                {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
              </button>
            </form>

            {!!status && <div className="zStatus">{status}</div>}

            <p className="zSwitchText">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                type="button"
                onClick={() => {
                  setMode(isRegister ? 'login' : 'register');
                  setStatus('');
                }}
              >
                {isRegister ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
