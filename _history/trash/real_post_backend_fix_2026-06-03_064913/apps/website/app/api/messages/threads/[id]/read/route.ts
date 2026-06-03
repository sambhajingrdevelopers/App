import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const response = await fetch(`${BACKEND_URL}/api/v1/messages/threads/${encodeURIComponent(params.id)}/read`, {
      method: 'POST',
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Read update failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      thread: data.thread,
      unreadTotal: data.unreadTotal
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Read server error' },
      { status: 500 }
    );
  }
}
