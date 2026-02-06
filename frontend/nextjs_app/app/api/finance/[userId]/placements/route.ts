import { NextRequest, NextResponse } from 'next/server';

// Mock placements data
const mockPlacementsData = [
  {
    id: 'PL-001',
    candidate: 'John Doe',
    company: 'MTN',
    position: 'SOC L1 Analyst',
    salary: 150000,
    stage: 'Offer Extended',
    probability: 90,
    lastUpdate: new Date(Date.now() - 2 * 60 * 1000).toISOString()
  },
  {
    id: 'PL-002',
    candidate: 'Jane Smith',
    company: 'Vodacom',
    position: 'Security Engineer',
    salary: 200000,
    stage: 'Interview',
    probability: 75,
    lastUpdate: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  },
  {
    id: 'PL-003',
    candidate: 'Mike Johnson',
    company: 'Ecobank',
    position: 'Cybersecurity Analyst',
    salary: 180000,
    stage: 'Screening',
    probability: 60,
    lastUpdate: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // In a real implementation, you would query the database for placements data
    return NextResponse.json(mockPlacementsData);
  } catch (error) {
    console.error('Finance placements API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch placements data' },
      { status: 500 }
    );
  }
}
