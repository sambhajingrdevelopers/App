import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL =
  process.env.EC2_BACKEND_URL ||
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "http://43.205.145.63:8003"

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    const response = await fetch(`${BACKEND_URL}/api/v1/content/upload-media`, {
      method: "POST",
      body: formData,
      cache: "no-store"
    })

    const data = await response.json()
    return NextResponse.json(data, { status: response.status })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Media upload failed."
    }, { status: 500 })
  }
}
