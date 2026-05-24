import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const follower =
      request.cookies.get("vibeloop_username")?.value ||
      body.follower ||
      "@you"

    const response = await fetch(`${BACKEND_URL}/api/v1/follow/toggle`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        follower,
        following: body.following
      }),
      cache: "no-store"
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.ok ? 200 : 400 })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Follow action failed." },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const follower =
      request.cookies.get("vibeloop_username")?.value ||
      request.nextUrl.searchParams.get("follower") ||
      "@you"

    const following = request.nextUrl.searchParams.get("following") || "@you"

    const response = await fetch(
      `${BACKEND_URL}/api/v1/follow/status?follower=${encodeURIComponent(follower)}&following=${encodeURIComponent(following)}`,
      { cache: "no-store" }
    )

    const data = await response.json()

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({
      success: true,
      followingStatus: false
    })
  }
}
