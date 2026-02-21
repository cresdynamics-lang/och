import { NextRequest, NextResponse } from 'next/server';

/**
 * Finance sponsors API
 * Returns real sponsor invoice data from Django's billing endpoints.
 */
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
    const invoicesResp = await fetch(`${djangoUrl}/api/v1/billing/invoices/`, {
      method: 'GET',
      headers: authHeaders,
      credentials: 'include',
    });

    if (!invoicesResp.ok) {
      console.error('Finance sponsors API: /billing/invoices failed', invoicesResp.status);
      return NextResponse.json([], { status: 200 });
    }

    const invoicesJson = await invoicesResp.json();
    const invoices = Array.isArray(invoicesJson.invoices) ? invoicesJson.invoices : [];

    const sponsors = invoices.map((inv: any) => ({
      id: inv.id,
      name: inv.sponsor_name
        ? `${inv.sponsor_name} • ${(inv.cohort_name || '').trim()}`.trim() || inv.sponsor_name
        : inv.cohort_name || inv.sponsor_name || 'Sponsor',
      amount: Number(inv.net_amount || 0),
      status: String(inv.payment_status || 'pending').toLowerCase(),
      dueDate: inv.billing_month,
      lastPayment: inv.invoice_generated ? inv.invoice_generated : inv.created_at,
    }));

    return NextResponse.json(sponsors);
  } catch (error) {
    console.error('Finance sponsors API error:', error);
    return NextResponse.json([], { status: 200 });
  }
}

