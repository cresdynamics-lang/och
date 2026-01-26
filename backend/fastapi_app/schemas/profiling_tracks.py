"""
OCH Track Definitions for AI Profiling Engine
Maps users to 5 specific cybersecurity tracks: defender, offensive, innovation, leadership, grc
"""

from typing import List
from pydantic import BaseModel


class TrackInfo(BaseModel):
    """Information about an OCH track."""
    key: str
    name: str
    description: str
    focus_areas: List[str]
    career_paths: List[str]

# OCH Tracks Definition - 5 Cybersecurity Specializations
OCH_TRACKS = {
    "defender": TrackInfo(
        key="defender",
        name="Defender",
        description="The Defenders track focuses on protecting systems, networks, and data from cyber threats. You excel at building robust security controls, monitoring for anomalies, and responding to security incidents. This track is ideal for those who thrive in defensive cybersecurity roles and enjoy protecting organizations from attacks.",
        focus_areas=[
            "Security Operations Center (SOC)",
            "Incident Response & Forensics",
            "SIEM & Security Monitoring",
            "Endpoint Detection & Response (EDR)",
            "Network Security & Firewalls",
            "Threat Intelligence & Hunting",
            "Vulnerability Management",
            "Security Architecture"
        ],
        career_paths=[
            "SOC Analyst",
            "Security Engineer",
            "Incident Responder",
            "Threat Hunter",
            "Security Architect",
            "Cybersecurity Analyst",
            "Security Operations Manager",
            "CISO"
        ]
    ),
    "offensive": TrackInfo(
        key="offensive",
        name="Offensive",
        description="The Offensive track focuses on ethical hacking, penetration testing, and red team operations. You excel at finding vulnerabilities, exploiting systems (ethically), and thinking like an attacker to strengthen defenses. This track is ideal for those who enjoy offensive security testing and want to help organizations identify security weaknesses before attackers do.",
        focus_areas=[
            "Penetration Testing",
            "Red Team Operations",
            "Vulnerability Assessment",
            "Exploit Development",
            "Web Application Security",
            "Network Penetration Testing",
            "Social Engineering",
            "Physical Security Testing"
        ],
        career_paths=[
            "Penetration Tester",
            "Ethical Hacker",
            "Red Team Operator",
            "Security Consultant",
            "Bug Bounty Hunter",
            "Vulnerability Researcher",
            "Offensive Security Engineer",
            "Security Specialist"
        ]
    ),
    "innovation": TrackInfo(
        key="innovation",
        name="Innovation",
        description="The Innovation track focuses on developing cutting-edge security technologies, tools, and solutions. You excel at research, development, and creating novel approaches to cybersecurity challenges. This track is ideal for those who want to push the boundaries of security technology and build the next generation of security tools.",
        focus_areas=[
            "Security Research & Development",
            "AI/ML in Cybersecurity",
            "Security Tool Development",
            "Emerging Technologies",
            "Cryptography & Encryption",
            "Secure Software Development",
            "IoT Security",
            "Cloud Security Innovation"
        ],
        career_paths=[
            "Security Researcher",
            "Security Software Engineer",
            "Cryptographer",
            "Security Architect (R&D)",
            "AI Security Engineer",
            "Security Tool Developer",
            "Innovation Lead",
            "Chief Technology Officer (Security)"
        ]
    ),
    "leadership": TrackInfo(
        key="leadership",
        name="Leadership",
        description="The Leadership track focuses on cybersecurity management, strategy, and executive roles. You excel at coordinating security teams, making strategic decisions, managing risk, and aligning security with business objectives. This track is ideal for those who want to lead security initiatives and drive organizational security strategy.",
        focus_areas=[
            "Security Program Management",
            "Risk Management & Governance",
            "Security Strategy & Planning",
            "Team Leadership & Management",
            "Stakeholder Management",
            "Security Budgeting & Resource Allocation",
            "Business Alignment",
            "Crisis Management & Communication"
        ],
        career_paths=[
            "Security Manager",
            "CISO (Chief Information Security Officer)",
            "Security Director",
            "VP of Security",
            "Security Program Manager",
            "Risk Manager",
            "Security Consultant (Strategy)",
            "Cybersecurity Executive"
        ]
    ),
    "grc": TrackInfo(
        key="grc",
        name="GRC (Governance, Risk & Compliance)",
        description="The GRC track focuses on governance, risk management, and compliance frameworks. You excel at understanding regulations, assessing risk, implementing compliance programs, and ensuring organizations meet security standards. This track is ideal for those who enjoy working with frameworks, regulations, and helping organizations navigate compliance requirements.",
        focus_areas=[
            "Compliance Frameworks (ISO 27001, NIST, SOC 2)",
            "Risk Assessment & Management",
            "Security Policies & Procedures",
            "Audit & Assessment",
            "Regulatory Compliance (GDPR, HIPAA, PCI-DSS)",
            "Security Governance",
            "Control Testing & Validation",
            "Documentation & Reporting"
        ],
        career_paths=[
            "GRC Analyst",
            "Compliance Manager",
            "Security Auditor",
            "Risk Analyst",
            "Privacy Officer",
            "Information Security Officer",
            "Compliance Consultant",
            "Security Governance Lead"
        ]
    )
}

# Track aliases for backward compatibility (if needed)
TRACK_ALIASES = {
    "defenders": "defender",
    "offensive_security": "offensive",
    "pentest": "offensive",
    "red_team": "offensive",
    "governance": "grc",
    "compliance": "grc",
    "risk": "grc",
}

