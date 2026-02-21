import { NextRequest, NextResponse } from 'next/server';

/**
 * Finance placements API
 * Returns real placement/billing data from Django billing/invoices.
 * Tracks sponsor-funded seats and financial status (consumed, pending, refunded).
 */
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
    const invoicesResp = await fetch(`${djangoUrl}/api/v1/billing/invoices/`, {
      method: 'GET',
      headers: authHeaders,
      credentials: 'include',
    });

    if (!invoicesResp.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const { invoices } = await invoicesResp.json();
    const list = Array.isArray(invoices) ? invoices : [];

    const placements = list.map((inv: any) => ({
      id: inv.id,
      sponsor_name: inv.sponsor_name,
      cohort_name: inv.cohort_name,
      cohort_id: inv.cohort_id,
      amount: Number(inv.net_amount || 0),
      status: String(inv.payment_status || 'pending').toLowerCase(),
      billing_month: inv.billing_month,
      students_active: inv.students_active ?? 0,
      hires: inv.hires ?? 0,
      source: inv.source || 'billing',
    }));

    return NextResponse.json(placements);
  } catch (error) {
    console.error('Finance placements API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

