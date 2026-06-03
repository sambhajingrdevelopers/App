import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/messages/threads`, {
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'platform' : 'fallback',
      unreadTotal: data.unreadTotal || 0,
      threads: data.threads || []
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      unreadTotal: 0,
      threads: []
    });
  }
}
