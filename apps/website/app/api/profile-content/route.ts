import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://43.205.145.63:8003";

export async function GET(request: NextRequest) {
  try {
    const username =
      request.nextUrl.searchParams.get("username") ||
      request.cookies.get("vibeloop_username")?.value ||
      "@you";

    const response = await fetch(
      `${BACKEND_URL}/api/v1/profile/content?username=${encodeURIComponent(username)}`,
      { cache: "no-store" }
    );

    const data = await response.json();

    return NextResponse.json({
      success: Boolean(data.success),
      username,
      posts: data.posts || [],
      reels: data.reels || [],
      stories: data.stories || [],
      total: data.total || 0
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        message: error?.message || "Profile content load failed.",
        posts: [],
        reels: [],
        stories: []
      },
      { status: 500 }
    );
  }
}
