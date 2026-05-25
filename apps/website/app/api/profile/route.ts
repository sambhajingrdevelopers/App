import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

function normalizeUsername(value: any) {
  const clean = String(value || "").trim()
  if (!clean) return "@you"
  return clean.startsWith("@") ? clean : `@${clean}`
}

async function getJson(path: string) {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" })
    return await res.json()
  } catch {
    return {}
  }
}

function safeCount(value: any) {
  const n = Number(value || 0)
  return Number.isFinite(n) ? n : 0
}

function matchUser(item: any, username: string) {
  const target = normalizeUsername(username).toLowerCase()
  const itemUser = normalizeUsername(item?.username || item?.user || item?.creator || item?.name).toLowerCase()
  return itemUser === target
}

export async function GET(request: NextRequest) {
  const target = normalizeUsername(
    request.nextUrl.searchParams.get("username") ||
    request.cookies.get("vibeloop_username")?.value ||
    "@you"
  )

  const viewer = normalizeUsername(
    request.nextUrl.searchParams.get("viewer") ||
    request.cookies.get("vibeloop_username")?.value ||
    "@guest"
  )

  const isOwner = target.toLowerCase() === viewer.toLowerCase()

  const backendProfile = await getJson(
    `/api/v1/public/profile?username=${encodeURIComponent(target)}&viewer=${encodeURIComponent(viewer)}`
  )

  if (backendProfile?.success && backendProfile?.user) {
    return NextResponse.json({
      success: true,
      source: "backend-public-profile",
      user: {
        name: backendProfile.user.name || target.replace("@", ""),
        username: normalizeUsername(backendProfile.user.username || target),
        bio: backendProfile.user.bio || "Digital Creator",
        avatarUrl: backendProfile.user.avatarUrl || "",
        bannerUrl: backendProfile.user.bannerUrl || "",
        verified: backendProfile.user.verified !== false,
        followers: backendProfile.user.followers ?? 0,
        following: backendProfile.user.following ?? 0,
        isOwner: Boolean(backendProfile.user.isOwner),
        isPrivate: Boolean(backendProfile.user.isPrivate),
        allowMessages: backendProfile.user.allowMessages !== false
      },
      privacy: backendProfile.privacy || {},
      posts: Array.isArray(backendProfile.posts) ? backendProfile.posts : [],
      reels: Array.isArray(backendProfile.reels) ? backendProfile.reels : [],
      stories: Array.isArray(backendProfile.stories) ? backendProfile.stories : [],
      counts: backendProfile.counts || {}
    })
  }

  const [usersData, feedData, reelsData, storiesData] = await Promise.all([
    getJson(`/api/v1/public/users/search?q=${encodeURIComponent(target)}`),
    getJson("/api/v1/content/home-live"),
    getJson("/api/v1/content/reels-live"),
    getJson("/api/v1/content/stories-live")
  ])

  const users = Array.isArray(usersData.users)
    ? usersData.users
    : Array.isArray(usersData.results)
      ? usersData.results
      : []

  const foundUser =
    users.find((u: any) => normalizeUsername(u.username).toLowerCase() === target.toLowerCase()) ||
    users[0] ||
    {}

  const posts = (Array.isArray(feedData.posts) ? feedData.posts : []).filter((item: any) => matchUser(item, target))
  const reels = (
    Array.isArray(reelsData.reels)
      ? reelsData.reels
      : Array.isArray(feedData.reels)
        ? feedData.reels
        : []
  ).filter((item: any) => matchUser(item, target))

  const stories = (
    Array.isArray(storiesData.stories)
      ? storiesData.stories
      : Array.isArray(feedData.stories)
        ? feedData.stories
        : []
  ).filter((item: any) => matchUser(item, target))

  return NextResponse.json({
    success: true,
    source: "frontend-profile-fallback",
    user: {
      name: foundUser.name || target.replace("@", "") || "Creator",
      username: target,
      bio: foundUser.bio || foundUser.caption || "Digital Creator • Designer • Developer",
      avatarUrl: foundUser.avatarUrl || "",
      bannerUrl: foundUser.bannerUrl || "",
      verified: foundUser.verified !== false,
      followers: safeCount(foundUser.followers),
      following: safeCount(foundUser.following),
      isOwner,
      isPrivate: false,
      allowMessages: true
    },
    privacy: {
      isPrivate: false,
      allowMessages: true
    },
    posts,
    reels,
    stories,
    counts: {
      posts: posts.length,
      reels: reels.length,
      stories: stories.length,
      followers: safeCount(foundUser.followers),
      following: safeCount(foundUser.following)
    }
  })
}
