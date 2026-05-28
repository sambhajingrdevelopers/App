import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://43.205.145.63:8003"

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username") || "@you"

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/settings/profile?username=${encodeURIComponent(username)}`,
      { cache: "no-store" }
    )

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Settings profile failed."
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const response = await fetch(`${BACKEND_URL}/api/v1/settings/profile/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(body),
      cache: "no-store"
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Settings update failed."
    }, { status: 500 })
  }
}
