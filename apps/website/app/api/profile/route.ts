import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

function normalizeUsername(value: any) {
  const clean = String(value || "").trim()
  if (!clean) return "@you"
  return clean.startsWith("@") ? clean : `@${clean}`
}

export async function GET(request: NextRequest) {
  const target = normalizeUsername(request.nextUrl.searchParams.get("username") || request.cookies.get("vibeloop_username")?.value || "@you")
  const viewer = normalizeUsername(request.cookies.get("vibeloop_username")?.value || "@guest")

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/public/profile?username=${encodeURIComponent(target)}&viewer=${encodeURIComponent(viewer)}`,
      { cache: "no-store" }
    )

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Profile load failed",
      user: {
        name: target.replace("@", ""),
        username: target,
        bio: "Digital Creator",
        isOwner: target === viewer,
        isPrivate: false,
        allowMessages: true,
        followers: 0,
        following: 0
      },
      posts: [],
      reels: [],
      stories: [],
      counts: { posts: 0, reels: 0, stories: 0, followers: 0, following: 0 }
    })
  }
}
