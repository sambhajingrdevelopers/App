import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

function normalizeUsername(value: any) {
  const clean = String(value || "").trim()
  if (!clean) return "@creator"
  return clean.startsWith("@") ? clean : `@${clean}`
}

export async function GET(request: NextRequest) {
  const currentUsername = normalizeUsername(
    request.cookies.get("vibeloop_username")?.value || "@you"
  )

  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/public/users/list`, {
      cache: "no-store"
    })

    const data = await response.json()
    const rawUsers = Array.isArray(data.users)
      ? data.users
      : Array.isArray(data.results)
        ? data.results
        : []

    const users = rawUsers
      .map((user: any) => {
        const username = normalizeUsername(user.username || user.name)

        return {
          id: user.id || user.userId || username,
          userId: user.userId || user.id || username,
          name: user.name || username.replace("@", "") || "Creator",
          username,
          avatarUrl: user.avatarUrl || user.avatar_url || "",
          bannerUrl: user.bannerUrl || user.banner_url || "",
          bio: user.bio || "Digital Creator",
          verified: user.verified !== false,
          online: true,
          status: "online"
        }
      })
      .filter((user: any) => user.username !== currentUsername)
      .slice(0, 20)

    return NextResponse.json({
      success: true,
      source: "real-users-db",
      users,
      creators: users,
      following: users,
      online: users,
      total: users.length
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      source: "frontend-error",
      message: error?.message || "Users load failed",
      users: [],
      creators: [],
      following: [],
      online: [],
      total: 0
    })
  }
}
