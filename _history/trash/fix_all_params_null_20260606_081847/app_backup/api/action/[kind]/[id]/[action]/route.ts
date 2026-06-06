import { NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(request: NextRequest, context: { params: Promise<{ kind: string; id: string; action: string }> }) {
  const { kind, id, action } = await context.params
  const body = await request.json().catch(() => ({}))

  return NextResponse.json({
    success: true,
    kind,
    id,
    action,
    item: { id, kind, ...body },
    message: `${action} saved`
  })
}
