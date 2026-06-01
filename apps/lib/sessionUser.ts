export type SessionUser = {
  id: string
  userId: string
  username: string
  name: string
  avatarUrl?: string
}

function cleanUsername(value: string) {
  const text = String(value || '@pradip').trim()
  return text.startsWith('@') ? text : `@${text}`
}

export async function getSessionUser(): Promise<SessionUser> {
  const fallback = cleanUsername(process.env.NEXT_PUBLIC_DEFAULT_USER || '@pradip')

  if (typeof window === 'undefined') {
    return {
      id: fallback,
      userId: fallback,
      username: fallback,
      name: fallback.replace('@', '') || 'User',
      avatarUrl: '',
    }
  }

  const saved =
    window.localStorage.getItem('vibeloop_user') ||
    window.localStorage.getItem('sessionUser') ||
    window.localStorage.getItem('username') ||
    window.localStorage.getItem('currentUser') ||
    fallback

  let username = String(saved || fallback).trim()
  let name = ''
  let avatarUrl = ''

  try {
    const parsed = JSON.parse(username)
    username = parsed.username || parsed.user || parsed.handle || parsed.name || fallback
    name = parsed.name || parsed.displayName || ''
    avatarUrl = parsed.avatarUrl || parsed.avatar_url || ''
  } catch {
    name = username.replace('@', '')
  }

  username = cleanUsername(username)

  return {
    id: username,
    userId: username,
    username,
    name: name || username.replace('@', '') || 'User',
    avatarUrl,
  }
}
