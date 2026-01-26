/**
 * Next.js API Route: Logout
 * Clears auth cookies and invalidates session
 */

import { NextRequest, NextResponse } from 'next/server';
import { clearServerAuthTokens, getServerRefreshToken } from '@/utils/auth-server';
import { djangoClient } from '@/services/djangoClient';

export async function POST(_request: NextRequest) {
  try {
    // Get refresh token and call Django logout
    const refreshToken = await getServerRefreshToken();
    if (refreshToken) {
      try {
        await djangoClient.auth.logout(refreshToken);
      } catch (error) {
        // Continue with logout even if API call fails
        console.error('Logout API error:', error);
      }
    }

    // Clear cookies
    await clearServerAuthTokens();

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Still clear cookies even if there's an error
    await clearServerAuthTokens();
    return NextResponse.json(
      { error: error.message || 'Logout failed' },
      { status: 500 }
    );
  }
}

