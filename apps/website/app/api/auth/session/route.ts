import { NextRequest, NextResponse } from "next/server"

function normalizeUsername(value: string) {
  const clean = String(value || "").trim()
  if (!clean) return "@you"
  return clean.startsWith("@") ? clean : `@${clean}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const username = normalizeUsername(body.username || body.user || body.email || "@you")
    const userId = String(body.userId || body.id || `USR-${username.replace("@", "").toUpperCase()}`)
    const name = String(body.name || username.replace("@", "") || "Creator")

    const response = NextResponse.json({
      success: true,
      user: {
        userId,
        username,
        name
      }
    })

    response.cookies.set("vibeloop_username", username, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    })

    response.cookies.set("vibeloop_user_id", userId, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    })

    response.cookies.set("vibeloop_name", name, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    })

    return response
  } catch {
    return NextResponse.json(
      { success: false, message: "Session save failed" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  const username = request.cookies.get("vibeloop_username")?.value || ""
  const userId = request.cookies.get("vibeloop_user_id")?.value || ""
  const name = request.cookies.get("vibeloop_name")?.value || ""

  return NextResponse.json({
    success: Boolean(username),
    user: {
      userId,
      username,
      name
    }
  })
}

export async function DELETE() {
  const response = NextResponse.json({ success: true })

  response.cookies.set("vibeloop_username", "", {
    path: "/",
    maxAge: 0
  })

  response.cookies.set("vibeloop_user_id", "", {
    path: "/",
    maxAge: 0
  })

  response.cookies.set("vibeloop_name", "", {
    path: "/",
    maxAge: 0
  })

  return response
}
