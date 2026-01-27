"""
Seed script for Leadership Track curriculum content.
Creates tracks, levels, modules, videos, quizzes, and assessments for Leadership.
"""

import json
from django.core.management.base import BaseCommand
from django.utils import timezone
from curriculum.models import (
    CurriculumTrack, CurriculumLevel, CurriculumModule,
    CurriculumContent, AssessmentBlock
)


class Command(BaseCommand):
    help = 'Seed Leadership Track curriculum content'

    def handle(self, *args, **options):
        self.stdout.write('Seeding Leadership Track curriculum...')

        # Create Leadership Track
        track, created = CurriculumTrack.objects.get_or_create(
            slug='leadership',
            defaults={
                'title': 'Leadership Track',
                'description': 'From SOC team lead to CISO: master technical leadership, executive communication, and strategic cyber governance.',
                'icon_key': 'leadership',
                'is_active': True,
                'order_number': 5
            }
        )
        if created:
            self.stdout.write(f'Created track: {track.title}')
        else:
            self.stdout.write(f'Updated track: {track.title}')

        # Leadership Level configurations
        levels_config = [
            {
                'slug': 'beginner',
                'title': 'Beginner',
                'description': 'Leadership foundations and basic cyber management skills',
                'order_number': 1,
                'estimated_duration_hours': 10,
                'modules': [
                    {
                        'slug': 'leadership-mindset-cyber',
                        'title': 'Leadership Mindset in Cyber',
                        'description': 'Developing the leadership mindset for cybersecurity roles',
                        'order_number': 1,
                        'estimated_duration_minutes': 50,
                        'videos': [
                            {
                                'slug': 'cybersecurity-leadership-fundamentals',
                                'title': 'Cybersecurity Leadership Fundamentals',
                                'video_url': 'https://videos.och.local/leadership/beginner/cybersecurity-leadership-fundamentals.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'technical-leader-vs-manager',
                                'title': 'Technical Leader vs Manager',
                                'video_url': 'https://videos.och.local/leadership/beginner/technical-leader-vs-manager.mp4',
                                'duration_seconds': 360
                            },
                            {
                                'slug': 'building-trust-tech-teams',
                                'title': 'Building Trust in Tech Teams',
                                'video_url': 'https://videos.och.local/leadership/beginner/building-trust-tech-teams.mp4',
                                'duration_seconds': 480
                            }
                        ],
                        'quiz': {
                            'slug': 'leadership-foundations-quiz',
                            'title': 'Leadership Foundations Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'What is the PRIMARY role of a cybersecurity leader?',
                                        'choices': [
                                            'Write all the code',
                                            'Make technical decisions alone',
                                            'Align security with business goals',
                                            'Fix every vulnerability personally'
                                        ],
                                        'correctIndex': 2
                                    },
                                    {
                                        'id': 'q2',
                                        'type': 'mcq',
                                        'prompt': 'Which builds trust FASTEST with a new team?',
                                        'choices': [
                                            'Share your resume',
                                            'Listen before speaking',
                                            'Assign complex tasks',
                                            'Set strict deadlines'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q3',
                                        'type': 'mcq',
                                        'prompt': 'What should a security leader do when technical and business priorities conflict?',
                                        'choices': [
                                            'Always prioritize technical security',
                                            'Always prioritize business needs',
                                            'Find a balanced approach that satisfies both',
                                            'Let others make the decision'
                                        ],
                                        'correctIndex': 2
                                    },
                                    {
                                        'id': 'q4',
                                        'type': 'mcq',
                                        'prompt': 'Which leadership style works best for cybersecurity teams?',
                                        'choices': [
                                            'Authoritarian only',
                                            'Democratic only',
                                            'Situational leadership adapting to team needs',
                                            'Hands-off completely'
                                        ],
                                        'correctIndex': 2
                                    },
                                    {
                                        'id': 'q5',
                                        'type': 'mcq',
                                        'prompt': 'What is the most important skill for communicating risk to executives?',
                                        'choices': [
                                            'Using technical jargon',
                                            'Explaining business impact',
                                            'Showing code examples',
                                            'Presenting vulnerability details'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q6',
                                        'type': 'mcq',
                                        'prompt': 'How should a leader handle a team member who disagrees with a security decision?',
                                        'choices': [
                                            'Ignore their opinion',
                                            'Immediately replace them',
                                            'Listen to their reasoning and consider alternatives',
                                            'Force them to accept the decision'
                                        ],
                                        'correctIndex': 2
                                    }
                                ]
                            }
                        }
                    },
                    {
                        'slug': 'communication-security',
                        'title': 'Communication in Cybersecurity',
                        'description': 'Mastering communication skills for security professionals',
                        'order_number': 2,
                        'estimated_duration_minutes': 55,
                        'videos': [
                            {
                                'slug': 'explaining-risk-non-tech-executives',
                                'title': 'Explaining Risk to Non-Tech Executives',
                                'video_url': 'https://videos.och.local/leadership/beginner/explaining-risk-non-tech-executives.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'security-incident-communication',
                                'title': 'Security Incident Communication',
                                'video_url': 'https://videos.och.local/leadership/beginner/security-incident-communication.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'stakeholder-mapping-cyber',
                                'title': 'Stakeholder Mapping for Cyber',
                                'video_url': 'https://videos.och.local/leadership/beginner/stakeholder-mapping-cyber.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'cyber-communication-basics-quiz',
                            'title': 'Cyber Communication Basics Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'When communicating a security incident to executives, what should be your FIRST priority?',
                                        'choices': [
                                            'Technical details of the breach',
                                            'Business impact and next steps',
                                            'Who is to blame',
                                            'How to prevent it from happening again'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q2',
                                        'type': 'mcq',
                                        'prompt': 'What is stakeholder mapping used for?',
                                        'choices': [
                                            'Creating organizational charts',
                                            'Identifying who needs what information and when',
                                            'Assigning blame for incidents',
                                            'Tracking employee performance'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q3',
                                        'type': 'mcq',
                                        'prompt': 'Which communication method is BEST for urgent security incidents?',
                                        'choices': [
                                            'Email only',
                                            'Phone call or in-person meeting',
                                            'Social media post',
                                            'Waiting for the next scheduled meeting'
                                        ],
                                        'correctIndex': 1
                                    }
                                ]
                            }
                        }
                    },
                    {
                        'slug': 'team-dynamics-cyber',
                        'title': 'Team Dynamics in Cyber',
                        'description': 'Leading and managing cybersecurity teams effectively',
                        'order_number': 3,
                        'estimated_duration_minutes': 45,
                        'videos': [
                            {
                                'slug': 'managing-mixed-technical-teams',
                                'title': 'Managing Mixed Technical Teams',
                                'video_url': 'https://videos.och.local/leadership/beginner/managing-mixed-technical-teams.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'motivating-soc-analysts',
                                'title': 'Motivating SOC Analysts',
                                'video_url': 'https://videos.och.local/leadership/beginner/motivating-soc-analysts.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'handling-technical-disagreements',
                                'title': 'Handling Technical Disagreements',
                                'video_url': 'https://videos.och.local/leadership/beginner/handling-technical-disagreements.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'team-leadership-basics-quiz',
                            'title': 'Team Leadership Basics Quiz',
                            'data': {
                                'questions': [
                                    {
                                        'id': 'q1',
                                        'type': 'mcq',
                                        'prompt': 'What is the biggest challenge in managing mixed technical teams?',
                                        'choices': [
                                            'Different programming languages',
                                            'Communication gaps between technical and non-technical members',
                                            'Scheduling conflicts',
                                            'Budget constraints'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q2',
                                        'type': 'mcq',
                                        'prompt': 'How can you best motivate SOC analysts?',
                                        'choices': [
                                            'Threaten their jobs if they miss alerts',
                                            'Recognize their expertise and give them autonomy',
                                            'Constantly micromanage their work',
                                            'Only focus on finding faults'
                                        ],
                                        'correctIndex': 1
                                    },
                                    {
                                        'id': 'q3',
                                        'type': 'mcq',
                                        'prompt': 'What should you do when team members disagree on technical approaches?',
                                        'choices': [
                                            'Always side with the most senior person',
                                            'Let them debate until someone gives up',
                                            'Facilitate discussion and consider multiple viewpoints',
                                            'Make the decision yourself immediately'
                                        ],
                                        'correctIndex': 2
                                    }
                                ]
                            }
                        }
                    }
                ],
                'assessment': {
                    'slug': 'leadership-beginner-assessment',
                    'title': 'First Leadership Challenge',
                    'description': 'Practice communicating a phishing incident to non-technical executives and handling team dynamics.',
                    'missions': [
                        {'mission_slug': 'phishing-incident-communication'}
                    ],
                    'recipes': ['leadership-risk-communication', 'leadership-team-motivation'],
                    'reflection_prompt': 'In 5–7 sentences, describe what was hardest about explaining technical risk to business leaders and how you would approach it differently next time.'
                }
            },
            {
                'slug': 'intermediate',
                'title': 'Intermediate',
                'description': 'Strategic leadership and operational management',
                'order_number': 2,
                'estimated_duration_hours': 12,
                'modules': [
                    {
                        'slug': 'cyber-security-strategy',
                        'title': 'Cyber Security Strategy',
                        'description': 'Developing and implementing cyber security strategy',
                        'order_number': 1,
                        'estimated_duration_minutes': 65,
                        'videos': [
                            {
                                'slug': 'aligning-security-business-goals',
                                'title': 'Aligning Security to Business Goals',
                                'video_url': 'https://videos.och.local/leadership/intermediate/aligning-security-business-goals.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'okrs-for-cyber',
                                'title': 'OKRs for Cyber Programs',
                                'video_url': 'https://videos.och.local/leadership/intermediate/okrs-for-cyber.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'budget-justification-security',
                                'title': 'Budget Justification for Security',
                                'video_url': 'https://videos.och.local/leadership/intermediate/budget-justification-security.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'cyber-security-strategy-quiz',
                            'title': 'Cyber Security Strategy Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'hiring-security-talent',
                        'title': 'Hiring Security Talent',
                        'description': 'Recruiting, interviewing, and retaining cybersecurity professionals',
                        'order_number': 2,
                        'estimated_duration_minutes': 70,
                        'videos': [
                            {
                                'slug': 'technical-interviews-security',
                                'title': 'Technical Interviews for Security Roles',
                                'video_url': 'https://videos.och.local/leadership/intermediate/technical-interviews-security.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'african-talent-pipelines',
                                'title': 'African Talent Pipelines',
                                'video_url': 'https://videos.och.local/leadership/intermediate/african-talent-pipelines.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'retention-strategies-security',
                                'title': 'Retention Strategies for Security Teams',
                                'video_url': 'https://videos.och.local/leadership/intermediate/retention-strategies-security.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'hiring-security-talent-quiz',
                            'title': 'Hiring Security Talent Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'security-governance-basics',
                        'title': 'Security Governance Basics',
                        'description': 'Establishing governance frameworks and board reporting',
                        'order_number': 3,
                        'estimated_duration_minutes': 55,
                        'videos': [
                            {
                                'slug': 'policy-frameworks-cyber',
                                'title': 'Policy Frameworks in Cybersecurity',
                                'video_url': 'https://videos.och.local/leadership/intermediate/policy-frameworks-cyber.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'board-reporting-security',
                                'title': 'Board Reporting for Security',
                                'video_url': 'https://videos.och.local/leadership/intermediate/board-reporting-security.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'compliance-leadership',
                                'title': 'Compliance Leadership',
                                'video_url': 'https://videos.och.local/leadership/intermediate/compliance-leadership.mp4',
                                'duration_seconds': 360
                            }
                        ],
                        'quiz': {
                            'slug': 'security-governance-quiz',
                            'title': 'Security Governance Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'leadership-intermediate-assessment',
                    'title': 'Build Your First Cyber Strategy',
                    'description': 'Develop a comprehensive cybersecurity strategy for a mid-sized African enterprise.',
                    'missions': [
                        {'mission_slug': 'cyber-strategy-development'}
                    ],
                    'recipes': ['leadership-strategy-alignment', 'leadership-talent-acquisition', 'leadership-governance-framework'],
                    'reflection_prompt': 'In 6–8 sentences, describe how you would implement the cyber strategy you developed, including challenges you anticipate and how you would overcome them.'
                }
            },
            {
                'slug': 'advanced',
                'title': 'Advanced',
                'description': 'Executive leadership and enterprise-level security management',
                'order_number': 3,
                'estimated_duration_hours': 13,
                'modules': [
                    {
                        'slug': 'ciso-strategic-leadership',
                        'title': 'CISO Strategic Leadership',
                        'description': 'Strategic leadership skills for Chief Information Security Officers',
                        'order_number': 1,
                        'estimated_duration_minutes': 75,
                        'videos': [
                            {
                                'slug': 'ciso-role-organization',
                                'title': 'The CISO Role in Modern Organizations',
                                'video_url': 'https://videos.och.local/leadership/advanced/ciso-role-organization.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'board-presentations-security',
                                'title': 'Board Presentations for Security Leaders',
                                'video_url': 'https://videos.och.local/leadership/advanced/board-presentations-security.mp4',
                                'duration_seconds': 600
                            },
                            {
                                'slug': 'crisis-leadership-cyber',
                                'title': 'Crisis Leadership in Cybersecurity',
                                'video_url': 'https://videos.och.local/leadership/advanced/crisis-leadership-cyber.mp4',
                                'duration_seconds': 480
                            }
                        ],
                        'quiz': {
                            'slug': 'ciso-strategic-leadership-quiz',
                            'title': 'CISO Strategic Leadership Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'cyber-budget-finance',
                        'title': 'Cyber Budget and Finance',
                        'description': 'Financial management and ROI justification for security programs',
                        'order_number': 2,
                        'estimated_duration_minutes': 70,
                        'videos': [
                            {
                                'slug': 'roi-justification-security',
                                'title': 'ROI Justification for Security Investments',
                                'video_url': 'https://videos.och.local/leadership/advanced/roi-justification-security.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'vendor-management-cyber',
                                'title': 'Vendor Management in Cybersecurity',
                                'video_url': 'https://videos.och.local/leadership/advanced/vendor-management-cyber.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'african-market-cyber-finance',
                                'title': 'African Market Realities for Cyber Finance',
                                'video_url': 'https://videos.och.local/leadership/advanced/african-market-cyber-finance.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'cyber-budget-finance-quiz',
                            'title': 'Cyber Budget and Finance Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'cross-functional-leadership',
                        'title': 'Cross-Functional Leadership',
                        'description': 'Leading across organizational boundaries and functions',
                        'order_number': 3,
                        'estimated_duration_minutes': 65,
                        'videos': [
                            {
                                'slug': 'working-with-legal-compliance',
                                'title': 'Working with Legal and Compliance Teams',
                                'video_url': 'https://videos.och.local/leadership/advanced/working-with-legal-compliance.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'collaboration-with-sales-marketing',
                                'title': 'Collaboration with Sales and Marketing',
                                'video_url': 'https://videos.och.local/leadership/advanced/collaboration-with-sales-marketing.mp4',
                                'duration_seconds': 420
                            },
                            {
                                'slug': 'enterprise-risk-management',
                                'title': 'Enterprise Risk Management Integration',
                                'video_url': 'https://videos.och.local/leadership/advanced/enterprise-risk-management.mp4',
                                'duration_seconds': 540
                            }
                        ],
                        'quiz': {
                            'slug': 'cross-functional-leadership-quiz',
                            'title': 'Cross-Functional Leadership Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'leadership-advanced-assessment',
                    'title': 'CISO Board Presentation Simulation',
                    'description': 'Prepare and deliver a board presentation on cybersecurity strategy and budget for a major African corporation.',
                    'missions': [
                        {'mission_slug': 'ciso-board-presentation'}
                    ],
                    'recipes': ['leadership-board-communication', 'leadership-budget-justification', 'leadership-crisis-management'],
                    'reflection_prompt': 'In 7–9 sentences, reflect on how your board presentation addressed the unique challenges of cybersecurity leadership in African enterprises.'
                }
            },
            {
                'slug': 'mastery',
                'title': 'Mastery',
                'description': 'Transformational leadership and national-level cyber influence',
                'order_number': 4,
                'estimated_duration_hours': 15,
                'modules': [
                    {
                        'slug': 'cyber-culture-transformation',
                        'title': 'Cyber Culture Transformation',
                        'description': 'Building and transforming security culture in organizations',
                        'order_number': 1,
                        'estimated_duration_minutes': 80,
                        'videos': [
                            {
                                'slug': 'security-culture-programs',
                                'title': 'Security Culture Programs and Initiatives',
                                'video_url': 'https://videos.och.local/leadership/mastery/security-culture-programs.mp4',
                                'duration_seconds': 600
                            },
                            {
                                'slug': 'psychological-safety-security',
                                'title': 'Psychological Safety in Security Teams',
                                'video_url': 'https://videos.och.local/leadership/mastery/psychological-safety-security.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'change-management-cyber',
                                'title': 'Change Management for Cyber Initiatives',
                                'video_url': 'https://videos.och.local/leadership/mastery/change-management-cyber.mp4',
                                'duration_seconds': 480
                            }
                        ],
                        'quiz': {
                            'slug': 'cyber-culture-transformation-quiz',
                            'title': 'Cyber Culture Transformation Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'national-cyber-leadership',
                        'title': 'National Cyber Leadership',
                        'description': 'Leading cyber initiatives at national and regional levels',
                        'order_number': 2,
                        'estimated_duration_minutes': 85,
                        'videos': [
                            {
                                'slug': 'policy-influence-cyber',
                                'title': 'Cyber Policy Influence and Advocacy',
                                'video_url': 'https://videos.och.local/leadership/mastery/policy-influence-cyber.mp4',
                                'duration_seconds': 600
                            },
                            {
                                'slug': 'african-cert-coordination',
                                'title': 'African CERT Coordination and Leadership',
                                'video_url': 'https://videos.och.local/leadership/mastery/african-cert-coordination.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'public-private-partnerships-cyber',
                                'title': 'Public-Private Partnerships in Cybersecurity',
                                'video_url': 'https://videos.och.local/leadership/mastery/public-private-partnerships-cyber.mp4',
                                'duration_seconds': 480
                            }
                        ],
                        'quiz': {
                            'slug': 'national-cyber-leadership-quiz',
                            'title': 'National Cyber Leadership Quiz',
                            'data': {'questions': []}
                        }
                    },
                    {
                        'slug': 'legacy-leadership-cyber',
                        'title': 'Legacy Leadership in Cyber',
                        'description': 'Building lasting impact and mentoring future leaders',
                        'order_number': 3,
                        'estimated_duration_minutes': 75,
                        'videos': [
                            {
                                'slug': 'succession-planning-cyber',
                                'title': 'Succession Planning for Cyber Leaders',
                                'video_url': 'https://videos.och.local/leadership/mastery/succession-planning-cyber.mp4',
                                'duration_seconds': 540
                            },
                            {
                                'slug': 'mentoring-next-generation',
                                'title': 'Mentoring the Next Generation of Cyber Leaders',
                                'video_url': 'https://videos.och.local/leadership/mastery/mentoring-next-generation.mp4',
                                'duration_seconds': 480
                            },
                            {
                                'slug': 'industry-influence-cyber',
                                'title': 'Industry Influence and Thought Leadership',
                                'video_url': 'https://videos.och.local/leadership/mastery/industry-influence-cyber.mp4',
                                'duration_seconds': 420
                            }
                        ],
                        'quiz': {
                            'slug': 'legacy-leadership-quiz',
                            'title': 'Legacy Leadership Quiz',
                            'data': {'questions': []}
                        }
                    }
                ],
                'assessment': {
                    'slug': 'leadership-mastery-assessment',
                    'title': 'Launch Your Cyber Leadership Initiative',
                    'description': 'Design and launch a transformational cyber leadership program for an African institution or region.',
                    'missions': [
                        {'mission_slug': 'cyber-leadership-program-launch'}
                    ],
                    'recipes': ['leadership-culture-transformation', 'leadership-national-policy-influence', 'leadership-succession-planning'],
                    'reflection_prompt': 'In 8–10 sentences, describe your 3-year vision for African cybersecurity leadership and the specific initiatives you would launch to achieve it.'
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

        self.stdout.write(self.style.SUCCESS('Successfully seeded Leadership Track curriculum!'))
