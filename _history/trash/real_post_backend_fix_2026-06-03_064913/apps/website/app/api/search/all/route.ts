import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://43.205.145.63:8003"

function cleanUsername(value: any) {
  const clean = String(value || "").trim()
  if (!clean) return "@creator"
  return clean.startsWith("@") ? clean : `@${clean}`
}

function normalizeUser(user: any) {
  const username = cleanUsername(user.username || user.user || user.name)

  return {
    id: String(user.id || user.userId || username),
    name: user.name || username.replace("@", "") || "Creator",
    username,
    bio: user.bio || "Digital Creator",
    avatarUrl: user.avatarUrl || user.avatar_url || "",
    bannerUrl: user.bannerUrl || user.banner_url || "",
    verified: Boolean(user.verified ?? true),
    followers: Number(user.followers || 0),
    following: Number(user.following || 0),
  }
}

function normalizeContent(item: any, fallbackKind: string) {
  const kind = item.kind || item.type || fallbackKind
  const videoUrl = item.videoUrl || item.video_url || ""
  const mediaUrl = item.mediaUrl || item.media_url || videoUrl || ""

  return {
    id: String(item.id || ""),
    kind,
    type: kind,
    title: item.title || kind,
    caption: item.caption || item.description || "",
    username: cleanUsername(item.username || item.user || item.creator),
    user: cleanUsername(item.user || item.username || item.creator),
    name: item.name || item.username || "Creator",
    avatarUrl: item.avatarUrl || item.avatar_url || "",
    mediaUrl,
    videoUrl,
    mediaType: item.mediaType || item.media_type || (videoUrl ? "video" : "image"),
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    views: Number(item.views || 0),
    createdAt: item.createdAt || item.created_at || "",
    archivedAt: item.archivedAt || item.archived_at || "",
  }
}

function matchText(value: any, needle: string) {
  return String(value || "").toLowerCase().includes(needle)
}

function contentMatches(item: any, needle: string) {
  if (!needle) return true

  return (
    matchText(item.title, needle) ||
    matchText(item.caption, needle) ||
    matchText(item.username, needle) ||
    matchText(item.name, needle) ||
    matchText(item.kind, needle)
  )
}

function userMatches(user: any, needle: string) {
  if (!needle) return true

  return (
    matchText(user.name, needle) ||
    matchText(user.username, needle) ||
    matchText(user.bio, needle)
  )
}

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get("q") || "").trim()
  const needle = q.toLowerCase()

  try {
    const [usersResponse, contentResponse] = await Promise.all([
      fetch(`${BACKEND_URL}/api/v1/users/list`, { cache: "no-store" }),
      fetch(`${BACKEND_URL}/api/v1/content/home-live`, { cache: "no-store" }),
    ])

    const usersData = await usersResponse.json().catch(() => ({}))
    const contentData = await contentResponse.json().catch(() => ({}))

    const users = (Array.isArray(usersData.users) ? usersData.users : [])
      .map(normalizeUser)
      .filter((user: any) => userMatches(user, needle))

    const posts = (Array.isArray(contentData.posts) ? contentData.posts : [])
      .map((item: any) => normalizeContent(item, "post"))
      .filter((item: any) => item.id && !item.archivedAt && contentMatches(item, needle))

    const reels = (Array.isArray(contentData.reels) ? contentData.reels : [])
      .map((item: any) => normalizeContent(item, "reel"))
      .filter((item: any) => item.id && !item.archivedAt && contentMatches(item, needle))

    const stories = (Array.isArray(contentData.stories) ? contentData.stories : [])
      .map((item: any) => normalizeContent(item, "story"))
      .filter((item: any) => item.id && !item.archivedAt && contentMatches(item, needle))

    return NextResponse.json({
      success: true,
      query: q,
      users,
      posts,
      reels,
      stories,
      total: users.length + posts.length + reels.length + stories.length,
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Search backend failed.",
      users: [],
      posts: [],
      reels: [],
      stories: [],
      total: 0,
    }, { status: 500 })
  }
}
