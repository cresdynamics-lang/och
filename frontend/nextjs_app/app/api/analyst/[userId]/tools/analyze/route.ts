import { NextRequest, NextResponse } from 'next/server';
import type { ToolAnalysisRequest, ToolAnalysisResponse } from '@/types/analyst-tools';

// Mock Wireshark analysis
const analyzeWireshark = (payload: ToolAnalysisRequest['payload']): ToolAnalysisResponse => {
  return {
    results: [
      {
        id: 'result-1',
        type: 'IOC',
        severity: 'critical',
        description: 'Ryuk beacon detected on 192.168.4.17',
        ioc: '192.168.4.17:445',
        timestamp: new Date().toISOString(),
        metadata: {
          protocol: 'SMB',
          packetCount: 47,
        },
      },
      {
        id: 'result-2',
        type: 'Suspicious Activity',
        severity: 'high',
        description: 'Unusual SMB negotiation pattern',
        ioc: '192.168.4.17',
        timestamp: new Date().toISOString(),
      },
    ],
    mttrUpdate: '18min',
    metadata: {
      packetsAnalyzed: payload.packets || 47,
      executionTime: 1.2,
    },
  };
};

// Mock YARA rule testing
const analyzeYARA = (payload: ToolAnalysisRequest['payload']): ToolAnalysisResponse => {
  const ruleName = payload.ruleName || 'ryuk_network_beacon';
  
  return {
    results: [
      {
        id: 'match-1',
        type: 'YARA Match',
        severity: 'critical',
        description: `Rule "${ruleName}" matched on sample`,
        metadata: {
          ruleName,
          matches: [
            { file: 'sample.exe', offset: '0x1000', data: 'RYUK' },
          ],
        },
      },
    ],
    mttrUpdate: '18min',
    metadata: {
      rulesMatched: 1,
      executionTime: 0.8,
    },
  };
};

// Mock Sigma IOC search
const analyzeSigma = (payload: ToolAnalysisRequest['payload']): ToolAnalysisResponse => {
  const ioc = payload.ioc || '192.168.4.17';
  
  return {
    results: [
      {
        id: 'sigma-hit-1',
        type: 'Sigma Rule',
        severity: 'critical',
        description: '47 Sigma hits: ryuk.exe',
        ioc,
        metadata: {
          ruleId: 'sigma-ryuk-detection',
          ruleName: 'Ryuk Ransomware Detection',
          matchedFields: ['process.name', 'network.ip'],
        },
      },
      {
        id: 'sigma-hit-2',
        type: 'Sigma Rule',
        severity: 'high',
        description: 'Suspicious SMB activity detected',
        ioc,
        metadata: {
          ruleId: 'sigma-smb-anomaly',
          ruleName: 'SMB Anomaly Detection',
        },
      },
    ],
    mttrUpdate: '18min',
    metadata: {
      sigmaHits: 47,
      executionTime: 2.1,
    },
  };
};

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body: ToolAnalysisRequest = await request.json();

    // RBAC Check
    const userRole = 'analyst';
    if (userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Route to appropriate tool handler
    let response: ToolAnalysisResponse;

    switch (body.tool) {
      case 'wireshark':
        response = analyzeWireshark(body.payload);
        break;
      case 'yara':
        response = analyzeYARA(body.payload);
        break;
      case 'sigma':
        response = analyzeSigma(body.payload);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid tool type' },
          { status: 400 }
        );
    }

    // Audit log
    console.log(`AUDIT: ${new Date().toISOString()} - ${userId} - tool.analyze`, {
      tool: body.tool,
      resultsCount: response.results.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Tool analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze' },
      { status: 500 }
    );
  }
}

