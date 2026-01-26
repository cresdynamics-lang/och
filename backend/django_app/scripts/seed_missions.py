#!/usr/bin/env python
"""
Script to seed missions data for development
Usage: python scripts/seed_missions.py
"""
import os
import sys
import django
from pathlib import Path

# Setup Django using the current project settings
BASE_DIR = Path(__file__).resolve().parent
# Ensure backend/django_app is on the path so core settings can be imported
sys.path.insert(0, str(BASE_DIR))
sys.path.insert(0, str(BASE_DIR.parent))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from missions.models import Mission

def seed_missions():
    """Seed missions with OCH data"""
    missions_data = [
        {
            'code': 'SIEM-01',
            'title': 'SIEM Dashboard Setup',
            'description': 'Build a Security Information and Event Management dashboard using Splunk or ELK stack. Configure log collection, create visualizations, and set up basic alerting rules.',
            'story': 'As a SOC analyst, you need to quickly identify security threats in a sea of log data. Your mission is to build a dashboard that transforms raw logs into actionable intelligence.',
            'difficulty': 'beginner',
            'track': 'defender',
            'tier': 'beginner',
            'type': 'lab',
            'track_key': 'soc_analyst',
            'estimated_duration_minutes': 240,
            'est_hours': 4,
            'competencies': ['SIEM', 'Splunk', 'ELK', 'Log Analysis', 'Dashboard Design'],
            'objectives': [
                'Install and configure ELK stack or Splunk',
                'Configure log collection from multiple sources',
                'Create basic dashboards and visualizations',
                'Set up alerting rules for common security events'
            ],
            'requirements': {
                'required_artifacts': ['screenshots', 'configuration_files', 'dashboard_export'],
                'success_criteria': {
                    'setup': 'ELK/Splunk properly installed and configured',
                    'collection': 'Logs collected from at least 2 sources',
                    'visualization': 'At least 3 working dashboards created',
                    'alerting': 'Basic alerting rules configured and tested'
                }
            },
            'recipe_recommendations': ['elk-setup', 'splunk-basics', 'log-parsing'],
        },
        {
            'code': 'DNS-02',
            'title': 'DNS Sinkhole Configuration',
            'description': 'Configure a DNS sinkhole to block malicious domains using pfSense firewall. Implement domain blacklisting and monitor blocked attempts.',
            'story': 'Malicious domains are the entry point for most cyber attacks. Your mission is to build a defensive barrier that prevents users from accessing harmful websites.',
            'difficulty': 'beginner',
            'track': 'defender',
            'tier': 'beginner',
            'type': 'lab',
            'track_key': 'network_security',
            'estimated_duration_minutes': 120,
            'est_hours': 2,
            'competencies': ['DNS', 'pfSense', 'Network Security', 'Firewall Configuration'],
            'objectives': [
                'Install and configure pfSense firewall',
                'Set up DNS resolver with sinkhole functionality',
                'Configure domain blacklists and whitelists',
                'Test sinkhole effectiveness with blocked domains'
            ],
            'requirements': {
                'required_artifacts': ['pfsense_config', 'dns_logs', 'test_results'],
                'success_criteria': {
                    'configuration': 'DNS sinkhole properly configured',
                    'blocking': 'Known malicious domains blocked',
                    'logging': 'Block attempts logged and monitored'
                }
            },
            'recipe_recommendations': ['pfsense-basics', 'dns-security'],
        },
        {
            'code': 'IR-03',
            'title': 'Incident Response Playbook',
            'description': 'Develop a comprehensive incident response playbook for ransomware attacks. Include detection, containment, eradication, and recovery procedures.',
            'story': 'When ransomware strikes, every second counts. Your mission is to create a battle-tested playbook that guides the response team through the chaos of a cyber attack.',
            'difficulty': 'advanced',
            'track': 'defender',
            'tier': 'intermediate',
            'type': 'project',
            'track_key': 'incident_response',
            'estimated_duration_minutes': 480,
            'est_hours': 8,
            'competencies': ['Incident Response', 'DFIR', 'Ransomware', 'Documentation', 'Communication'],
            'objectives': [
                'Research ransomware attack patterns and techniques',
                'Develop detection and initial assessment procedures',
                'Create containment and eradication strategies',
                'Design recovery and lessons learned processes',
                'Document communication protocols and stakeholder management'
            ],
            'requirements': {
                'required_artifacts': ['playbook_document', 'flow_diagrams', 'checklists'],
                'success_criteria': {
                    'comprehensive': 'All phases of incident response covered',
                    'practical': 'Procedures are actionable and realistic',
                    'communication': 'Stakeholder communication clearly defined'
                }
            },
            'recipe_recommendations': ['incident-response-framework', 'ransomware-analysis'],
        },
        {
            'code': 'PYSEC-04',
            'title': 'Python Security Scanner',
            'description': 'Build a Python script to scan for common security vulnerabilities including SQL injection, XSS, and insecure configurations.',
            'story': 'Security vulnerabilities hide in code like landmines in a battlefield. Your mission is to build an automated scanner that finds these threats before they can be exploited.',
            'difficulty': 'intermediate',
            'track': 'defender',
            'tier': 'intermediate',
            'type': 'lab',
            'track_key': 'security_automation',
            'estimated_duration_minutes': 360,
            'est_hours': 6,
            'competencies': ['Python', 'Security Testing', 'Vulnerability Assessment', 'Automation'],
            'objectives': [
                'Research common web application vulnerabilities',
                'Implement scanning logic for SQL injection detection',
                'Add XSS vulnerability detection',
                'Create insecure configuration checks',
                'Generate detailed vulnerability reports'
            ],
            'requirements': {
                'required_artifacts': ['python_script', 'test_results', 'vulnerability_report'],
                'success_criteria': {
                    'functionality': 'Scanner successfully detects known vulnerabilities',
                    'accuracy': 'Low false positive rate',
                    'reporting': 'Clear and actionable vulnerability reports'
                }
            },
            'recipe_recommendations': ['python-security', 'web-vuln-assessment'],
        },
        {
            'code': 'MAL-05',
            'title': 'Malware Analysis Lab',
            'description': 'Set up a malware analysis environment and perform basic static and dynamic analysis on sample malware.',
            'story': 'Malware is the weapon of choice for cyber attackers. Your mission is to build a safe environment to study these digital weapons and understand their behavior.',
            'difficulty': 'advanced',
            'track': 'defender',
            'tier': 'advanced',
            'type': 'lab',
            'track_key': 'malware_analysis',
            'estimated_duration_minutes': 600,
            'est_hours': 10,
            'competencies': ['Malware Analysis', 'Reverse Engineering', 'Sandboxing', 'Static Analysis', 'Dynamic Analysis'],
            'objectives': [
                'Set up isolated malware analysis environment',
                'Configure virtual machines and networking',
                'Perform static analysis on sample malware',
                'Execute dynamic analysis with monitoring',
                'Document findings and IOCs (Indicators of Compromise)'
            ],
            'requirements': {
                'required_artifacts': ['environment_setup', 'analysis_reports', 'ioc_documentation'],
                'success_criteria': {
                    'environment': 'Safe, isolated analysis environment configured',
                    'analysis': 'Both static and dynamic analysis performed',
                    'documentation': 'Clear documentation of malware behavior and IOCs'
                }
            },
            'recipe_recommendations': ['malware-analysis-setup', 'static-analysis', 'dynamic-analysis'],
        },
        {
            'code': 'PEN-06',
            'title': 'Penetration Testing Report',
            'description': 'Conduct a penetration test on a vulnerable web application and create a comprehensive security assessment report.',
            'story': 'Organizations need to know their weaknesses before attackers do. Your mission is to ethically hack a system and provide actionable recommendations for improvement.',
            'difficulty': 'advanced',
            'track': 'offensive',
            'tier': 'advanced',
            'type': 'project',
            'track_key': 'penetration_testing',
            'estimated_duration_minutes': 720,
            'est_hours': 12,
            'competencies': ['Penetration Testing', 'Vulnerability Assessment', 'Report Writing', 'Ethical Hacking'],
            'objectives': [
                'Reconnaissance and information gathering',
                'Vulnerability scanning and enumeration',
                'Exploit identified vulnerabilities',
                'Document all findings with evidence',
                'Create executive and technical reports with recommendations'
            ],
            'requirements': {
                'required_artifacts': ['recon_data', 'exploit_evidence', 'technical_report', 'executive_summary'],
                'success_criteria': {
                    'methodology': 'Proper pentest methodology followed',
                    'findings': 'Vulnerabilities identified with proof-of-concept',
                    'reporting': 'Clear, actionable reports with prioritization'
                }
            },
            'recipe_recommendations': ['pentest-methodology', 'vulnerability-scanning', 'exploit-development'],
        },
    ]

    created_count = 0
    updated_count = 0

    for mission_data in missions_data:
        mission, created = Mission.objects.update_or_create(
            code=mission_data['code'],
            defaults=mission_data
        )
        if created:
            created_count += 1
            print(f'✅ Created mission: {mission.code} - {mission.title}')
        else:
            updated_count += 1
            print(f'🔄 Updated mission: {mission.code} - {mission.title}')

    print(f'\n🎯 Mission seeding complete!')
    print(f'   Created: {created_count} missions')
    print(f'   Updated: {updated_count} missions')
    print(f'   Total: {created_count + updated_count} missions processed')

if __name__ == '__main__':
    try:
        seed_missions()
    except Exception as e:
        print(f'❌ Error seeding missions: {e}')
        sys.exit(1)
