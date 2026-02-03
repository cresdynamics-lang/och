import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    // Mock P&L data - replace with real financial calculations
    const plData = {
      period: "February 2026",
      revenue: {
        cohortRevenue: 3200000,
        pro7Subscriptions: 1270000,
        placementFees: 600000,
        total: 4970000
      },
      expenses: {
        salaries: 750000,
        rent: 150000,
        utilities: 50000,
        marketing: 100000,
        equipment: 25000,
        total: 1075000
      },
      profit: {
        grossProfit: 3895000,
        netProfit: 2820000,
        margin: 71.4
      }
    };

    // Generate CSV format for download
    const csvContent = `OCH PROFIT & LOSS STATEMENT - ${plData.period}
Period:,${plData.period}

REVENUE
Cohort Revenue:,KES ${plData.revenue.cohortRevenue.toLocaleString()}
Pro7 Subscriptions:,KES ${plData.revenue.pro7Subscriptions.toLocaleString()}
Placement Fees:,KES ${plData.revenue.placementFees.toLocaleString()}
Total Revenue:,KES ${plData.revenue.total.toLocaleString()}

EXPENSES
Salaries:,KES ${plData.expenses.salaries.toLocaleString()}
Rent:,KES ${plData.expenses.rent.toLocaleString()}
Utilities:,KES ${plData.expenses.utilities.toLocaleString()}
Marketing:,KES ${plData.expenses.marketing.toLocaleString()}
Equipment:,KES ${plData.expenses.equipment.toLocaleString()}
Total Expenses:,KES ${plData.expenses.total.toLocaleString()}

PROFIT
Gross Profit:,KES ${plData.profit.grossProfit.toLocaleString()}
Net Profit:,KES ${plData.profit.netProfit.toLocaleString()}
Profit Margin:,${plData.profit.margin}%
`;

    const response = new NextResponse(csvContent);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', `attachment; filename="och-pl-statement-${new Date().toISOString().split('T')[0]}.csv"`);

    return response;
  } catch (error) {
    console.error('P&L statement error:', error);
    return NextResponse.json({ error: 'Failed to generate P&L statement' }, { status: 500 });
  }
}
