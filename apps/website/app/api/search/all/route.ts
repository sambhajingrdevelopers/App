import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://43.205.145.63:8003"

function cleanUsername(value: any) {
  const clean = String(value || "").trim()
  if (!clean) return ""
  return clean.startsWith("@") ? clean : `@${clean}`
}

function contentUser(item: any) {
  const username = cleanUsername(item?.username || item?.user || item?.name)
  if (!username) return null

  return {
    id: username,
    username,
    name: item?.name || username.replace("@", "") || "Creator",
    avatarUrl: item?.avatarUrl || item?.avatar_url || "",
    bio: item?.bio || "Creator",
    verified: item?.verified !== false
  }
}

function matchQuery(item: any, q: string) {
  if (!q) return true

  const text = [
    item?.name,
    item?.username,
    item?.user,
    item?.title,
    item?.caption,
    item?.bio
  ]
    .join(" ")
    .toLowerCase()

  return text.includes(q.toLowerCase())
}

export async function GET(request: NextRequest) {
  const q = String(request.nextUrl.searchParams.get("q") || "").trim()

  try {
    const [usersRes, feedRes] = await Promise.allSettled([
      fetch(`${BACKEND_URL}/api/v1/public/users/search?q=${encodeURIComponent(q || "@")}`, {
        cache: "no-store"
      }),
      fetch(`${BACKEND_URL}/api/v1/content/home-live`, {
        cache: "no-store"
      })
    ])

    let users: any[] = []
    let posts: any[] = []
    let reels: any[] = []
    let stories: any[] = []

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
      posts = Array.isArray(feed.posts) ? feed.posts : []
      reels = Array.isArray(feed.reels) ? feed.reels : []
      stories = Array.isArray(feed.stories) ? feed.stories : []

      const contentUsers = [...posts, ...reels, ...stories]
        .map(contentUser)
        .filter(Boolean)

      users = [...users, ...contentUsers]
    }

    const userMap = new Map<string, any>()

    users.forEach((user) => {
      const username = cleanUsername(user.username || user.user || user.name)
      if (!username) return

      const normalized = {
        id: user.id || user.userId || username,
        username,
        name: user.name || username.replace("@", "") || "Creator",
        avatarUrl: user.avatarUrl || user.avatar_url || "",
        bio: user.bio || "Creator",
        verified: user.verified !== false,
        followers: user.followers || 0
      }

      userMap.set(username.toLowerCase(), normalized)
    })

    const creators = Array.from(userMap.values()).filter((item) => matchQuery(item, q))

    return NextResponse.json({
      success: true,
      source: "backend-search",
      query: q,
      creators,
      posts: posts.filter((item) => matchQuery(item, q)),
      reels: reels.filter((item) => matchQuery(item, q)),
      stories: stories.filter((item) => matchQuery(item, q))
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Search failed",
      query: q,
      creators: [],
      posts: [],
      reels: [],
      stories: []
    })
  }
}
