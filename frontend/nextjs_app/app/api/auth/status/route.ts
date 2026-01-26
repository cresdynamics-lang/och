/**
 * Next.js API Route: Auth Status
 * Returns current authentication status
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAccessToken } from '@/utils/auth';

export async function GET(request: NextRequest) {
  try {
    const token = getAccessToken();

    if (!token) {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }

    // Try to get user info from Django
    const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
    const response = await fetch(`${DJANGO_API_URL}/api/v1/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const user = await response.json();
      return NextResponse.json({
        authenticated: true,
        user,
      });
    } else {
      return NextResponse.json({
        authenticated: false,
        user: null,
      });
    }
  } catch (error) {
    console.error('Auth status error:', error);
    return NextResponse.json({
      authenticated: false,
      user: null,
      error: 'Failed to check authentication status',
    }, { status: 500 });
  }
}
