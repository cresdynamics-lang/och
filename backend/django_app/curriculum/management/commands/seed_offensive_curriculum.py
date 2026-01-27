"""
Seed script for Offensive Track curriculum content.
Creates tracks, levels, modules, videos, quizzes, and assessments for Offensive.
"""

import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from curriculum.models import (
    CurriculumTrack, CurriculumLevel, CurriculumModule,
    CurriculumContent, AssessmentBlock
)


class Command(BaseCommand):
    help = 'Seed Offensive Track curriculum content'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Offensive Track curriculum...')

        # Create Offensive Track
        track, created = CurriculumTrack.objects.get_or_create(
            slug='offensive',
            defaults={
                'title': 'Offensive Track',
                'description': 'Penetration testing, red teaming, and adversary emulation for African enterprise targets.',
                'icon_key': 'offensive',
                'is_active': True,
                'order_number': 6
            }
        )
        if created:
            self.stdout.write(f'Created track: {track.title}')
        else:
            self.stdout.write(f'Updated track: {track.title}')

        # Offensive Level configurations
        levels_config = [
            {
                'slug': 'beginner',
                'title': 'Beginner',
                'description': 'Reconnaissance and enumeration fundamentals',
                'order_number': 1,
                'estimated_duration_hours': 10,
                'modules': [
                    {
                        'slug': 'recon-fundamentals',
                        'title': 'Reconnaissance Fundamentals',
                        'description': 'Active and passive reconnaissance techniques',
                        'order_number': 1,
                        'estimated_duration_minutes': 50,
                        'videos': [
                            {
                                'slug': 'active-vs-passive-recon',
                                'title': 'Active vs Passive Reconnaissance',
                                'video_url': 'https://videos.och.local/offensive/beginner/active-vs-passive-recon.mp4',
                                'duration_seconds': 360
                            },
                            {
                                'slug': 'dns-enumeration-techniques',
                                'title': 'DNS Enumeration Techniques',
                                'video_url': 'https://videos.och.local/offensive/beginner/dns-enumeration-techniques.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'whois-and-asn-lookup',
                                'title': 'WHOIS and ASN Lookup',
                                'video_url': 'https://videos.och.local/offensive/beginner/whois-and-asn-lookup.mp4',
                                'duration_seconds': 300
                            }
                        ],
                        'quiz': {
                            'slug': 'reconnaissance-basics-quiz',
                            'title': 'Reconnaissance Basics Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'Which type of reconnaissance involves directly interacting with the target?',
                                        'choices': [
                                            'Passive reconnaissance',
                                            'Active reconnaissance',
                                            'Internal reconnaissance',
                                            'External reconnaissance'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q2',
                                        'type': 'mcq',
                                        'prompt': 'What information can be gathered from a WHOIS lookup?',
                                        'choices': [
                                            'Domain registration details and contact information',
                                            'Internal network topology',
                                            'User passwords',
                                            'Database contents'
                                        ],
                                        'correctIndex': 0
                                    },
                                    {
                                        'id': 'q3',
                                        'type': 'mcq',
                                        'prompt': 'Which DNS enumeration technique involves trying common subdomain names?',
                                        'choices': [
                                            'Zone transfer',
                                            'Brute force enumeration',
                                            'Reverse DNS lookup',
                                            'DNS cache snooping'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q4',
                                        'type': 'mcq',
                                        'prompt': 'What is an ASN in the context of reconnaissance?',
                                        'choices': [
                                            'Application Security Number',
                                            'Autonomous System Number',
                                            'Advanced Security Network',
                                            'Automated Scanning Node'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q5',
                                        'type': 'mcq',
                                        'prompt': 'Why is passive reconnaissance preferred over active reconnaissance?',
                                        'choices': [
                                            'It\'s faster',
                                            'It\'s less likely to be detected',
                                            'It requires fewer tools',
                                            'It provides more detailed information'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q6',
                                        'type': 'mcq',
                                        'prompt': 'What tool is commonly used for DNS enumeration?',
                                        'choices': [
                                            'Nmap',
                                            'Wireshark',
                                            'Dig',
                                            'Metasploit'
                                        ],
                                        'correctIndex': 2
                                    }
                                ]
                            }
                        }
                    },
                    {
                        'slug': 'port-scanning-nmap',
                        'title': 'Port Scanning with Nmap',
                        'description': 'Mastering Nmap for network reconnaissance',
                        'order_number': 2,
                        'estimated_duration_minutes': 55,
                        'videos': [
                            {
                                'slug': 'nmap-scan-types-explained',
                                'title': 'Nmap Scan Types Explained',
                                'video_url': 'https://videos.och.local/offensive/beginner/nmap-scan-types-explained.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'nmap-scripting-engine-nse',
                                'title': 'Nmap Scripting Engine (NSE)',
                                'video_url': 'https://videos.och.local/offensive/beginner/nmap-scripting-engine-nse.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'scan-evasion-techniques',
                                'title': 'Scan Evasion Techniques',
                                'video_url': 'https://videos.och.local/offensive/beginner/scan-evasion-techniques.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'nmap-fundamentals-quiz',
                            'title': 'Nmap Fundamentals Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'Which Nmap scan type is considered the most stealthy?',
                                        'choices': [
                                            'TCP SYN scan (-sS)',
                                            'TCP connect scan (-sT)',
                                            'UDP scan (-sU)',
                                            'ACK scan (-sA)'
                                        ],
                                        'correctIndex': 0
                                    },
                                    {
                                        'id': 'q2',
                                        'type': 'mcq',
                                        'prompt': 'What is the primary purpose of the Nmap Scripting Engine (NSE)?',
                                        'choices': [
                                            'To perform denial of service attacks',
                                            'To automate complex scanning tasks and vulnerability detection',
                                            'To crack passwords',
                                            'To generate fake network traffic'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q3',
                                        'type': 'mcq',
                                        'prompt': 'Which technique can help evade IDS/IPS detection during scanning?',
                                        'choices': [
                                            'Using very fast scan rates',
                                            'Fragmenting packets',
                                            'Scanning during business hours',
                                            'Using default Nmap options'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q4',
                                        'type': 'mcq',
                                        'prompt': 'What does the -sV flag do in Nmap?',
                                        'choices': [
                                            'Performs a version scan',
                                            'Scans for vulnerabilities',
                                            'Shows verbose output',
                                            'Scans all ports'
                                        ],
                                        'correctIndex': 0
                                    }
                                ]
                            }
                        }
                    },
                    {
                        'slug': 'web-recon-basics',
                        'title': 'Web Reconnaissance Basics',
                        'description': 'Web application reconnaissance techniques',
                        'order_number': 3,
                        'estimated_duration_minutes': 45,
                        'videos': [
                            {
                                'slug': 'directory-busting-gobuster',
                                'title': 'Directory Busting with Gobuster',
                                'video_url': 'https://videos.och.local/offensive/beginner/directory-busting-gobuster.mp4',
                                'duration_seconds': 360
                            },
                            {
                                'slug': 'subdomain-enumeration',
                                'title': 'Subdomain Enumeration',
                                'video_url': 'https://videos.och.local/offensive/beginner/subdomain-enumeration.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'technology-fingerprinting',
                                'title': 'Technology Fingerprinting',
                                'video_url': 'https://videos.och.local/offensive/beginner/technology-fingerprinting.mp4',
                                'duration_seconds': 300
                            }
                        ],
                        'quiz': {
                            'slug': 'web-reconnaissance-quiz',
                            'title': 'Web Reconnaissance Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'What is directory busting used for?',
                                        'choices': [
                                            'Finding hidden files and directories on web servers',
                                            'Cracking passwords',
                                            'Scanning network ports',
                                            'Enumerating DNS records'
                                        ],
                                        'correctIndex': 0
                                    },
                                    {
                                        'id': 'q2',
                                        'type': 'mcq',
                                        'prompt': 'Which tool is commonly used for directory busting?',
                                        'choices': [
                                            'Nmap',
                                            'Gobuster',
                                            'Wireshark',
                                            'Metasploit'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q3',
                                        'type': 'mcq',
                                        'prompt': 'What is the main purpose of technology fingerprinting?',
                                        'choices': [
                                            'To identify the technologies and versions running on a target',
                                            'To crack passwords',
                                            'To perform denial of service attacks',
                                            'To encrypt data'
                                        ],
                                        'correctIndex': 0
                                    },
                                    {
                                        'id': 'q4',
                                        'type': 'mcq',
                                        'prompt': 'What is subdomain enumeration?',
                                        'choices': [
                                            'Finding all subdomains of a target domain',
                                            'Scanning for open ports',
                                            'Cracking WiFi passwords',
                                            'Analyzing network traffic'
                                        ],
                                        'correctIndex': 0
                                    }
                                ]
                            }
                        }
                    }
                ],
                'assessment': {
                    'slug': 'offensive-beginner-assessment',
                    'title': 'Complete Reconnaissance Assessment',
                    'description': 'Conduct full reconnaissance on a target following proper methodology.',
                    'missions': [
                        {'mission_slug': 'full-recon-exercise'}
                    ],
                    'recipes': ['offensive-nmap-basics', 'offensive-osint-recon', 'offensive-web-recon-checklist'],
                    'reflection_prompt': 'Document your reconnaissance methodology and explain what information you were able to gather about the target.'
                }
            },
            {
                'slug': 'intermediate',
                'title': 'Intermediate',
                'description': 'Exploitation fundamentals and vulnerability assessment',
                'order_number': 2,
                'estimated_duration_hours': 12,
                'modules': [
                    {
                        'slug': 'vulnerability-scanning',
                        'title': 'Vulnerability Scanning',
                        'description': 'Using automated tools to identify vulnerabilities',
                        'order_number': 1,
                        'estimated_duration_minutes': 65,
                        'videos': [
                            {
                                'slug': 'nessus-openvas-basics',
                                'title': 'Nessus and OpenVAS Basics',
                                'video_url': 'https://videos.och.local/offensive/intermediate/nessus-openvas-basics.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'cve-lookup-exploit-db',
                                'title': 'CVE Lookup and Exploit-DB',
                                'video_url': 'https://videos.och.local/offensive/intermediate/cve-lookup-exploit-db.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'vulnerability-prioritization',
                                'title': 'Vulnerability Prioritization',
                                'video_url': 'https://videos.och.local/offensive/intermediate/vulnerability-prioritization.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'vulnerability-scanning-quiz',
                            'title': 'Vulnerability Scanning Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'web-app-exploitation',
                        'title': 'Web Application Exploitation',
                        'description': 'Common web application vulnerabilities and exploitation',
                        'order_number': 2,
                        'estimated_duration_minutes': 70,
                        'videos': [
                            {
                                'slug': 'sql-injection-basics',
                                'title': 'SQL Injection Fundamentals',
                                'video_url': 'https://videos.och.local/offensive/intermediate/sql-injection-basics.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'xss-cross-site-scripting',
                                'title': 'XSS (Cross-Site Scripting)',
                                'video_url': 'https://videos.och.local/offensive/intermediate/xss-cross-site-scripting.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'burp-suite-basics',
                                'title': 'Burp Suite Basics',
                                'video_url': 'https://videos.och.local/offensive/intermediate/burp-suite-basics.mp4',
                                'duration_seconds': 540
                            }
                        ],
                        'quiz': {
                            'slug': 'web-app-exploitation-quiz',
                            'title': 'Web App Exploitation Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'password-attacks',
                        'title': 'Password Attacks',
                        'description': 'Cracking and attacking password security',
                        'order_number': 3,
                        'estimated_duration_minutes': 55,
                        'videos': [
                            {
                                'slug': 'hashcat-fundamentals',
                                'title': 'Hashcat Fundamentals',
                                'video_url': 'https://videos.och.local/offensive/intermediate/hashcat-fundamentals.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'john-the-ripper',
                                'title': 'John the Ripper',
                                'video_url': 'https://videos.och.local/offensive/intermediate/john-the-ripper.mp4',
                                'duration_seconds': 360
                            },
                            {
                                'slug': 'credential-stuffing',
                                'title': 'Credential Stuffing Attacks',
                                'video_url': 'https://videos.och.local/offensive/intermediate/credential-stuffing.mp4',
                                'duration_seconds': 300
                            }
                        ],
                        'quiz': {
                            'slug': 'password-attacks-quiz',
                            'title': 'Password Attacks Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'offensive-intermediate-assessment',
                    'title': 'Exploit a Vulnerable Web Application',
                    'description': 'Identify and exploit vulnerabilities in a deliberately vulnerable web application.',
                    'missions': [
                        {'mission_slug': 'web-app-exploitation-exercise'}
                    ],
                    'recipes': ['offensive-sql-injection-guide', 'offensive-xss-exploitation', 'offensive-password-cracking-basics'],
                    'reflection_prompt': 'Describe the vulnerabilities you found and exploited. What was your methodology and what lessons did you learn?'
                }
            },
            {
                'slug': 'advanced',
                'title': 'Advanced',
                'description': 'Post-exploitation and evasion techniques',
                'order_number': 3,
                'estimated_duration_hours': 13,
                'modules': [
                    {
                        'slug': 'post-exploitation',
                        'title': 'Post-Exploitation Techniques',
                        'description': 'Maintaining access and privilege escalation after initial compromise',
                        'order_number': 1,
                        'estimated_duration_minutes': 75,
                        'videos': [
                            {
                                'slug': 'meterpreter-basics',
                                'title': 'Meterpreter Basics',
                                'video_url': 'https://videos.och.local/offensive/advanced/meterpreter-basics.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'privilege-escalation',
                                'title': 'Privilege Escalation Techniques',
                                'video_url': 'https://videos.och.local/offensive/advanced/privilege-escalation.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'persistence-methods',
                                'title': 'Persistence Methods',
                                'video_url': 'https://videos.och.local/offensive/advanced/persistence-methods.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'post-exploitation-quiz',
                            'title': 'Post-Exploitation Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'evasion-detection',
                        'title': 'Evasion and Detection Avoidance',
                        'description': 'Bypassing security controls and avoiding detection',
                        'order_number': 2,
                        'estimated_duration_minutes': 70,
                        'videos': [
                            {
                                'slug': 'antivirus-bypass',
                                'title': 'Antivirus Bypass Techniques',
                                'video_url': 'https://videos.och.local/offensive/advanced/antivirus-bypass.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'log-manipulation',
                                'title': 'Log Manipulation and Anti-Forensics',
                                'video_url': 'https://videos.och.local/offensive/advanced/log-manipulation.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'c2-frameworks',
                                'title': 'Command and Control Frameworks',
                                'video_url': 'https://videos.och.local/offensive/advanced/c2-frameworks.mp4',
                                'duration_seconds': 540
                            }
                        ],
                        'quiz': {
                            'slug': 'evasion-detection-quiz',
                            'title': 'Evasion and Detection Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'wireless-attacks',
                        'title': 'Wireless Network Attacks',
                        'description': 'Attacking WiFi networks and wireless protocols',
                        'order_number': 3,
                        'estimated_duration_minutes': 65,
                        'videos': [
                            {
                                'slug': 'wifi-cracking-fundamentals',
                                'title': 'WiFi Cracking Fundamentals',
                                'video_url': 'https://videos.och.local/offensive/advanced/wifi-cracking-fundamentals.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'evil-twin-attacks',
                                'title': 'Evil Twin Attacks',
                                'video_url': 'https://videos.och.local/offensive/advanced/evil-twin-attacks.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'ble-security-attacks',
                                'title': 'BLE (Bluetooth Low Energy) Security',
                                'video_url': 'https://videos.och.local/offensive/advanced/ble-security-attacks.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'wireless-attacks-quiz',
                            'title': 'Wireless Attacks Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'offensive-advanced-assessment',
                    'title': 'Red Team Engagement Simulation',
                    'description': 'Simulate a red team engagement including initial access, privilege escalation, and persistence.',
                    'missions': [
                        {'mission_slug': 'red-team-simulation'}
                    ],
                    'recipes': ['offensive-post-exploitation-guide', 'offensive-evasion-techniques', 'offensive-wireless-pentesting'],
                    'reflection_prompt': 'Describe your red team simulation approach. What techniques worked well and what challenges did you encounter?'
                }
            },
            {
                'slug': 'mastery',
                'title': 'Mastery',
                'description': 'Red team operations and advanced adversary emulation',
                'order_number': 4,
                'estimated_duration_hours': 15,
                'modules': [
                    {
                        'slug': 'red-team-methodology',
                        'title': 'Red Team Methodology',
                        'description': 'Structured approach to red team operations',
                        'order_number': 1,
                        'estimated_duration_minutes': 80,
                        'videos': [
                            {
                                'slug': 'mitre-attck-framework',
                                'title': 'MITRE ATT&CK Framework',
                                'video_url': 'https://videos.och.local/offensive/mastery/mitre-attck-framework.mp4',
                                'duration_seconds': 600
                            },
                            {
                                'slug': 'opfor-planning',
                                'title': 'OPFOR (Opposing Force) Planning',
                                'video_url': 'https://videos.och.local/offensive/mastery/opfor-planning.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'rules-of-engagement',
                                'title': 'Rules of Engagement (ROE)',
                                'video_url': 'https://videos.och.local/offensive/mastery/rules-of-engagement.mp4',
                                'duration_seconds': 480
                            }
                        ],
                        'quiz': {
                            'slug': 'red-team-methodology-quiz',
                            'title': 'Red Team Methodology Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'advanced-exploitation',
                        'title': 'Advanced Exploitation Techniques',
                        'description': '0-day exploits, custom weaponization, and advanced techniques',
                        'order_number': 2,
                        'estimated_duration_minutes': 85,
                        'videos': [
                            {
                                'slug': 'zero-day-exploitation',
                                'title': '0-Day Exploitation',
                                'video_url': 'https://videos.och.local/offensive/mastery/zero-day-exploitation.mp4',
                                'duration_seconds': 600
                            },
                            {
                                'slug': 'custom-exploit-development',
                                'title': 'Custom Exploit Development',
                                'video_url': 'https://videos.och.local/offensive/mastery/custom-exploit-development.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'payload-weaponization',
                                'title': 'Payload Weaponization',
                                'video_url': 'https://videos.och.local/offensive/mastery/payload-weaponization.mp4',
                                'duration_seconds': 480
                            }
                        ],
                        'quiz': {
                            'slug': 'advanced-exploitation-quiz',
                            'title': 'Advanced Exploitation Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'adversary-emulation',
                        'title': 'Adversary Emulation',
                        'description': 'Emulating real-world threat actors and techniques',
                        'order_number': 3,
                        'estimated_duration_minutes': 75,
                        'videos': [
                            {
                                'slug': 'atomic-red-team',
                                'title': 'Atomic Red Team',
                                'video_url': 'https://videos.och.local/offensive/mastery/atomic-red-team.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'caldera-framework',
                                'title': 'Caldera Framework',
                                'video_url': 'https://videos.och.local/offensive/mastery/caldera-framework.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'purple-teaming',
                                'title': 'Purple Teaming Concepts',
                                'video_url': 'https://videos.och.local/offensive/mastery/purple-teaming.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'adversary-emulation-quiz',
                            'title': 'Adversary Emulation Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'offensive-mastery-assessment',
                    'title': 'Full Red Team Operation Report',
                    'description': 'Execute a complete red team engagement and deliver a professional report with findings and recommendations.',
                    'missions': [
                        {'mission_slug': 'complete-red-team-operation'}
                    ],
                    'recipes': ['offensive-red-team-methodology', 'offensive-advanced-exploitation', 'offensive-adversary-emulation'],
                    'reflection_prompt': 'Describe your complete red team operation. What was your most sophisticated technique and how would you improve it for future engagements?'
                }
            }
        ]

        # Create levels, modules, content, and assessments
        for level_config in levels_config:
            level, created = CurriculumLevel.objects.get_or_create(
                track=track,
                slug=level_config['slug'],
                defaults={
                    'title': level_config['title'],
                    'description': level_config['description'],
                    'order_number': level_config['order_number'],
                    'estimated_duration_hours': level_config['estimated_duration_hours'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'Created level: {level.title}')
            else:
                self.stdout.write(f'Updated level: {level.title}')

            # Create modules for this level
            for module_config in level_config['modules']:
                module, created = CurriculumModule.objects.get_or_create(
                    level=level,
                    slug=module_config['slug'],
                    defaults={
                        'title': module_config['title'],
                        'description': module_config['description'],
                        'order_number': module_config['order_number'],
                        'estimated_duration_minutes': module_config['estimated_duration_minutes'],
                        'is_active': True
                    }
                )
                if created:
                    self.stdout.write(f'  Created module: {module.title}')
                else:
                    self.stdout.write(f'  Updated module: {module.title}')

                # Create videos for this module
                for video_config in module_config['videos']:
                    video, created = CurriculumContent.objects.get_or_create(
                        module=module,
                        slug=video_config['slug'],
                        defaults={
                            'title': video_config['title'],
                            'content_type': 'video',
                            'video_url': video_config['video_url'],
                            'duration_seconds': video_config['duration_seconds'],
                            'order_number': module_config['videos'].index(video_config) + 1,
                            'is_active': True
                        }
                    )
                    if created:
                        self.stdout.write(f'    Created video: {video.title}')
                    else:
                        self.stdout.write(f'    Updated video: {video.title}')

                # Create quiz for this module
                quiz_data = module_config['quiz']
                quiz, created = CurriculumContent.objects.get_or_create(
                    module=module,
                    slug=quiz_data['slug'],
                    defaults={
                        'title': quiz_data['title'],
                        'content_type': 'quiz',
                        'quiz_data': json.dumps(quiz_data['data']),
                        'order_number': len(module_config['videos']) + 1,
                        'is_active': True
                    }
                )
                if created:
                    self.stdout.write(f'    Created quiz: {quiz.title}')
                else:
                    self.stdout.write(f'    Updated quiz: {quiz.title}')

            # Create assessment block for this level
            assessment_config = level_config['assessment']
            assessment, created = AssessmentBlock.objects.get_or_create(
                level=level,
                slug=assessment_config['slug'],
                defaults={
                    'title': assessment_config['title'],
                    'description': assessment_config['description'],
                    'missions': json.dumps(assessment_config['missions']),
                    'recipes': json.dumps(assessment_config['recipes']),
                    'reflection_prompt': assessment_config['reflection_prompt'],
                    'is_active': True
                }
            )
            if created:
                self.stdout.write(f'  Created assessment: {assessment.title}')
            else:
                self.stdout.write(f'  Updated assessment: {assessment.title}')

        self.stdout.write(self.style.SUCCESS('Successfully seeded Offensive Track curriculum!'))
