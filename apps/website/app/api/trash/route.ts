import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003";

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/trash`, {
      cache: "no-store"
    });

    const data = await response.json();

    return NextResponse.json({
      success: Boolean(data.success),
      items: data.items || [],
      total: data.total || 0
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Trash load failed.", items: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const type = String(body.type || "");
    const id = String(body.id || "");

    const normalizedType =
      type === "post" ? "posts" :
      type === "reel" ? "reels" :
      type === "story" ? "stories" :
      "";

    if (!normalizedType || !id) {
      return NextResponse.json(
        { success: false, message: "Type and id are required." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/v1/${normalizedType}/${encodeURIComponent(id)}/restore`,
      {
        method: "POST",
        cache: "no-store"
      }
    );

    const data = await response.json();

    return NextResponse.json(data, { status: response.ok ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Restore failed." },
      { status: 500 }
    );
  }
}
