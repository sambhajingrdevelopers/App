import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://43.205.145.63:8003"

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id") || ""

  try {
    const res = await fetch(`${BACKEND_URL}/api/v1/content/detail?id=${encodeURIComponent(id)}`, {
      cache: "no-store",
    })

    const data = await res.json().catch(() => ({
      success: false,
      message: "Invalid backend JSON.",
      item: null,
    }))

    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Content detail backend failed.",
        item: null,
      },
      { status: 500 }
    )
  }
}
