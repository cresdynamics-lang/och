#!/usr/bin/env python
"""
Create comprehensive test data structure for OCH programs.

This script creates:
- 5 Programs (one for each track: Leadership, Defender, Offensive, GRC, Innovation)
- Each program contains:
  - Primary track (80% content focus)
  - Cross-track content from other tracks (20% shared)
  - Tracks with modules, milestones, missions (min 10 per track), and specializations

Run: python create_comprehensive_programs.py
"""
import os
import sys
import django
import random
from datetime import timedelta
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.db import transaction
from django.contrib.auth import get_user_model
from programs.models import Program, Track, Milestone, Module, Specialization
from missions.models import Mission
from users.models import User, Role

User = get_user_model()

# Track definitions
TRACKS = {
    'leadership': {
        'name': 'Cybersecurity Leadership',
        'key': 'leadership',
        'description': 'Cybersecurity management, strategy, and executive leadership',
        'focus_areas': [
            'Security Program Management', 'Risk Management & Governance',
            'Security Strategy & Planning', 'Team Leadership & Management',
            'Stakeholder Management', 'Security Budgeting & Resource Allocation',
            'Business Alignment', 'Crisis Management & Communication'
        ]
    },
    'defender': {
        'name': 'Cybersecurity Defender',
        'key': 'defender',
        'description': 'Security Operations, Incident Response, and Defensive Cybersecurity',
        'focus_areas': [
            'Security Operations Center (SOC)', 'Incident Response & Forensics',
            'SIEM & Security Monitoring', 'Endpoint Detection & Response (EDR)',
            'Network Security & Firewalls', 'Threat Intelligence & Hunting',
            'Vulnerability Management', 'Security Architecture'
        ]
    },
    'offensive': {
        'name': 'Cybersecurity Offensive',
        'key': 'offensive',
        'description': 'Ethical Hacking, Penetration Testing, and Red Team Operations',
        'focus_areas': [
            'Penetration Testing', 'Red Team Operations',
            'Vulnerability Assessment', 'Exploit Development',
            'Web Application Security', 'Network Penetration Testing',
            'Social Engineering', 'Physical Security Testing'
        ]
    },
    'grc': {
        'name': 'Cybersecurity GRC',
        'key': 'grc',
        'description': 'Governance, Risk Management, and Compliance',
        'focus_areas': [
            'Compliance Frameworks (ISO 27001, NIST, SOC 2)',
            'Risk Assessment & Management', 'Security Policies & Procedures',
            'Audit & Assessment', 'Regulatory Compliance (GDPR, HIPAA, PCI-DSS)',
            'Security Governance', 'Control Testing & Validation',
            'Documentation & Reporting'
        ]
    },
    'innovation': {
        'name': 'Cybersecurity Innovation',
        'key': 'innovation',
        'description': 'Security Research, Development, and Innovation',
        'focus_areas': [
            'Security Research & Development', 'AI/ML in Cybersecurity',
            'Security Tool Development', 'Emerging Technologies',
            'Cryptography & Encryption', 'Secure Software Development',
            'IoT Security', 'Cloud Security Innovation'
        ]
    }
}

# Mission templates for each track (minimum 10 per track)
MISSION_TEMPLATES = {
    'leadership': [
        {'title': 'Ransomware Crisis Response', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 168},
        {'title': 'Security Budget Planning', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 120},
        {'title': 'Incident Response Team Coordination', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 180},
        {'title': 'Stakeholder Communication Strategy', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 90},
        {'title': 'Security Program Maturity Assessment', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 240},
        {'title': 'Vendor Risk Management', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 150},
        {'title': 'Security Awareness Program Design', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 100},
        {'title': 'CISO Executive Briefing', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 200},
        {'title': 'Security Metrics Dashboard', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 140},
        {'title': 'Business Continuity Planning', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 220},
        {'title': 'Security Team Performance Review', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 160},
        {'title': 'Regulatory Compliance Strategy', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 250},
    ],
    'defender': [
        {'title': 'Silent Pivot: Lateral Movement', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 180},
        {'title': 'SIEM Alert Triage', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 90},
        {'title': 'Malware Analysis Lab', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 200},
        {'title': 'Network Traffic Analysis', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 120},
        {'title': 'Endpoint Detection & Response', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 150},
        {'title': 'Threat Hunting Exercise', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 240},
        {'title': 'Log Analysis Fundamentals', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 100},
        {'title': 'Incident Response Playbook', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 170},
        {'title': 'Vulnerability Assessment', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 110},
        {'title': 'Security Architecture Review', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 220},
        {'title': 'Forensics Investigation', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 260},
        {'title': 'SOC Operations Optimization', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 190},
    ],
    'offensive': [
        {'title': 'API Infiltration: Broken Object Level Authorization', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 120},
        {'title': 'Web Application Penetration Testing', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 180},
        {'title': 'Network Penetration Testing', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 200},
        {'title': 'Vulnerability Scanning', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 90},
        {'title': 'Exploit Development', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 240},
        {'title': 'Social Engineering Assessment', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 150},
        {'title': 'Red Team Exercise', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 300},
        {'title': 'OWASP Top 10 Testing', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 120},
        {'title': 'Wireless Security Testing', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 160},
        {'title': 'Mobile Application Security', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 220},
        {'title': 'Cloud Security Assessment', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 190},
        {'title': 'Physical Security Testing', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 250},
    ],
    'grc': [
        {'title': 'ISO 27001 Gap Analysis', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 200},
        {'title': 'Risk Assessment Framework', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 120},
        {'title': 'Compliance Audit Preparation', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 180},
        {'title': 'Security Policy Development', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 100},
        {'title': 'NIST CSF Mapping', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 240},
        {'title': 'GDPR Compliance Assessment', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 160},
        {'title': 'Control Testing & Validation', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 110},
        {'title': 'Third-Party Risk Assessment', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 170},
        {'title': 'Security Governance Framework', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 220},
        {'title': 'Audit Report Writing', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 90},
        {'title': 'SOC 2 Type II Preparation', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 250},
        {'title': 'Regulatory Compliance Mapping', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 190},
    ],
    'innovation': [
        {'title': 'The Graph Breach: API Injection', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 240},
        {'title': 'Cloud Leak: The Open Bucket', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 60},
        {'title': 'Security Tool Development', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 200},
        {'title': 'AI/ML Security Research', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 280},
        {'title': 'Cryptography Implementation', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 180},
        {'title': 'Secure Software Development', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 120},
        {'title': 'IoT Security Research', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 190},
        {'title': 'Blockchain Security Analysis', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 260},
        {'title': 'Automation Script Development', 'difficulty': 'beginner', 'tier': 'beginner', 'duration': 100},
        {'title': 'Zero-Day Research', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 300},
        {'title': 'Security API Development', 'difficulty': 'intermediate', 'tier': 'intermediate', 'duration': 170},
        {'title': 'Emerging Threat Analysis', 'difficulty': 'advanced', 'tier': 'advanced', 'duration': 250},
    ]
}

# Milestone structure (4 milestones per track)
MILESTONE_NAMES = [
    'Foundation & Fundamentals',
    'Intermediate Skills & Application',
    'Advanced Techniques & Strategy',
    'Mastery & Capstone'
]

# Module types distribution (80% primary, 20% cross-track)
MODULE_TYPES = {
    'primary': ['video', 'lab', 'workshop', 'assignment'],
    'cross_track': ['article', 'quiz', 'workshop']
}


@transaction.atomic
def get_or_create_program_director():
    """Get or create a program director user."""
    director, created = User.objects.get_or_create(
        email='director@test.com',
        defaults={
            'username': 'director',
            'first_name': 'Program',
            'last_name': 'Director',
            'account_status': 'active',
            'email_verified': True,
            'is_active': True
        }
    )
    if not created:
        director.account_status = 'active'
        director.email_verified = True
        director.is_active = True
        director.save()
    
    role, _ = Role.objects.get_or_create(name='program_director')
    from users.models import UserRole
    UserRole.objects.get_or_create(
        user=director,
        role=role,
        defaults={'scope': 'global', 'is_active': True}
    )
    return director


@transaction.atomic
def create_program(program_name, primary_track_key, director):
    """Create a program with its primary track."""
    program, created = Program.objects.get_or_create(
        name=program_name,
        defaults={
            'category': 'technical' if primary_track_key != 'leadership' else 'leadership',
            'categories': ['technical', 'leadership'] if primary_track_key == 'leadership' else ['technical'],
            'description': f'Comprehensive {TRACKS[primary_track_key]["name"]} program with 80% primary track content and 20% cross-track learning',
            'duration_months': 12,
            'default_price': Decimal('0.00'),
            'currency': 'USD',
            'outcomes': [
                f'Master {TRACKS[primary_track_key]["name"]} fundamentals',
                'Apply cross-track knowledge for comprehensive understanding',
                'Complete real-world missions and projects',
                'Build professional portfolio',
                'Achieve industry-recognized competencies'
            ],
            'status': 'active'
        }
    )
    if created:
        print(f'✓ Created program: {program.name}')
    return program


@transaction.atomic
def create_track(program, track_key, is_primary=False):
    """Create a track within a program."""
    track_data = TRACKS[track_key]
    track, created = Track.objects.get_or_create(
        program=program,
        key=track_data['key'],
        defaults={
            'name': track_data['name'],
            'description': track_data['description'],
            'track_type': 'primary' if is_primary else 'cross_track',
            'competencies': {
                'focus_areas': track_data['focus_areas'],
                'career_paths': [
                    f'{track_data["name"]} Analyst',
                    f'{track_data["name"]} Engineer',
                    f'{track_data["name"]} Manager',
                    f'{track_data["name"]} Director'
                ]
            }
        }
    )
    if created:
        print(f'  ✓ Created track: {track.name} ({track.track_type})')
    return track


@transaction.atomic
def create_milestones(track):
    """Create 4 milestones for a track."""
    milestones = []
    for i, milestone_name in enumerate(MILESTONE_NAMES, 1):
        milestone, created = Milestone.objects.get_or_create(
            track=track,
            order=i,
            defaults={
                'name': f'{milestone_name} - {track.name}',
                'description': f'{milestone_name} milestone for {track.name} track',
                'duration_weeks': 3 if i == 1 else (4 if i < 4 else 5)
            }
        )
        if created:
            print(f'    ✓ Created milestone: {milestone.name}')
        milestones.append(milestone)
    return milestones


@transaction.atomic
def create_modules(milestones, track, is_primary=False):
    """Create modules for milestones (80% primary, 20% cross-track)."""
    modules_created = 0
    for milestone in milestones:
        # Determine number of modules (more for primary track)
        num_modules = 6 if is_primary else 2
        
        for i in range(1, num_modules + 1):
            module_type = random.choice(MODULE_TYPES['primary'] if is_primary else MODULE_TYPES['cross_track'])
            module, created = Module.objects.get_or_create(
                milestone=milestone,
                order=i,
                defaults={
                    'name': f'{milestone.name} - Module {i}',
                    'description': f'Module {i} covering {track.name} concepts',
                    'content_type': module_type,
                    'content_url': f'https://example.com/content/{track.key}/module-{i}',
                    'estimated_hours': round(random.uniform(1.0, 4.0), 1),
                    'skills': random.sample(TRACKS[track.key]['focus_areas'], min(3, len(TRACKS[track.key]['focus_areas'])))
                }
            )
            if created:
                modules_created += 1
                # Add to applicable tracks
                if not is_primary:
                    module.applicable_tracks.add(track)
    
    print(f'    ✓ Created {modules_created} modules')
    return modules_created


@transaction.atomic
def create_missions(track, track_key):
    """Create missions for a track (minimum 10)."""
    missions_created = 0
    templates = MISSION_TEMPLATES[track_key]
    
    for i, template in enumerate(templates, 1):
        mission_code = f'{track_key.upper()[:3]}-M{i:02d}'
        mission, created = Mission.objects.get_or_create(
            code=mission_code,
            defaults={
                'title': template['title'],
                'description': f'{template["title"]} mission for {track.name} track',
                'story': f'Mission scenario set in OCH Cyber-City focusing on {template["title"]}',
                'objectives': [
                    f'Understand {template["title"]} concepts',
                    f'Apply {track.name} skills',
                    'Complete practical exercises',
                    'Document findings and solutions'
                ],
                'subtasks': [
                    {
                        'id': 1,
                        'title': 'Initial Assessment',
                        'description': 'Analyze the scenario and identify key requirements',
                        'order': 1,
                        'type': 'technical'
                    },
                    {
                        'id': 2,
                        'title': 'Implementation',
                        'description': 'Execute the required tasks and solutions',
                        'order': 2,
                        'type': 'technical'
                    },
                    {
                        'id': 3,
                        'title': 'Documentation',
                        'description': 'Document findings, solutions, and recommendations',
                        'order': 3,
                        'type': 'technical'
                    }
                ],
                'track': track_key,
                'tier': template['tier'],
                'difficulty': template['difficulty'],
                'type': 'scenario',
                'track_id': track.id,
                'track_key': track.key,
                'estimated_duration_minutes': template['duration'],
                'requires_mentor_review': template['tier'] in ['advanced', 'mastery'],
                'competencies': random.sample(TRACKS[track_key]['focus_areas'], min(3, len(TRACKS[track_key]['focus_areas']))),
                'success_criteria': {
                    'completion': 70,
                    'quality': 80,
                    'documentation': 75
                },
                'is_active': True
            }
        )
        if created:
            missions_created += 1
    
    # Update track missions list
    track.missions = [f'{track_key.upper()[:3]}-M{i:02d}' for i in range(1, len(templates) + 1)]
    track.save()
    
    print(f'    ✓ Created {missions_created} missions')
    return missions_created


@transaction.atomic
def create_specializations(track):
    """Create 2-3 specializations per track."""
    specializations_created = 0
    specialization_names = [
        f'{track.name} Fundamentals',
        f'Advanced {track.name}',
        f'{track.name} Expert'
    ]
    
    for i, spec_name in enumerate(specialization_names[:2], 1):  # Create 2 specializations
        spec, created = Specialization.objects.get_or_create(
            track=track,
            name=spec_name,
            defaults={
                'description': f'{spec_name} specialization within {track.name} track',
                'missions': [],
                'duration_weeks': 4 + i
            }
        )
        if created:
            specializations_created += 1
    
    print(f'    ✓ Created {specializations_created} specializations')
    return specializations_created


def main():
    """Main function to create all programs and their components."""
    print('=' * 80)
    print('Creating Comprehensive OCH Programs Test Data')
    print('=' * 80)
    print()
    
    director = get_or_create_program_director()
    print(f'✓ Using program director: {director.email}')
    print()
    
    total_stats = {
        'programs': 0,
        'tracks': 0,
        'milestones': 0,
        'modules': 0,
        'missions': 0,
        'specializations': 0
    }
    
    # Create 5 programs (one for each track)
    for primary_track_key in TRACKS.keys():
        program_name = f'Cybersecurity {TRACKS[primary_track_key]["name"]} Program'
        
        print(f'\n{"="*80}')
        print(f'Creating: {program_name}')
        print(f'{"="*80}')
        
        # Create program
        program = create_program(program_name, primary_track_key, director)
        total_stats['programs'] += 1
        
        # Create primary track (80% content)
        primary_track = create_track(program, primary_track_key, is_primary=True)
        total_stats['tracks'] += 1
        
        # Create milestones for primary track
        milestones = create_milestones(primary_track)
        total_stats['milestones'] += len(milestones)
        
        # Create modules for primary track (80% - more modules)
        modules_count = create_modules(milestones, primary_track, is_primary=True)
        total_stats['modules'] += modules_count
        
        # Create missions for primary track (minimum 10)
        missions_count = create_missions(primary_track, primary_track_key)
        total_stats['missions'] += missions_count
        
        # Create specializations for primary track
        specs_count = create_specializations(primary_track)
        total_stats['specializations'] += specs_count
        
        # Create cross-track content (20% - from other tracks)
        other_tracks = [k for k in TRACKS.keys() if k != primary_track_key]
        for cross_track_key in other_tracks[:2]:  # Add 2 cross-tracks (20% content)
            cross_track = create_track(program, cross_track_key, is_primary=False)
            total_stats['tracks'] += 1
            
            # Create milestones for cross-track
            cross_milestones = create_milestones(cross_track)
            total_stats['milestones'] += len(cross_milestones)
            
            # Create modules for cross-track (20% - fewer modules)
            cross_modules_count = create_modules(cross_milestones, cross_track, is_primary=False)
            total_stats['modules'] += cross_modules_count
            
            # Create some missions for cross-track (fewer than primary)
            cross_missions_count = create_missions(cross_track, cross_track_key)
            total_stats['missions'] += cross_missions_count
    
    # Summary
    print()
    print('=' * 80)
    print('Summary')
    print('=' * 80)
    print(f'✓ Programs created: {total_stats["programs"]}')
    print(f'✓ Tracks created: {total_stats["tracks"]}')
    print(f'✓ Milestones created: {total_stats["milestones"]}')
    print(f'✓ Modules created: {total_stats["modules"]}')
    print(f'✓ Missions created: {total_stats["missions"]}')
    print(f'✓ Specializations created: {total_stats["specializations"]}')
    print()
    print('✅ All comprehensive program test data created successfully!')
    print()
    print('Program Structure:')
    print('  - Each program has 1 primary track (80% content)')
    print('  - Each program has 2 cross-tracks (20% shared content)')
    print('  - Each track has 4 milestones')
    print('  - Each track has multiple modules')
    print('  - Each track has minimum 10 missions')
    print('  - Each primary track has 2 specializations')


if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f'\n❌ Error: {e}')
        import traceback
        traceback.print_exc()
        sys.exit(1)
