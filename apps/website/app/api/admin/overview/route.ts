import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';
const ADMIN_API_KEY = process.env.ADMIN_API_KEY || 'CHANGE_ME_ADMIN_KEY';

const fallback = {
  success: true,
  source: 'fallback',
  analytics: {
    totalUsers: 4,
    totalReports: 3,
    pendingReports: 3,
    verificationRequests: 3,
    pendingVerification: 2,
    adsRevenue: '₹48,920',
    systemHealth: '99%',
    platformStatus: 'Fallback'
  },
  users: [
    { id: 'USR-101', name: 'VibeLoop Creator', username: '@you', email: 'mira@vibeloop.com', status: 'Active', role: 'Creator' },
    { id: 'USR-102', name: 'Creator Studio', username: '@you', email: 'dev@vibeloop.com', status: 'Active', role: 'Creator' }
  ],
  reports: [
    { id: 'RPT-101', username: '@unknown.user', reason: 'Spam content', status: 'Pending' },
    { id: 'RPT-102', username: '@fake.brand', reason: 'Fake business account', status: 'Review' }
  ],
  verification: [
    { id: 'VR-301', username: '@you', category: 'Digital Creator', status: 'Pending' },
    { id: 'VR-302', username: '@you', category: 'Travel Creator', status: 'Approved' }
  ],
  ads: [
    { id: 'AD-501', title: 'Creator Boost Campaign', budget: '₹12,500', status: 'Running', progress: 72 },
    { id: 'AD-502', title: 'Reels Discovery Campaign', budget: '₹8,000', status: 'Scheduled', progress: 46 }
  ]
};

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/admin/overview`, {
      headers: { 'X-Admin-Api-Key': ADMIN_API_KEY },
      method: 'GET',
      cache: 'no-store'
    });

    if (!response.ok) {
      return NextResponse.json(fallback);
    }

    const data = await response.json();

    return NextResponse.json({
      ...data,
      source: 'platform'
    });
  } catch {
    return NextResponse.json(fallback);
  }
}
