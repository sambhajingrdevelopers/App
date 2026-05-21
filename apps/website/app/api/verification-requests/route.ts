import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/verification-requests`, {
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'backend' : 'fallback',
      requests: data.requests || []
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      requests: []
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/verification-requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Verification request failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      request: data.request
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Verification server error' },
      { status: 500 }
    );
  }
}
