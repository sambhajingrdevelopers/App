import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

function normalizeUsername(value: string) {
  const clean = String(value || "").trim()

  if (!clean) return ""

  if (clean.includes("@") && !clean.startsWith("@")) {
    return `@${clean.split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "")}`
  }

  return clean.startsWith("@") ? clean : `@${clean}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const name = String(body.name || body.fullName || "").trim()
    const email = String(body.email || "").trim()
    const username = normalizeUsername(body.username || email || name)
    const password = String(body.password || "").trim()

    if (!name) {
      return NextResponse.json({ success: false, message: "Name is required." }, { status: 400 })
    }

    if (!password) {
      return NextResponse.json({ success: false, message: "Password is required." }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ success: false, message: "Password must be at least 6 characters." }, { status: 400 })
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        username,
        password
      }),
      cache: "no-store"
    })

    const data = await backendResponse.json()

    if (!backendResponse.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || "Registration failed." },
        { status: 400 }
      )
    }

    const user = data.user || {}
    const userId = String(user.userId || user.id || "")
    const finalUsername = normalizeUsername(user.username || username)
    const finalName = String(user.name || name || "Creator")

    const response = NextResponse.json({
      success: true,
      message: "Registration successful.",
      user: {
        ...user,
        userId,
        id: userId,
        username: finalUsername,
        name: finalName
      }
    })

    response.cookies.set("vibeloop_username", finalUsername, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    })

    response.cookies.set("vibeloop_user_id", userId, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    })

    response.cookies.set("vibeloop_name", finalName, {
      path: "/",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30
    })

    return response
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Registration failed." },
      { status: 500 }
    )
  }
}
