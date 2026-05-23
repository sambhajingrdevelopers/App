import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const response = await fetch(`${BACKEND_URL}/api/v1/stories/${encodeURIComponent(params.id)}/replies`, {
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: response.ok && data.success,
      replies: data.replies || []
    });
  } catch {
    return NextResponse.json({ success: false, replies: [] });
  }
}
