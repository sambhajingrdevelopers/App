import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/messages/threads/${encodeURIComponent(params.id)}/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Send failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      thread: data.thread,
      message: data.message
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Send server error' },
      { status: 500 }
    );
  }
}
