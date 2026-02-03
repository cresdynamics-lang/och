import { NextResponse } from 'next/server';

export async function GET(request: Request, { params }: { params: { userId: string } }) {
  try {
    // Mock CSV data - replace with real data from database
    const csvData = `Date,Description,Amount,Currency,Category
${new Date().toISOString().split('T')[0]},Cohort Revenue,3200000,KES,Revenue
${new Date().toISOString().split('T')[0]},Pro7 Subscription,1270000,KES,Revenue
${new Date().toISOString().split('T')[0]},Placement Fees,600000,KES,Revenue
${new Date().toISOString().split('T')[0]},MTN Invoice Payment,-500000,KES,Expenses
${new Date().toISOString().split('T')[0]},Vodacom Invoice Payment,-300000,KES,Expenses
${new Date().toISOString().split('T')[0]},Ecobank Invoice Payment,-200000,KES,Expenses
${new Date().toISOString().split('T')[0]},Payroll,0,KES,Expenses
${new Date().toISOString().split('T')[0]},Office Rent,0,KES,Expenses`;

    const response = new NextResponse(csvData);
    response.headers.set('Content-Type', 'text/csv');
    response.headers.set('Content-Disposition', `attachment; filename="och-finance-${new Date().toISOString().split('T')[0]}.csv"`);

    return response;
  } catch (error) {
    console.error('CSV export error:', error);
    return NextResponse.json({ error: 'Failed to export CSV' }, { status: 500 });
  }
}
