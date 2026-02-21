import { NextRequest, NextResponse } from 'next/server';

/**
 * Finance revenue API
 * Connects the finance dashboard to real Django finance endpoints.
 *
 * - If user has sponsor_organizations: use /api/sponsors/{slug}/finance (sponsor-scoped).
 * - If user has no sponsor orgs (platform/internal Finance): use /api/v1/finance/platform/overview.
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
    const meResp = await fetch(`${djangoUrl}/api/v1/auth/me`, {
      method: 'GET',
      headers: authHeaders,
      credentials: 'include',
    });

    if (!meResp.ok) {
      console.error('Finance revenue API: /auth/me failed', meResp.status);
      return NextResponse.json(
        { total: 0, cohort: 0, placements: 0, subscriptions: 0, pro7: 0, roi: 0, activeUsers: 0, placementsCount: 0, scope: 'sponsor' },
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
      else console.error('Finance revenue API: /sponsors/{slug}/finance failed', financeResp.status);
    } else {
      const platformResp = await fetch(`${djangoUrl}/api/v1/finance/platform/overview/`, {
        method: 'GET',
        headers: authHeaders,
        credentials: 'include',
      });
      if (platformResp.ok) overview = await platformResp.json();
      else console.error('Finance revenue API: /finance/platform/overview failed', platformResp.status);
    }

    const totalPlatformCost = Number(overview?.total_platform_cost || 0);
    const totalValueCreated = Number(overview?.total_value_created || 0);
    const totalRevenueShare = Number(overview?.total_revenue_share || 0);
    const totalHires = Number(overview?.total_hires || 0);
    const totalRoi = Number(overview?.total_roi || 0);

    const cohorts = Array.isArray(overview?.cohorts) ? overview.cohorts : [];
    const cohortTotal = cohorts.reduce(
      (sum: number, c: any) => sum + Number(c?.billed_amount || c?.net_amount || 0),
      0
    );

    // Always fetch subscription data so dashboard shows revenue even when billing overview fails or is empty
    const USD_TO_KES = Number(process.env.USD_TO_KES_RATE || process.env.NEXT_PUBLIC_USD_TO_KES || 130);
    let subscriptionTotal = 0;
    let activeUsers = 0;
    try {
      const plansResp = await fetch(`${djangoUrl}/api/v1/subscription/plans`, {
        method: 'GET',
        headers: authHeaders,
        credentials: 'include',
      });
      if (plansResp.ok) {
        const plans = await plansResp.json();
        const plansList = Array.isArray(plans) ? plans : [];
        const usdTotal = plansList.reduce((s: number, p: any) => s + Number(p.revenue || 0), 0);
        subscriptionTotal = Math.round(usdTotal * USD_TO_KES * 100) / 100;
        activeUsers = plansList.reduce((s: number, p: any) => s + Number(p.users || 0), 0);
      }
    } catch (_) {
      // Subscription service optional
    }

    const billingTotal = totalPlatformCost || totalValueCreated || cohortTotal;
    const total = billingTotal + subscriptionTotal;

    // Map to frontend revenue shape (all numbers from real Django APIs)
    const revenuePayload = {
      total,
      cohort: cohortTotal || totalPlatformCost || totalValueCreated,
      placements: totalRevenueShare,
      subscriptions: subscriptionTotal,
      pro7: Number(overview?.revenue_forecast_q2 || 0),
      roi: totalRoi,
      activeUsers,
      placementsCount: totalHires,
      scope: sponsorSlug ? 'sponsor' : 'platform',
    };

    return NextResponse.json(revenuePayload);
  } catch (error) {
    console.error('Finance revenue API error:', error);
    return NextResponse.json(
      {
        total: 0,
        cohort: 0,
        placements: 0,
        subscriptions: 0,
        pro7: 0,
        roi: 0,
        activeUsers: 0,
        placementsCount: 0,
        scope: 'sponsor',
      },
      { status: 200 }
    );
  }
}

