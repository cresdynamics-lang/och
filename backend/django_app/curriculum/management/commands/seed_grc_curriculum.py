"""
Seed script for GRC Track curriculum content.
Creates tracks, levels, modules, videos, quizzes, and assessments for GRC.
"""

import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from curriculum.models import (
    CurriculumTrack, CurriculumLevel, CurriculumModule,
    CurriculumContent, AssessmentBlock
)


class Command(BaseCommand):
    help = 'Seed GRC Track curriculum content'

    def handle(self, *args, **options):
        self.stdout.write('Seeding GRC Track curriculum...')

        # Create GRC Track
        track, created = CurriculumTrack.objects.get_or_create(
            slug='grc',
            defaults={
                'title': 'GRC Track',
                'description': 'Governance, Risk, and Compliance for modern cyber programs.',
                'icon_key': 'grc',
                'is_active': True,
                'order_number': 2
            }
        )
        if created:
            self.stdout.write(f'Created track: {track.title}')
        else:
            self.stdout.write(f'Updated track: {track.title}')

        # GRC Level configurations
        levels_config = [
            {
                'slug': 'beginner',
                'title': 'Beginner',
                'description': 'GRC fundamentals and basic concepts',
                'order_number': 1,
                'estimated_duration_hours': 10,
                'modules': [
                    {
                        'slug': 'grc-foundations',
                        'title': 'GRC Foundations & Key Terms',
                        'description': 'Understanding the core concepts of Governance, Risk, and Compliance',
                        'order_number': 1,
                        'estimated_duration_minutes': 45,
                        'videos': [
                            {
                                'slug': 'what-is-grc',
                                'title': 'What is GRC in Cybersecurity?',
                                'video_url': 'https://videos.och.local/grc/beginner/what-is-grc.mp4',
                                'duration_seconds': 360
                            },
                            {
                                'slug': 'governance-risk-compliance-differences',
                                'title': 'Governance vs Risk vs Compliance',
                                'video_url': 'https://videos.och.local/grc/beginner/governance-risk-compliance-differences.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'grc-roles-in-organizations',
                                'title': 'Who Does What in GRC?',
                                'video_url': 'https://videos.och.local/grc/beginner/grc-roles-in-organizations.mp4',
                                'duration_seconds': 300
                            }
                        ],
                        'quiz': {
                            'slug': 'grc-foundations-quiz',
                            'title': 'GRC Foundations Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'What does GRC stand for?',
                                        'choices': [
                                            'Governance, Risk, and Compliance',
                                            'Governance, Reporting, and Controls',
                                            'General Risk and Compliance',
                                            'Global Regulatory Compliance'
                                        ],
                                        'correctIndex': 0
                                    },
                                    {
                                        'id': 'q2',
                                        'type': 'mcq',
                                        'prompt': 'Which of the following is primarily concerned with setting policies and ensuring organizational objectives are met?',
                                        'choices': [
                                            'Risk Management',
                                            'Compliance',
                                            'Governance',
                                            'Auditing'
                                        ],
                                        'correctIndex': 2
                                    },
                                    {
                                        'id': 'q3',
                                        'type': 'mcq',
                                        'prompt': 'What is the main purpose of a risk register?',
                                        'choices': [
                                            'To document compliance violations',
                                            'To track and monitor identified risks',
                                            'To create audit reports',
                                            'To define organizational policies'
                                        ],
                                        'correctIndex': 1
                                    }
                                ]
                            }
                        }
                    },
                    {
                        'slug': 'policies-and-standards-intro',
                        'title': 'Policies, Standards & Frameworks',
                        'description': 'Introduction to policies, standards, procedures and common frameworks',
                        'order_number': 2,
                        'estimated_duration_minutes': 50,
                        'videos': [
                            {
                                'slug': 'policies-vs-standards-vs-procedures',
                                'title': 'Policies vs Standards vs Procedures',
                                'video_url': 'https://videos.och.local/grc/beginner/policies-vs-standards-vs-procedures.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'common-frameworks-overview',
                                'title': 'Common Frameworks: ISO 27001, NIST CSF',
                                'video_url': 'https://videos.och.local/grc/beginner/common-frameworks-overview.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'african-context-frameworks',
                                'title': 'Frameworks in African Context (AFRINIC, etc.)',
                                'video_url': 'https://videos.och.local/grc/beginner/african-context-frameworks.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'policies-standards-quiz',
                            'title': 'Policies & Standards Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'What is the hierarchy from highest to lowest level?',
                                        'choices': [
                                            'Policy → Standard → Procedure → Guideline',
                                            'Procedure → Standard → Policy → Guideline',
                                            'Guideline → Policy → Standard → Procedure',
                                            'Standard → Procedure → Guideline → Policy'
                                        ],
                                        'correctIndex': 0
                                    }
                                ]
                            }
                        }
                    },
                    {
                        'slug': 'risk-assessment-basics',
                        'title': 'Risk Assessment Fundamentals',
                        'description': 'Basic concepts of risk identification, assessment, and management',
                        'order_number': 3,
                        'estimated_duration_minutes': 40,
                        'videos': [
                            {
                                'slug': 'risk-register-basics',
                                'title': 'What is a Risk Register?',
                                'video_url': 'https://videos.och.local/grc/beginner/risk-register-basics.mp4',
                                'duration_seconds': 300
                            },
                            {
                                'slug': 'impact-vs-likelihood',
                                'title': 'Impact vs Likelihood Assessment',
                                'video_url': 'https://videos.och.local/grc/beginner/impact-vs-likelihood.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'basic-controls-examples',
                                'title': 'Basic Control Examples & Categories',
                                'video_url': 'https://videos.och.local/grc/beginner/basic-controls-examples.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'risk-assessment-quiz',
                            'title': 'Risk Assessment Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'Which risk assessment factor considers the potential damage or loss?',
                                        'choices': [
                                            'Likelihood',
                                            'Impact',
                                            'Velocity',
                                            'Frequency'
                                        ],
                                        'correctIndex': 1
                                    }
                                ]
                            }
                        }
                    }
                ],
                'assessment': {
                    'slug': 'grc-beginner-assessment',
                    'title': 'GRC Beginner Assessment',
                    'description': 'Mini case study to apply GRC basics to a small African fintech scenario.',
                    'missions': [
                        {'mission_slug': 'sample-risk-register-exercise'},
                        {'mission_slug': 'policy-review-mini-case'}
                    ],
                    'recipes': ['grc-risk-register-basics', 'grc-policy-reading-checklist'],
                    'reflection_prompt': 'In 5–7 sentences, explain why a small African fintech must care about GRC.'
                }
            },
            {
                'slug': 'intermediate',
                'title': 'Intermediate',
                'description': 'Operational GRC practices and implementation',
                'order_number': 2,
                'estimated_duration_hours': 12,
                'modules': [
                    {
                        'slug': 'risk-register-operations',
                        'title': 'Risk Register Operations',
                        'description': 'Managing and maintaining risk registers in operational environments',
                        'order_number': 1,
                        'estimated_duration_minutes': 55,
                        'videos': [
                            {
                                'slug': 'risk-register-maintenance',
                                'title': 'Risk Register Maintenance & Updates',
                                'video_url': 'https://videos.och.local/grc/intermediate/risk-register-maintenance.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'risk-reporting-basics',
                                'title': 'Basic Risk Reporting to Management',
                                'video_url': 'https://videos.och.local/grc/intermediate/risk-reporting-basics.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'risk-treatment-planning',
                                'title': 'Risk Treatment Planning',
                                'video_url': 'https://videos.och.local/grc/intermediate/risk-treatment-planning.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'risk-register-ops-quiz',
                            'title': 'Risk Register Operations Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'control-mapping-fundamentals',
                        'title': 'Control Mapping Fundamentals',
                        'description': 'Mapping controls to requirements and frameworks',
                        'order_number': 2,
                        'estimated_duration_minutes': 60,
                        'videos': [
                            {
                                'slug': 'control-mapping-process',
                                'title': 'The Control Mapping Process',
                                'video_url': 'https://videos.och.local/grc/intermediate/control-mapping-process.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'framework-alignment',
                                'title': 'Aligning Controls with Frameworks',
                                'video_url': 'https://videos.och.local/grc/intermediate/framework-alignment.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'control-effectiveness',
                                'title': 'Measuring Control Effectiveness',
                                'video_url': 'https://videos.och.local/grc/intermediate/control-effectiveness.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'control-mapping-quiz',
                            'title': 'Control Mapping Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'policy-gap-analysis',
                        'title': 'Policy Gap Analysis',
                        'description': 'Identifying and addressing gaps in policy frameworks',
                        'order_number': 3,
                        'estimated_duration_minutes': 45,
                        'videos': [
                            {
                                'slug': 'gap-analysis-methodology',
                                'title': 'Gap Analysis Methodology',
                                'video_url': 'https://videos.och.local/grc/intermediate/gap-analysis-methodology.mp4',
                                'duration_seconds': 360
                            },
                            {
                                'slug': 'policy-assessment-techniques',
                                'title': 'Policy Assessment Techniques',
                                'video_url': 'https://videos.och.local/grc/intermediate/policy-assessment-techniques.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'remediation-planning',
                                'title': 'Gap Remediation Planning',
                                'video_url': 'https://videos.och.local/grc/intermediate/remediation-planning.mp4',
                                'duration_seconds': 300
                            }
                        ],
                        'quiz': {
                            'slug': 'gap-analysis-quiz',
                            'title': 'Policy Gap Analysis Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'grc-intermediate-assessment',
                    'title': 'GRC Intermediate Assessment',
                    'description': 'Operational case study: As GRC analyst at a Telco, prioritize and treat 5 identified risks.',
                    'missions': [
                        {'mission_slug': 'telco-risk-prioritization-case'},
                        {'mission_slug': 'control-mapping-exercise'}
                    ],
                    'recipes': ['grc-control-mapping-iso-nist', 'grc-vendor-risk-review-checklist'],
                    'reflection_prompt': 'In 6–8 sentences, describe how you would implement a risk management process for a growing African startup.'
                }
            },
            {
                'slug': 'advanced',
                'title': 'Advanced',
                'description': 'Advanced GRC practices including audits and metrics',
                'order_number': 3,
                'estimated_duration_hours': 12,
                'modules': [
                    {
                        'slug': 'audit-preparation-and-evidence',
                        'title': 'Audit Preparation & Evidence Collection',
                        'description': 'Preparing for audits and managing evidence effectively',
                        'order_number': 1,
                        'estimated_duration_minutes': 65,
                        'videos': [
                            {
                                'slug': 'audit-readiness-planning',
                                'title': 'Audit Readiness Planning',
                                'video_url': 'https://videos.och.local/grc/advanced/audit-readiness-planning.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'evidence-collection-methods',
                                'title': 'Evidence Collection & Management',
                                'video_url': 'https://videos.och.local/grc/advanced/evidence-collection-methods.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'audit-response-techniques',
                                'title': 'Responding to Audit Findings',
                                'video_url': 'https://videos.och.local/grc/advanced/audit-response-techniques.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'audit-preparation-quiz',
                            'title': 'Audit Preparation Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'advanced-risk-treatment',
                        'title': 'Advanced Risk Treatment Strategies',
                        'description': 'Sophisticated approaches to risk mitigation and treatment',
                        'order_number': 2,
                        'estimated_duration_minutes': 70,
                        'videos': [
                            {
                                'slug': 'risk-transfer-techniques',
                                'title': 'Risk Transfer & Insurance Strategies',
                                'video_url': 'https://videos.och.local/grc/advanced/risk-transfer-techniques.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'residual-risk-management',
                                'title': 'Managing Residual & Secondary Risks',
                                'video_url': 'https://videos.och.local/grc/advanced/residual-risk-management.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'risk-appetite-alignment',
                                'title': 'Aligning Controls with Risk Appetite',
                                'video_url': 'https://videos.och.local/grc/advanced/risk-appetite-alignment.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'advanced-risk-treatment-quiz',
                            'title': 'Advanced Risk Treatment Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'metrics-and-kpis-for-grc',
                        'title': 'GRC Metrics & KPIs',
                        'description': 'Measuring and reporting GRC program effectiveness',
                        'order_number': 3,
                        'estimated_duration_minutes': 55,
                        'videos': [
                            {
                                'slug': 'grc-program-metrics',
                                'title': 'Key GRC Program Metrics',
                                'video_url': 'https://videos.och.local/grc/advanced/grc-program-metrics.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'kpi-development-process',
                                'title': 'Developing Meaningful KPIs',
                                'video_url': 'https://videos.och.local/grc/advanced/kpi-development-process.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'metrics-reporting-best-practices',
                                'title': 'Metrics Reporting Best Practices',
                                'video_url': 'https://videos.och.local/grc/advanced/metrics-reporting-best-practices.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'grc-metrics-quiz',
                            'title': 'GRC Metrics Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'grc-advanced-assessment',
                    'title': 'GRC Advanced Assessment',
                    'description': 'Mini internal audit simulation: Prepare evidence and respond to audit findings.',
                    'missions': [
                        {'mission_slug': 'internal-audit-simulation'},
                        {'mission_slug': 'evidence-collection-case'}
                    ],
                    'recipes': ['grc-audit-evidence-management', 'grc-metrics-dashboard-basics'],
                    'reflection_prompt': 'In 7–9 sentences, explain how you would design and implement a metrics program to demonstrate GRC program value to executive leadership.'
                }
            },
            {
                'slug': 'mastery',
                'title': 'Mastery',
                'description': 'Strategic GRC leadership and board-level practices',
                'order_number': 4,
                'estimated_duration_hours': 14,
                'modules': [
                    {
                        'slug': 'grc-program-design',
                        'title': 'GRC Program Design & Strategy',
                        'description': 'Designing comprehensive GRC programs from the ground up',
                        'order_number': 1,
                        'estimated_duration_minutes': 75,
                        'videos': [
                            {
                                'slug': 'grc-program-maturity-models',
                                'title': 'GRC Program Maturity Models',
                                'video_url': 'https://videos.och.local/grc/mastery/grc-program-maturity-models.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'strategic-grc-planning',
                                'title': 'Strategic GRC Planning',
                                'video_url': 'https://videos.och.local/grc/mastery/strategic-grc-planning.mp4',
                                'duration_seconds': 600
                            },
                            {
                                'slug': 'program-roadmap-development',
                                'title': 'Developing GRC Program Roadmaps',
                                'video_url': 'https://videos.och.local/grc/mastery/program-roadmap-development.mp4',
                                'duration_seconds': 480
                            }
                        ],
                        'quiz': {
                            'slug': 'grc-program-design-quiz',
                            'title': 'GRC Program Design Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'regulatory-landscape-africa',
                        'title': 'Regulatory Landscape in Africa',
                        'description': 'Understanding African regulatory requirements and compliance frameworks',
                        'order_number': 2,
                        'estimated_duration_minutes': 80,
                        'videos': [
                            {
                                'slug': 'african-data-protection-laws',
                                'title': 'African Data Protection Laws & Regulations',
                                'video_url': 'https://videos.och.local/grc/mastery/african-data-protection-laws.mp4',
                                'duration_seconds': 600
                            },
                            {
                                'slug': 'regional-vs-global-standards',
                                'title': 'Regional vs Global Standards in Africa',
                                'video_url': 'https://videos.och.local/grc/mastery/regional-vs-global-standards.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'emerging-regulations-trends',
                                'title': 'Emerging Regulations & Trends',
                                'video_url': 'https://videos.och.local/grc/mastery/emerging-regulations-trends.mp4',
                                'duration_seconds': 480
                            }
                        ],
                        'quiz': {
                            'slug': 'african-regulatory-quiz',
                            'title': 'African Regulatory Landscape Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'board-reporting-and-risk-appetite',
                        'title': 'Board Reporting & Risk Appetite',
                        'description': 'Communicating GRC matters to board level and defining risk appetite',
                        'order_number': 3,
                        'estimated_duration_minutes': 70,
                        'videos': [
                            {
                                'slug': 'board-level-reporting',
                                'title': 'Effective Board-Level Reporting',
                                'video_url': 'https://videos.och.local/grc/mastery/board-level-reporting.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'risk-appetite-definition',
                                'title': 'Defining Organizational Risk Appetite',
                                'video_url': 'https://videos.och.local/grc/mastery/risk-appetite-definition.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'executive-risk-communication',
                                'title': 'Risk Communication with Executives',
                                'video_url': 'https://videos.och.local/grc/mastery/executive-risk-communication.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'board-reporting-quiz',
                            'title': 'Board Reporting Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'grc-mastery-assessment',
                    'title': 'GRC Mastery Assessment',
                    'description': 'Strategic case study: Build and present a high-level GRC program pitch for an African financial institution.',
                    'missions': [
                        {'mission_slug': 'grc-program-pitch-development'},
                        {'mission_slug': 'board-presentation-simulation'}
                    ],
                    'recipes': ['grc-program-roadmap-template', 'grc-board-reporting-framework'],
                    'reflection_prompt': 'In 8–10 sentences, describe how you would establish and lead a world-class GRC program in an African context, considering cultural, regulatory, and resource challenges.'
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

        self.stdout.write(self.style.SUCCESS('Successfully seeded GRC Track curriculum!'))
