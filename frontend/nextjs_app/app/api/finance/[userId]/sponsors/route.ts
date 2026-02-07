import { NextRequest, NextResponse } from 'next/server';

// Mock sponsors data
const mockSponsorsData = [
  {
    name: 'MTN',
    amount: 500000,
    status: 'due',
    dueDate: '2025-02-15',
    contact: 'billing@mtn.co.ke',
    lastPayment: '2025-01-15'
  },
  {
    name: 'Vodacom',
    amount: 300000,
    status: 'paid',
    dueDate: '2025-01-30',
    contact: 'finance@vodacom.co.za',
    lastPayment: '2025-01-28'
  },
  {
    name: 'Ecobank',
    amount: 200000,
    status: 'overdue',
    dueDate: '2025-01-30',
    contact: 'accounts@ecobank.com',
    lastPayment: '2025-01-20'
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // In a real implementation, you would query the database for sponsors data
    return NextResponse.json(mockSponsorsData);
  } catch (error) {
    console.error('Finance sponsors API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sponsors data' },
      { status: 500 }
    );
  }
}
