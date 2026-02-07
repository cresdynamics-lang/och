import { NextRequest, NextResponse } from 'next/server';

// Generate HTML content for ROI PDF
function generateROIPDFContent(revenueData: any) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <title>OCH Finance ROI Report</title>
        <style>
            body {
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
                margin: 0;
                padding: 40px;
                color: #1e293b;
                background: white;
            }
            .header {
                text-align: center;
                border-bottom: 3px solid #0ea5e9;
                padding-bottom: 20px;
                margin-bottom: 40px;
            }
            .logo {
                font-size: 28px;
                font-weight: bold;
                color: #0ea5e9;
                margin-bottom: 10px;
            }
            .subtitle {
                color: #64748b;
                font-size: 16px;
            }
            .metrics-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 30px;
                margin: 40px 0;
            }
            .metric-card {
                background: #f8fafc;
                border: 1px solid #e2e8f0;
                border-radius: 12px;
                padding: 24px;
                text-align: center;
            }
            .metric-value {
                font-size: 32px;
                font-weight: bold;
                color: #0ea5e9;
                margin-bottom: 8px;
            }
            .metric-label {
                color: #64748b;
                font-size: 14px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .breakdown {
                margin: 40px 0;
            }
            .breakdown h3 {
                color: #1e293b;
                margin-bottom: 20px;
                font-size: 20px;
            }
            .breakdown-item {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #e2e8f0;
            }
            .breakdown-item:last-child {
                border-bottom: none;
            }
            .breakdown-value {
                font-weight: bold;
                color: #0ea5e9;
            }
            .footer {
                margin-top: 60px;
                text-align: center;
                color: #64748b;
                font-size: 12px;
                border-top: 1px solid #e2e8f0;
                padding-top: 20px;
            }
        </style>
    </head>
    <body>
        <div class="header">
            <div class="logo">Ongoza CyberHub</div>
            <div class="subtitle">Finance ROI Report - ${new Date().toLocaleDateString()}</div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">KES ${revenueData.total.toLocaleString()}</div>
                <div class="metric-label">Total Revenue</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${revenueData.roi}x</div>
                <div class="metric-label">ROI Multiple</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${revenueData.activeUsers}</div>
                <div class="metric-label">Active Users</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">${revenueData.placementsCount}</div>
                <div class="metric-label">Placements</div>
            </div>
        </div>

        <div class="breakdown">
            <h3>Revenue Breakdown</h3>
            <div class="breakdown-item">
                <span>Cohort Program Revenue</span>
                <span class="breakdown-value">KES ${revenueData.cohort.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
                <span>Placement Fees</span>
                <span class="breakdown-value">KES ${revenueData.placements.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
                <span>Pro7 Subscription Revenue</span>
                <span class="breakdown-value">KES ${revenueData.pro7.toLocaleString()}</span>
            </div>
            <div class="breakdown-item">
                <span><strong>Total Revenue</strong></span>
                <span class="breakdown-value"><strong>KES ${revenueData.total.toLocaleString()}</strong></span>
            </div>
        </div>

        <div class="footer">
            <p>Report generated on ${new Date().toLocaleString()} | Ongoza CyberHub Finance Team</p>
        </div>
    </body>
    </html>
  `;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
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

    const htmlContent = generateROIPDFContent(revenueData);

    // For now, return HTML. In production, you would use a library like Puppeteer
    // to convert HTML to PDF. Since this is a demo, we'll return the HTML content.

    const response = new NextResponse(htmlContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="och-roi-report-${new Date().toISOString().split('T')[0]}.html"`
      }
    });

    return response;
  } catch (error) {
    console.error('Finance PDF export error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF export' },
      { status: 500 }
    );
  }
}
