/**
 * Proxy for GET /api/v1/profiling/status
 * Tries FastAPI first; returns fallback when FastAPI is unavailable so the profiling page still loads.
 */

import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8001';

function fallbackStatus() {
  return NextResponse.json({
    completed: false,
    session_id: null,
    has_active_session: false,
    progress: null,
    completed_at: null,
  });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/profiling/status`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn('[profiling/status] FastAPI returned', res.status);
      return fallbackStatus();
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.warn('[profiling/status] FastAPI unavailable:', err?.message || err);
    return fallbackStatus();
  }
}
