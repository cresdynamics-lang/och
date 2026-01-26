"""
Management command to seed profiling questions for aptitude and behavioral assessments.
"""
from django.core.management.base import BaseCommand
from profiler.models import ProfilerQuestion


class Command(BaseCommand):
    help = 'Seed profiling questions for aptitude and behavioral assessments'

    def handle(self, *args, **options):
        self.stdout.write('Seeding profiling questions...')

        # Aptitude Questions
        aptitude_questions = [
            {
                'question_text': 'How would you rate your understanding of network protocols (TCP/IP, HTTP, DNS)?',
                'answer_type': 'scale',
                'question_order': 1,
                'category': 'networking',
                'points': 10,
                'correct_answer': None,  # No correct answer for scale questions
            },
            {
                'question_text': 'How comfortable are you with using command-line tools (Linux/Unix)?',
                'answer_type': 'scale',
                'question_order': 2,
                'category': 'technical_skills',
                'points': 10,
            },
            {
                'question_text': 'Rate your knowledge of cybersecurity fundamentals (threats, vulnerabilities, attacks)',
                'answer_type': 'scale',
                'question_order': 3,
                'category': 'security',
                'points': 10,
            },
            {
                'question_text': 'How would you approach troubleshooting a network connectivity issue?',
                'answer_type': 'multiple_choice',
                'question_order': 4,
                'category': 'problem_solving',
                'options': [
                    'Check physical connections first',
                    'Start with DNS resolution',
                    'Use network diagnostic tools',
                    'Check firewall rules',
                ],
                'points': 10,
            },
            {
                'question_text': 'What is your experience with programming/scripting?',
                'answer_type': 'multiple_choice',
                'question_order': 5,
                'category': 'programming',
                'options': [
                    'No experience',
                    'Beginner (basic scripts)',
                    'Intermediate (can write functions)',
                    'Advanced (can build applications)',
                ],
                'points': 10,
            },
        ]

        # Behavioral Questions
        behavioral_questions = [
            {
                'question_text': 'I prefer working independently rather than in a team',
                'answer_type': 'likert',
                'question_order': 1,
                'category': 'work_style',
            },
            {
                'question_text': 'I enjoy solving complex problems that require deep thinking',
                'answer_type': 'likert',
                'question_order': 2,
                'category': 'problem_solving',
            },
            {
                'question_text': 'I learn best by doing hands-on practice',
                'answer_type': 'likert',
                'question_order': 3,
                'category': 'learning_style',
            },
            {
                'question_text': 'I am comfortable taking on leadership roles',
                'answer_type': 'likert',
                'question_order': 4,
                'category': 'leadership',
            },
            {
                'question_text': 'I prefer structured learning environments with clear guidelines',
                'answer_type': 'likert',
                'question_order': 5,
                'category': 'learning_style',
            },
            {
                'question_text': 'I am motivated by challenging projects that push my limits',
                'answer_type': 'likert',
                'question_order': 6,
                'category': 'motivation',
            },
            {
                'question_text': 'I work best under pressure and tight deadlines',
                'answer_type': 'likert',
                'question_order': 7,
                'category': 'work_style',
            },
            {
                'question_text': 'I enjoy mentoring others and sharing knowledge',
                'answer_type': 'likert',
                'question_order': 8,
                'category': 'collaboration',
            },
        ]

        # Create aptitude questions
        created_count = 0
        for q_data in aptitude_questions:
            question, created = ProfilerQuestion.objects.update_or_create(
                question_text=q_data['question_text'],
                question_type='aptitude',
                defaults={
                    'answer_type': q_data['answer_type'],
                    'question_order': q_data['question_order'],
                    'category': q_data['category'],
                    'points': q_data.get('points', 1),
                    'correct_answer': q_data.get('correct_answer'),
                    'options': q_data.get('options', []),
                    'is_active': True,
                }
            )
            if created:
                created_count += 1

        # Create behavioral questions
        for q_data in behavioral_questions:
            question, created = ProfilerQuestion.objects.update_or_create(
                question_text=q_data['question_text'],
                question_type='behavioral',
                defaults={
                    'answer_type': q_data['answer_type'],
                    'question_order': q_data['question_order'],
                    'category': q_data['category'],
                    'options': q_data.get('options', []),
                    'is_active': True,
                }
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully seeded {created_count} new profiling questions. '
                f'Total questions: {ProfilerQuestion.objects.count()}'
            )
        )






