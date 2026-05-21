import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/safety/unblock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Unblock failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      target: data.target
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Unblock server error' },
      { status: 500 }
    );
  }
}
