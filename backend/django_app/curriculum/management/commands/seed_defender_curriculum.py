"""
Management command to seed the complete OCH Curriculum System.
Creates all 5 tracks (Defender, Offensive, GRC, Innovation, Leadership) with full content structure.
"""
import uuid
from django.core.management.base import BaseCommand
from curriculum.models import (
    CurriculumTrack, CurriculumLevel, CurriculumModule,
    CurriculumVideo, CurriculumQuiz, StrategicSession
)


class Command(BaseCommand):
    help = 'Seed complete OCH Curriculum System with all 5 tracks (Defender, Offensive, GRC, Innovation, Leadership)'

    OCH_CURRICULUM = [
        {
            'track': {
                'slug': 'defender',
                'title': 'Defender Track',
                'description': 'Master cybersecurity defense from fundamentals to advanced threat hunting',
                'thumbnail_url': 'https://placeholder.com/defender.jpg',
                'order_number': 1
            },
            'levels': [
                {
                    'slug': 'beginner',
                    'title': 'Beginner',
                    'description': 'Foundations of cybersecurity defense',
                    'estimated_duration_hours': 12,
                    'modules': [
                        {
                            'slug': 'log-analysis-fundamentals',
                            'title': 'Log Analysis Fundamentals',
                            'description': 'Learn the basics of log analysis and event monitoring',
                            'estimated_duration_minutes': 180,
                            'supporting_recipes': ['log-parsing-basics'],
                            'videos': [
                                {
                                    'slug': 'what-are-logs',
                                    'title': 'What Are Logs?',
                                    'description': 'Understanding log files and their importance in cybersecurity',
                                    'video_url': 'https://placeholder.com/video1.mp4',
                                    'duration_seconds': 300
                                },
                                {
                                    'slug': 'event-viewer-walkthrough',
                                    'title': 'Event Viewer Walkthrough',
                                    'description': 'Exploring Windows Event Viewer for security events',
                                    'video_url': 'https://placeholder.com/video2.mp4',
                                    'duration_seconds': 480
                                },
                                {
                                    'slug': 'failed-logon-patterns',
                                    'title': 'Failed Logon Patterns',
                                    'description': 'Identifying suspicious login attempts and patterns',
                                    'video_url': 'https://placeholder.com/video3.mp4',
                                    'duration_seconds': 420
                                }
                            ],
                            'quiz': {
                                'slug': 'log-basics-assessment',
                                'title': 'Log Basics Assessment',
                                'questions': [
                                    {
                                        'question': 'What Event ID indicates a failed logon attempt?',
                                        'type': 'multiple_choice',
                                        'options': ['4624', '4625', '4634', '4648'],
                                        'correct_answer': '4625',
                                        'explanation': 'Event ID 4625 indicates an account failed to log on.'
                                    }
                                ]
                            }
                        },
                        {
                            'slug': 'basic-siem-searching',
                            'title': 'Basic SIEM Searching',
                            'description': 'Introduction to SIEM interfaces and search syntax',
                            'estimated_duration_minutes': 150,
                            'supporting_recipes': ['siem-basics'],
                            'videos': [
                                {
                                    'slug': 'siem-interface-overview',
                                    'title': 'SIEM Interface Overview',
                                    'description': 'Understanding SIEM dashboard and navigation',
                                    'video_url': 'https://placeholder.com/video4.mp4',
                                    'duration_seconds': 360
                                },
                                {
                                    'slug': 'search-syntax-basics',
                                    'title': 'Search Syntax Basics',
                                    'description': 'Learning basic search operators and filters',
                                    'video_url': 'https://placeholder.com/video5.mp4',
                                    'duration_seconds': 540
                                },
                                {
                                    'slug': 'time-range-filtering',
                                    'title': 'Time Range Filtering',
                                    'description': 'Using time-based filters in security investigations',
                                    'video_url': 'https://placeholder.com/video6.mp4',
                                    'duration_seconds': 360
                                }
                            ],
                            'quiz': {
                                'slug': 'siem-search-fundamentals',
                                'title': 'SIEM Search Fundamentals',
                                'questions': []
                            }
                        },
                        {
                            'slug': 'alert-triage-intro',
                            'title': 'Alert Triage Intro',
                            'description': 'Understanding alert priority and initial response procedures',
                            'estimated_duration_minutes': 120,
                            'supporting_recipes': ['alert-basics'],
                            'videos': [
                                {
                                    'slug': 'what-is-alert-triage',
                                    'title': 'What Is Alert Triage?',
                                    'description': 'Introduction to alert triage process',
                                    'video_url': 'https://placeholder.com/video7.mp4',
                                    'duration_seconds': 300
                                },
                                {
                                    'slug': 'priority-vs-severity',
                                    'title': 'Priority vs Severity',
                                    'description': 'Understanding the difference between priority and severity',
                                    'video_url': 'https://placeholder.com/video8.mp4',
                                    'duration_seconds': 420
                                }
                            ],
                            'quiz': {
                                'slug': 'alert-basics',
                                'title': 'Alert Basics',
                                'questions': []
                            }
                        }
                    ],
                    'strategic_session': {
                        'title': 'Beginner Defender Roadmap',
                        'description': 'Planning your journey as a cybersecurity defender',
                        'agenda_items': [
                            'Review log parsing recipes',
                            'Plan first SIEM searches',
                            'Set 30-day goals'
                        ],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['defender-roadmap']
                    }
                },
                {
                    'slug': 'intermediate',
                    'title': 'Intermediate',
                    'description': 'Advanced analysis and correlation techniques',
                    'estimated_duration_hours': 12,
                    'modules': [
                        {
                            'slug': 'advanced-log-correlation',
                            'title': 'Advanced Log Correlation',
                            'description': 'Correlating events across multiple log sources',
                            'estimated_duration_minutes': 180,
                            'supporting_recipes': ['log-correlation'],
                            'videos': [
                                {'slug': 'multi-source-correlation', 'title': 'Multi-Source Correlation', 'video_url': 'https://placeholder.com/video9.mp4', 'duration_seconds': 480},
                                {'slug': 'temporal-analysis', 'title': 'Temporal Analysis', 'video_url': 'https://placeholder.com/video10.mp4', 'duration_seconds': 420},
                                {'slug': 'pattern-recognition', 'title': 'Pattern Recognition', 'video_url': 'https://placeholder.com/video11.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'correlation-assessment', 'title': 'Log Correlation Assessment', 'questions': []}
                        },
                        {
                            'slug': 'detection-rule-basics',
                            'title': 'Detection Rule Basics',
                            'description': 'Creating detection rules with Sigma and YARA',
                            'estimated_duration_minutes': 150,
                            'supporting_recipes': ['sigma-rules', 'yara-basics'],
                            'videos': [
                                {'slug': 'sigma-rule-syntax', 'title': 'Sigma Rule Syntax', 'video_url': 'https://placeholder.com/video12.mp4', 'duration_seconds': 540},
                                {'slug': 'yara-rule-creation', 'title': 'YARA Rule Creation', 'video_url': 'https://placeholder.com/video13.mp4', 'duration_seconds': 480},
                                {'slug': 'rule-testing-validation', 'title': 'Rule Testing & Validation', 'video_url': 'https://placeholder.com/video14.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'detection-rules-quiz', 'title': 'Detection Rules Assessment', 'questions': []}
                        },
                        {
                            'slug': 'incident-timelines',
                            'title': 'Incident Timelines',
                            'description': 'Building and analyzing incident timelines',
                            'estimated_duration_minutes': 120,
                            'supporting_recipes': ['timeline-analysis'],
                            'videos': [
                                {'slug': 'timeline-construction', 'title': 'Timeline Construction', 'video_url': 'https://placeholder.com/video15.mp4', 'duration_seconds': 420},
                                {'slug': 'evidence-correlation', 'title': 'Evidence Correlation', 'video_url': 'https://placeholder.com/video16.mp4', 'duration_seconds': 360},
                                {'slug': 'chain-of-events', 'title': 'Chain of Events', 'video_url': 'https://placeholder.com/video17.mp4', 'duration_seconds': 480}
                            ],
                            'quiz': {'slug': 'timeline-assessment', 'title': 'Timeline Analysis Quiz', 'questions': []}
                        }
                    ],
                    'strategic_session': {
                        'title': 'Intermediate Defender Planning',
                        'description': 'Advancing your defensive capabilities',
                        'agenda_items': ['Review advanced techniques', 'Plan detection rule development', 'Set intermediate goals'],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['intermediate-defender']
                    }
                },
                {
                    'slug': 'advanced',
                    'title': 'Advanced',
                    'description': 'Proactive defense and threat hunting',
                    'estimated_duration_hours': 12,
                    'modules': [
                        {
                            'slug': 'threat-hunting-methodologies',
                            'title': 'Threat Hunting Methodologies',
                            'description': 'Proactive threat hunting techniques and frameworks',
                            'estimated_duration_minutes': 180,
                            'supporting_recipes': ['threat-hunting'],
                            'videos': [
                                {'slug': 'hunting-hypothesis', 'title': 'Hunting Hypothesis', 'video_url': 'https://placeholder.com/video18.mp4', 'duration_seconds': 480},
                                {'slug': 'data-analysis-techniques', 'title': 'Data Analysis Techniques', 'video_url': 'https://placeholder.com/video19.mp4', 'duration_seconds': 420},
                                {'slug': 'threat-intelligence-integration', 'title': 'Threat Intelligence Integration', 'video_url': 'https://placeholder.com/video20.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'threat-hunting-quiz', 'title': 'Threat Hunting Assessment', 'questions': []}
                        },
                        {
                            'slug': 'edr-deep-dive',
                            'title': 'EDR Deep Dive',
                            'description': 'Advanced Endpoint Detection and Response',
                            'estimated_duration_minutes': 150,
                            'supporting_recipes': ['edr-advanced'],
                            'videos': [
                                {'slug': 'edr-architecture', 'title': 'EDR Architecture', 'video_url': 'https://placeholder.com/video21.mp4', 'duration_seconds': 540},
                                {'slug': 'behavioral-analysis', 'title': 'Behavioral Analysis', 'video_url': 'https://placeholder.com/video22.mp4', 'duration_seconds': 480},
                                {'slug': 'response-automation', 'title': 'Response Automation', 'video_url': 'https://placeholder.com/video23.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'edr-assessment', 'title': 'EDR Deep Dive Quiz', 'questions': []}
                        },
                        {
                            'slug': 'advanced-siem-analytics',
                            'title': 'Advanced SIEM Analytics',
                            'description': 'Advanced analytics and machine learning in SIEM',
                            'estimated_duration_minutes': 120,
                            'supporting_recipes': ['siem-analytics'],
                            'videos': [
                                {'slug': 'machine-learning-detection', 'title': 'Machine Learning Detection', 'video_url': 'https://placeholder.com/video24.mp4', 'duration_seconds': 420},
                                {'slug': 'anomaly-detection', 'title': 'Anomaly Detection', 'video_url': 'https://placeholder.com/video25.mp4', 'duration_seconds': 360},
                                {'slug': 'predictive-analytics', 'title': 'Predictive Analytics', 'video_url': 'https://placeholder.com/video26.mp4', 'duration_seconds': 480}
                            ],
                            'quiz': {'slug': 'analytics-assessment', 'title': 'Advanced Analytics Quiz', 'questions': []}
                        }
                    ],
                    'strategic_session': {
                        'title': 'Advanced Defender Strategy',
                        'description': 'Strategic planning for advanced defensive operations',
                        'agenda_items': ['Review threat hunting frameworks', 'Plan EDR deployment', 'Set advanced objectives'],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['advanced-defender-strategy']
                    }
                },
                {
                    'slug': 'mastery',
                    'title': 'Mastery',
                    'description': 'Leadership and advanced defensive strategies',
                    'estimated_duration_hours': 12,
                    'modules': [
                        {
                            'slug': 'proactive-threat-hunting',
                            'title': 'Proactive Threat Hunting',
                            'description': 'Advanced threat hunting and red team emulation',
                            'estimated_duration_minutes': 180,
                            'supporting_recipes': ['proactive-hunting'],
                            'videos': [
                                {'slug': 'red-team-emulation', 'title': 'Red Team Emulation', 'video_url': 'https://placeholder.com/video27.mp4', 'duration_seconds': 480},
                                {'slug': 'assume-breach-mindset', 'title': 'Assume Breach Mindset', 'video_url': 'https://placeholder.com/video28.mp4', 'duration_seconds': 420},
                                {'slug': 'continuous-monitoring', 'title': 'Continuous Monitoring', 'video_url': 'https://placeholder.com/video29.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'proactive-hunting-quiz', 'title': 'Proactive Threat Hunting Assessment', 'questions': []}
                        },
                        {
                            'slug': 'detection-engineering',
                            'title': 'Detection Engineering',
                            'description': 'Building and maintaining detection capabilities',
                            'estimated_duration_minutes': 150,
                            'supporting_recipes': ['detection-engineering'],
                            'videos': [
                                {'slug': 'detection-engineering-principles', 'title': 'Detection Engineering Principles', 'video_url': 'https://placeholder.com/video30.mp4', 'duration_seconds': 540},
                                {'slug': 'rule-optimization', 'title': 'Rule Optimization', 'video_url': 'https://placeholder.com/video31.mp4', 'duration_seconds': 480},
                                {'slug': 'detection-testing', 'title': 'Detection Testing', 'video_url': 'https://placeholder.com/video32.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'detection-engineering-quiz', 'title': 'Detection Engineering Assessment', 'questions': []}
                        },
                        {
                            'slug': 'defender-team-leadership',
                            'title': 'Defender Team Leadership',
                            'description': 'Leading cybersecurity defense teams and operations',
                            'estimated_duration_minutes': 120,
                            'supporting_recipes': ['team-leadership'],
                            'videos': [
                                {'slug': 'building-security-teams', 'title': 'Building Security Teams', 'video_url': 'https://placeholder.com/video33.mp4', 'duration_seconds': 420},
                                {'slug': 'incident-response-leadership', 'title': 'Incident Response Leadership', 'video_url': 'https://placeholder.com/video34.mp4', 'duration_seconds': 360},
                                {'slug': 'security-program-management', 'title': 'Security Program Management', 'video_url': 'https://placeholder.com/video35.mp4', 'duration_seconds': 480}
                            ],
                            'quiz': {'slug': 'leadership-assessment', 'title': 'Defender Leadership Quiz', 'questions': []}
                        }
                    ],
                    'strategic_session': {
                        'title': 'Mastery Capstone Planning',
                        'description': 'Final planning for cybersecurity defense mastery',
                        'agenda_items': ['Review mastery achievements', 'Plan career advancement', 'Set long-term goals'],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['mastery-capstone']
                    }
                }
            ]
        }
        },
        {
            'track': {
                'slug': 'offensive',
                'title': 'Offensive Security Track',
                'description': 'Master penetration testing and red team operations',
                'thumbnail_url': 'https://placeholder.com/offensive.jpg',
                'order_number': 2
            },
            'levels': [
                {
                    'slug': 'beginner',
                    'title': 'Beginner',
                    'description': 'Foundations of offensive security',
                    'estimated_duration_hours': 12,
                    'modules': [
                        {
                            'slug': 'reconnaissance-fundamentals',
                            'title': 'Reconnaissance Fundamentals',
                            'description': 'Information gathering and OSINT techniques',
                            'estimated_duration_minutes': 180,
                            'supporting_recipes': ['osint-basics'],
                            'videos': [
                                {'slug': 'passive-recon', 'title': 'Passive Reconnaissance', 'video_url': 'https://placeholder.com/video36.mp4', 'duration_seconds': 300},
                                {'slug': 'active-scanning', 'title': 'Active Scanning Techniques', 'video_url': 'https://placeholder.com/video37.mp4', 'duration_seconds': 480},
                                {'slug': 'footprinting', 'title': 'Network Footprinting', 'video_url': 'https://placeholder.com/video38.mp4', 'duration_seconds': 420}
                            ],
                            'quiz': {'slug': 'recon-quiz', 'title': 'Reconnaissance Assessment', 'questions': []}
                        },
                        {
                            'slug': 'vulnerability-scanning',
                            'title': 'Vulnerability Scanning',
                            'description': 'Automated vulnerability discovery',
                            'estimated_duration_minutes': 150,
                            'supporting_recipes': ['nessus-basics'],
                            'videos': [
                                {'slug': 'scanner-tools', 'title': 'Scanner Tools Overview', 'video_url': 'https://placeholder.com/video39.mp4', 'duration_seconds': 360},
                                {'slug': 'scan-types', 'title': 'Types of Vulnerability Scans', 'video_url': 'https://placeholder.com/video40.mp4', 'duration_seconds': 540},
                                {'slug': 'false-positives', 'title': 'Handling False Positives', 'video_url': 'https://placeholder.com/video41.mp4', 'duration_seconds': 480}
                            ],
                            'quiz': {'slug': 'vuln-scan-quiz', 'title': 'Vulnerability Scanning Quiz', 'questions': []}
                        },
                        {
                            'slug': 'basic-exploitation',
                            'title': 'Basic Exploitation',
                            'description': 'Introduction to exploit development',
                            'estimated_duration_minutes': 120,
                            'supporting_recipes': ['metasploit-intro'],
                            'videos': [
                                {'slug': 'exploit-concepts', 'title': 'Exploit Development Concepts', 'video_url': 'https://placeholder.com/video42.mp4', 'duration_seconds': 420},
                                {'slug': 'payload-delivery', 'title': 'Payload Delivery Methods', 'video_url': 'https://placeholder.com/video43.mp4', 'duration_seconds': 360},
                                {'slug': 'post-exploitation', 'title': 'Post-Exploitation Basics', 'video_url': 'https://placeholder.com/video44.mp4', 'duration_seconds': 480}
                            ],
                            'quiz': {'slug': 'exploitation-quiz', 'title': 'Basic Exploitation Assessment', 'questions': []}
                        }
                    ],
                    'strategic_session': {
                        'title': 'Beginner Offensive Roadmap',
                        'description': 'Planning your offensive security journey',
                        'agenda_items': ['Review recon techniques', 'Plan vulnerability assessments', 'Set ethical hacking goals'],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['offensive-roadmap']
                    }
                },
                {
                    'slug': 'intermediate',
                    'title': 'Intermediate',
                    'description': 'Advanced offensive techniques',
                    'estimated_duration_hours': 12,
                    'prerequisites': {'quizzes_passed': 80},
                    'modules': [
                        {
                            'slug': 'web-application-testing',
                            'title': 'Web Application Testing',
                            'description': 'OWASP Top 10 and web security testing',
                            'estimated_duration_minutes': 180,
                            'supporting_recipes': ['owasp-top-10'],
                            'videos': [
                                {'slug': 'owasp-overview', 'title': 'OWASP Top 10 Overview', 'video_url': 'https://placeholder.com/video45.mp4', 'duration_seconds': 480},
                                {'slug': 'injection-attacks', 'title': 'SQL Injection & XSS', 'video_url': 'https://placeholder.com/video46.mp4', 'duration_seconds': 420},
                                {'slug': 'authentication-testing', 'title': 'Authentication Testing', 'video_url': 'https://placeholder.com/video47.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'web-app-quiz', 'title': 'Web Application Security Quiz', 'questions': []}
                        },
                        {
                            'slug': 'network-pentesting',
                            'title': 'Network Penetration Testing',
                            'description': 'Internal and external network testing',
                            'estimated_duration_minutes': 150,
                            'supporting_recipes': ['network-pentest'],
                            'videos': [
                                {'slug': 'network-mapping', 'title': 'Network Mapping & Enumeration', 'video_url': 'https://placeholder.com/video48.mp4', 'duration_seconds': 540},
                                {'slug': 'wireless-testing', 'title': 'Wireless Network Testing', 'video_url': 'https://placeholder.com/video49.mp4', 'duration_seconds': 480},
                                {'slug': 'lateral-movement', 'title': 'Lateral Movement Techniques', 'video_url': 'https://placeholder.com/video50.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'network-pentest-quiz', 'title': 'Network Penetration Testing Quiz', 'questions': []}
                        },
                        {
                            'slug': 'social-engineering',
                            'title': 'Social Engineering',
                            'description': 'Human-focused attack techniques',
                            'estimated_duration_minutes': 120,
                            'supporting_recipes': ['social-engineering'],
                            'videos': [
                                {'slug': 'phishing-techniques', 'title': 'Advanced Phishing Techniques', 'video_url': 'https://placeholder.com/video51.mp4', 'duration_seconds': 420},
                                {'slug': 'physical-security', 'title': 'Physical Security Assessment', 'video_url': 'https://placeholder.com/video52.mp4', 'duration_seconds': 360},
                                {'slug': 'psychological-tricks', 'title': 'Psychological Manipulation', 'video_url': 'https://placeholder.com/video53.mp4', 'duration_seconds': 480}
                            ],
                            'quiz': {'slug': 'social-eng-quiz', 'title': 'Social Engineering Assessment', 'questions': []}
                        }
                    ],
                    'strategic_session': {
                        'title': 'Intermediate Offensive Strategy',
                        'description': 'Advanced penetration testing planning',
                        'agenda_items': ['Review web app testing', 'Plan network assessments', 'Develop social engineering campaigns'],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['intermediate-offensive']
                    }
                },
                {
                    'slug': 'advanced',
                    'title': 'Advanced',
                    'description': 'Expert-level offensive operations',
                    'estimated_duration_hours': 12,
                    'prerequisites': {'quizzes_passed': 85},
                    'modules': [
                        {
                            'slug': 'red-team-operations',
                            'title': 'Red Team Operations',
                            'description': 'Full-scope red team engagements',
                            'estimated_duration_minutes': 180,
                            'supporting_recipes': ['red-team-methodology'],
                            'videos': [
                                {'slug': 'red-team-planning', 'title': 'Red Team Mission Planning', 'video_url': 'https://placeholder.com/video54.mp4', 'duration_seconds': 480},
                                {'slug': 'assume-breach', 'title': 'Assume Breach Methodology', 'video_url': 'https://placeholder.com/video55.mp4', 'duration_seconds': 420},
                                {'slug': 'persistence-techniques', 'title': 'Advanced Persistence Techniques', 'video_url': 'https://placeholder.com/video56.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'red-team-quiz', 'title': 'Red Team Operations Quiz', 'questions': []}
                        },
                        {
                            'slug': 'exploit-development',
                            'title': 'Exploit Development',
                            'description': 'Custom exploit creation and analysis',
                            'estimated_duration_minutes': 150,
                            'supporting_recipes': ['exploit-dev'],
                            'videos': [
                                {'slug': 'fuzzing-techniques', 'title': 'Fuzzing & Crash Analysis', 'video_url': 'https://placeholder.com/video57.mp4', 'duration_seconds': 540},
                                {'slug': 'shellcode-writing', 'title': 'Shellcode Development', 'video_url': 'https://placeholder.com/video58.mp4', 'duration_seconds': 480},
                                {'slug': 'heap-exploitation', 'title': 'Heap Exploitation', 'video_url': 'https://placeholder.com/video59.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'exploit-dev-quiz', 'title': 'Exploit Development Assessment', 'questions': []}
                        },
                        {
                            'slug': 'wireless-hacking',
                            'title': 'Wireless Network Hacking',
                            'description': 'WiFi and Bluetooth security testing',
                            'estimated_duration_minutes': 120,
                            'supporting_recipes': ['wireless-security'],
                            'videos': [
                                {'slug': 'wifi-cracking', 'title': 'WiFi Cracking Techniques', 'video_url': 'https://placeholder.com/video60.mp4', 'duration_seconds': 420},
                                {'slug': 'wps-attacks', 'title': 'WPS & PMKID Attacks', 'video_url': 'https://placeholder.com/video61.mp4', 'duration_seconds': 360},
                                {'slug': 'bluetooth-hacking', 'title': 'Bluetooth Security Testing', 'video_url': 'https://placeholder.com/video62.mp4', 'duration_seconds': 480}
                            ],
                            'quiz': {'slug': 'wireless-quiz', 'title': 'Wireless Hacking Assessment', 'questions': []}
                        }
                    ],
                    'strategic_session': {
                        'title': 'Advanced Offensive Operations',
                        'description': 'Expert-level offensive security strategy',
                        'agenda_items': ['Review red team operations', 'Plan exploit development', 'Develop wireless testing campaigns'],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['advanced-offensive']
                    }
                },
                {
                    'slug': 'mastery',
                    'title': 'Mastery',
                    'description': 'Elite offensive security mastery',
                    'estimated_duration_hours': 12,
                    'prerequisites': {'quizzes_passed': 90},
                    'modules': [
                        {
                            'slug': 'apt-simulation',
                            'title': 'APT Simulation',
                            'description': 'Advanced persistent threat emulation',
                            'estimated_duration_minutes': 180,
                            'supporting_recipes': ['apt-techniques'],
                            'videos': [
                                {'slug': 'apt-lifecycle', 'title': 'APT Attack Lifecycle', 'video_url': 'https://placeholder.com/video63.mp4', 'duration_seconds': 480},
                                {'slug': 'command-control', 'title': 'C2 Infrastructure', 'video_url': 'https://placeholder.com/video64.mp4', 'duration_seconds': 420},
                                {'slug': 'living-off-land', 'title': 'Living Off The Land', 'video_url': 'https://placeholder.com/video65.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'apt-quiz', 'title': 'APT Simulation Assessment', 'questions': []}
                        },
                        {
                            'slug': 'zero-day-research',
                            'title': 'Zero-Day Research',
                            'description': 'Original vulnerability research',
                            'estimated_duration_minutes': 150,
                            'supporting_recipes': ['vulnerability-research'],
                            'videos': [
                                {'slug': 'bug-hunting', 'title': 'Bug Hunting Methodology', 'video_url': 'https://placeholder.com/video66.mp4', 'duration_seconds': 540},
                                {'slug': 'reverse-engineering', 'title': 'Reverse Engineering Techniques', 'video_url': 'https://placeholder.com/video67.mp4', 'duration_seconds': 480},
                                {'slug': 'exploit-chains', 'title': 'Building Exploit Chains', 'video_url': 'https://placeholder.com/video68.mp4', 'duration_seconds': 360}
                            ],
                            'quiz': {'slug': 'zero-day-quiz', 'title': 'Zero-Day Research Quiz', 'questions': []}
                        },
                        {
                            'slug': 'offensive-team-leadership',
                            'title': 'Offensive Team Leadership',
                            'description': 'Leading red team operations',
                            'estimated_duration_minutes': 120,
                            'supporting_recipes': ['red-team-leadership'],
                            'videos': [
                                {'slug': 'team-coordination', 'title': 'Red Team Coordination', 'video_url': 'https://placeholder.com/video69.mp4', 'duration_seconds': 420},
                                {'slug': 'engagement-planning', 'title': 'Engagement Planning & Scoping', 'video_url': 'https://placeholder.com/video70.mp4', 'duration_seconds': 360},
                                {'slug': 'reporting-findings', 'title': 'Executive Reporting', 'video_url': 'https://placeholder.com/video71.mp4', 'duration_seconds': 480}
                            ],
                            'quiz': {'slug': 'leadership-quiz', 'title': 'Offensive Leadership Assessment', 'questions': []}
                        }
                    ],
                    'strategic_session': {
                        'title': 'Offensive Mastery Capstone',
                        'description': 'Elite offensive security capstone planning',
                        'agenda_items': ['Review APT techniques', 'Plan zero-day research', 'Develop leadership skills'],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['offensive-mastery']
                    }
                }
            ]
        },
        # Add GRC, Innovation, and Leadership tracks here with similar structure
        {
            'track': {
                'slug': 'grc',
                'title': 'Governance, Risk & Compliance Track',
                'description': 'Master GRC frameworks and compliance management',
                'thumbnail_url': 'https://placeholder.com/grc.jpg',
                'order_number': 3
            },
            'levels': [
                {
                    'slug': 'beginner',
                    'title': 'Beginner',
                    'description': 'GRC fundamentals and basic compliance',
                    'estimated_duration_hours': 10,
                    'modules': [
                        {
                            'slug': 'grc-fundamentals',
                            'title': 'GRC Fundamentals',
                            'description': 'Understanding Governance, Risk, and Compliance',
                            'estimated_duration_minutes': 150,
                            'supporting_recipes': ['grc-basics'],
                            'videos': [
                                {'slug': 'what-is-grc', 'title': 'What is GRC?', 'video_url': 'https://placeholder.com/video72.mp4', 'duration_seconds': 300},
                                {'slug': 'risk-management', 'title': 'Risk Management Basics', 'video_url': 'https://placeholder.com/video73.mp4', 'duration_seconds': 360},
                                {'slug': 'compliance-frameworks', 'title': 'Compliance Frameworks Overview', 'video_url': 'https://placeholder.com/video74.mp4', 'duration_seconds': 420}
                            ],
                            'quiz': {'slug': 'grc-basics-quiz', 'title': 'GRC Fundamentals Quiz', 'questions': []}
                        }
                    ],
                    'strategic_session': {
                        'title': 'Beginner GRC Roadmap',
                        'description': 'Planning your GRC journey',
                        'agenda_items': ['Review GRC concepts', 'Plan compliance assessments', 'Set GRC goals'],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['grc-roadmap']
                    }
                }
            ]
        },
        {
            'track': {
                'slug': 'innovation',
                'title': 'Innovation & Cloud Security Track',
                'description': 'Master cloud security and innovative security solutions',
                'thumbnail_url': 'https://placeholder.com/innovation.jpg',
                'order_number': 4
            },
            'levels': [
                {
                    'slug': 'beginner',
                    'title': 'Beginner',
                    'description': 'Cloud security fundamentals',
                    'estimated_duration_hours': 12,
                    'modules': [
                        {
                            'slug': 'cloud-security-basics',
                            'title': 'Cloud Security Basics',
                            'description': 'AWS, Azure, and GCP security fundamentals',
                            'estimated_duration_minutes': 180,
                            'supporting_recipes': ['aws-security', 'azure-security'],
                            'videos': [
                                {'slug': 'cloud-shared-responsibility', 'title': 'Shared Responsibility Model', 'video_url': 'https://placeholder.com/video75.mp4', 'duration_seconds': 360},
                                {'slug': 'iam-best-practices', 'title': 'Identity & Access Management', 'video_url': 'https://placeholder.com/video76.mp4', 'duration_seconds': 480},
                                {'slug': 'cloud-networking-security', 'title': 'Cloud Networking Security', 'video_url': 'https://placeholder.com/video77.mp4', 'duration_seconds': 420}
                            ],
                            'quiz': {'slug': 'cloud-basics-quiz', 'title': 'Cloud Security Basics Quiz', 'questions': []}
                        }
                    ],
                    'strategic_session': {
                        'title': 'Beginner Innovation Roadmap',
                        'description': 'Planning your cloud security journey',
                        'agenda_items': ['Review cloud platforms', 'Plan security implementations', 'Set innovation goals'],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['cloud-security-roadmap']
                    }
                }
            ]
        },
        {
            'track': {
                'slug': 'leadership',
                'title': 'Cyber Leadership Track',
                'description': 'Develop executive cybersecurity leadership skills',
                'thumbnail_url': 'https://placeholder.com/leadership.jpg',
                'order_number': 5
            },
            'levels': [
                {
                    'slug': 'beginner',
                    'title': 'Beginner',
                    'description': 'Security leadership fundamentals',
                    'estimated_duration_hours': 14,
                    'modules': [
                        {
                            'slug': 'security-strategy',
                            'title': 'Security Strategy & Planning',
                            'description': 'Developing comprehensive security strategies',
                            'estimated_duration_minutes': 210,
                            'supporting_recipes': ['security-strategy'],
                            'videos': [
                                {'slug': 'strategic-planning', 'title': 'Strategic Security Planning', 'video_url': 'https://placeholder.com/video78.mp4', 'duration_seconds': 480},
                                {'slug': 'risk-assessment', 'title': 'Executive Risk Assessment', 'video_url': 'https://placeholder.com/video79.mp4', 'duration_seconds': 540},
                                {'slug': 'budget-justification', 'title': 'Security Budget & ROI', 'video_url': 'https://placeholder.com/video80.mp4', 'duration_seconds': 420}
                            ],
                            'quiz': {'slug': 'strategy-quiz', 'title': 'Security Strategy Quiz', 'questions': []}
                        }
                    ],
                    'strategic_session': {
                        'title': 'Beginner Leadership Roadmap',
                        'description': 'Planning your security leadership journey',
                        'agenda_items': ['Review leadership concepts', 'Plan organizational security', 'Set executive goals'],
                        'estimated_duration_minutes': 90,
                        'supporting_recipes': ['leadership-roadmap'],
                        'requires_professional': True
                    }
                }
            ]
        }
    ]

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing defender curriculum data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing OCH curriculum data...')
            StrategicSession.objects.all().delete()
            CurriculumContent.objects.all().delete()
            CurriculumModule.objects.all().delete()
            CurriculumLevel.objects.all().delete()
            CurriculumTrack.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing OCH curriculum data'))

        self.stdout.write('Seeding OCH Curriculum System (5 tracks)...')

        total_content_created = 0

        # Create all tracks
        for track_data in self.OCH_CURRICULUM:
            track_info = track_data['track']

            # Create track
            track, created = CurriculumTrack.objects.update_or_create(
                slug=track_info['slug'],
                defaults={
                    'title': track_info['title'],
                    'description': track_info['description'],
                    'thumbnail_url': track_info['thumbnail_url'],
                    'order_number': track_info['order_number'],
                    'is_active': True,
                }
            )
            self.stdout.write(f"{'Created' if created else 'Updated'} track: {track.title}")

            # Create levels and their content
            for level_order, level_data in enumerate(track_data['levels']):
                level, created = CurriculumLevel.objects.update_or_create(
                    track=track,
                    slug=level_data['slug'],
                    defaults={
                        'title': level_data['title'],
                        'description': level_data['description'],
                        'order_number': level_order,
                        'estimated_duration_hours': level_data['estimated_duration_hours'],
                        'prerequisites': level_data.get('prerequisites', {}),
                    }
                )
                self.stdout.write(f"  {'Created' if created else 'Updated'} level: {level.title}")

                # Create modules for this level
                for module_order, module_data in enumerate(level_data['modules']):
                    module, created = CurriculumModule.objects.update_or_create(
                        level=level,
                        slug=module_data['slug'],
                        defaults={
                            'title': module_data['title'],
                            'description': module_data['description'],
                            'order_number': module_order,
                            'estimated_duration_minutes': module_data['estimated_duration_minutes'],
                            'supporting_recipes': module_data['supporting_recipes'],
                            'is_locked_by_default': module_order > 0,  # First module unlocked by default
                        }
                    )
                    self.stdout.write(f"    {'Created' if created else 'Updated'} module: {module.title}")

                    # Create content items for this module
                    content_created = 0

                    # Create videos
                    for content_order, video_data in enumerate(module_data['videos']):
                        content, created = CurriculumContent.objects.update_or_create(
                            module=module,
                            slug=video_data['slug'],
                            defaults={
                                'title': video_data['title'],
                                'content_type': 'video',
                                'video_url': video_data['video_url'],
                                'duration_seconds': video_data['duration_seconds'],
                                'order_number': content_order,
                            }
                        )
                        content_created += 1 if created else 0

                    # Create quiz
                    if module_data.get('quiz'):
                        quiz_data = module_data['quiz']
                        content, created = CurriculumContent.objects.update_or_create(
                            module=module,
                            slug=quiz_data['slug'],
                            defaults={
                                'title': quiz_data['title'],
                                'content_type': 'quiz',
                                'quiz_data': quiz_data['questions'],
                                'order_number': len(module_data['videos']),
                            }
                        )
                        content_created += 1 if created else 0

                    total_content_created += content_created
                    self.stdout.write(f"      Created {content_created} content items")

                # Create strategic session for this level
                if level_data.get('strategic_session'):
                    session_data = level_data['strategic_session']
                    session, created = StrategicSession.objects.update_or_create(
                        level=level,
                        title=session_data['title'],
                        defaults={
                            'description': session_data['description'],
                            'agenda_items': session_data['agenda_items'],
                            'estimated_duration_minutes': session_data['estimated_duration_minutes'],
                            'supporting_recipes': session_data['supporting_recipes'],
                            'requires_professional': session_data.get('requires_professional', True),
                        }
                    )
                    self.stdout.write(f"    {'Created' if created else 'Updated'} strategic session: {session.title}")

        self.stdout.write(self.style.SUCCESS('Successfully seeded OCH Curriculum System!'))
        self.stdout.write(f'Created: 5 tracks, 20 levels, 60 modules, {total_content_created} content items, 20 strategic sessions')
