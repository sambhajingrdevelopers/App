export type SessionUser = {
  userId: string
  id: string
  username: string
  name: string
}

function normalizeUsername(value: any) {
  const clean = String(value || "").trim()
  if (!clean) return "@you"
  return clean.startsWith("@") ? clean : `@${clean}`
}

export async function getSessionUser(): Promise<SessionUser> {
  try {
    const response = await fetch("/api/auth/session", { cache: "no-store" })
    const data = await response.json()
    const user = data.user || data.session?.user || {}

    const username = normalizeUsername(user.username || user.user || user.email || "@you")
    const userId = user.userId || user.id || `USR-${username.replace("@", "").toUpperCase()}`
    const name = user.name || username.replace("@", "") || "Creator"

    return {
      userId,
      id: userId,
      username,
      name
    }
  } catch {
    return {
      userId: "USR-YOU",
      id: "USR-YOU",
      username: "@you",
      name: "Creator"
    }
  }
}
