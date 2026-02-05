import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/recipes/env-status
 * Proxy to Django backend to check AI environment configuration status
 */
export async function GET(request: NextRequest) {
  try {
    const DJANGO_API_URL = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';
    
    // Proxy request to Django backend
    const response = await fetch(`${DJANGO_API_URL}/api/v1/recipes/env-status/`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Django API returned ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);

  } catch (error) {
    console.error('Error checking environment status from Django:', error);
    
    // Return fallback status on error
    return NextResponse.json(
      { 
        grok: false, 
        llama: false, 
        supabase: false,
        openai: false,
        model: 'gpt-4',
        error: 'Failed to connect to backend' 
      },
      { status: 500 }
    );
  }
}
