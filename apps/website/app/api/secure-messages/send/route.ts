import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://43.205.145.63:8003"

const PATHS = [
  "/api/v1/secure/messages/send",
  "/api/v1/messages/send",
  "/api/v1/secure-messages/send",
]

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const errors: string[] = []

  const payload = {
    ...body,
    sender: body.sender || body.from || body.user || body.from_user,
    receiver: body.receiver || body.to || body.withUser || body.to_user,
    text: body.text || body.message || body.body || "",
    from_user: body.sender || body.from || body.user || body.from_user,
    to_user: body.receiver || body.to || body.withUser || body.to_user,
    message: body.text || body.message || body.body || "",
  }

  for (const path of PATHS) {
    const url = `${BACKEND_URL}${path}`

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      })

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
    message: "Real send-message backend not available.",
    errors,
  }, { status: 502 })
}
