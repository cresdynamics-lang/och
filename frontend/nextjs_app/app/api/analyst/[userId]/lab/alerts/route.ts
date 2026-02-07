import { NextRequest, NextResponse } from 'next/server';

// Mock data for lab alerts - replace with real database queries
const generateLabAlerts = () => [
  {
    id: "lab-456",
    ioc: "192.168.4.17:445",
    title: "Ransomware - Ryuk Family Match",
    severity: "critical" as const,
    source: "MTN Lab - SMB Exploit",
    age: "LIVE",
    primaryAction: "TRIAGE NOW",
    sigmaRule: "ryuk.exe",
    mitre: "TA0008 Lateral Movement"
  },
  {
    id: "lab-457",
    ioc: "malicious-domain.com",
    title: "Phishing Campaign - Credential Harvesting",
    severity: "high" as const,
    source: "Corporate Email - Suspicious Link",
    age: "2 min ago",
    primaryAction: "INVESTIGATE",
    sigmaRule: "phishing_detection",
    mitre: "TA0001 Initial Access"
  },
  {
    id: "lab-458",
    ioc: "10.0.0.5:3389",
    title: "Brute Force RDP Attack",
    severity: "high" as const,
    source: "External Firewall - Port 3389",
    age: "5 min ago",
    primaryAction: "BLOCK IP",
    sigmaRule: "rdp_brute_force",
    mitre: "TA0006 Credential Access"
  },
  {
    id: "lab-459",
    ioc: "suspicious-file.exe",
    title: "Malware - Unknown Signature",
    severity: "medium" as const,
    source: "Endpoint Protection - File Scan",
    age: "12 min ago",
    primaryAction: "ANALYZE",
    sigmaRule: "unknown_malware",
    mitre: "TA0002 Execution"
  },
  {
    id: "lab-460",
    ioc: "unusual-traffic.net",
    title: "Data Exfiltration Attempt",
    severity: "medium" as const,
    source: "Network IDS - Large Upload",
    age: "18 min ago",
    primaryAction: "MONITOR",
    sigmaRule: "data_exfil",
    mitre: "TA0010 Exfiltration"
  }
];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    // Simulate some processing time
    await new Promise(resolve => setTimeout(resolve, 100));

    const allAlerts = generateLabAlerts();

    // Add some randomization for demo purposes
    const criticalAlerts = allAlerts.filter(alert => alert.severity === 'critical');
    const highAlerts = allAlerts.filter(alert => alert.severity === 'high');

    return NextResponse.json({
      total: allAlerts.length,
      critical: criticalAlerts.length,
      high: highAlerts.length,
      criticalAlerts: criticalAlerts.slice(0, 5) // Return first 5 critical alerts
    });
  } catch (error) {
    console.error('Error fetching lab alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lab alerts' },
      { status: 500 }
    );
  }
}
