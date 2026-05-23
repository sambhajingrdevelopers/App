import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'CHANGE_ME_ADMIN_KEY';

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;

    const response = await fetch(`${BACKEND_URL}/api/v1/admin/users/${encodeURIComponent(params.id)}/archive`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
      method: 'POST',
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json({ success: false, message: data.message || 'Archive failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true, user: data.user, message: data.message });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error?.message || 'Archive server error' }, { status: 500 });
  }
}
