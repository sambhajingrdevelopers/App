'use client'

import { FormEvent, useState } from 'react'

type AuthMode = 'login' | 'register'

type Props = {
  initialMode?: AuthMode
}

function normalizeUsername(value: string) {
  const clean = String(value || '').trim()

  if (!clean) return ''

  if (clean.includes('@') && !clean.startsWith('@')) {
    return `@${clean.split('@')[0].replace(/[^a-zA-Z0-9_.-]/g, '')}`
  }

  return clean.startsWith('@') ? clean : `@${clean}`
}

export default function AuthPanel3D({ initialMode = 'login' }: Props) {
  const [mode, setMode] = useState<AuthMode>(initialMode)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)

  const isRegister = mode === 'register'

  async function submitAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const cleanName = fullName.trim()
    const cleanEmail = email.trim()
    const cleanUsername = normalizeUsername(username || email)
    const cleanPassword = password.trim()

    if (isRegister && !cleanName) {
      setMessage('Name is required.')
      return
    }

    if (!cleanUsername && !cleanEmail) {
      setMessage('Username or email is required.')
      return
    }

    if (!cleanPassword) {
      setMessage('Password is required.')
      return
    }

    if (cleanPassword.length < 6) {
      setMessage('Password must be at least 6 characters.')
      return
    }

    setLoading(true)
    setMessage(isRegister ? 'Creating account...' : 'Logging in...')

    try {
      const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login'

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: cleanName,
          name: cleanName,
          email: cleanEmail,
          username: cleanUsername,
          identifier: cleanUsername || cleanEmail,
          password: cleanPassword
        })
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.message || 'Authentication failed.')
      }

      const realUser = result.user || result.data?.user || result.data || {}
      const finalUsername = normalizeUsername(realUser.username || cleanUsername || cleanEmail)
      const finalName = realUser.name || cleanName || finalUsername || 'Creator'
      const finalUserId =
        realUser.userId ||
        realUser.id ||
        `USR-${finalUsername.replace('@', '').toUpperCase()}`

      const savedUser = {
        ...realUser,
        id: finalUserId,
        userId: finalUserId,
        username: finalUsername,
        name: finalName
      }

      localStorage.setItem('vibeloop_user', JSON.stringify(savedUser))

      await fetch('/api/auth/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(savedUser)
      }).catch(() => {})

      setMessage('Success. Opening app...')
      window.location.href = '/home'
    } catch (error: any) {
      setMessage(error?.message || 'Authentication failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="authPage">
      <section className="authPanel3d">
        <div className="authHero">
          <span>VibeLoop</span>
          <h1>{isRegister ? 'Create account' : 'Login'}</h1>
          <p>
            {isRegister
              ? 'Create your real creator account with password.'
              : 'Login with your username/email and password.'}
          </p>
        </div>

        <form className="authForm3d" onSubmit={submitAuth}>
          {isRegister && (
            <label>
              Full Name
              <input
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your name"
                autoComplete="name"
              />
            </label>
          )}

          <label>
            Email
            <input
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
            />
          </label>

          <label>
            Username
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              placeholder="@username"
              autoComplete="username"
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
              type="password"
              autoComplete={isRegister ? 'new-password' : 'current-password'}
            />
          </label>

          {message && <p className="authMessage">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : isRegister ? 'Register' : 'Login'}
          </button>

          <button
            type="button"
            className="authSwitchBtn"
            onClick={() => {
              setMode(isRegister ? 'login' : 'register')
              setMessage('')
            }}
          >
            {isRegister ? 'Already have account? Login' : 'New user? Register'}
          </button>
        </form>
      </section>
    </main>
  )
}
