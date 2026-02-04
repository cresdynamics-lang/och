#!/usr/bin/env python
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from missions.models import Mission
from users.models import User, Role, UserRole
from django.utils import timezone

def create_program_director():
    """Create a program director user for mission creation"""
    
    # Create program_director role if it doesn't exist
    director_role, created = Role.objects.get_or_create(
        name='program_director',
        defaults={
            'display_name': 'Program Director',
            'description': 'Can create and manage missions',
            'is_system_role': True
        }
    )
    if created:
        print('+ Created program_director role')
    
    # Create director user
    director, created = User.objects.get_or_create(
        email='director@och.com',
        defaults={
            'first_name': 'Program',
            'last_name': 'Director',
            'is_staff': True,
            'is_active': True
        }
    )
    if created:
        print('+ Created director user')
    
    # Assign director role
    user_role, created = UserRole.objects.get_or_create(
        user=director,
        role=director_role,
        scope='global',
        defaults={'is_active': True}
    )
    if created:
        print('+ Assigned director role')
    
    return director

def populate_missions():
    """Populate missions with proper content as Program Director would"""
    
    director = create_program_director()
    
    # Mission data as Program Director would create
    missions_data = [
        {
            'code': 'SIEM-01',
            'title': 'SIEM Lab: Log Analysis',
            'description': 'Learn to analyze security logs using SIEM tools to detect threats and incidents',
            'difficulty': 'beginner',
            'type': 'lab',
            'track_key': 'defender',
            'estimated_duration_minutes': 120,
            'objectives': [
                'Understand SIEM fundamentals and log sources',
                'Configure log collection and parsing rules',
                'Create detection rules for common attack patterns',
                'Investigate security incidents using SIEM queries',
                'Generate security reports and dashboards'
            ],
            'subtasks': [
                {
                    'title': 'Setup SIEM Environment',
                    'description': 'Install and configure Splunk/ELK stack for log analysis',
                    'estimated_minutes': 30,
                    'deliverables': ['Screenshot of SIEM dashboard', 'Configuration files']
                },
                {
                    'title': 'Log Collection Configuration',
                    'description': 'Configure log sources (Windows, Linux, network devices)',
                    'estimated_minutes': 45,
                    'deliverables': ['Log source configuration', 'Sample log ingestion proof']
                },
                {
                    'title': 'Create Detection Rules',
                    'description': 'Write rules to detect failed logins, privilege escalation, malware',
                    'estimated_minutes': 30,
                    'deliverables': ['Detection rule files', 'Test results']
                },
                {
                    'title': 'Incident Investigation',
                    'description': 'Investigate a simulated security incident using SIEM queries',
                    'estimated_minutes': 15,
                    'deliverables': ['Investigation report', 'Timeline of events', 'Remediation steps']
                }
            ],
            'requirements': {
                'status': 'published',
                'required_artifacts': ['lab_report', 'screenshots', 'config_files'],
                'prerequisites': ['Basic networking knowledge', 'Linux command line'],
                'tools': ['Splunk/ELK', 'Virtual machines', 'Sample log data']
            },
            'competencies': ['siem_analysis', 'log_investigation', 'incident_response', 'threat_detection']
        },
        {
            'code': 'NET-SEC-01',
            'title': 'Network Security Fundamentals',
            'description': 'Master network security concepts including firewalls, IDS/IPS, and network monitoring',
            'difficulty': 'beginner',
            'type': 'project',
            'track_key': 'defender',
            'estimated_duration_minutes': 180,
            'objectives': [
                'Configure and manage firewall rules',
                'Deploy and tune IDS/IPS systems',
                'Implement network segmentation',
                'Monitor network traffic for anomalies',
                'Document security policies and procedures'
            ],
            'subtasks': [
                {
                    'title': 'Firewall Configuration',
                    'description': 'Set up pfSense firewall with proper rule sets',
                    'estimated_minutes': 60,
                    'deliverables': ['Firewall rule documentation', 'Network diagram']
                },
                {
                    'title': 'IDS/IPS Deployment',
                    'description': 'Install and configure Suricata for intrusion detection',
                    'estimated_minutes': 45,
                    'deliverables': ['IDS configuration', 'Alert tuning report']
                },
                {
                    'title': 'Network Monitoring',
                    'description': 'Implement network monitoring with Wireshark and ntopng',
                    'estimated_minutes': 45,
                    'deliverables': ['Traffic analysis report', 'Baseline documentation']
                },
                {
                    'title': 'Security Assessment',
                    'description': 'Conduct network security assessment and create improvement plan',
                    'estimated_minutes': 30,
                    'deliverables': ['Security assessment report', 'Remediation roadmap']
                }
            ],
            'requirements': {
                'status': 'published',
                'required_artifacts': ['network_diagram', 'config_files', 'assessment_report'],
                'prerequisites': ['TCP/IP fundamentals', 'Basic Linux administration'],
                'tools': ['pfSense', 'Suricata', 'Wireshark', 'Virtual network lab']
            },
            'competencies': ['network_security', 'firewall_management', 'ids_ips', 'traffic_analysis']
        },
        {
            'code': 'VULN-01',
            'title': 'Vulnerability Assessment & Management',
            'description': 'Learn to identify, assess, and manage security vulnerabilities in enterprise environments',
            'difficulty': 'intermediate',
            'type': 'capstone',
            'track_key': 'defender',
            'estimated_duration_minutes': 240,
            'objectives': [
                'Conduct comprehensive vulnerability scans',
                'Prioritize vulnerabilities based on risk',
                'Develop remediation strategies',
                'Create vulnerability management processes',
                'Present findings to stakeholders'
            ],
            'subtasks': [
                {
                    'title': 'Vulnerability Scanning',
                    'description': 'Use Nessus/OpenVAS to scan network infrastructure',
                    'estimated_minutes': 60,
                    'deliverables': ['Scan reports', 'Vulnerability inventory']
                },
                {
                    'title': 'Risk Assessment',
                    'description': 'Analyze and prioritize vulnerabilities using CVSS scoring',
                    'estimated_minutes': 45,
                    'deliverables': ['Risk matrix', 'Prioritized vulnerability list']
                },
                {
                    'title': 'Remediation Planning',
                    'description': 'Create detailed remediation plans for critical vulnerabilities',
                    'estimated_minutes': 60,
                    'deliverables': ['Remediation roadmap', 'Patch management plan']
                },
                {
                    'title': 'Executive Presentation',
                    'description': 'Present vulnerability findings and recommendations to leadership',
                    'estimated_minutes': 75,
                    'deliverables': ['Executive summary', 'Presentation slides', 'Budget proposal']
                }
            ],
            'requirements': {
                'status': 'published',
                'required_artifacts': ['vulnerability_report', 'presentation', 'remediation_plan'],
                'prerequisites': ['Network fundamentals', 'Security concepts', 'Risk management basics'],
                'tools': ['Nessus/OpenVAS', 'CVSS calculator', 'Presentation software']
            },
            'competencies': ['vulnerability_assessment', 'risk_analysis', 'remediation_planning', 'stakeholder_communication']
        }
    ]
    
    # Create/update missions
    for mission_data in missions_data:
        mission, created = Mission.objects.update_or_create(
            code=mission_data['code'],
            defaults=mission_data
        )
        
        if created:
            print(f'+ Created mission: {mission.code} - {mission.title}')
        else:
            print(f'+ Updated mission: {mission.code} - {mission.title}')
    
    print(f'\nSuccess! Populated {len(missions_data)} missions with full content')
    print('Missions now have:')
    print('- Detailed objectives')
    print('- Step-by-step subtasks')
    print('- Time estimates')
    print('- Required deliverables')
    print('- Prerequisites and tools')
    print('- Competency mappings')

if __name__ == '__main__':
    populate_missions()