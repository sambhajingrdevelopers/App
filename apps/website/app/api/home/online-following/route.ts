import { NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/me?username=@you`, {
      cache: "no-store"
    })

    const data = await response.json()

    const user = data.user || {
      name: "VibeLoop Creator",
      username: "@you",
      avatarUrl: ""
    }

    return NextResponse.json({
      success: true,
      users: [
        {
          id: user.userId || user.id || "USR-YOU",
          name: user.name || "VibeLoop Creator",
          username: user.username || "@you",
          avatarUrl: user.avatarUrl || "",
          online: true,
          hasStory: true
        }
      ]
    })
  } catch {
    return NextResponse.json({
      success: true,
      users: []
    })
  }
}
