import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const djangoUrl =
    process.env.DJANGO_API_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    'http://localhost:8000';

  const { searchParams } = new URL(request.url);
  const plan = searchParams.get('plan');

  const cookie = request.headers.get('cookie') ?? '';
  const accessToken = request.cookies.get('access_token')?.value ?? '';
  const authHeaders: Record<string, string> = { Cookie: cookie };
  if (accessToken) authHeaders['Authorization'] = `Bearer ${accessToken}`;

  try {
    const url = plan 
      ? `${djangoUrl}/api/v1/subscription/users?plan=${plan}`
      : `${djangoUrl}/api/v1/subscription/users`;

    const resp = await fetch(url, {
      method: 'GET',
      headers: authHeaders,
      credentials: 'include',
    });

    if (!resp.ok) {
      console.error('Subscription users API error:', resp.status);
      return NextResponse.json([], { status: 200 });
    }

    const data = await resp.json();
    return NextResponse.json(Array.isArray(data) ? data : []);
  } catch (error) {
    console.error('Subscription users API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
