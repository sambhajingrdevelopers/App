import { NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/content/reels-live`, {
      cache: "no-store"
    })

    const data = await response.json()

    return NextResponse.json({
      success: data.success !== false,
      source: data.source || "backend",
      reels: data.reels || [],
      total: data.total || 0
    })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      source: "frontend-error",
      message: error?.message || "Reels load failed",
      reels: [],
      total: 0
    })
  }
}
