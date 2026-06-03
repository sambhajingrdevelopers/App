import { NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://43.205.145.63:8003"

export async function GET() {
  try {
    const reelsRes = await fetch(`${BACKEND_URL}/api/v1/content/reels-live`, {
      cache: "no-store"
    })

    let data = await reelsRes.json().catch(() => ({}))
    let reels = Array.isArray(data.reels) ? data.reels : []

    if (reels.length === 0) {
      const feedRes = await fetch(`${BACKEND_URL}/api/v1/content/home-live`, {
        cache: "no-store"
      })

      const feed = await feedRes.json().catch(() => ({}))
      reels = Array.isArray(feed.reels) ? feed.reels : []
    }

    return NextResponse.json({
      success: true,
      source: "backend-reels",
      reels
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      source: "backend-error",
      message: error?.message || "Backend reels failed",
      reels: []
    })
  }
}
