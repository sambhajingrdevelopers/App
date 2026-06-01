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
  if (typeof window === 'undefined') {
    const username = cleanUsername(process.env.NEXT_PUBLIC_DEFAULT_USER || '@pradip')

    return {
      id: username,
      userId: username,
      username,
      name: username.replace('@', '') || 'User',
      avatarUrl: '',
    }
  }

  const saved =
    window.localStorage.getItem('vibeloop_user') ||
    window.localStorage.getItem('sessionUser') ||
    window.localStorage.getItem('username') ||
    window.localStorage.getItem('currentUser') ||
    process.env.NEXT_PUBLIC_DEFAULT_USER ||
    '@pradip'

  let username = String(saved || '@pradip').trim()
  let name = ''
  let id = ''
  let userId = ''
  let avatarUrl = ''

  try {
    const parsed = JSON.parse(username)

    username = parsed.username || parsed.user || parsed.handle || parsed.name || '@pradip'
    name = parsed.name || parsed.displayName || ''
    id = parsed.id || parsed.userId || parsed.username || username
    userId = parsed.userId || parsed.id || parsed.username || username
    avatarUrl = parsed.avatarUrl || parsed.avatar_url || ''
  } catch {
    name = username.replace('@', '')
    id = username
    userId = username
  }

  username = cleanUsername(username)

  return {
    id: String(id || username),
    userId: String(userId || id || username),
    username,
    name: name || username.replace('@', '') || 'User',
    avatarUrl,
  }
}
