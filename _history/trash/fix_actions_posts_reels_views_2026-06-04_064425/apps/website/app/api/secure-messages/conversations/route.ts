import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

const PATHS = [
  "/api/v1/messages/conversations",
  "/api/v1/secure/messages/conversations",
  "/api/v1/secure-messages/conversations",
  "/api/v1/messages/threads",
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
  const user = request.nextUrl.searchParams.get("user") || "@pradip"
  const errors: string[] = []

  for (const path of PATHS) {
    const qs = path.includes("threads") ? "" : `?user=${encodeURIComponent(user)}`
    const url = `${BACKEND_URL}${path}${qs}`

    try {
      const res = await fetch(url, { cache: "no-store" })
      const data = await readJson(res)

      if (res.ok && data?.success !== false && data?.detail !== "Not Found") {
        const conversations =
          Array.isArray(data.conversations) ? data.conversations :
          Array.isArray(data.threads) ? data.threads :
          Array.isArray(data.items) ? data.items : []

        return NextResponse.json({
          ...data,
          success: true,
          backendUrl: url,
          conversations,
        })
      }

      errors.push(`${url} -> ${res.status} ${data?.message || data?.detail || "failed"}`)
    } catch (error: any) {
      errors.push(`${url} -> ${error?.message || "failed"}`)
    }
  }

  return NextResponse.json({
    success: false,
    message: "Real conversations backend not available.",
    backendBase: BACKEND_URL,
    conversations: [],
    errors,
  }, { status: 502 })
}
