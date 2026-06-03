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

function sameUser(a: any, b: any) {
  return cleanUsername(a).toLowerCase() === cleanUsername(b).toLowerCase()
}

function normalizeContent(item: any, fallbackKind: string) {
  const username = cleanUsername(item.username || item.user || item.owner || "@creator")

  return {
    id: String(item.id || ""),
    kind: item.kind || item.type || fallbackKind,
    title: item.title || fallbackKind,
    caption: item.caption || "",
    username,
    user: username,
    name: item.name || username.replace("@", ""),
    mediaUrl: item.mediaUrl || item.media_url || "",
    videoUrl: item.videoUrl || item.video_url || "",
    mediaType: item.mediaType || item.media_type || (item.videoUrl || item.video_url ? "video" : "image"),
    likes: Number(item.likes || 0),
    comments: Number(item.comments || 0),
    views: Number(item.views || 0),
    createdAt: item.createdAt || item.created_at || "",
  }
}

export async function GET(request: NextRequest) {
  const username = cleanUsername(request.nextUrl.searchParams.get("username") || "@creator")
  const viewer = cleanUsername(request.nextUrl.searchParams.get("viewer") || "@guest")

  try {
    const [usersResult, contentResult, followResult] = await Promise.allSettled([
      fetch(`${BACKEND_URL}/api/v1/users/list`, { cache: "no-store" }),
      fetch(`${BACKEND_URL}/api/v1/content/home-live`, { cache: "no-store" }),
      fetch(`${BACKEND_URL}/api/v1/follow/status?follower=${encodeURIComponent(viewer)}&following=${encodeURIComponent(username)}`, {
        cache: "no-store",
      }),
    ])

    let usersData: any = {}
    let contentData: any = {}
    let followData: any = {}

    if (usersResult.status === "fulfilled") {
      usersData = await usersResult.value.json().catch(() => ({}))
    }

    if (contentResult.status === "fulfilled") {
      contentData = await contentResult.value.json().catch(() => ({}))
    }

    if (followResult.status === "fulfilled") {
      followData = await followResult.value.json().catch(() => ({}))
    }

    const rawUsers = Array.isArray(usersData.users)
      ? usersData.users
      : Array.isArray(usersData)
        ? usersData
        : []

    const userRow =
      rawUsers.find((user: any) => sameUser(user.username || user.user || user.handle || user.name, username)) || {}

    const posts = (Array.isArray(contentData.posts) ? contentData.posts : [])
      .map((item: any) => normalizeContent(item, "post"))
      .filter((item: any) => sameUser(item.username, username))

    const reels = (Array.isArray(contentData.reels) ? contentData.reels : [])
      .map((item: any) => normalizeContent(item, "reel"))
      .filter((item: any) => sameUser(item.username, username))

    const stories = (Array.isArray(contentData.stories) ? contentData.stories : [])
      .map((item: any) => normalizeContent(item, "story"))
      .filter((item: any) => sameUser(item.username, username))

    const profile = {
      id: String(userRow.id || userRow.userId || username),
      name: userRow.name || username.replace("@", "") || "Creator",
      username,
      bio: userRow.bio || userRow.role || "Digital Creator",
      location: userRow.location || "India",
      avatarUrl: userRow.avatarUrl || userRow.avatar_url || "",
      coverUrl: userRow.coverUrl || userRow.cover_url || "",
      verified: userRow.verified !== false,
      followers: Number(followData.followers || 0),
      following: Number(followData.followingCount || followData.following || 0),
      isFollowing: Boolean(followData.isFollowing),
      isOwner: sameUser(username, viewer),
      counts: {
        posts: posts.length,
        reels: reels.length,
        stories: stories.length,
      },
    }

    return NextResponse.json({
      success: true,
      profile,
      posts,
      reels,
      stories,
      debug: {
        backend: BACKEND_URL,
        rawUsers: rawUsers.length,
        allPosts: Array.isArray(contentData.posts) ? contentData.posts.length : 0,
        allReels: Array.isArray(contentData.reels) ? contentData.reels.length : 0,
        allStories: Array.isArray(contentData.stories) ? contentData.stories.length : 0,
      },
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Profile load failed.",
        profile: null,
        posts: [],
        reels: [],
        stories: [],
      },
      { status: 500 }
    )
  }
}
