import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Mock data - replace with real database call
    const labFeed = [
      {
        id: 'alert-001',
        ioc: '192.168.4.17:445',
        type: 'IP:Port',
        severity: 'critical' as const
      },
      {
        id: 'alert-002',
        ioc: 'malware.exe',
        type: 'Filename',
        severity: 'high' as const
      },
      {
        id: 'alert-003',
        ioc: 'bad-domain.com',
        type: 'Domain',
        severity: 'medium' as const
      },
      {
        id: 'alert-004',
        ioc: 'suspicious-hash-123',
        type: 'Hash',
        severity: 'low' as const
      }
    ];

    return NextResponse.json(labFeed);
  } catch (error) {
    console.error('Error fetching lab feed:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab feed' },
      { status: 500 }
    );
  }
}
