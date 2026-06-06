import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))

  const comment = {
    id: `CMT-${Date.now()}`,
    user: body.user || "@you",
    text: body.text || body.comment || "",
    createdAt: new Date().toISOString()
  }

  return NextResponse.json({
    success: true,
    id,
    comment,
    comments: [comment]
  })
}
