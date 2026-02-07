import { NextRequest, NextResponse } from 'next/server';

// Mock resume generation function
const generateResumePDF = async (userId: string): Promise<Buffer> => {
  // In production, this would:
  // 1. Fetch user profile data
  // 2. Generate PDF using a library like Puppeteer or PDFKit
  // 3. Include portfolio, certifications, projects, etc.

  // For now, return a mock PDF buffer
  const mockResumeContent = `
    OCH DEFENDER TRACK RESUME
    =========================

    User ID: ${userId}
    Generated: ${new Date().toISOString()}

    EDUCATION
    ---------
    Bachelor of Science in Cybersecurity
    University of Nairobi (Expected 2026)

    CERTIFICATIONS
    -------------
    • CompTIA Security+ (2025)
    • SOC Level 1 Certification (2025)
    • CISSP (In Progress)

    SKILLS
    ------
    • SIEM Tools (Splunk, ELK Stack)
    • Threat Detection & Response
    • Network Security
    • Incident Response
    • Vulnerability Assessment

    EXPERIENCE
    ----------
    OCH Defender Program (2024-Present)
    • Completed 68% of SOC L1 curriculum
    • Lab exercises in threat detection
    • Portfolio projects in cybersecurity

    PROJECTS
    --------
    • SOC Simulation Lab
    • Threat Hunting Challenge
    • Incident Response Case Study
  `;

  // Convert to buffer (in production, this would be actual PDF bytes)
  return Buffer.from(mockResumeContent);
};

// Validate expiry token
const isValidExpiry = (expires: string): boolean => {
  const expiryTime = parseInt(expires);
  const now = Date.now();
  const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

  return (now - expiryTime) < maxAge && expiryTime > now;
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { searchParams } = new URL(request.url);
    const expires = searchParams.get('expires');

    // Validate expiry token
    if (!expires || !isValidExpiry(expires)) {
      return NextResponse.json(
        { error: 'Resume link has expired. Please generate a new one.' },
        { status: 403 }
      );
    }

    // RBAC Check
    const userRole = 'analyst'; // Mock - would come from auth
    if (userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Audit log download
    console.log(`AUDIT: ${new Date().toISOString()} - ${userId} - resume.download`);

    // Generate resume PDF
    const pdfBuffer = await generateResumePDF(userId);

    // Return PDF with appropriate headers
    return new Response(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="OCH_Analyst_Resume_${userId}.pdf"`,
        'Cache-Control': 'private, no-cache',
        'X-Content-Type-Options': 'nosniff',
      },
    });

  } catch (error) {
    console.error('Resume generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate resume' },
      { status: 500 }
    );
  }
}
