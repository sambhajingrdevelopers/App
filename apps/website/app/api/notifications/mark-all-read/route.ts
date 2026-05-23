import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';

export async function POST() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/notifications/mark-all-read`, {
      method: 'POST',
      cache: 'no-store'
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return NextResponse.json(
        { success: false, message: data.message || 'Mark all read failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      unread: data.unread || 0,
      notifications: data.notifications || []
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error?.message || 'Notification server error' },
      { status: 500 }
    );
  }
}
