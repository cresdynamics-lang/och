import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const djangoUrl =
    process.env.DJANGO_API_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    'http://localhost:8000';

  const cookie = request.headers.get('cookie') ?? '';
  const accessToken = request.cookies.get('access_token')?.value ?? '';
  const authHeaders: Record<string, string> = { Cookie: cookie };
  if (accessToken) authHeaders['Authorization'] = `Bearer ${accessToken}`;

  try {
    const resp = await fetch(`${djangoUrl}/api/v1/subscription/plans`, {
      method: 'GET',
      headers: authHeaders,
      credentials: 'include',
    });

    if (!resp.ok) {
      console.error('Subscriptions API error:', resp.status);
      return NextResponse.json({ plans: [] }, { status: 200 });
    }

    const plans = await resp.json();
    return NextResponse.json({ plans: Array.isArray(plans) ? plans : [] });
  } catch (error) {
    console.error('Subscriptions API error:', error);
    return NextResponse.json({ plans: [] }, { status: 200 });
  }
}
