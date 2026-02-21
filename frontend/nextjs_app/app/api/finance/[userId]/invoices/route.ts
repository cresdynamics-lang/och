import { NextRequest, NextResponse } from 'next/server';

/**
 * Finance invoices API
 * Returns full invoice records from Django billing/invoices including line items,
 * payment status (pending, paid, waived), and source (system-generated vs manual).
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
    const resp = await fetch(`${djangoUrl}/api/v1/billing/invoices/`, {
      method: 'GET',
      headers: authHeaders,
      credentials: 'include',
    });

    if (!resp.ok) {
      return NextResponse.json(
        { invoices: [], total_invoices: 0 },
        { status: 200 }
      );
    }

    const data = await resp.json();
    return NextResponse.json({
      invoices: Array.isArray(data.invoices) ? data.invoices : [],
      total_invoices: data.total_invoices ?? 0,
    });
  } catch (error) {
    console.error('Finance invoices API error:', error);
    return NextResponse.json(
      { invoices: [], total_invoices: 0 },
      { status: 200 }
    );
  }
}
