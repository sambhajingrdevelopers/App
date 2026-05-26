import { NextRequest, NextResponse } from "next/server"

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003"

export async function POST(request: NextRequest) {
  try {
    const form = await request.formData()

    const res = await fetch(`${BACKEND_URL}/api/v1/content/upload-media`, {
      method: "POST",
      body: form,
      cache: "no-store"
    })

    const data = await res.json()
    return NextResponse.json(data, { status: res.status })
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error?.message || "Upload failed"
    }, { status: 500 })
  }
}
