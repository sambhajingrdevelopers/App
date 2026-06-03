import { NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://43.205.145.63:8003"

export async function GET() {
  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/content/home-live`, {
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({
      success: false,
      message: "Invalid backend JSON.",
    }))

    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Content backend failed.",
        posts: [],
        reels: [],
        stories: [],
      },
      { status: 500 }
    )
  }
}
