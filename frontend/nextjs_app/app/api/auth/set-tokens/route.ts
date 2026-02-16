/**
 * Set auth cookies after MFA complete (or when tokens are obtained outside login API).
 * Middleware reads access_token cookie; without it, post-MFA redirect would send user back to login.
 */
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const access_token = body?.access_token;
    const refresh_token = body?.refresh_token;

    if (!access_token || typeof access_token !== 'string') {
      return NextResponse.json(
        { error: 'Missing access_token' },
        { status: 400 }
      );
    }

    const nextResponse = NextResponse.json({ ok: true }, { status: 200 });

    nextResponse.cookies.set('access_token', access_token, {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
      path: '/',
    });

    if (refresh_token && typeof refresh_token === 'string') {
      nextResponse.cookies.set('refresh_token', refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30,
        path: '/',
      });
    }

    return nextResponse;
  } catch (e) {
    console.error('[set-tokens] Error:', e);
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
}
