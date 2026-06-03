import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://43.205.145.63:8003"

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get("user") || "@you"
  const withUser = request.nextUrl.searchParams.get("with") || "@creator"

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/messages/thread?user=${encodeURIComponent(user)}&with_user=${encodeURIComponent(withUser)}`,
      { cache: "no-store" }
    )

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Message thread failed.",
      messages: []
    })
  }
}
