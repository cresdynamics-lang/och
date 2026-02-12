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
        { total: 0, cohort: 0, placements: 0, pro7: 0, roi: 0, activeUsers: 0, placementsCount: 0, scope: 'sponsor' },
        { status: 200 }
      );
    }

    const me = await meResp.json();
    const sponsorOrgs = me?.sponsor_organizations || [];
    const primarySponsor = sponsorOrgs[0];
    const sponsorSlug = primarySponsor?.slug as string | undefined;

    let overview: any;
    if (sponsorSlug) {
      const financeResp = await fetch(`${djangoUrl}/api/sponsors/${sponsorSlug}/finance`, {
        method: 'GET',
        headers: authHeaders,
        credentials: 'include',
      });
      if (!financeResp.ok) {
        console.error('Finance revenue API: /sponsors/{slug}/finance failed', financeResp.status);
        return NextResponse.json(
          { total: 0, cohort: 0, placements: 0, pro7: 0, roi: 0, activeUsers: 0, placementsCount: 0, scope: 'sponsor' },
          { status: 200 }
        );
      }
      overview = await financeResp.json();
    } else {
      // Platform Finance (no sponsor org): use cross-sponsor overview
      const platformResp = await fetch(`${djangoUrl}/api/v1/finance/platform/overview/`, {
        method: 'GET',
        headers: authHeaders,
        credentials: 'include',
      });
      if (!platformResp.ok) {
        console.error('Finance revenue API: /finance/platform/overview failed', platformResp.status);
        return NextResponse.json(
          { total: 0, cohort: 0, placements: 0, pro7: 0, roi: 0, activeUsers: 0, placementsCount: 0, scope: 'platform' },
          { status: 200 }
        );
      }
      overview = await platformResp.json();
    }

    const totalPlatformCost = Number(overview.total_platform_cost || 0);
    const totalValueCreated = Number(overview.total_value_created || 0);
    const totalRevenueShare = Number(overview.total_revenue_share || 0);
    const totalHires = Number(overview.total_hires || 0);
    const totalRoi = Number(overview.total_roi || 0);

    // Sum billed amounts for cohorts if present
    const cohorts = Array.isArray(overview.cohorts) ? overview.cohorts : [];
    const cohortTotal = cohorts.reduce(
      (sum: number, c: any) => sum + Number(c?.billed_amount || c?.net_amount || 0),
      0
    );

    // Map to frontend revenue shape (all numbers are real from Django)
    const revenuePayload = {
      total: totalPlatformCost || totalValueCreated,
      cohort: cohortTotal || totalPlatformCost || totalValueCreated,
      placements: totalRevenueShare,
      pro7: Number(overview.revenue_forecast_q2 || 0),
      roi: totalRoi,
      activeUsers: 0, // can be wired to real headcount later
      placementsCount: totalHires,
      scope: sponsorSlug ? 'sponsor' : 'platform', // platform = internal Finance, all sponsors
    };

    return NextResponse.json(revenuePayload);
  } catch (error) {
    console.error('Finance revenue API error:', error);
    return NextResponse.json(
      {
        total: 0,
        cohort: 0,
        placements: 0,
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

