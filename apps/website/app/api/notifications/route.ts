import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackNotifications = [
  {
    id: 'NT-101',
    type: 'like',
    icon: '♡',
    title: 'Mira liked your post',
    desc: 'Your creator post is getting strong engagement.',
    isRead: false
  },
  {
    id: 'NT-102',
    type: 'comment',
    icon: '💬',
    title: 'Dev commented on your reel',
    desc: 'This reel style looks premium and powerful.',
    isRead: false
  },
  {
    id: 'NT-103',
    type: 'follow',
    icon: '＋',
    title: 'Sara started following you',
    desc: 'You have a new creator follower.',
    isRead: false
  }
];

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/notifications`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        unreadCount: fallbackNotifications.filter((item) => !item.isRead).length,
        notifications: fallbackNotifications
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'backend',
      unreadCount: data.unreadCount || 0,
      notifications: data.notifications || fallbackNotifications
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      unreadCount: fallbackNotifications.filter((item) => !item.isRead).length,
      notifications: fallbackNotifications
    });
  }
}
