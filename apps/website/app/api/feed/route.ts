import { NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://43.205.145.63:8003"

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/content/home-live`, {
      cache: "no-store"
    })

    const data = await res.json()

    return NextResponse.json({
      success: data.success !== false,
      source: "backend",
      posts: Array.isArray(data.posts) ? data.posts : [],
      reels: Array.isArray(data.reels) ? data.reels : [],
      stories: Array.isArray(data.stories) ? data.stories : []
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      source: "backend-error",
      message: error?.message || "Backend feed failed",
      posts: [],
      reels: [],
      stories: []
    })
  }
}
