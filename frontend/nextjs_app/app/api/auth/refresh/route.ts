/**
 * Next.js API Route: Refresh Token
 * Refreshes access token and updates cookies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerRefreshToken, setServerAuthTokens, clearServerAuthTokens } from '@/utils/auth-server';
import { djangoClient } from '@/services/djangoClient';

export async function POST(_request: NextRequest) {
  try {
    const refreshToken = await getServerRefreshToken();
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available' },
        { status: 401 }
      );
    }

    // Call Django API to refresh token
    const response = await djangoClient.auth.refreshToken({
      refresh_token: refreshToken,
    });

    // Update cookies with new tokens
    await setServerAuthTokens(response.access_token, response.refresh_token);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    // Clear tokens if refresh fails
    await clearServerAuthTokens();
    return NextResponse.json(
      { error: error.message || 'Token refresh failed' },
      { status: error.status || 401 }
    );
  }
}

