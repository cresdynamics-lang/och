#!/usr/bin/env python
"""
Create comprehensive test missions for all 5 OCH tracks with proper locking mechanism.

Usage: python scripts/create_tier7_missions.py

This script creates missions for:
- Defender Track
- Offensive Track
- GRC (Governance, Risk, Compliance) Track
- Innovation Track
- Leadership Track

Missions are created with proper difficulty progression and locking based on user track enrollment.
"""

import os
import sys
import django
from decimal import Decimal
import uuid
from datetime import datetime

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
django.setup()

from missions.models import Mission
from django.utils import timezone


def create_defender_track_missions():
    """Create Defender track missions - SIEM, Monitoring, Detection."""
    missions = [
        {
            'code': 'DEF-BEG-001',
            'title': 'Logs 101: Reading the Story',
            'description': 'Learn to read and interpret system logs to identify suspicious activities.',
            'story': 'You are a junior analyst at the SOC. Your mentor hands you a stack of server logs and asks you to find the anomaly. This is your first real case.',
            'objectives': [
                'Parse and understand common log formats (syslog, Windows Event Log)',
                'Identify suspicious patterns and anomalies',
                'Document findings in a professional report'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Parse System Logs',
                    'description': 'Extract and filter relevant log entries from a server log file.',
                    'order': 1,
                    'type': 'technical',
                    'dependencies': [],
                    'evidence_schema': {
                        'file_types': ['PDF', 'PNG', 'TXT'],
                        'required': True
                    }
                },
                {
                    'id': 2,
                    'title': 'Identify Anomalies',
                    'description': 'Spot suspicious login attempts, failed authentications, and unusual access patterns.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {
                        'file_types': ['PNG', 'PDF'],
                        'required': True
                    }
                },
                {
                    'id': 3,
                    'title': 'Create Incident Report',
                    'description': 'Document your findings in a professional incident report.',
                    'order': 3,
                    'type': 'documentation',
                    'dependencies': [2],
                    'evidence_schema': {
                        'file_types': ['PDF', 'DOCX'],
                        'required': True
                    }
                }
            ],
            'track': 'defender',
            'tier': 'beginner',
            'difficulty': 'novice',
            'type': 'lab',
            'track_key': 'defender',
            'estimated_duration_minutes': 60,
            'competencies': ['Log Analysis', 'SIEM Basics', 'Incident Detection'],
            'recipe_recommendations': ['log-parsing-basics', 'grep-commands', 'log-analysis-tools'],
            'success_criteria': {
                'technical_accuracy': 25,
                'completeness': 25,
                'documentation': 25,
                'professional_standards': 25
            },
            'requirements': {
                'tools': ['grep', 'awk', 'text editor'],
                'environment': 'Linux terminal'
            }
        },
        {
            'code': 'DEF-BEG-002',
            'title': 'Alert Tuning: Reduce the Noise',
            'description': 'Learn to configure SIEM alerts to reduce false positives while catching real threats.',
            'story': 'The SOC is drowning in alerts. Your team gets 10,000 alerts per day, but only 2% are actual incidents. Your task: tune the alerts.',
            'objectives': [
                'Understand alert tuning concepts',
                'Create alert rules in a SIEM environment',
                'Implement suppression and correlation rules',
                'Measure and report on alert quality'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Analyze Alert Patterns',
                    'description': 'Review current alerts and identify patterns of false positives.',
                    'order': 1,
                    'type': 'technical',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF', 'PNG'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Create Tuning Rules',
                    'description': 'Write alert suppression and correlation rules.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['TXT', 'PDF'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Test and Report',
                    'description': 'Test the tuned alerts and report the reduction in false positives.',
                    'order': 3,
                    'type': 'documentation',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PDF', 'PNG'], 'required': True}
                }
            ],
            'track': 'defender',
            'tier': 'beginner',
            'difficulty': 'beginner',
            'type': 'lab',
            'track_key': 'defender',
            'estimated_duration_minutes': 90,
            'competencies': ['SIEM', 'Alert Tuning', 'False Positive Reduction'],
            'recipe_recommendations': ['siem-basics', 'alert-correlation', 'elasticsearch-queries'],
            'requires_mentor_review': False
        },
        {
            'code': 'DEF-INT-001',
            'title': 'Incident Response: Network Breach',
            'description': 'Respond to a simulated network breach with full forensics and containment.',
            'story': 'Your organization detected unusual network traffic to a known C2 server. A data breach is suspected. You have 4 hours to respond.',
            'objectives': [
                'Identify all affected systems',
                'Contain the breach',
                'Collect forensic evidence',
                'Restore systems safely'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Identify C2 Communication',
                    'description': 'Use network monitoring tools to identify all hosts communicating with the C2 server.',
                    'order': 1,
                    'type': 'technical',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PCAP', 'PDF', 'TXT'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Isolate Infected Hosts',
                    'description': 'Safely isolate affected hosts from the network without disrupting business.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['PDF', 'PNG'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Forensic Collection',
                    'description': 'Collect memory dumps, disk images, and log files for investigation.',
                    'order': 3,
                    'type': 'technical',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['TXT', 'PDF'], 'required': True}
                },
                {
                    'id': 4,
                    'title': 'IR Report',
                    'description': 'Write comprehensive incident report with timeline and recommendations.',
                    'order': 4,
                    'type': 'documentation',
                    'dependencies': [3],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                }
            ],
            'track': 'defender',
            'tier': 'intermediate',
            'difficulty': 'intermediate',
            'type': 'scenario',
            'track_key': 'defender',
            'estimated_duration_minutes': 180,
            'competencies': ['Incident Response', 'Forensics', 'Network Analysis'],
            'recipe_recommendations': ['network-forensics', 'tcpdump-analysis', 'incident-response-procedures'],
            'requires_mentor_review': True
        },
        {
            'code': 'DEF-ADV-001',
            'title': 'Threat Hunting: APT Indicators',
            'description': 'Proactive threat hunting for Advanced Persistent Threat (APT) indicators.',
            'story': 'Intelligence suggests your industry is being targeted by a specific APT group. Hunt for indicators of compromise in your network.',
            'objectives': [
                'Understand APT tactics, techniques, and procedures',
                'Develop hunt queries for SIEM',
                'Correlate multiple data sources',
                'Present findings to leadership'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Research APT Indicators',
                    'description': 'Study MITRE ATT&CK and threat intelligence for the specific APT group.',
                    'order': 1,
                    'type': 'research',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Build Hunt Queries',
                    'description': 'Create SPL, KQL, or custom queries to hunt for indicators.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['TXT', 'PDF'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Analyze Results',
                    'description': 'Analyze hunt results and validate findings.',
                    'order': 3,
                    'type': 'technical',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PDF', 'PNG'], 'required': True}
                },
                {
                    'id': 4,
                    'title': 'Executive Briefing',
                    'description': 'Create presentation for leadership with findings and recommendations.',
                    'order': 4,
                    'type': 'documentation',
                    'dependencies': [3],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                }
            ],
            'track': 'defender',
            'tier': 'advanced',
            'difficulty': 'advanced',
            'type': 'scenario',
            'track_key': 'defender',
            'estimated_duration_minutes': 240,
            'competencies': ['Threat Hunting', 'APT Analysis', 'MITRE ATT&CK'],
            'recipe_recommendations': ['mitre-attck-framework', 'siem-hunting-queries', 'threat-intelligence'],
            'requires_mentor_review': True
        }
    ]
    
    return missions


def create_offensive_track_missions():
    """Create Offensive track missions - Penetration Testing, Exploitation."""
    missions = [
        {
            'code': 'OFF-BEG-001',
            'title': 'Port Scanning Fundamentals',
            'description': 'Master the art of network reconnaissance using port scanning techniques.',
            'story': 'You have been authorized to conduct a security assessment. Your first task is to map the target network.',
            'objectives': [
                'Understand network scanning basics',
                'Use nmap for reconnaissance',
                'Identify open services',
                'Document findings'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Learn Scanning Techniques',
                    'description': 'Study different port scanning methods (TCP, UDP, SYN, etc.)',
                    'order': 1,
                    'type': 'technical',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Execute Scans',
                    'description': 'Run nmap scans against target environment.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['TXT', 'PNG'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Analyze Results',
                    'description': 'Interpret scan results and identify services.',
                    'order': 3,
                    'type': 'technical',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                }
            ],
            'track': 'offensive',
            'tier': 'beginner',
            'difficulty': 'novice',
            'type': 'lab',
            'track_key': 'offensive',
            'estimated_duration_minutes': 90,
            'competencies': ['Network Reconnaissance', 'Nmap', 'Port Scanning'],
            'recipe_recommendations': ['nmap-basics', 'network-scanning', 'service-identification']
        },
        {
            'code': 'OFF-BEG-002',
            'title': 'Web Application Scanning',
            'description': 'Learn to identify web application vulnerabilities.',
            'story': 'Your client has a web application they want tested. Start with automated scanning and manual validation.',
            'objectives': [
                'Use web vulnerability scanners',
                'Understand OWASP Top 10',
                'Find and validate vulnerabilities',
                'Write security report'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Setup Scanning Tools',
                    'description': 'Configure Burp Suite or OWASP ZAP for web scanning.',
                    'order': 1,
                    'type': 'technical',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PNG', 'PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Run Automated Scans',
                    'description': 'Execute web vulnerability scans against target application.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['PDF', 'PNG'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Manual Validation',
                    'description': 'Manually test and validate discovered vulnerabilities.',
                    'order': 3,
                    'type': 'technical',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PNG', 'PDF'], 'required': True}
                }
            ],
            'track': 'offensive',
            'tier': 'beginner',
            'difficulty': 'beginner',
            'type': 'lab',
            'track_key': 'offensive',
            'estimated_duration_minutes': 120,
            'competencies': ['Web Security', 'OWASP', 'Vulnerability Scanning'],
            'recipe_recommendations': ['owasp-top-10', 'burp-suite-basics', 'web-scanning']
        },
        {
            'code': 'OFF-INT-001',
            'title': 'SQL Injection: From Detection to Exploitation',
            'description': 'Master SQL injection attacks from reconnaissance to data exfiltration.',
            'story': 'You discovered a vulnerable login form. Exploit it to prove the vulnerability and extract sensitive data.',
            'objectives': [
                'Identify SQL injection vulnerabilities',
                'Craft injection payloads',
                'Extract data from database',
                'Write detailed security report'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Identify Vulnerable Parameters',
                    'description': 'Find parameters vulnerable to SQL injection.',
                    'order': 1,
                    'type': 'technical',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PNG', 'PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Craft SQL Payloads',
                    'description': 'Create SQL injection payloads for exploitation.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['TXT', 'PDF'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Extract Data',
                    'description': 'Use SQL injection to extract sensitive data.',
                    'order': 3,
                    'type': 'technical',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PNG', 'PDF'], 'required': True}
                }
            ],
            'track': 'offensive',
            'tier': 'intermediate',
            'difficulty': 'intermediate',
            'type': 'scenario',
            'track_key': 'offensive',
            'estimated_duration_minutes': 150,
            'competencies': ['SQL Injection', 'Web Exploitation', 'Database Security'],
            'recipe_recommendations': ['sql-injection-basics', 'sqlmap-usage', 'payload-encoding'],
            'requires_mentor_review': True
        }
    ]
    
    return missions


def create_grc_track_missions():
    """Create GRC track missions - Compliance, Risk, Governance."""
    missions = [
        {
            'code': 'GRC-BEG-001',
            'title': 'Compliance 101: GDPR Fundamentals',
            'description': 'Understand GDPR requirements and implement compliance controls.',
            'story': 'Your organization is expanding to Europe. You need to implement GDPR compliance.',
            'objectives': [
                'Understand GDPR principles',
                'Identify personal data',
                'Implement data protection controls',
                'Create compliance documentation'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Study GDPR Framework',
                    'description': 'Review GDPR articles and key requirements.',
                    'order': 1,
                    'type': 'documentation',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Map Data Processing',
                    'description': 'Create a data flow diagram showing all personal data processing.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['PDF', 'PNG'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Implement Controls',
                    'description': 'Document implemented GDPR compliance controls.',
                    'order': 3,
                    'type': 'documentation',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                }
            ],
            'track': 'grc',
            'tier': 'beginner',
            'difficulty': 'novice',
            'type': 'lab',
            'track_key': 'grc',
            'estimated_duration_minutes': 120,
            'competencies': ['GDPR', 'Data Protection', 'Compliance'],
            'recipe_recommendations': ['gdpr-framework', 'data-mapping', 'compliance-documentation']
        },
        {
            'code': 'GRC-BEG-002',
            'title': 'Risk Assessment: Identify and Mitigate',
            'description': 'Conduct a risk assessment and develop mitigation strategies.',
            'story': 'You are tasked with assessing risks to a critical system.',
            'objectives': [
                'Identify assets and threats',
                'Assess risk likelihood and impact',
                'Prioritize risks',
                'Recommend mitigations'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Identify Assets and Threats',
                    'description': 'List assets and potential threats.',
                    'order': 1,
                    'type': 'documentation',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Assess Risk Levels',
                    'description': 'Calculate risk scores for each threat.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['PDF', 'PNG'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Develop Mitigations',
                    'description': 'Create mitigation strategies for top risks.',
                    'order': 3,
                    'type': 'documentation',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                }
            ],
            'track': 'grc',
            'tier': 'beginner',
            'difficulty': 'beginner',
            'type': 'lab',
            'track_key': 'grc',
            'estimated_duration_minutes': 150,
            'competencies': ['Risk Assessment', 'Risk Management', 'Mitigation'],
            'recipe_recommendations': ['risk-assessment-framework', 'nist-risk-management', 'impact-analysis']
        },
        {
            'code': 'GRC-INT-001',
            'title': 'ISO 27001 Implementation Project',
            'description': 'Lead ISO 27001 certification project for an organization.',
            'story': 'Your client wants ISO 27001 certification. Plan and oversee the implementation.',
            'objectives': [
                'Conduct gap analysis',
                'Create ISMS documentation',
                'Implement controls',
                'Prepare for audit'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Gap Analysis',
                    'description': 'Assess current state against ISO 27001 requirements.',
                    'order': 1,
                    'type': 'documentation',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Create Implementation Plan',
                    'description': 'Develop detailed plan for implementing missing controls.',
                    'order': 2,
                    'type': 'documentation',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Evidence Collection',
                    'description': 'Gather evidence of control implementation.',
                    'order': 3,
                    'type': 'technical',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PDF', 'PNG'], 'required': True}
                }
            ],
            'track': 'grc',
            'tier': 'intermediate',
            'difficulty': 'intermediate',
            'type': 'project',
            'track_key': 'grc',
            'estimated_duration_minutes': 300,
            'competencies': ['ISO 27001', 'ISMS', 'Certification', 'Compliance Program'],
            'recipe_recommendations': ['iso-27001-framework', 'control-implementation', 'audit-preparation'],
            'requires_mentor_review': True
        }
    ]
    
    return missions


def create_innovation_track_missions():
    """Create Innovation track missions - Automation, Development, Tools."""
    missions = [
        {
            'code': 'INN-BEG-001',
            'title': 'Python Security Tools: First Script',
            'description': 'Write your first security tool in Python.',
            'story': 'The SOC team needs a tool to parse logs faster. You volunteer to write it.',
            'objectives': [
                'Learn Python basics for security',
                'Parse and process log data',
                'Create a reusable tool',
                'Document and test the code'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Learn Python Basics',
                    'description': 'Study Python fundamentals for security automation.',
                    'order': 1,
                    'type': 'technical',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF', 'GITHUB'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Write Log Parser',
                    'description': 'Create a Python script to parse and filter log files.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['GITHUB', 'PDF'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Test and Document',
                    'description': 'Write tests and documentation for your tool.',
                    'order': 3,
                    'type': 'documentation',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['GITHUB', 'PDF'], 'required': True}
                }
            ],
            'track': 'innovation',
            'tier': 'beginner',
            'difficulty': 'novice',
            'type': 'lab',
            'track_key': 'innovation',
            'estimated_duration_minutes': 120,
            'competencies': ['Python', 'Log Analysis', 'Tool Development'],
            'recipe_recommendations': ['python-basics', 'file-handling', 'string-parsing']
        },
        {
            'code': 'INN-BEG-002',
            'title': 'Infrastructure as Code: Ansible Playbooks',
            'description': 'Automate security control deployment with Ansible.',
            'story': 'Your team needs to deploy firewall rules across 100 servers. Write Ansible playbooks to automate it.',
            'objectives': [
                'Learn Ansible fundamentals',
                'Write security playbooks',
                'Test deployment automation',
                'Document procedures'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Learn Ansible',
                    'description': 'Study Ansible for infrastructure automation.',
                    'order': 1,
                    'type': 'technical',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Create Playbooks',
                    'description': 'Write Ansible playbooks for firewall configuration.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['GITHUB', 'PDF'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Test Deployment',
                    'description': 'Test playbooks in lab environment.',
                    'order': 3,
                    'type': 'technical',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PNG', 'PDF'], 'required': True}
                }
            ],
            'track': 'innovation',
            'tier': 'beginner',
            'difficulty': 'beginner',
            'type': 'lab',
            'track_key': 'innovation',
            'estimated_duration_minutes': 150,
            'competencies': ['Ansible', 'Infrastructure Automation', 'IaC'],
            'recipe_recommendations': ['ansible-basics', 'yaml-syntax', 'playbook-writing']
        },
        {
            'code': 'INN-INT-001',
            'title': 'SIEM Integration Project',
            'description': 'Build custom SIEM integration and automation workflows.',
            'story': 'Your team wants to integrate a new data source into Splunk and automate response actions.',
            'objectives': [
                'Develop custom SIEM connector',
                'Create automated workflows',
                'Build dashboards',
                'Document integration'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Develop Connector',
                    'description': 'Create custom SIEM connector for new data source.',
                    'order': 1,
                    'type': 'technical',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['GITHUB', 'PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Create Workflows',
                    'description': 'Build automated response workflows in SIEM.',
                    'order': 2,
                    'type': 'technical',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['PNG', 'GITHUB', 'PDF'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Build Dashboards',
                    'description': 'Create visualization dashboards for the new data source.',
                    'order': 3,
                    'type': 'technical',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PNG', 'PDF'], 'required': True}
                }
            ],
            'track': 'innovation',
            'tier': 'intermediate',
            'difficulty': 'intermediate',
            'type': 'project',
            'track_key': 'innovation',
            'estimated_duration_minutes': 240,
            'competencies': ['SIEM', 'Integration', 'Custom Development', 'Automation'],
            'recipe_recommendations': ['splunk-development', 'api-integration', 'workflow-automation'],
            'requires_mentor_review': True
        }
    ]
    
    return missions


def create_leadership_track_missions():
    """Create Leadership track missions - Management, Strategy, Communication."""
    missions = [
        {
            'code': 'LEAD-BEG-001',
            'title': 'Team Communication: Security Briefing',
            'description': 'Develop communication skills by delivering a security briefing.',
            'story': 'You need to brief the executive team on a security incident.',
            'objectives': [
                'Understand audience needs',
                'Simplify technical concepts',
                'Create executive summary',
                'Practice presentation'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Analyze Audience',
                    'description': 'Understand the executive team\'s knowledge level and concerns.',
                    'order': 1,
                    'type': 'documentation',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Create Presentation',
                    'description': 'Develop clear, executive-level presentation.',
                    'order': 2,
                    'type': 'documentation',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Deliver Briefing',
                    'description': 'Record or deliver the security briefing.',
                    'order': 3,
                    'type': 'documentation',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['VIDEO', 'PDF'], 'required': True}
                }
            ],
            'track': 'leadership',
            'tier': 'beginner',
            'difficulty': 'novice',
            'type': 'lab',
            'track_key': 'leadership',
            'estimated_duration_minutes': 120,
            'competencies': ['Communication', 'Executive Briefing', 'Leadership'],
            'recipe_recommendations': ['presentation-skills', 'executive-communication', 'technical-writing']
        },
        {
            'code': 'LEAD-BEG-002',
            'title': 'Team Building: Create Security Culture',
            'description': 'Develop strategies to build a strong security culture in your team.',
            'story': 'You\'re assigned to improve security awareness and culture in your department.',
            'objectives': [
                'Assess current security culture',
                'Identify improvement areas',
                'Create engagement plan',
                'Measure effectiveness'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Culture Assessment',
                    'description': 'Conduct survey or interviews to assess current security culture.',
                    'order': 1,
                    'type': 'documentation',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Create Action Plan',
                    'description': 'Develop plan to improve security culture and awareness.',
                    'order': 2,
                    'type': 'documentation',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Implementation & Metrics',
                    'description': 'Execute plan and establish metrics to measure success.',
                    'order': 3,
                    'type': 'documentation',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PDF', 'PNG'], 'required': True}
                }
            ],
            'track': 'leadership',
            'tier': 'beginner',
            'difficulty': 'beginner',
            'type': 'lab',
            'track_key': 'leadership',
            'estimated_duration_minutes': 150,
            'competencies': ['Team Management', 'Security Culture', 'Change Management'],
            'recipe_recommendations': ['leadership-fundamentals', 'change-management', 'team-dynamics']
        },
        {
            'code': 'LEAD-INT-001',
            'title': 'Strategic Planning: 3-Year Security Roadmap',
            'description': 'Create a comprehensive strategic security roadmap for your organization.',
            'story': 'You\'re promoted to Chief Information Security Officer. Create a 3-year strategy.',
            'objectives': [
                'Assess current state',
                'Define strategic goals',
                'Create implementation roadmap',
                'Develop budget plan'
            ],
            'subtasks': [
                {
                    'id': 1,
                    'title': 'Current State Assessment',
                    'description': 'Comprehensive assessment of current security posture.',
                    'order': 1,
                    'type': 'documentation',
                    'dependencies': [],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 2,
                    'title': 'Strategic Goals',
                    'description': 'Define 3-year strategic goals aligned with business objectives.',
                    'order': 2,
                    'type': 'documentation',
                    'dependencies': [1],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                },
                {
                    'id': 3,
                    'title': 'Implementation Roadmap',
                    'description': 'Create detailed roadmap with milestones and dependencies.',
                    'order': 3,
                    'type': 'documentation',
                    'dependencies': [2],
                    'evidence_schema': {'file_types': ['PDF', 'PNG'], 'required': True}
                },
                {
                    'id': 4,
                    'title': 'Budget & Business Case',
                    'description': 'Develop budget plan and business justification.',
                    'order': 4,
                    'type': 'documentation',
                    'dependencies': [3],
                    'evidence_schema': {'file_types': ['PDF'], 'required': True}
                }
            ],
            'track': 'leadership',
            'tier': 'intermediate',
            'difficulty': 'intermediate',
            'type': 'project',
            'track_key': 'leadership',
            'estimated_duration_minutes': 300,
            'competencies': ['Strategic Planning', 'Leadership', 'Business Acumen', 'Budget Management'],
            'recipe_recommendations': ['strategic-planning', 'business-alignment', 'roadmap-development'],
            'requires_mentor_review': True
        }
    ]
    
    return missions


def seed_missions():
    """Seed all missions into the database."""
    print("\n" + "="*80)
    print("TIER 7 MISSION ENGINE - TEST DATA SEEDING")
    print("="*80)
    
    all_missions = []
    
    # Collect all missions from each track
    print("\n📍 Defender Track Missions...")
    defender_missions = create_defender_track_missions()
    all_missions.extend(defender_missions)
    print(f"   ✓ Created {len(defender_missions)} missions")
    
    print("\n🔍 Offensive Track Missions...")
    offensive_missions = create_offensive_track_missions()
    all_missions.extend(offensive_missions)
    print(f"   ✓ Created {len(offensive_missions)} missions")
    
    print("\n📋 GRC Track Missions...")
    grc_missions = create_grc_track_missions()
    all_missions.extend(grc_missions)
    print(f"   ✓ Created {len(grc_missions)} missions")
    
    print("\n⚙️  Innovation Track Missions...")
    innovation_missions = create_innovation_track_missions()
    all_missions.extend(innovation_missions)
    print(f"   ✓ Created {len(innovation_missions)} missions")
    
    print("\n👔 Leadership Track Missions...")
    leadership_missions = create_leadership_track_missions()
    all_missions.extend(leadership_missions)
    print(f"   ✓ Created {len(leadership_missions)} missions")
    
    print(f"\n{'='*80}")
    print(f"TOTAL MISSIONS TO CREATE: {len(all_missions)}")
    print(f"{'='*80}\n")
    
    # Create missions in database
    created_count = 0
    skipped_count = 0
    
    for mission_data in all_missions:
        try:
            mission, created = Mission.objects.update_or_create(
                code=mission_data['code'],
                defaults={
                    'title': mission_data['title'],
                    'description': mission_data['description'],
                    'story': mission_data.get('story', ''),
                    'objectives': mission_data.get('objectives', []),
                    'subtasks': mission_data.get('subtasks', []),
                    'track': mission_data['track'],
                    'tier': mission_data['tier'],
                    'difficulty': mission_data['difficulty'],
                    'type': mission_data.get('type', 'lab'),
                    'track_key': mission_data.get('track_key', ''),
                    'estimated_duration_minutes': mission_data.get('estimated_duration_minutes'),
                    'competencies': mission_data.get('competencies', []),
                    'recipe_recommendations': mission_data.get('recipe_recommendations', []),
                    'success_criteria': mission_data.get('success_criteria', {}),
                    'requirements': mission_data.get('requirements', {}),
                    'requires_mentor_review': mission_data.get('requires_mentor_review', False),
                    'is_active': True
                }
            )
            
            if created:
                created_count += 1
                status = "✨ CREATED"
            else:
                skipped_count += 1
                status = "🔄 UPDATED"
            
            print(f"{status} | {mission_data['code']} | {mission_data['title'][:40]}")
        
        except Exception as e:
            print(f"❌ ERROR | {mission_data['code']} | {str(e)}")
    
    print(f"\n{'='*80}")
    print(f"SUMMARY:")
    print(f"  ✨ Created: {created_count}")
    print(f"  🔄 Updated: {skipped_count}")
    print(f"  {'='*80}\n")
    
    # Print summary by track
    print("📊 MISSIONS BY TRACK:\n")
    for track in ['defender', 'offensive', 'grc', 'innovation', 'leadership']:
        count = Mission.objects.filter(track=track).count()
        print(f"  {track.upper():12} | {count} missions")
    
    # Print summary by tier
    print("\n📊 MISSIONS BY TIER:\n")
    for tier in ['beginner', 'intermediate', 'advanced']:
        count = Mission.objects.filter(tier=tier).count()
        print(f"  {tier.upper():12} | {count} missions")
    
    print("\n" + "="*80)
    print("✅ MISSION SEEDING COMPLETE")
    print("="*80 + "\n")
    
    # Print instructions for testing
    print("🧪 TESTING INSTRUCTIONS:\n")
    print("1. Access the missions dashboard:")
    print("   http://localhost:3000/dashboard/student/missions\n")
    print("2. Missions will be locked based on user's track enrollment\n")
    print("3. Only missions matching the user's track will be unlocked\n")
    print("4. Users in other tracks will see 'LOCKED' status with lock icon\n")
    print("="*80 + "\n")


if __name__ == '__main__':
    try:
        seed_missions()
    except Exception as e:
        print(f"\n❌ ERROR: {str(e)}\n")
        sys.exit(1)
