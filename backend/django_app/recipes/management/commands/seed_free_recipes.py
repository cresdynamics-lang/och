"""
Management command to seed the two free sample recipes for OCH Recipe Engine.
"""
import uuid
from django.core.management.base import BaseCommand
from recipes.models import Recipe


class Command(BaseCommand):
    help = 'Seed the two free sample recipes for OCH Recipe Engine'

    def handle(self, *args, **options):
        # Log Parsing Basics Recipe
        log_parsing_recipe, created = Recipe.objects.get_or_create(
            slug='defender-log-parsing-basics',
            defaults={
                'title': 'Log Parsing Basics: Failed Logon Detection',
                'track_codes': ['defender'],
                'skill_codes': ['log_parsing'],
                'difficulty': 'beginner',
                'is_free_sample': True,
                'summary': 'Learn to identify failed logon attempts in Windows Event Logs using basic filtering techniques.',
                'description': 'Learn to identify failed logon attempts in Windows Event Logs using basic filtering techniques.',
                'prerequisites': ['Basic command line familiarity'],
                'tools_and_environment': ['Windows Event Viewer', 'PowerShell'],
                'inputs': ['Windows Event Log access'],
                'estimated_minutes': 20,
                'steps': [
                    {
                        'step_number': 1,
                        'instruction': 'Open Event Viewer → Windows Logs → Security',
                        'expected_outcome': 'See Security events list',
                        'evidence_hint': 'Screenshot of Security log'
                    },
                    {
                        'step_number': 2,
                        'instruction': 'Filter for Event ID 4625 (Failed Logon)',
                        'expected_outcome': 'Only failed logons visible',
                        'evidence_hint': 'Screenshot of filtered results'
                    },
                    {
                        'step_number': 3,
                        'instruction': 'Examine first failed logon → note Account Name, Workstation Name, Failure Reason',
                        'expected_outcome': 'Understand attack patterns',
                        'evidence_hint': 'Screenshot with annotations'
                    },
                    {
                        'step_number': 4,
                        'instruction': 'Count total failed logons in last 24h → create simple report',
                        'expected_outcome': 'Daily failed logon summary',
                        'evidence_hint': 'Your count + screenshot'
                    }
                ],
                'validation_checks': [
                    'Can you spot Event ID 4625?',
                    'What\'s the most common failure reason?'
                ],
                'is_active': True
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created free sample recipe: {log_parsing_recipe.title}'))
        else:
            self.stdout.write(f'Free sample recipe already exists: {log_parsing_recipe.title}')

        # Nmap Basics Recipe
        nmap_recipe, created = Recipe.objects.get_or_create(
            slug='offensive-nmap-basics',
            defaults={
                'title': 'Nmap Basics: Port Scanning Fundamentals',
                'track_codes': ['offensive'],
                'skill_codes': ['nmap_scanning'],
                'difficulty': 'beginner',
                'is_free_sample': True,
                'summary': 'Master basic Nmap port scanning techniques for reconnaissance.',
                'description': 'Master basic Nmap port scanning techniques for reconnaissance.',
                'prerequisites': ['Linux terminal access'],
                'tools_and_environment': ['Kali Linux', 'Nmap', 'Target: scanme.nmap.org'],
                'inputs': ['Internet access'],
                'estimated_minutes': 25,
                'steps': [
                    {
                        'step_number': 1,
                        'instruction': 'nmap -sS scanme.nmap.org',
                        'expected_outcome': 'SYN scan results',
                        'evidence_hint': 'Screenshot of open ports'
                    },
                    {
                        'step_number': 2,
                        'instruction': 'nmap -sV -sC scanme.nmap.org',
                        'expected_outcome': 'Service versions + scripts',
                        'evidence_hint': 'Screenshot of service detection'
                    },
                    {
                        'step_number': 3,
                        'instruction': 'nmap --top-ports 50 scanme.nmap.org',
                        'expected_outcome': 'Top 50 ports scan',
                        'evidence_hint': 'Compare results'
                    },
                    {
                        'step_number': 4,
                        'instruction': 'Save output: nmap -oN my_scan.txt scanme.nmap.org',
                        'expected_outcome': 'Saved report file',
                        'evidence_hint': 'File contents screenshot'
                    }
                ],
                'validation_checks': [
                    'What ports are open?',
                    'What services run on them?',
                    'Why save scan results?'
                ],
                'is_active': True
            }
        )

        if created:
            self.stdout.write(self.style.SUCCESS(f'Created free sample recipe: {nmap_recipe.title}'))
        else:
            self.stdout.write(f'Free sample recipe already exists: {nmap_recipe.title}')

        self.stdout.write(self.style.SUCCESS('Free sample recipes seeding completed!'))
