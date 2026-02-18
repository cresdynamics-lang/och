/**
 * Proxy for POST /api/v1/profiling/session/start
 * Starts a new profiling session via FastAPI
 */

import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8000';

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  try {
    const body = await request.json();
    
    const res = await fetch(`${FASTAPI_URL}/api/v1/profiling/session/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to start profiling session' }));
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[profiling/session/start] FastAPI error:', err?.message || err);
    return NextResponse.json(
      { error: 'Unable to connect to profiling service. Please ensure FastAPI is running.' },
      { status: 503 }
    );
  }
}
