import { NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/content/stories-live`, {
      method: "GET",
      cache: "no-store"
    })

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        source: "platform",
        stories: []
      })
    }

    const data = await response.json()

    return NextResponse.json({
      success: true,
      source: "platform",
      stories: data.stories || []
    })
  } catch {
    return NextResponse.json({
      success: true,
      source: "platform",
      stories: []
    })
  }
}
