/**
 * Proxy for GET /api/v1/profiling/tracks
 * Tries FastAPI first; returns static OCH track fallback when FastAPI is unavailable.
 */

import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_URL = process.env.NEXT_PUBLIC_FASTAPI_API_URL || 'http://localhost:8000';

/** Fallback tracks matching FastAPI OCH_TRACKS shape so the profiling page can render */
const FALLBACK_TRACKS: Record<string, { key: string; name: string; description: string; focus_areas: string[]; career_paths: string[] }> = {
  defender: {
    key: 'defender',
    name: 'Defender',
    description: 'Protecting systems, networks, and data from cyber threats. SOC, monitoring, incident response.',
    focus_areas: ['SOC', 'Incident Response', 'SIEM', 'EDR', 'Threat Hunting', 'Vulnerability Management'],
    career_paths: ['SOC Analyst', 'Security Engineer', 'Incident Responder', 'Threat Hunter', 'CISO'],
  },
  offensive: {
    key: 'offensive',
    name: 'Offensive',
    description: 'Ethical hacking, penetration testing, and red team operations.',
    focus_areas: ['Penetration Testing', 'Red Team', 'Vulnerability Assessment', 'Web App Security'],
    career_paths: ['Penetration Tester', 'Ethical Hacker', 'Red Team Operator', 'Security Consultant'],
  },
  innovation: {
    key: 'innovation',
    name: 'Innovation',
    description: 'Security research, tool development, and emerging security technologies.',
    focus_areas: ['Security R&D', 'AI/ML Security', 'Tool Development', 'Cryptography'],
    career_paths: ['Security Researcher', 'Security Software Engineer', 'Security Architect (R&D)'],
  },
  leadership: {
    key: 'leadership',
    name: 'Leadership',
    description: 'Cybersecurity management, strategy, and executive roles.',
    focus_areas: ['Program Management', 'Risk Management', 'Security Strategy', 'Team Leadership'],
    career_paths: ['Security Manager', 'CISO', 'Security Director', 'VP of Security'],
  },
  grc: {
    key: 'grc',
    name: 'GRC (Governance, Risk & Compliance)',
    description: 'Governance, risk management, and compliance frameworks.',
    focus_areas: ['Compliance (ISO, NIST, SOC 2)', 'Risk Assessment', 'Audit', 'Policy'],
    career_paths: ['GRC Analyst', 'Compliance Manager', 'Security Auditor', 'Risk Analyst'],
  },
};

function fallbackTracks() {
  return NextResponse.json({
    tracks: FALLBACK_TRACKS,
    total_tracks: Object.keys(FALLBACK_TRACKS).length,
    description: 'Available OCH career tracks (fallback when profiling service is unavailable)',
  });
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  try {
    const res = await fetch(`${FASTAPI_URL}/api/v1/profiling/tracks`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader ? { Authorization: authHeader } : {}),
      },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.warn('[profiling/tracks] FastAPI returned', res.status);
      return fallbackTracks();
    }
    const data = await res.json();
    return NextResponse.json(data);
  } catch (err: any) {
    console.warn('[profiling/tracks] FastAPI unavailable:', err?.message || err);
    return fallbackTracks();
  }
}
