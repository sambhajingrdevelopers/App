import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    success: true,
    id,
    item: { id, ...body },
    post: { id, ...body },
    reel: { id, ...body },
    message: "Action saved"
  })
}
