import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/posts/${encodeURIComponent(params.id)}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saved: body.saved }),
      cache: 'no-store'
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data?.message || 'Save update failed' },
        { status: response.status || 500 }
      );
    }

    return NextResponse.json({ success: true, post: data.post });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Save server error' },
      { status: 500 }
    );
  }
}
