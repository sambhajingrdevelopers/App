import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'CHANGE_ME_ADMIN_KEY';

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || '';
  const includeArchived = request.nextUrl.searchParams.get('includeArchived') || 'false';

  try {
    const response = await fetch(
      `${BACKEND_URL}/api/v1/admin/users?q=${encodeURIComponent(q)}&include_archived=${encodeURIComponent(includeArchived)}`,
      { cache: 'no-store' }
    );

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'platform' : 'fallback',
      users: data.users || [],
      summary: data.summary || { total: 0, active: 0, blocked: 0, verified: 0, archived: 0 }
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      users: [],
      summary: { total: 0, active: 0, blocked: 0, verified: 0, archived: 0 }
    });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const response = await fetch(`${BACKEND_URL}/api/v1/admin/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Admin-Api-Key': ADMIN_API_KEY },
      body: JSON.stringify(body),
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'User create failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user: data.user });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'User server error' },
      { status: 500 }
    );
  }
}
