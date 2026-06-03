import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const storyId = String(body.storyId || body.id || "");

    if (!storyId) {
      return NextResponse.json(
        { success: false, message: "Story id is required." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/v1/stories/${encodeURIComponent(storyId)}/archive`,
      {
        method: "POST",
        cache: "no-store"
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: Boolean(data.success),
      message: data.message || "Story safely archived.",
      id: storyId,
      archived: true
    }, { status: response.ok ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Story archive failed." },
      { status: 500 }
    );
  }
}
