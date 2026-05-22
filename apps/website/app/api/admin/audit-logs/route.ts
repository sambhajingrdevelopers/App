import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'CHANGE_ME_ADMIN_KEY';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const limit = request.nextUrl.searchParams.get('limit') || '100';

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/admin/audit-logs?q=${encodeURIComponent(q)}&limit=${encodeURIComponent(limit)}`,
      {
        headers: {
          'X-Admin-Api-Key': ADMIN_API_KEY
        },
        cache: 'no-store'
      }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'backend' : 'fallback',
      total: data.total || 0,
      logs: data.logs || []
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      total: 0,
      logs: []
    });
  }
}
