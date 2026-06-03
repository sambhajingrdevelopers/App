import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

const PATHS = [
  "/api/v1/secure/messages/conversations",
  "/api/v1/messages/conversations",
  "/api/v1/secure-messages/conversations",
]

export async function GET(request: NextRequest) {
  const qs = request.nextUrl.searchParams.toString()
  const errors: string[] = []

  for (const path of PATHS) {
    const url = `${BACKEND_URL}${path}${qs ? `?${qs}` : ""}`

    try {
      const res = await fetch(url, { cache: "no-store" })
      const text = await res.text()
      let data: any = {}

      try {
        data = text ? JSON.parse(text) : {}
      } catch {
        data = { success: false, message: text || "Invalid backend response" }
      }

      if (res.ok && data?.detail !== "Not Found") {
        return NextResponse.json({
          ...data,
          success: data.success !== false,
          backendUrl: url,
        })
      }

      errors.push(`${url} -> ${res.status}`)
    } catch (error: any) {
      errors.push(`${url} -> ${error?.message || "failed"}`)
    }
  }

  return NextResponse.json({
    success: false,
    message: "Real conversations backend not available.",
    conversations: [],
    errors,
  }, { status: 502 })
}
