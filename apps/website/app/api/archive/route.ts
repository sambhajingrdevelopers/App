import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

function normalizeType(type: string) {
  if (type === "post" || type === "posts") return "posts"
  if (type === "reel" || type === "reels") return "reels"
  if (type === "story" || type === "stories") return "stories"
  return ""
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const type = normalizeType(String(body.type || ""))
    const id = String(body.id || "")
    const action = String(body.action || "archive")

    if (!type || !id) {
      return NextResponse.json(
        { success: false, message: "Content type and id are required." },
        { status: 400 }
      )
    }

    if (action !== "archive" && action !== "restore") {
      return NextResponse.json(
        { success: false, message: "Invalid action." },
        { status: 400 }
      )
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/${type}/${encodeURIComponent(id)}/${action}`, {
      method: "POST",
      cache: "no-store"
    })

    const data = await response.json()

    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Archive action failed." },
      { status: 500 }
    )
  }
}
