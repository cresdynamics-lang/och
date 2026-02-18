/**
 * Proxy for GET /api/v1/profiling/enhanced/questions
 * Returns profiling questions from FastAPI
 */

import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/profiling/enhanced/questions`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to load profiling questions' }));
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.error('[profiling/enhanced/questions] FastAPI error:', err?.message || err);
    return NextResponse.json(
      { error: 'Unable to connect to profiling service. Please ensure FastAPI is running.' },
      { status: 503 }
    );
  }
}
