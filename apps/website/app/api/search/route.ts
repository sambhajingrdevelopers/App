import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") || ""

  if (!q.trim()) {
    return NextResponse.json({
      success: true,
      source: "platform",
      query: q,
      results: []
    })
  }

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/search?q=${encodeURIComponent(q)}`,
      {
        method: "GET",
        cache: "no-store"
      }
    )

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        source: "platform",
        query: q,
        results: []
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      source: "platform",
      query: q,
      results: data.results || []
    })
  } catch {
    return NextResponse.json({
      success: true,
      source: "platform",
      query: q,
      results: []
    })
  }
}
