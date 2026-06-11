import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

const PATHS = [
  "/api/v1/messages/send",
  "/api/v1/secure/messages/send",
  "/api/v1/secure-messages/send",
]

async function readJson(res: Response) {
  const text = await res.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { success: false, message: text || "Invalid backend response" }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}))
  const errors: string[] = []

  const sender = body.sender || body.from || body.user || body.from_user || "@pradip"
  const receiver = body.receiver || body.to || body.withUser || body.with_user || body.to_user || "@creator"
  const text = body.text || body.message || body.body || ""

  const payload = {
    ...body,
    sender,
    receiver,
    text,
    from_user: sender,
    to_user: receiver,
    message: text,
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

      const data = await readJson(res)

      if (res.ok && data?.success !== false && data?.detail !== "Not Found") {
        return NextResponse.json({
          ...data,
          success: true,
          backendUrl: url,
        })
      }

      errors.push(`${url} -> ${res.status} ${data?.message || data?.detail || "failed"}`)
    } catch (error: any) {
      errors.push(`${url} -> ${error?.message || "failed"}`)
    }
  }

  return NextResponse.json({
    success: false,
    message: "Real send-message backend not available.",
    backendBase: BACKEND_URL,
    errors,
  }, { status: 502 })
}
