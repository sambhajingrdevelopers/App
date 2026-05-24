import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackCreators = [
  { id: 'CR-101', name: 'VibeLoop Creator', username: '@you', category: 'Digital Creator', followers: 52800, isFollowing: false },
  { id: 'CR-102', name: 'Creator Studio', username: '@you', category: 'Travel Creator', followers: 42100, isFollowing: false },
  { id: 'CR-103', name: 'Content Hub', username: '@you', category: 'Lifestyle Creator', followers: 31800, isFollowing: false },
  { id: 'CR-104', name: 'Style Loop', username: '@styleloop', category: 'Fashion Brand', followers: 76400, isFollowing: false }
];

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/creators`, {
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json({
        success: true,
        source: 'fallback',
        creators: fallbackCreators,
        followingCount: 0
      });
    }

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: 'platform',
      creators: data.creators || fallbackCreators,
      followingCount: data.followingCount || 0
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      creators: fallbackCreators,
      followingCount: 0
    });
  }
}
