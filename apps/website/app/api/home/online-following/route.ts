import { NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://43.205.145.63:8003"

function normalizeUsername(value: any) {
  const clean = String(value || "").trim()
  if (!clean) return ""
  return clean.startsWith("@") ? clean : `@${clean}`
}

function userFromContent(item: any) {
  const username = normalizeUsername(item?.username || item?.user || item?.name)
  if (!username) return null

  return {
    id: username,
    username,
    name: item?.name || username.replace("@", "") || "Creator",
    avatarUrl: item?.avatarUrl || item?.avatar_url || "",
    verified: item?.verified !== false
  }
}

export async function GET() {
  try {
    const [usersRes, feedRes] = await Promise.allSettled([
      fetch(`${BACKEND_URL}/api/v1/public/users/search?q=%40`, { cache: "no-store" }),
      fetch(`${BACKEND_URL}/api/v1/content/home-live`, { cache: "no-store" })
    ])

    let users: any[] = []

    if (usersRes.status === "fulfilled") {
      const data = await usersRes.value.json().catch(() => ({}))
      users = Array.isArray(data.users)
        ? data.users
        : Array.isArray(data.results)
          ? data.results
          : Array.isArray(data.items)
            ? data.items
            : []
    }

    if (feedRes.status === "fulfilled") {
      const feed = await feedRes.value.json().catch(() => ({}))
      const contentUsers = [
        ...(Array.isArray(feed.posts) ? feed.posts : []),
        ...(Array.isArray(feed.reels) ? feed.reels : []),
        ...(Array.isArray(feed.stories) ? feed.stories : [])
      ]
        .map(userFromContent)
        .filter(Boolean)

      users = [...users, ...contentUsers]
    }

    const map = new Map<string, any>()

    users.forEach((user) => {
      const username = normalizeUsername(user.username || user.user || user.name)
      if (!username) return

      map.set(username.toLowerCase(), {
        id: user.id || user.userId || username,
        username,
        name: user.name || username.replace("@", "") || "Creator",
        avatarUrl: user.avatarUrl || user.avatar_url || "",
        verified: user.verified !== false
      })
    })

    return NextResponse.json({
      success: true,
      users: Array.from(map.values())
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Users load failed",
      users: []
    })
  }
}
