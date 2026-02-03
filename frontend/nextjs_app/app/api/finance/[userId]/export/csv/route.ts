import { NextRequest, NextResponse } from 'next/server';

// Generate CSV data for QuickBooks export
function generateQuickBooksCSV(revenueData: any) {
  const headers = [
    'Date',
    'Description',
    'Amount',
    'Category',
    'Customer',
    'Type'
  ];

  const rows = [
    // Revenue entries
    [`${new Date().toISOString().split('T')[0]}`, 'Cohort Revenue', revenueData.cohort.toString(), 'Revenue', 'OCH Program', 'Income'],
    [`${new Date().toISOString().split('T')[0]}`, 'Placement Fees', revenueData.placements.toString(), 'Revenue', 'OCH Program', 'Income'],
    [`${new Date().toISOString().split('T')[0]}`, 'Pro7 Subscription', revenueData.pro7.toString(), 'Revenue', 'OCH Program', 'Income'],

    // Sample expense entries
    [`${new Date().toISOString().split('T')[0]}`, 'Server Hosting', '-15000', 'Expenses', 'OCH Program', 'Expense'],
    [`${new Date().toISOString().split('T')[0]}`, 'Marketing', '-25000', 'Expenses', 'OCH Program', 'Expense'],
    [`${new Date().toISOString().split('T')[0]}`, 'Office Rent', '-30000', 'Expenses', 'OCH Program', 'Expense'],
  ];

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csvContent;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // Mock revenue data - replace with real database queries
    const revenueData = {
      total: 4970000,
      cohort: 3200000,
      placements: 600000,
      pro7: 1270000,
      roi: 4.2,
      activeUsers: 127,
      placementsCount: 12
    };

    const csvContent = generateQuickBooksCSV(revenueData);

    const response = new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="och-finance-${new Date().toISOString().split('T')[0]}.csv"`
      }
    });

    return response;
  } catch (error) {
    console.error('Finance CSV export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate CSV export' },
      { status: 500 }
    );
  }
}
