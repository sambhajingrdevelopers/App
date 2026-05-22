import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackNotifications = [
  { id: 'NT-101', title: 'New follower', message: '@mira.creates started following you.', type: 'follow', isRead: false },
  { id: 'NT-102', title: 'Post liked', message: 'Your post received new likes.', type: 'like', isRead: false },
  { id: 'NT-103', title: 'Comment added', message: 'Someone commented on your post.', type: 'comment', isRead: false }
];

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/notifications`, {
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'backend' : 'fallback',
      notifications: data.notifications || fallbackNotifications
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      notifications: fallbackNotifications
    });
  }
}
