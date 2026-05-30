import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://43.205.145.63:8003"

function cleanUsername(value: any) {
  const text = String(value || "").trim()
  if (!text) return "@creator"
  return text.startsWith("@") ? text : `@${text}`
}

function normalizeUser(user: any) {
  const username = cleanUsername(user.username || user.user || user.handle || user.name)

  return {
    id: String(user.id || user.userId || username),
    name: user.name || username.replace("@", "") || "Creator",
    username,
    bio: user.bio || user.role || "Digital Creator",
    avatarUrl: user.avatarUrl || user.avatar_url || "",
    verified: user.verified !== false,
    followers: Number(user.followers || 0),
    lastMessage: user.lastMessage || "",
    lastAt: user.lastAt || "",
    unread: Number(user.unread || 0),
    pinned: Boolean(user.pinned),
    muted: Boolean(user.muted),
    typing: Boolean(user.typing),
    online: user.online !== false,
  }
}

function fallbackUsers(currentUser: string) {
  const base = [
    {
      id: "fallback-creator",
      name: "creator",
      username: "@creator",
      bio: "Online",
      lastMessage: "Hi",
      lastAt: new Date().toISOString(),
      unread: 1,
      verified: true,
      pinned: true,
      muted: false,
      typing: false,
      online: true,
    },
    {
      id: "fallback-sambhajingr",
      name: "Sambhajingr Developers",
      username: "@sambhajingrdevelopers",
      bio: "Digital Creator",
      lastMessage: "Project update received",
      lastAt: new Date(Date.now() - 1000 * 60 * 38).toISOString(),
      unread: 3,
      verified: true,
      pinned: false,
      muted: false,
      typing: false,
      online: true,
    },
    {
      id: "fallback-manoj",
      name: "Manoj",
      username: "@manoj",
      bio: "Creator account",
      lastMessage: "typing...",
      lastAt: new Date(Date.now() - 1000 * 60 * 78).toISOString(),
      unread: 2,
      verified: false,
      pinned: false,
      muted: false,
      typing: true,
      online: true,
    },
    {
      id: "fallback-pradip",
      name: "Pradip Kumar",
      username: "@pradip",
      bio: "Digital Creator",
      lastMessage: "Sure, I will send it.",
      lastAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
      unread: 0,
      verified: true,
      pinned: false,
      muted: true,
      typing: false,
      online: true,
    },
  ]

  return base.filter((user) => user.username.toLowerCase() !== currentUser.toLowerCase())
}

export async function GET(request: NextRequest) {
  const currentUser = cleanUsername(request.nextUrl.searchParams.get("user") || "@guest")

  try {
    const [usersResult, conversationsResult] = await Promise.allSettled([
      fetch(`${BACKEND_URL}/api/v1/users/list`, { cache: "no-store" }),
      fetch(`${BACKEND_URL}/api/v1/secure/messages/conversations?user=${encodeURIComponent(currentUser)}`, {
        cache: "no-store",
      }),
    ])

    let usersData: any = {}
    let conversationsData: any = {}

    if (usersResult.status === "fulfilled") {
      usersData = await usersResult.value.json().catch(() => ({}))
    }

    if (conversationsResult.status === "fulfilled") {
      conversationsData = await conversationsResult.value.json().catch(() => ({}))
    }

    const rawUsers = Array.isArray(usersData.users)
      ? usersData.users
      : Array.isArray(usersData)
        ? usersData
        : []

    const rawConversations = Array.isArray(conversationsData.conversations)
      ? conversationsData.conversations
      : []

    const map = new Map<string, any>()

    rawUsers.forEach((user: any) => {
      const item = normalizeUser(user)
      if (item.username.toLowerCase() !== currentUser.toLowerCase()) {
        map.set(item.username.toLowerCase(), item)
      }
    })

    rawConversations.forEach((chat: any) => {
      const username = cleanUsername(chat.username || chat.user || chat.withUser)
      if (username.toLowerCase() === currentUser.toLowerCase()) return

      const existing = map.get(username.toLowerCase()) || {}

      map.set(username.toLowerCase(), {
        ...existing,
        id: existing.id || chat.id || username,
        name: chat.name || existing.name || username.replace("@", "") || "Creator",
        username,
        bio: existing.bio || "Encrypted chat",
        avatarUrl: chat.avatarUrl || existing.avatarUrl || "",
        verified: chat.verified !== false,
        lastMessage: chat.lastMessage || existing.lastMessage || "Encrypted message",
        lastAt: chat.lastAt || existing.lastAt || "",
        unread: Number(chat.unread || existing.unread || 0),
        pinned: Boolean(existing.pinned),
        muted: Boolean(existing.muted),
        typing: Boolean(existing.typing),
        online: existing.online !== false,
      })
    })

    let users = Array.from(map.values()).sort((a, b) => {
      const pinnedDiff = Number(Boolean(b.pinned)) - Number(Boolean(a.pinned))
      if (pinnedDiff) return pinnedDiff
      return String(b.lastAt || "").localeCompare(String(a.lastAt || ""))
    })

    if (users.length === 0) {
      users = fallbackUsers(currentUser)
    }

    return NextResponse.json({
      success: true,
      currentUser,
      count: users.length,
      users,
      debug: {
        backend: BACKEND_URL,
        rawUsers: rawUsers.length,
        rawConversations: rawConversations.length,
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      success: true,
      currentUser,
      count: fallbackUsers(currentUser).length,
      users: fallbackUsers(currentUser),
      fallback: true,
      message: error?.message || "Fallback users loaded.",
    })
  }
}
