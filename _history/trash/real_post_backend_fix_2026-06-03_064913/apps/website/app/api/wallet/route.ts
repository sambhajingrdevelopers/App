import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.EC2_BACKEND_URL || 'http://43.205.145.63:8003';

const fallbackWallet = {
  totalEarnings: 42800,
  availableBalance: 18500,
  pendingPayout: 7000,
  thisMonth: 12400,
  currency: '₹'
};

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/api/v1/wallet`, {
      cache: 'no-store'
    });

    const data = await response.json();

    return NextResponse.json({
      success: true,
      source: response.ok ? 'platform' : 'fallback',
      wallet: data.wallet || fallbackWallet,
      transactions: data.transactions || [],
      payouts: data.payouts || []
    });
  } catch {
    return NextResponse.json({
      success: true,
      source: 'fallback',
      wallet: fallbackWallet,
      transactions: [],
      payouts: []
    });
  }
}
