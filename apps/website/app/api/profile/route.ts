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

async function getJson(path: string) {
  try {
    const res = await fetch(`${BACKEND_URL}${path}`, { cache: "no-store" })
    return await res.json()
  } catch {
    return {}
  }
}

function matchUser(item: any, username: string) {
  const target = cleanUsername(username).toLowerCase()
  const user = cleanUsername(item?.username || item?.user || item?.creator || item?.name).toLowerCase()
  return user === target
}

function publicUserFromSearch(user: any, target: string, isOwner: boolean) {
  const username = cleanUsername(user?.username || target)

  return {
    name: user?.name || username.replace("@", "") || "Creator",
    username,
    bio: user?.bio || user?.caption || "Digital Creator",
    avatarUrl: user?.avatarUrl || user?.avatar_url || "",
    bannerUrl: user?.bannerUrl || user?.banner_url || "",
    verified: user?.verified !== false,
    followers: Number(user?.followers || 0),
    following: Number(user?.following || 0),
    isOwner,
    isPrivate: Boolean(user?.isPrivate || user?.is_private),
    allowMessages: user?.allowMessages !== false
  }
}

export async function GET(request: NextRequest) {
  const target = cleanUsername(
    request.nextUrl.searchParams.get("username") ||
    request.cookies.get("vibeloop_username")?.value ||
    "@you"
  )

  const viewer = cleanUsername(
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
        name: backendProfile.user.name || target.replace("@", "") || "Creator",
        username: cleanUsername(backendProfile.user.username || target),
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
      posts: Array.isArray(backendProfile.posts) ? backendProfile.posts : [],
      reels: Array.isArray(backendProfile.reels) ? backendProfile.reels : [],
      stories: Array.isArray(backendProfile.stories) ? backendProfile.stories : [],
      privacy: backendProfile.privacy || {}
    })
  }

  const [usersData, feedData] = await Promise.all([
    getJson(`/api/v1/public/users/search?q=${encodeURIComponent(target)}`),
    getJson("/api/v1/content/home-live")
  ])

  const users = Array.isArray(usersData.users)
    ? usersData.users
    : Array.isArray(usersData.results)
      ? usersData.results
      : []

  const foundUser =
    users.find((user: any) => cleanUsername(user.username || user.name).toLowerCase() === target.toLowerCase()) ||
    users[0] ||
    {}

  const posts = (Array.isArray(feedData.posts) ? feedData.posts : []).filter((item: any) => matchUser(item, target))
  const reels = (Array.isArray(feedData.reels) ? feedData.reels : []).filter((item: any) => matchUser(item, target))
  const stories = (Array.isArray(feedData.stories) ? feedData.stories : []).filter((item: any) => matchUser(item, target))

  return NextResponse.json({
    success: true,
    source: "frontend-profile-fallback",
    user: publicUserFromSearch(foundUser, target, isOwner),
    posts,
    reels,
    stories,
    privacy: {
      isPrivate: false,
      allowMessages: true
    }
  })
}
