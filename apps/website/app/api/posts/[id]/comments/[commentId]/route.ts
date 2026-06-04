import { NextResponse } from "next/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function DELETE() {
  return NextResponse.json({ success: true, message: "Comment removed" })
}
