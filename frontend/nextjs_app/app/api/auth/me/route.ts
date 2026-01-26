/**
 * Next.js API Route: Get Current User
 * Returns user data for authenticated requests
 */

import { NextRequest, NextResponse } from 'next/server';

// Mock user database for development
const mockUsers: Record<string, any> = {
  'ongoza@gmail.com': {
    id: 'ongoza@gmail.com',
    email: 'ongoza@gmail.com',
    first_name: 'Ongoza',
    last_name: '',
    account_status: 'active',
    roles: ['student'],
    consent_scopes: [],
    entitlements: ['recipe_access', 'basic_features']
  },
  'ongozacyberhub@gmail.com': {
    id: 'ongozacyberhub@gmail.com',
    email: 'ongozacyberhub@gmail.com',
    first_name: 'Ongoza',
    last_name: 'CyberHub',
    account_status: 'active',
    roles: ['student'],
    consent_scopes: [],
    entitlements: ['recipe_access', 'basic_features']
  },
  'admin@ongozacyberhub.com': {
    id: 'admin@ongozacyberhub@gmail.com',
    email: 'admin@ongozacyberhub.com',
    first_name: 'Admin',
    last_name: 'User',
    account_status: 'active',
    roles: ['admin'],
    consent_scopes: [],
    entitlements: ['full_access', 'admin_features']
  }
};

export async function GET(request: NextRequest) {
  try {
    // Check for access token in cookies
    const accessToken = request.cookies.get('access_token')?.value;

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Extract user email from token (our tokens are in format: dev_access_email@domain.com_timestamp)
    const emailMatch = accessToken.match(/dev_access_(.+?)_\d+$/);
    const userEmail = emailMatch ? emailMatch[1] : null;

    if (!userEmail) {
      return NextResponse.json(
        { error: 'Invalid token format' },
        { status: 401 }
      );
    }

    if (!userEmail || !mockUsers[userEmail]) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 401 }
      );
    }

    const user = mockUsers[userEmail];

    // Return user data in the format expected by the client
    return NextResponse.json({
      user: user,
      roles: user.roles,
      consent_scopes: user.consent_scopes,
      entitlements: user.entitlements
    });

  } catch (error: any) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
