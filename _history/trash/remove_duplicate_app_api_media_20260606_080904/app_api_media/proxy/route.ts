import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

export async function GET(request: NextRequest) {
  try {
    const raw = request.nextUrl.searchParams.get("url") || ""

    if (!raw) {
      return NextResponse.json({ success: false, message: "Media URL missing" }, { status: 400 })
    }

    const target = raw.startsWith("http")
      ? raw
      : `${BACKEND_URL}${raw.startsWith("/") ? raw : `/media/${raw}`}`

    const response = await fetch(target, { cache: "no-store" })
    const contentType = response.headers.get("content-type") || ""

    if (!response.ok || !response.body) {
      return NextResponse.json(
        { success: false, message: "Media not found", status: response.status, target },
        { status: 404 }
      )
    }

    if (contentType.includes("text/html")) {
      return NextResponse.json(
        { success: false, message: "Backend returned HTML instead of media.", target },
        { status: 502 }
      )
    }

    const headers = new Headers()
    headers.set("Content-Type", contentType || "application/octet-stream")
    headers.set("Cache-Control", "no-store")

    return new NextResponse(response.body, { status: 200, headers })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Media proxy failed" },
      { status: 500 }
    )
  }
}
