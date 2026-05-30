export async function getSessionUser() {
  if (typeof window === 'undefined') {
    return {
      username: process.env.NEXT_PUBLIC_DEFAULT_USER || '@pradip',
      name: 'Pradip Kumar',
    }
  }

  const saved =
    window.localStorage.getItem('vibeloop_user') ||
    window.localStorage.getItem('username') ||
    window.localStorage.getItem('currentUser') ||
    process.env.NEXT_PUBLIC_DEFAULT_USER ||
    '@pradip'

  let username = String(saved || '@pradip').trim()

  try {
    const parsed = JSON.parse(username)
    username = parsed.username || parsed.user || parsed.handle || '@pradip'
  } catch {}

  if (!username.startsWith('@')) username = `@${username}`

  return {
    username,
    name: username.replace('@', '') || 'User',
  }
}
