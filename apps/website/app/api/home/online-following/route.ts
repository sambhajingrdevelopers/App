import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

export async function GET(request: NextRequest) {
  try {
    const username =
      request.cookies.get("vibeloop_username")?.value ||
      request.nextUrl.searchParams.get("username") ||
      "@you"

    const response = await fetch(
      `${BACKEND_URL}/api/v1/home/online-following?username=${encodeURIComponent(username)}`,
      { cache: "no-store" }
    )

    const data = await response.json()

    return NextResponse.json({
      success: Boolean(data.success),
      users: data.users || []
    })
  } catch {
    return NextResponse.json({
      success: true,
      users: []
    })
  }
}
