import { NextRequest, NextResponse } from 'next/server';

/**
 * Finance realtime API
 * Uses real Django data for high-level finance metrics and recent invoice activity.
 *
 * Shape is designed to match what the finance dashboard expects, but all
 * numbers come from real backend endpoints (no hardcoded mock data).
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
    const meResp = await fetch(`${djangoUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: authHeaders,
      credentials: 'include',
    });

    if (!meResp.ok) {
      console.error('Finance realtime API: /auth/me failed', meResp.status);
      return NextResponse.json(
        {
          lastUpdate: new Date().toISOString(),
          pipelineUpdates: [],
          invoiceUpdates: [],
          metrics: {
            activePlacements: 0,
            pendingInvoices: 0,
            monthlyRevenue: 0,
            conversionRate: 0,
          },
        },
        { status: 200 }
      );
    }

    const me = await meResp.json();
    const sponsorOrgs = me?.sponsor_organizations || [];
    const primarySponsor = sponsorOrgs[0];
    const sponsorSlug = primarySponsor?.slug as string | undefined;

    let overview: any = null;
    if (sponsorSlug) {
      const financeResp = await fetch(`${djangoUrl}/api/sponsors/${sponsorSlug}/finance`, {
        method: 'GET',
        headers: authHeaders,
        credentials: 'include',
      });
      if (financeResp.ok) overview = await financeResp.json();
    } else {
      // Platform Finance: use cross-sponsor overview
      const platformResp = await fetch(`${djangoUrl}/api/v1/finance/platform/overview/`, {
        method: 'GET',
        headers: authHeaders,
        credentials: 'include',
      });
      if (platformResp.ok) overview = await platformResp.json();
    }

    // Fetch sponsor invoices (uses RBAC on Django side)
    let invoices: any[] = [];
    try {
      const invoicesResp = await fetch(`${djangoUrl}/api/v1/billing/invoices/`, {
        method: 'GET',
        headers: authHeaders,
        credentials: 'include',
      });

      if (invoicesResp.ok) {
        const invoicesJson = await invoicesResp.json();
        invoices = Array.isArray(invoicesJson.invoices) ? invoicesJson.invoices : [];
      } else {
        console.error('Finance realtime API: /billing/invoices failed', invoicesResp.status);
      }
    } catch (invoiceErr) {
      console.error('Finance realtime API: error fetching invoices', invoiceErr);
    }

    const totalHires = Number(overview?.total_hires || 0);
    const totalPlatformCost = Number(overview?.total_platform_cost || 0);

    const pendingInvoices = invoices.filter((inv: any) =>
      ['pending', 'due', 'overdue'].includes(String(inv?.payment_status || '').toLowerCase())
    );

    const paidInvoices = invoices.filter((inv: any) =>
      ['paid', 'settled'].includes(String(inv?.payment_status || '').toLowerCase())
    );

    const totalInvoices = invoices.length || 1; // avoid division by zero
    const conversionRate = Math.round((paidInvoices.length / totalInvoices) * 100);

    const invoiceUpdates = invoices
      .slice(0, 5)
      .map((inv: any) => ({
        id: inv.id,
        company: inv.cohort_name || inv.sponsor_name || 'Sponsor',
        amount: Number(inv.net_amount || 0),
        status: inv.payment_status,
        timestamp: inv.created_at,
      }));

    const payload = {
      lastUpdate: new Date().toISOString(),
      pipelineUpdates: [], // can be wired to a dedicated placements endpoint later
      invoiceUpdates,
      metrics: {
        activePlacements: totalHires,
        pendingInvoices: pendingInvoices.length,
        monthlyRevenue: totalPlatformCost,
        conversionRate: isFinite(conversionRate) ? conversionRate : 0,
      },
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error('Finance realtime API error:', error);
    return NextResponse.json(
      {
        lastUpdate: new Date().toISOString(),
        pipelineUpdates: [],
        invoiceUpdates: [],
        metrics: {
          activePlacements: 0,
          pendingInvoices: 0,
          monthlyRevenue: 0,
          conversionRate: 0,
        },
      },
      { status: 200 }
    );
  }
}

