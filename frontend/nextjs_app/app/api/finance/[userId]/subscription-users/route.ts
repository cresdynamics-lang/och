import { NextRequest, NextResponse } from 'next/server';

/** Subscription prices from Django are in USD; finance dashboard displays KES. Same rate as subscriptions route. */
const USD_TO_KES = Number(process.env.USD_TO_KES_RATE || process.env.NEXT_PUBLIC_USD_TO_KES || 130);

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
    const list = Array.isArray(data) ? data : [];
    // Convert price_monthly from USD to KES for finance display
    const users = list.map((sub: { price_monthly?: number; [k: string]: unknown }) => ({
      ...sub,
      price_monthly: Math.round((Number(sub.price_monthly ?? 0) * USD_TO_KES) * 100) / 100,
    }));
    return NextResponse.json(users);
  } catch (error) {
    console.error('Subscription users API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}
