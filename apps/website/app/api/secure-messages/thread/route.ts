import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://43.205.145.63:8003"

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams.get("user") || "@guest"
  const withUser = request.nextUrl.searchParams.get("with") || "@creator"

  try {
    const res = await fetch(
      `${BACKEND_URL}/api/v1/secure/messages/thread?user=${encodeURIComponent(user)}&with=${encodeURIComponent(withUser)}`,
      { cache: "no-store" }
    )

    const data = await res.json().catch(() => ({}))
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Thread failed.",
      messages: [],
    }, { status: 500 })
  }
}
