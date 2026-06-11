import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "http://13.206.145.54:8003"

async function safeJson(response: Response) {
  const text = await response.text()
  try {
    return text ? JSON.parse(text) : {}
  } catch {
    return { success: false, message: "Backend returned non-JSON response.", raw: text.slice(0, 180) }
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const response = await fetch(`${BACKEND_URL}/api/v1/ai/photo-hd`, {
      method: "POST",
      body: formData,
      cache: "no-store"
    })

    const data = await safeJson(response)
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "AI photo HD proxy failed" },
      { status: 500 }
    )
  }
}
