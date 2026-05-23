import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.secure cloud_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackAnalytics = {
  profileViews: 128940,
  totalPosts: 24,
  savedPosts: 6,
  totalLikes: 48200,
  totalComments: 3200,
  totalReels: 12,
  reelViews: 284000,
  totalStories: 18,
  storyViews: 42900,
  followers: 52800,
  following: 320,
  engagementRate: 8.4,
  growth: [
    { label: 'Mon', views: 1200, likes: 240, followers: 40 },
    { label: 'Tue', views: 2200, likes: 420, followers: 66 },
    { label: 'Wed', views: 3100, likes: 610, followers: 88 },
    { label: 'Thu', views: 4200, likes: 850, followers: 110 },
    { label: 'Fri', views: 5900, likes: 1200, followers: 160 },
    { label: 'Sat', views: 7600, likes: 1650, followers: 220 },
    { label: 'Sun', views: 9800, likes: 2100, followers: 310 }
  ]
};

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/analytics`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        analytics: fallbackAnalytics
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'platform',
      analytics: data.analytics || fallbackAnalytics
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      analytics: fallbackAnalytics
    });
  }
}
