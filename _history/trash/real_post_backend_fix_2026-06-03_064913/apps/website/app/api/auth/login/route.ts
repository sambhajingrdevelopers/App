import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

function normalizeUsername(value: string) {
  const clean = String(value || "").trim()

  if (!clean) {
    return ""
  }

  if (clean.includes("@") && !clean.startsWith("@")) {
    return `@${clean.split("@")[0].replace(/[^a-zA-Z0-9_.-]/g, "")}`
  }

  return clean.startsWith("@") ? clean : `@${clean}`
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const identifier = String(
      body.identifier ||
      body.email ||
      body.username ||
      body.phone ||
      ""
    ).trim()

    const password = String(body.password || "").trim()

    if (!identifier) {
      return NextResponse.json(
        { success: false, message: "Email, username or phone is required." },
        { status: 400 }
      )
    }

    if (!password) {
      return NextResponse.json(
        { success: false, message: "Password is required." },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters." },
        { status: 400 }
      )
    }

    const backendResponse = await fetch(`${BACKEND_URL}/api/v1/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier,
        email: body.email || identifier,
        username: body.username || identifier,
        password
      }),
      cache: "no-store"
    })

    let data: any = {}

    try {
      data = await backendResponse.json()
    } catch {
      data = {}
    }

    if (!backendResponse.ok || !data.success) {
      return NextResponse.json(
        {
          success: false,
          message: data.message || "Invalid login details."
        },
        { status: 401 }
      )
    }

    const user = data.user || {}

    const username = normalizeUsername(
      user.username ||
      body.username ||
      identifier
    )

    const userId = String(user.userId || user.id || `USR-${username.replace("@", "").toUpperCase()}`)
    const name = String(user.name || user.fullName || username.replace("@", "") || "Creator")

    const response = NextResponse.json({
      success: true,
      message: "Login successful.",
      user: {
        ...user,
        userId,
        id: userId,
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
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Login failed." },
      { status: 500 }
    )
  }
}
