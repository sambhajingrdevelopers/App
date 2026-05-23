import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const reelId = String(body.reelId || body.id || "");

    if (!reelId) {
      return NextResponse.json(
        { success: false, message: "Reel id is required." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/v1/reels/${encodeURIComponent(reelId)}/archive`,
      {
        method: "POST",
        cache: "no-store"
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: Boolean(data.success),
      message: data.message || "Reel safely archived.",
      id: reelId,
      archived: true
    }, { status: response.ok ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Reel archive failed." },
      { status: 500 }
    );
  }
}
