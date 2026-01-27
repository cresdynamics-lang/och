"""
Seed script for Innovation Track curriculum content.
Creates tracks, levels, modules, videos, quizzes, and assessments for Innovation.
"""

import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from curriculum.models import (
    CurriculumTrack, CurriculumLevel, CurriculumModule,
    CurriculumContent, AssessmentBlock
)


class Command(BaseCommand):
    help = 'Seed Innovation Track curriculum content'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Innovation Track curriculum...')

        # Create Innovation Track
        track, created = CurriculumTrack.objects.get_or_create(
            slug='innovation',
            defaults={
                'title': 'Innovation Track',
                'description': 'Build tomorrow\'s cyber tools. Spot emerging threats. Launch secure products for African markets.',
                'icon_key': 'innovation',
                'is_active': True,
                'order_number': 4
            }
        )
        if created:
            self.stdout.write(f'Created track: {track.title}')
        else:
            self.stdout.write(f'Updated track: {track.title}')

        # Innovation Level configurations
        levels_config = [
            {
                'slug': 'beginner',
                'title': 'Beginner',
                'description': 'Innovation foundations and basic cyber creativity',
                'order_number': 1,
                'estimated_duration_hours': 9,
                'modules': [
                    {
                        'slug': 'innovation-mindset-basics',
                        'title': 'Innovation Mindset Basics',
                        'description': 'Developing the creative thinking patterns for cyber innovation',
                        'order_number': 1,
                        'estimated_duration_minutes': 40,
                        'videos': [
                            {
                                'slug': 'what-is-cyber-innovation',
                                'title': 'What is Cyber Innovation?',
                                'video_url': 'https://videos.och.local/innovation/beginner/what-is-cyber-innovation.mp4',
                                'duration_seconds': 360
                            },
                            {
                                'slug': 'problem-first-thinking',
                                'title': 'Problem-First Thinking',
                                'video_url': 'https://videos.och.local/innovation/beginner/problem-first-thinking.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'observation-vs-assumption',
                                'title': 'Observation vs Assumption',
                                'video_url': 'https://videos.och.local/innovation/beginner/observation-vs-assumption.mp4',
                                'duration_seconds': 300
                            }
                        ],
                        'quiz': {
                            'slug': 'innovation-foundations-quiz',
                            'title': 'Innovation Foundations Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'What is the first step in cyber innovation?',
                                        'choices': [
                                            'Build a tool immediately',
                                            'Spot a real problem that others miss',
                                            'Read all research papers',
                                            'Copy existing solutions'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q2',
                                        'type': 'mcq',
                                        'prompt': 'What does OSINT stand for?',
                                        'choices': [
                                            'Online Security Intelligence Tools',
                                            'Open Source Intelligence',
                                            'Operational Security Integration Network',
                                            'Open Systems Internet Technology'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q3',
                                        'type': 'mcq',
                                        'prompt': 'Why is problem-first thinking important in cybersecurity?',
                                        'choices': [
                                            'It helps you build tools faster',
                                            'It ensures you solve real problems instead of imagined ones',
                                            'It makes you look more professional',
                                            'It reduces the need for testing'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q4',
                                        'type': 'mcq',
                                        'prompt': 'What should you do when you observe a potential security problem?',
                                        'choices': [
                                            'Immediately assume you know the solution',
                                            'Research if others have already solved it',
                                            'Build a prototype without validation',
                                            'Ignore it if it seems too complex'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q5',
                                        'type': 'mcq',
                                        'prompt': 'What is the main purpose of trend spotting in cybersecurity?',
                                        'choices': [
                                            'To predict future attacks',
                                            'To copy what other companies are doing',
                                            'To identify emerging threats before they become widespread',
                                            'To create marketing hype'
                                        ],
                                        'correctIndex': 2
                                    },
                                    {
                                        'id': 'q6',
                                        'type': 'mcq',
                                        'prompt': 'What is the benefit of no-code tools in security innovation?',
                                        'choices': [
                                            'They require no learning curve',
                                            'They allow rapid prototyping and validation of ideas',
                                            'They are always more secure than custom code',
                                            'They eliminate the need for security expertise'
                                        ],
                                        'correctIndex': 1
                                    }
                                ]
                            }
                        }
                    },
                    {
                        'slug': 'threat-research-basics',
                        'title': 'Threat Research Basics',
                        'description': 'Using OSINT and research to understand cyber threats',
                        'order_number': 2,
                        'estimated_duration_minutes': 50,
                        'videos': [
                            {
                                'slug': 'open-source-intelligence-osint',
                                'title': 'Open Source Intelligence (OSINT)',
                                'video_url': 'https://videos.och.local/innovation/beginner/open-source-intelligence-osint.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'reading-cves-advisories',
                                'title': 'Reading CVEs & Security Advisories',
                                'video_url': 'https://videos.och.local/innovation/beginner/reading-cves-advisories.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'trend-spotting-patterns',
                                'title': 'Trend Spotting Patterns',
                                'video_url': 'https://videos.och.local/innovation/beginner/trend-spotting-patterns.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'threat-research-basics-quiz',
                            'title': 'Threat Research Basics Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'What type of information can be gathered through OSINT?',
                                        'choices': [
                                            'Only classified government data',
                                            'Publicly available information from various sources',
                                            'Only data from social media',
                                            'Only technical vulnerability data'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q2',
                                        'type': 'mcq',
                                        'prompt': 'What does CVE stand for?',
                                        'choices': [
                                            'Cyber Vulnerability Expert',
                                            'Common Vulnerability Exposure',
                                            'Critical Vulnerability Event',
                                            'Cybersecurity Vulnerability Encyclopedia'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q3',
                                        'type': 'mcq',
                                        'prompt': 'Why is trend spotting important for security innovation?',
                                        'choices': [
                                            'It helps predict which stocks to invest in',
                                            'It identifies emerging threats before they become widespread',
                                            'It tracks fashion trends in cybersecurity',
                                            'It monitors competitor product releases'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q4',
                                        'type': 'mcq',
                                        'prompt': 'What is a good source for security advisories?',
                                        'choices': [
                                            'Only vendor websites',
                                            'CERT/CC, US-CERT, and vendor security bulletins',
                                            'Only social media posts',
                                            'Only academic research papers'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q5',
                                        'type': 'mcq',
                                        'prompt': 'What should you look for when analyzing CVE trends?',
                                        'choices': [
                                            'Only the number of CVEs published',
                                            'Patterns in affected software, attack vectors, and exploitation methods',
                                            'Only high-severity CVEs',
                                            'Only CVEs from the past week'
                                        ],
                                        'correctIndex': 1
                                    }
                                ]
                            }
                        }
                    },
                    {
                        'slug': 'tool-prototyping-intro',
                        'title': 'Tool Prototyping Introduction',
                        'description': 'Building and validating security tool ideas quickly',
                        'order_number': 3,
                        'estimated_duration_minutes': 45,
                        'videos': [
                            {
                                'slug': 'no-code-security-tools',
                                'title': 'No-Code Security Tools',
                                'video_url': 'https://videos.och.local/innovation/beginner/no-code-security-tools.mp4',
                                'duration_seconds': 360
                            },
                            {
                                'slug': 'scripting-with-chatgpt',
                                'title': 'Scripting with ChatGPT',
                                'video_url': 'https://videos.och.local/innovation/beginner/scripting-with-chatgpt.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'idea-validation-checklist',
                                'title': 'Idea Validation Checklist',
                                'video_url': 'https://videos.och.local/innovation/beginner/idea-validation-checklist.mp4',
                                'duration_seconds': 300
                            }
                        ],
                        'quiz': {
                            'slug': 'prototyping-basics-quiz',
                            'title': 'Prototyping Basics Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'What is the main benefit of prototyping with no-code tools?',
                                        'choices': [
                                            'They create production-ready software',
                                            'They allow rapid testing of ideas without coding expertise',
                                            'They are always more secure than custom code',
                                            'They eliminate the need for user testing'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q2',
                                        'type': 'mcq',
                                        'prompt': 'Why should you validate ideas before building full prototypes?',
                                        'choices': [
                                            'To avoid wasting time on bad ideas',
                                            'To impress investors immediately',
                                            'To create more documentation',
                                            'To increase development costs'
                                        ],
                                        'correctIndex': 0
                                    },
                                    {
                                        'id': 'q3',
                                        'type': 'mcq',
                                        'prompt': 'What is a good first step in idea validation?',
                                        'choices': [
                                            'Build a complete prototype',
                                            'Talk to potential users about their problems',
                                            'Register a domain name',
                                            'Write a business plan'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q4',
                                        'type': 'mcq',
                                        'prompt': 'How can AI tools like ChatGPT help with prototyping?',
                                        'choices': [
                                            'They can write complete applications',
                                            'They can help generate code snippets and explain concepts',
                                            'They can replace human developers entirely',
                                            'They can deploy applications to production'
                                        ],
                                        'correctIndex': 1
                                    }
                                ]
                            }
                        }
                    }
                ],
                'assessment': {
                    'slug': 'innovation-beginner-assessment',
                    'title': 'Spot the Next Threat Trend',
                    'description': 'Use OSINT skills to identify an emerging threat that others might be missing.',
                    'missions': [
                        {'mission_slug': 'emerging-threats-osint'}
                    ],
                    'recipes': ['innovation-osint-basics', 'innovation-idea-validation', 'innovation-threat-trend-spotting'],
                    'reflection_prompt': 'In 5–7 sentences, describe the emerging threat you discovered through OSINT research and why African organizations should care about it specifically.'
                }
            },
            {
                'slug': 'intermediate',
                'title': 'Intermediate',
                'description': 'Building and testing security innovations',
                'order_number': 2,
                'estimated_duration_hours': 11,
                'modules': [
                    {
                        'slug': 'security-automation-basics',
                        'title': 'Security Automation Basics',
                        'description': 'Automating security tasks with scripts and basic tools',
                        'order_number': 1,
                        'estimated_duration_minutes': 60,
                        'videos': [
                            {
                                'slug': 'bash-scripting-security',
                                'title': 'Bash Scripting for Security Tasks',
                                'video_url': 'https://videos.och.local/innovation/intermediate/bash-scripting-security.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'python-security-automation',
                                'title': 'Python for Security Automation',
                                'video_url': 'https://videos.och.local/innovation/intermediate/python-security-automation.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'github-actions-security',
                                'title': 'GitHub Actions for Security CI/CD',
                                'video_url': 'https://videos.och.local/innovation/intermediate/github-actions-security.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'security-automation-quiz',
                            'title': 'Security Automation Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'threat-modeling-innovation',
                        'title': 'Threat Modeling for Innovation',
                        'description': 'Using threat modeling frameworks to guide security innovation',
                        'order_number': 2,
                        'estimated_duration_minutes': 65,
                        'videos': [
                            {
                                'slug': 'stride-threat-modeling',
                                'title': 'STRIDE Threat Modeling Framework',
                                'video_url': 'https://videos.och.local/innovation/intermediate/stride-threat-modeling.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'pasta-threat-modeling',
                                'title': 'PASTA for Risk-Based Threat Modeling',
                                'video_url': 'https://videos.och.local/innovation/intermediate/pasta-threat-modeling.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'african-enterprise-threat-modeling',
                                'title': 'Threat Modeling for African Enterprises',
                                'video_url': 'https://videos.och.local/innovation/intermediate/african-enterprise-threat-modeling.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'threat-modeling-quiz',
                            'title': 'Threat Modeling Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'mvp-development-security',
                        'title': 'Secure MVP Development',
                        'description': 'Building secure minimum viable products for security tools',
                        'order_number': 3,
                        'estimated_duration_minutes': 55,
                        'videos': [
                            {
                                'slug': 'secure-mvp-patterns',
                                'title': 'Secure MVP Development Patterns',
                                'video_url': 'https://videos.och.local/innovation/intermediate/secure-mvp-patterns.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'api-security-mvp',
                                'title': 'API Security in MVPs',
                                'video_url': 'https://videos.och.local/innovation/intermediate/api-security-mvp.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'testing-automation-mvp',
                                'title': 'Testing Automation for Security MVPs',
                                'video_url': 'https://videos.och.local/innovation/intermediate/testing-automation-mvp.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'mvp-development-quiz',
                            'title': 'MVP Development Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'innovation-intermediate-assessment',
                    'title': 'Build Your First Security Tool MVP',
                    'description': 'Create a working prototype of a security tool using automation and threat modeling.',
                    'missions': [
                        {'mission_slug': 'security-tool-mvp-development'}
                    ],
                    'recipes': ['innovation-mvp-security-checklist', 'innovation-threat-model-template', 'innovation-automation-basics'],
                    'reflection_prompt': 'In 6–8 sentences, describe the security tool MVP you built, the problem it solves, and what you learned about balancing security with innovation speed.'
                }
            },
            {
                'slug': 'advanced',
                'title': 'Advanced',
                'description': 'Scaling security innovations and advanced technologies',
                'order_number': 3,
                'estimated_duration_hours': 12,
                'modules': [
                    {
                        'slug': 'ai-security-innovation',
                        'title': 'AI for Security Innovation',
                        'description': 'Using AI to enhance security tools and threat detection',
                        'order_number': 1,
                        'estimated_duration_minutes': 70,
                        'videos': [
                            {
                                'slug': 'prompt-injection-defense',
                                'title': 'Defending Against Prompt Injection Attacks',
                                'video_url': 'https://videos.och.local/innovation/advanced/prompt-injection-defense.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'ai-red-teaming',
                                'title': 'AI Red Teaming Techniques',
                                'video_url': 'https://videos.och.local/innovation/advanced/ai-red-teaming.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'secure-rag-implementation',
                                'title': 'Secure Retrieval-Augmented Generation (RAG)',
                                'video_url': 'https://videos.och.local/innovation/advanced/secure-rag-implementation.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'ai-security-quiz',
                            'title': 'AI Security Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'zero-trust-innovation',
                        'title': 'Zero Trust Architecture Innovation',
                        'description': 'Innovative approaches to zero trust implementation',
                        'order_number': 2,
                        'estimated_duration_minutes': 75,
                        'videos': [
                            {
                                'slug': 'ztna-design-patterns',
                                'title': 'ZTNA Design Patterns and Innovations',
                                'video_url': 'https://videos.och.local/innovation/advanced/ztna-design-patterns.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'african-zero-trust',
                                'title': 'Zero Trust for African Enterprises',
                                'video_url': 'https://videos.och.local/innovation/advanced/african-zero-trust.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'continuous-verification-innovation',
                                'title': 'Innovative Continuous Verification',
                                'video_url': 'https://videos.och.local/innovation/advanced/continuous-verification-innovation.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'zero-trust-quiz',
                            'title': 'Zero Trust Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'blockchain-security-innovation',
                        'title': 'Blockchain Security Innovation',
                        'description': 'Securing blockchain applications and smart contracts',
                        'order_number': 3,
                        'estimated_duration_minutes': 65,
                        'videos': [
                            {
                                'slug': 'smart-contract-auditing',
                                'title': 'Smart Contract Auditing Techniques',
                                'video_url': 'https://videos.och.local/innovation/advanced/smart-contract-auditing.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'defi-security-innovation',
                                'title': 'DeFi Security Innovations',
                                'video_url': 'https://videos.och.local/innovation/advanced/defi-security-innovation.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'web3-security-tools',
                                'title': 'Building Web3 Security Tools',
                                'video_url': 'https://videos.och.local/innovation/advanced/web3-security-tools.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'blockchain-security-quiz',
                            'title': 'Blockchain Security Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'innovation-advanced-assessment',
                    'title': 'Design Zero Trust for African Telco',
                    'description': 'Design and prototype a zero trust architecture for a major African telecommunications provider.',
                    'missions': [
                        {'mission_slug': 'zero-trust-architecture-design'}
                    ],
                    'recipes': ['innovation-ztna-blueprint', 'innovation-blockchain-security-basics', 'innovation-ai-security-tools'],
                    'reflection_prompt': 'In 7–9 sentences, explain your zero trust design for the African telco, including how you addressed local challenges like intermittent connectivity and resource constraints.'
                }
            },
            {
                'slug': 'mastery',
                'title': 'Mastery',
                'description': 'Strategic innovation leadership and cyber entrepreneurship',
                'order_number': 4,
                'estimated_duration_hours': 14,
                'modules': [
                    {
                        'slug': 'cyber-product-strategy',
                        'title': 'Cyber Product Strategy',
                        'description': 'Strategic thinking for cyber product development',
                        'order_number': 1,
                        'estimated_duration_minutes': 80,
                        'videos': [
                            {
                                'slug': 'product-market-fit-cyber',
                                'title': 'Finding Product-Market Fit in Cybersecurity',
                                'video_url': 'https://videos.och.local/innovation/mastery/product-market-fit-cyber.mp4',
                                'duration_seconds': 600
                            },
                            {
                                'slug': 'african-cyber-market-analysis',
                                'title': 'African Cyber Market Analysis',
                                'video_url': 'https://videos.och.local/innovation/mastery/african-cyber-market-analysis.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'cyber-product-roadmapping',
                                'title': 'Cyber Product Roadmapping',
                                'video_url': 'https://videos.och.local/innovation/mastery/cyber-product-roadmapping.mp4',
                                'duration_seconds': 480
                            }
                        ],
                        'quiz': {
                            'slug': 'cyber-product-strategy-quiz',
                            'title': 'Cyber Product Strategy Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'venture-building-cyber',
                        'title': 'Building Cyber Ventures',
                        'description': 'Entrepreneurship and venture building in cybersecurity',
                        'order_number': 2,
                        'estimated_duration_minutes': 85,
                        'videos': [
                            {
                                'slug': 'pitch-deck-security',
                                'title': 'Security-Focused Pitch Decks',
                                'video_url': 'https://videos.och.local/innovation/mastery/pitch-deck-security.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'investor-diligence-cyber',
                                'title': 'Investor Due Diligence for Cyber Startups',
                                'video_url': 'https://videos.och.local/innovation/mastery/investor-diligence-cyber.mp4',
                                'duration_seconds': 600
                            },
                            {
                                'slug': 'cyber-startup-funding',
                                'title': 'Funding Strategies for Cyber Startups',
                                'video_url': 'https://videos.och.local/innovation/mastery/cyber-startup-funding.mp4',
                                'duration_seconds': 480
                            }
                        ],
                        'quiz': {
                            'slug': 'venture-building-quiz',
                            'title': 'Venture Building Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'national-cyber-innovation',
                        'title': 'National Cyber Innovation Programs',
                        'description': 'Building national-level cyber innovation initiatives',
                        'order_number': 3,
                        'estimated_duration_minutes': 75,
                        'videos': [
                            {
                                'slug': 'policy-innovation-cyber',
                                'title': 'Cyber Policy Innovation',
                                'video_url': 'https://videos.och.local/innovation/mastery/policy-innovation-cyber.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'cisa-style-programs',
                                'title': 'CISA-Style Cyber Innovation Programs',
                                'video_url': 'https://videos.och.local/innovation/mastery/cisa-style-programs.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'national-cyber-ecosystem',
                                'title': 'Building National Cyber Ecosystems',
                                'video_url': 'https://videos.och.local/innovation/mastery/national-cyber-ecosystem.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'national-innovation-quiz',
                            'title': 'National Cyber Innovation Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'innovation-mastery-assessment',
                    'title': 'Pitch Your Cyber Startup to VCs',
                    'description': 'Develop and present a complete cyber startup pitch for African market opportunities.',
                    'missions': [
                        {'mission_slug': 'cyber-startup-pitch-development'}
                    ],
                    'recipes': ['innovation-pitch-deck-template', 'innovation-market-analysis-africa', 'innovation-funding-strategy-guide'],
                    'reflection_prompt': 'In 8–10 sentences, describe your cyber startup idea, the African market opportunity you identified, and how you would address the unique challenges of building cyber ventures in African markets.'
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

        self.stdout.write(self.style.SUCCESS('Successfully seeded Innovation Track curriculum!'))
