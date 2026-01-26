"""
Orientation Assessment Questions for Tier 1 Foundations.
These questions test understanding of OCH structure, missions, recipes, tracks, and VIP framework.
"""

FOUNDATIONS_ASSESSMENT_QUESTIONS = [
    {
        'id': 'q1',
        'question': 'What is the primary purpose of OCH missions?',
        'options': [
            {
                'value': 'A',
                'text': 'To provide theoretical cybersecurity knowledge through lectures',
                'correct': False
            },
            {
                'value': 'B',
                'text': 'To challenge learners with real-world cybersecurity scenarios that build practical skills',
                'correct': True
            },
            {
                'value': 'C',
                'text': 'To replace traditional cybersecurity certifications',
                'correct': False
            },
            {
                'value': 'D',
                'text': 'To provide only beginner-level content',
                'correct': False
            }
        ],
        'explanation': 'Missions are real-world cybersecurity scenarios designed to build practical, job-ready skills through hands-on experience.'
    },
    {
        'id': 'q2',
        'question': 'How do recipes support mission completion?',
        'options': [
            {
                'value': 'A',
                'text': 'Recipes are optional reading materials',
                'correct': False
            },
            {
                'value': 'B',
                'text': 'Recipes teach micro-skills, tools, and techniques needed to complete missions',
                'correct': True
            },
            {
                'value': 'C',
                'text': 'Recipes are only for advanced learners',
                'correct': False
            },
            {
                'value': 'D',
                'text': 'Recipes replace missions entirely',
                'correct': False
            }
        ],
        'explanation': 'Recipes are focused learning modules that teach specific tools, techniques, or concepts needed to successfully complete missions.'
    },
    {
        'id': 'q3',
        'question': 'What are the 5 OCH tracks?',
        'options': [
            {
                'value': 'A',
                'text': 'Defender, Offensive, Innovation, Leadership, GRC',
                'correct': True
            },
            {
                'value': 'B',
                'text': 'Beginner, Intermediate, Advanced, Expert, Master',
                'correct': False
            },
            {
                'value': 'C',
                'text': 'Network Security, Application Security, Cloud Security, IoT Security, Mobile Security',
                'correct': False
            },
            {
                'value': 'D',
                'text': 'Red Team, Blue Team, Purple Team, Green Team, Yellow Team',
                'correct': False
            }
        ],
        'explanation': 'OCH offers 5 specialized tracks: Defender (SOC/IR), Offensive (Penetration Testing), Innovation (Security Engineering), Leadership (Security Management), and GRC (Governance, Risk, Compliance).'
    },
    {
        'id': 'q4',
        'question': 'What does the VIP framework stand for?',
        'options': [
            {
                'value': 'A',
                'text': 'Very Important Person - a status for premium users',
                'correct': False
            },
            {
                'value': 'B',
                'text': 'Value, Impact, Purpose - a framework that guides your cybersecurity journey',
                'correct': True
            },
            {
                'value': 'C',
                'text': 'Virtual IP Address - a networking concept',
                'correct': False
            },
            {
                'value': 'D',
                'text': 'Vulnerability Impact Priority - a risk assessment method',
                'correct': False
            }
        ],
        'explanation': 'VIP stands for Value (what unique value you bring), Impact (how you make a difference), and Purpose (what drives your journey).'
    },
    {
        'id': 'q5',
        'question': 'What happens to your work as you complete missions?',
        'options': [
            {
                'value': 'A',
                'text': 'It is deleted after each mission',
                'correct': False
            },
            {
                'value': 'B',
                'text': 'It builds your portfolio, showcasing your skills to employers and connecting you to marketplace opportunities',
                'correct': True
            },
            {
                'value': 'C',
                'text': 'It is only visible to mentors',
                'correct': False
            },
            {
                'value': 'D',
                'text': 'It is stored but never shared',
                'correct': False
            }
        ],
        'explanation': 'Your completed missions create a portfolio of real work that demonstrates your capabilities and connects you to career opportunities.'
    },
    {
        'id': 'q6',
        'question': 'How do mentors support your learning at OCH?',
        'options': [
            {
                'value': 'A',
                'text': 'Mentors only provide technical support',
                'correct': False
            },
            {
                'value': 'B',
                'text': 'Mentors provide mission reviews, career guidance, technical help, and portfolio development support',
                'correct': True
            },
            {
                'value': 'C',
                'text': 'Mentors are only available for premium users',
                'correct': False
            },
            {
                'value': 'D',
                'text': 'Mentors replace the need for missions',
                'correct': False
            }
        ],
        'explanation': 'Mentors are experienced professionals who guide your learning through mission reviews, career advice, technical support, and portfolio development.'
    },
    {
        'id': 'q7',
        'question': 'What is the transformation pathway in OCH?',
        'options': [
            {
                'value': 'A',
                'text': 'Beginner → Intermediate → Advanced → Mastery → Marketplace',
                'correct': True
            },
            {
                'value': 'B',
                'text': 'Student → Graduate → Professional → Expert',
                'correct': False
            },
            {
                'value': 'C',
                'text': 'Level 1 → Level 2 → Level 3 → Level 4 → Level 5',
                'correct': False
            },
            {
                'value': 'D',
                'text': 'Tier 0 → Tier 1 → Tier 2 only',
                'correct': False
            }
        ],
        'explanation': 'The OCH transformation pathway progresses from Beginner through Mastery, ultimately leading to Marketplace opportunities where you can earn from your skills.'
    },
    {
        'id': 'q8',
        'question': 'Can you change your track after starting?',
        'options': [
            {
                'value': 'A',
                'text': 'No, tracks are permanent once selected',
                'correct': False
            },
            {
                'value': 'B',
                'text': 'Yes, you can switch tracks, though it\'s recommended to complete your current track first',
                'correct': True
            },
            {
                'value': 'C',
                'text': 'Only with mentor approval',
                'correct': False
            },
            {
                'value': 'D',
                'text': 'Only once per year',
                'correct': False
            }
        ],
        'explanation': 'While you can switch tracks, it\'s recommended to complete your current track to build a strong foundation before exploring other paths.'
    },
    {
        'id': 'q9',
        'question': 'What makes OCH different from traditional cybersecurity training?',
        'options': [
            {
                'value': 'A',
                'text': 'OCH focuses on mission-driven, role-based learning with real-world scenarios',
                'correct': True
            },
            {
                'value': 'B',
                'text': 'OCH only offers video lectures',
                'correct': False
            },
            {
                'value': 'C',
                'text': 'OCH requires no hands-on practice',
                'correct': False
            },
            {
                'value': 'D',
                'text': 'OCH is only for beginners',
                'correct': False
            }
        ],
        'explanation': 'OCH emphasizes mission-driven, role-based learning through real-world scenarios that build practical skills, unlike traditional lecture-based training.'
    },
    {
        'id': 'q10',
        'question': 'What should you do if you get stuck on a mission?',
        'options': [
            {
                'value': 'A',
                'text': 'Give up and skip the mission',
                'correct': False
            },
            {
                'value': 'B',
                'text': 'Review recommended recipes, seek mentor help, or ask in community discussions',
                'correct': True
            },
            {
                'value': 'C',
                'text': 'Only ask mentors, no other resources',
                'correct': False
            },
            {
                'value': 'D',
                'text': 'Wait for someone else to complete it first',
                'correct': False
            }
        ],
        'explanation': 'OCH provides multiple support resources: recipes for micro-skills, mentors for guidance, and community discussions for peer help.'
    }
]

def calculate_assessment_score(answers: dict) -> tuple[int, dict]:
    """
    Calculate assessment score based on user answers.
    
    Args:
        answers: Dictionary mapping question_id to selected option value (e.g., {'q1': 'B', 'q2': 'A'})
    
    Returns:
        Tuple of (score_percentage, detailed_results)
        score_percentage: 0-100
        detailed_results: Dict with question_id -> {'correct': bool, 'selected': str, 'correct_answer': str}
    """
    total_questions = len(FOUNDATIONS_ASSESSMENT_QUESTIONS)
    correct_count = 0
    detailed_results = {}
    
    for question in FOUNDATIONS_ASSESSMENT_QUESTIONS:
        question_id = question['id']
        selected_answer = answers.get(question_id)
        
        # Find the correct answer
        correct_option = next((opt for opt in question['options'] if opt['correct']), None)
        correct_answer = correct_option['value'] if correct_option else None
        
        # Check if answer is correct
        is_correct = selected_answer == correct_answer
        
        if is_correct:
            correct_count += 1
        
        detailed_results[question_id] = {
            'correct': is_correct,
            'selected': selected_answer,
            'correct_answer': correct_answer,
            'explanation': question.get('explanation', '')
        }
    
    score_percentage = int((correct_count / total_questions) * 100) if total_questions > 0 else 0
    
    return score_percentage, detailed_results
