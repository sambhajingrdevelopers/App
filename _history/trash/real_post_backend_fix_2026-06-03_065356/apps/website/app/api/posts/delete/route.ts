import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = process.env.EC2_BACKEND_URL || "http://13.206.145.54:8003";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const postId = String(body.postId || body.id || "");

    if (!postId) {
      return NextResponse.json(
        { success: false, message: "Post id is required." },
        { status: 400 }
      );
    }

    const response = await fetch(
      `${BACKEND_URL}/api/v1/posts/${encodeURIComponent(postId)}/archive`,
      {
        method: "POST",
        cache: "no-store"
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: Boolean(data.success),
      message: data.message || "Post safely archived.",
      id: postId,
      archived: true
    }, { status: response.ok ? 200 : 400 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || "Post archive failed." },
      { status: 500 }
    );
  }
}
