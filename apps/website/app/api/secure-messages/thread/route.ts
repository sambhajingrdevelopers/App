import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

const PATHS = [
  "/api/v1/messages/thread",
  "/api/v1/secure/messages/thread",
  "/api/v1/secure-messages/thread",
]

async function readJson(res: Response) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { success: false, message: text || "Invalid backend response" }
  }
}

export async function GET(request: NextRequest) {
  const user = request.nextUrl.searchParams?.get("user") || "@pradip"
  const withUser =
    request.nextUrl.searchParams?.get("with_user") ||
    request.nextUrl.searchParams?.get("withUser") ||
    request.nextUrl.searchParams?.get("with") ||
    "@creator"

  const qs = `user=${encodeURIComponent(user)}&with_user=${encodeURIComponent(withUser)}&withUser=${encodeURIComponent(withUser)}`
  const errors: string[] = []

  for (const path of PATHS) {
    const url = `${BACKEND_URL}${path}?${qs}`

    try {
      const res = await fetch(url, { cache: "no-store" })
      const data = await readJson(res)

      if (res.ok && data?.success !== false && data?.detail !== "Not Found") {
        return NextResponse.json({
          ...data,
          success: true,
          backendUrl: url,
          messages: Array.isArray(data.messages) ? data.messages : [],
        })
      }

      errors.push(`${url} -> ${res.status} ${data?.message || data?.detail || "failed"}`)
    } catch (error: any) {
      errors.push(`${url} -> ${error?.message || "failed"}`)
    }
  }

  return NextResponse.json({
    success: false,
    message: "Real message thread backend not available.",
    backendBase: BACKEND_URL,
    messages: [],
    errors,
  }, { status: 502 })
}
