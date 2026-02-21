import { NextRequest, NextResponse } from 'next/server';

/**
 * Create manual invoice via Django billing API (real data, no mock).
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  const djangoUrl =
    process.env.DJANGO_API_URL ||
    process.env.NEXT_PUBLIC_DJANGO_API_URL ||
    'http://localhost:8000';

  const cookie = request.headers.get('cookie') ?? '';
  const accessToken = request.cookies.get('access_token')?.value ?? '';
  const authHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    Cookie: cookie,
  };
  if (accessToken) authHeaders['Authorization'] = `Bearer ${accessToken}`;

  try {
    const body = await request.json();
    const payload = {
      client: body.client || '',
      amount: body.total ?? body.amount ?? 0,
      dueDate: body.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      items: Array.isArray(body.items) ? body.items : [],
    };

    const resp = await fetch(`${djangoUrl}/api/v1/billing/invoices/create/`, {
      method: 'POST',
      headers: authHeaders,
      credentials: 'include',
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      return NextResponse.json(
        { error: err.error || 'Failed to create invoice' },
        { status: resp.status }
      );
    }

    const invoice = await resp.json();
    return NextResponse.json({
      success: true,
      message: 'Invoice created successfully',
      invoice: {
        id: invoice.id,
        client: invoice.sponsor_name,
        amount: invoice.amount_kes,
        status: invoice.status,
        createdAt: invoice.created_at,
      },
    });
  } catch (error) {
    console.error('New invoice error:', error);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}
