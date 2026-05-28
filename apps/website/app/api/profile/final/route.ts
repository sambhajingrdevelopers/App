import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://43.205.145.63:8003"

function cleanUsername(value: any) {
  const clean = String(value || "").trim()
  if (!clean) return "@you"
  return clean.startsWith("@") ? clean : `@${clean}`
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
    caption: item.caption || "",
    username: cleanUsername(item.username || item.user || item.creator),
    user: cleanUsername(item.user || item.username || item.creator),
    name: item.name || "Creator",
    avatarUrl: item.avatarUrl || item.avatar_url || "",
    mediaUrl,
    videoUrl,
    mediaType: item.mediaType || item.media_type || (videoUrl ? "video" : "image"),
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    views: Number(item.views || 0),
    createdAt: item.createdAt || item.created_at || "",
    archivedAt: item.archivedAt || item.archived_at || ""
  }
}

export async function GET(request: NextRequest) {
  const username = cleanUsername(request.nextUrl.searchParams.get("username") || "@you")
  const viewer = cleanUsername(request.nextUrl.searchParams.get("viewer") || "@guest")

  try {
    const [profileRes, contentRes, usersRes] = await Promise.allSettled([
      fetch(`${BACKEND_URL}/api/v1/public/profile?username=${encodeURIComponent(username)}&viewer=${encodeURIComponent(viewer)}`, {
        cache: "no-store"
      }),
      fetch(`${BACKEND_URL}/api/v1/content/home-live`, {
        cache: "no-store"
      }),
      fetch(`${BACKEND_URL}/api/v1/users/list`, {
        cache: "no-store"
      })
    ])

    let backendProfile: any = {}
    let content: any = {}
    let users: any[] = []

    if (profileRes.status === "fulfilled") {
      backendProfile = await profileRes.value.json().catch(() => ({}))
    }

    if (contentRes.status === "fulfilled") {
      content = await contentRes.value.json().catch(() => ({}))
    }

    if (usersRes.status === "fulfilled") {
      const usersData = await usersRes.value.json().catch(() => ({}))
      users = Array.isArray(usersData.users) ? usersData.users : []
    }

    const foundUser =
      backendProfile.user ||
      users.find((u: any) => cleanUsername(u.username).toLowerCase() === username.toLowerCase()) ||
      {}

    const isOwner = username.toLowerCase() === viewer.toLowerCase()

    const user = {
      id: foundUser.id || username,
      name: foundUser.name || username.replace("@", "") || "Creator",
      username,
      bio: foundUser.bio || "Digital Creator",
      avatarUrl: foundUser.avatarUrl || foundUser.avatar_url || "",
      bannerUrl: foundUser.bannerUrl || foundUser.banner_url || "",
      verified: foundUser.verified !== false,
      followers: Number(foundUser.followers || 0),
      following: Number(foundUser.following || 0),
      isPrivate: Boolean(foundUser.isPrivate || foundUser.is_private),
      allowMessages: foundUser.allowMessages !== false,
      isOwner
    }

    const canView = isOwner || !user.isPrivate

    const posts = (Array.isArray(backendProfile.posts) ? backendProfile.posts : Array.isArray(content.posts) ? content.posts : [])
      .map((item: any) => normalizeContent(item, "post"))
      .filter((item: any) => item.username.toLowerCase() === username.toLowerCase() && !item.archivedAt)

    const reels = (Array.isArray(backendProfile.reels) ? backendProfile.reels : Array.isArray(content.reels) ? content.reels : [])
      .map((item: any) => normalizeContent(item, "reel"))
      .filter((item: any) => item.username.toLowerCase() === username.toLowerCase() && !item.archivedAt)

    const stories = (Array.isArray(backendProfile.stories) ? backendProfile.stories : Array.isArray(content.stories) ? content.stories : [])
      .map((item: any) => normalizeContent(item, "story"))
      .filter((item: any) => item.username.toLowerCase() === username.toLowerCase() && !item.archivedAt)

    return NextResponse.json({
      success: true,
      user,
      posts: canView ? posts : [],
      reels: canView ? reels : [],
      stories: canView ? stories : [],
      privacy: {
        isPrivate: user.isPrivate,
        allowMessages: user.allowMessages,
        canViewContent: canView
      }
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Profile load failed.",
      user: null,
      posts: [],
      reels: [],
      stories: []
    }, { status: 500 })
  }
}
