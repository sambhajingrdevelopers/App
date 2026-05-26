import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

export async function GET(request: NextRequest) {
  const id = String(request.nextUrl.searchParams.get("id") || "").trim()

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/content/detail?id=${encodeURIComponent(id)}`,
      { cache: "no-store" }
    )

    const data = await res.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Detail load failed",
      item: null
    })
  }
}
