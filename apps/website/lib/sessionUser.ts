export type SessionUser = {
  userId: string
  id: string
  username: string
  name: string
}

export async function getSessionUser(): Promise<SessionUser> {
  try {
    const response = await fetch('/api/auth/session', { cache: 'no-store' })
    const data = await response.json()
    const user = data.user || {}

    const username = user.username || '@you'
    const userId = user.userId || user.id || `USR-${String(username).replace('@', '').toUpperCase()}`
    const name = user.name || String(username).replace('@', '') || 'Creator'

    return {
      userId,
      id: userId,
      username,
      name
    }
  } catch {
    return {
      userId: 'USR-YOU',
      id: 'USR-YOU',
      username: '@you',
      name: 'Creator'
    }
  }
}
