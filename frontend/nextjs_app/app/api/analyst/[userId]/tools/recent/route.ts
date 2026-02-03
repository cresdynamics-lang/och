import { NextRequest, NextResponse } from 'next/server';

interface ToolUsage {
  toolId: string;
  toolName: string;
  recentQuery?: string;
  recentRule?: string;
  packetsCaptured?: number;
  recentThreat?: string;
  lastUsed: string;
}

interface ToolData {
  siem: ToolUsage | null;
  yara: ToolUsage | null;
  wireshark: ToolUsage | null;
  threatIntel: ToolUsage | null;
}

// Mock tool usage data - in production this would come from Prisma
const mockToolUsage: ToolUsage[] = [
  {
    toolId: 'siem',
    toolName: 'SIEM Query Builder',
    recentQuery: '192.168.4.17 | ryuk.exe',
    lastUsed: new Date(Date.now() - 30 * 60 * 1000).toISOString()
  },
  {
    toolId: 'yara',
    toolName: 'YARA Rule Editor',
    recentRule: 'ryuk_network_beacon',
    lastUsed: new Date(Date.now() - 45 * 60 * 1000).toISOString()
  },
  {
    toolId: 'wireshark',
    toolName: 'Wireshark Lab',
    packetsCaptured: 47,
    lastUsed: new Date(Date.now() - 15 * 60 * 1000).toISOString()
  },
  {
    toolId: 'threat-intel',
    toolName: 'Threat Intel Feed',
    recentThreat: 'APT28 | Ecobank Phishing',
    lastUsed: new Date(Date.now() - 60 * 60 * 1000).toISOString()
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    // In production, fetch from Prisma with userId filter
    // const toolUsage = await prisma.toolUsage.findMany({
    //   where: { userId: params.userId },
    //   orderBy: { lastUsed: 'desc' },
    //   take: 10
    // });

    // For now, return mock data
    const toolData: ToolData = {
      siem: mockToolUsage.find(t => t.toolId === 'siem') || {
        toolId: 'siem',
        toolName: 'SIEM Query Builder',
        recentQuery: 'index=mtu_lab sourcetype=smb',
        lastUsed: new Date().toISOString()
      },
      yara: mockToolUsage.find(t => t.toolId === 'yara') || {
        toolId: 'yara',
        toolName: 'YARA Rule Editor',
        recentRule: 'rule malware_detector',
        lastUsed: new Date().toISOString()
      },
      wireshark: mockToolUsage.find(t => t.toolId === 'wireshark') || {
        toolId: 'wireshark',
        toolName: 'Wireshark Lab',
        packetsCaptured: 0,
        lastUsed: new Date().toISOString()
      },
      threatIntel: mockToolUsage.find(t => t.toolId === 'threat-intel') || {
        toolId: 'threat-intel',
        toolName: 'Threat Intel Feed',
        recentThreat: 'No recent threats',
        lastUsed: new Date().toISOString()
      }
    };

    return NextResponse.json(toolData);
  } catch (error) {
    console.error('Error fetching tool usage data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tool usage data' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const body = await request.json();
    const { toolId, action, metadata } = body;

    // In production, save to Prisma
    // await prisma.toolUsage.create({
    //   data: {
    //     userId: params.userId,
    //     toolId,
    //     action,
    //     metadata,
    //     lastUsed: new Date()
    //   }
    // });

    // Mock response
    console.log(`Tool usage logged: ${toolId} - ${action}`, metadata);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error logging tool usage:', error);
    return NextResponse.json(
      { error: 'Failed to log tool usage' },
      { status: 500 }
    );
  }
}
