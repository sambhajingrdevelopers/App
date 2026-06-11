import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString()

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/presence/list${qs ? `?${qs}` : ""}`, {
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({ success: false }))
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Presence backend failed.",
      presence: [],
    }, { status: 502 })
  }
}
