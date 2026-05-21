'use client';

import { useState } from 'react';

type AuthPanel3DProps = {
  initialMode?: 'login' | 'register';
};

export default function AuthPanel3D({ initialMode = 'login' }: AuthPanel3DProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);

  const isRegister = mode === 'register';

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

          <form className="authForm">
            {isRegister && (
              <label>
                Full Name
                <input type="text" placeholder="Enter your name" />
              </label>
            )}

            <label>
              Username or Email
              <input type="text" placeholder="creator@vibeloop.com" />
            </label>

            {isRegister && (
              <label>
                Username
                <input type="text" placeholder="@yourusername" />
              </label>
            )}

            <label>
              Password
              <input type="password" placeholder="••••••••" />
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

            <button className="authSubmit" type="button">
              {isRegister ? 'Create VibeLoop Account' : 'Login to VibeLoop'}
            </button>
          </form>

          <p className="authSwitch">
            {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              type="button"
              onClick={() => setMode(isRegister ? 'login' : 'register')}
            >
              {isRegister ? 'Login' : 'Register'}
            </button>
          </p>
        </div>
      </div>
    </section>
  );
}
