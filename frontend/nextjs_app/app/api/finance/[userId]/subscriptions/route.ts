import { NextRequest, NextResponse } from 'next/server';

/** Subscription plans are stored in USD; finance dashboard displays KES. Conversion rate (env or default). */
const USD_TO_KES = Number(process.env.USD_TO_KES_RATE || process.env.NEXT_PUBLIC_USD_TO_KES || 130);

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
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

    const rawPlans = await resp.json();
    const plansList = Array.isArray(rawPlans) ? rawPlans : [];
    // Backend returns price_monthly and revenue in USD; convert to KES for finance dashboard
    const plans = plansList.map((p: { revenue?: number; price_monthly?: number; [k: string]: unknown }) => ({
      ...p,
      price_monthly: Math.round((Number(p.price_monthly ?? 0) * USD_TO_KES) * 100) / 100,
      revenue: Math.round((Number(p.revenue ?? 0) * USD_TO_KES) * 100) / 100,
      subscription_currency: 'KES',
    }));
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('Subscriptions API error:', error);
    return NextResponse.json({ plans: [] }, { status: 200 });
  }
}
