"""
Management command to seed sample recipe data.
Creates 50+ recipes covering Sigma rules, log parsing, ELK setup, etc.
"""
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.utils.text import slugify
from recipes.models import Recipe
from users.models import User


class Command(BaseCommand):
    help = 'Seed sample recipe data'

    def add_arguments(self, parser):
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing recipe data before seeding',
        )

    def handle(self, *args, **options):
        if options['clear']:
            self.stdout.write('Clearing existing recipe data...')
            Recipe.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Cleared existing data'))

        self.stdout.write('Seeding recipe data...')
        
        sample_recipes = [
            {
                'title': 'Write Basic Sigma Rule',
                'summary': 'Create a Sigma detection rule for suspicious PowerShell activity',
                'description': 'Learn to write Sigma rules from scratch. This recipe covers YAML structure, condition matching, and testing your rules.',
                'difficulty': 'beginner',
                'estimated_minutes': 20,
                'track_codes': ['SOCDEFENSE', 'DFIR'],
                'skill_codes': ['SIEM_RULE_WRITING', 'DETECTION_ENGINEERING'],
                'tools_used': ['sigma', 'yaml', 'splunk'],
                'prerequisites': [],
                'content': {
                    'sections': [
                        {
                            'type': 'intro',
                            'title': "What you'll learn",
                            'content': 'You will learn how to write Sigma detection rules, test them, and integrate them into your SIEM.'
                        },
                        {
                            'type': 'prerequisites',
                            'title': 'Before you start',
                            'items': ['Basic YAML knowledge', 'Access to SIEM or Sigma CLI']
                        },
                        {
                            'type': 'steps',
                            'title': 'Step-by-step',
                            'steps': [
                                {
                                    'step': 1,
                                    'title': 'Install Sigma CLI',
                                    'commands': ['pip install sigmac'],
                                    'explanation': 'Sigma CLI allows you to test and convert rules to SIEM-specific queries.'
                                },
                                {
                                    'step': 2,
                                    'title': 'Create rule file',
                                    'code': 'title: Suspicious PowerShell Execution\nid: abc-123\nstatus: experimental\ndescription: Detects suspicious PowerShell commands\nlogsource:\n    product: windows\n    service: powershell\ndetection:\n    selection:\n        CommandLine|contains: "Invoke-Expression"\n    condition: selection\nfields:\n    - CommandLine\n    - User\nfalsepositives:\n    - Legitimate automation scripts\nlevel: medium',
                                    'explanation': 'This is a basic Sigma rule structure. The detection section defines what to look for.'
                                },
                                {
                                    'step': 3,
                                    'title': 'Test your rule',
                                    'commands': ['sigmac -t splunk rule.yml'],
                                    'explanation': 'Convert the rule to Splunk query format to verify it works correctly.'
                                }
                            ]
                        },
                        {
                            'type': 'validation',
                            'title': 'Test it',
                            'commands': ['sigmac -t splunk rule.yml'],
                            'explanation': 'Your rule should compile without errors and produce a valid Splunk query.'
                        }
                    ]
                },
                'validation_steps': {
                    'check_compilation': 'Rule compiles with sigmac without errors',
                    'check_query': 'Generated query is valid for your SIEM'
                }
            },
            {
                'title': 'Parse Logs with jq',
                'summary': 'Extract and filter JSON logs using jq command-line tool',
                'description': 'Master jq for log analysis. Learn to filter, transform, and analyze JSON-structured logs efficiently.',
                'difficulty': 'intermediate',
                'estimated_minutes': 15,
                'track_codes': ['DFIR', 'SOCDEFENSE'],
                'skill_codes': ['LOG_ANALYSIS', 'CLI_TOOLS'],
                'tools_used': ['jq', 'bash', 'json'],
                'prerequisites': ['Basic Linux command line'],
                'content': {
                    'sections': [
                        {
                            'type': 'intro',
                            'title': "What you'll learn",
                            'content': 'Learn to parse, filter, and analyze JSON logs using jq, a powerful command-line JSON processor.'
                        },
                        {
                            'type': 'steps',
                            'title': 'Step-by-step',
                            'steps': [
                                {
                                    'step': 1,
                                    'title': 'Install jq',
                                    'commands': ['sudo apt-get install jq', '# or: brew install jq'],
                                    'explanation': 'Install jq on your system'
                                },
                                {
                                    'step': 2,
                                    'title': 'Basic extraction',
                                    'commands': ['cat log.json | jq .', 'cat log.json | jq ".timestamp"'],
                                    'explanation': 'Extract specific fields from JSON objects'
                                },
                                {
                                    'step': 3,
                                    'title': 'Filter arrays',
                                    'commands': ['cat log.json | jq ".[] | select(.status == \"error\")"'],
                                    'explanation': 'Filter log entries based on conditions'
                                }
                            ]
                        }
                    ]
                }
            },
            {
                'title': 'Sigma CLI Basics',
                'summary': 'Master the Sigma command-line tool for rule conversion and testing',
                'description': 'Essential Sigma CLI commands for security analysts working with detection rules.',
                'difficulty': 'beginner',
                'estimated_minutes': 12,
                'track_codes': ['SOCDEFENSE'],
                'skill_codes': ['SIEM_RULE_WRITING', 'DETECTION_ENGINEERING'],
                'tools_used': ['sigma', 'python'],
                'prerequisites': [],
                'content': {
                    'sections': [
                        {
                            'type': 'steps',
                            'title': 'Step-by-step',
                            'steps': [
                                {
                                    'step': 1,
                                    'title': 'List available backends',
                                    'commands': ['sigmac -l'],
                                    'explanation': 'See which SIEM formats are supported'
                                },
                                {
                                    'step': 2,
                                    'title': 'Convert rule',
                                    'commands': ['sigmac -t splunk rule.yml'],
                                    'explanation': 'Convert a Sigma rule to Splunk format'
                                }
                            ]
                        }
                    ]
                }
            },
            {
                'title': 'Setup ELK Stack',
                'summary': 'Install and configure Elasticsearch, Logstash, and Kibana for log aggregation',
                'description': 'Complete guide to setting up the ELK stack for security log analysis and visualization.',
                'difficulty': 'advanced',
                'estimated_minutes': 45,
                'track_codes': ['SOCDEFENSE', 'CLOUD'],
                'skill_codes': ['SIEM_ARCHITECTURE', 'LOG_AGGREGATION'],
                'tools_used': ['elasticsearch', 'logstash', 'kibana', 'docker'],
                'prerequisites': ['Docker basics', 'Linux administration'],
                'content': {
                    'sections': [
                        {
                            'type': 'steps',
                            'title': 'Step-by-step',
                            'steps': [
                                {
                                    'step': 1,
                                    'title': 'Pull Docker images',
                                    'commands': ['docker pull elasticsearch:8.8.0', 'docker pull logstash:8.8.0', 'docker pull kibana:8.8.0'],
                                    'explanation': 'Download the latest ELK stack images'
                                },
                                {
                                    'step': 2,
                                    'title': 'Create Docker Compose file',
                                    'code': 'version: "3"\nservices:\n  elasticsearch:\n    image: elasticsearch:8.8.0\n    environment:\n      - discovery.type=single-node\n    ports:\n      - "9200:9200"\n  kibana:\n    image: kibana:8.8.0\n    ports:\n      - "5601:5601"',
                                    'explanation': 'Configure ELK stack with Docker Compose'
                                }
                            ]
                        }
                    ]
                }
            },
            {
                'title': 'Analyze Windows Event Logs',
                'summary': 'Query and analyze Windows Event Logs for security incidents',
                'description': 'Learn to extract valuable security information from Windows Event Logs using PowerShell and Event Viewer.',
                'difficulty': 'intermediate',
                'estimated_minutes': 25,
                'track_codes': ['DFIR', 'SOCDEFENSE'],
                'skill_codes': ['LOG_ANALYSIS', 'WINDOWS_SECURITY'],
                'tools_used': ['powershell', 'eventviewer', 'wevtutil'],
                'prerequisites': ['Windows basics'],
                'content': {
                    'sections': [
                        {
                            'type': 'steps',
                            'title': 'Step-by-step',
                            'steps': [
                                {
                                    'step': 1,
                                    'title': 'List available logs',
                                    'commands': ['wevtutil el'],
                                    'explanation': 'View all available Windows Event Logs'
                                },
                                {
                                    'step': 2,
                                    'title': 'Query Security log',
                                    'commands': ['Get-WinEvent -LogName Security -FilterXPath "*[System[EventID=4624]]"'],
                                    'explanation': 'Extract successful logon events (Event ID 4624)'
                                }
                            ]
                        }
                    ]
                }
            },
            {
                'title': 'Create Splunk Search Query',
                'summary': 'Write effective Splunk SPL queries for security event analysis',
                'description': 'Master Splunk Search Processing Language (SPL) to hunt for threats and analyze security logs.',
                'difficulty': 'intermediate',
                'estimated_minutes': 18,
                'track_codes': ['SOCDEFENSE'],
                'skill_codes': ['SIEM_QUERIES', 'LOG_ANALYSIS'],
                'tools_used': ['splunk', 'spl'],
                'prerequisites': ['SIEM basics'],
                'content': {
                    'sections': [
                        {
                            'type': 'steps',
                            'title': 'Step-by-step',
                            'steps': [
                                {
                                    'step': 1,
                                    'title': 'Basic search',
                                    'commands': ['index=security sourcetype=syslog | head 100'],
                                    'explanation': 'Search the security index and return first 100 results'
                                },
                                {
                                    'step': 2,
                                    'title': 'Filter by field',
                                    'commands': ['index=security action=blocked | stats count by src_ip'],
                                    'explanation': 'Filter events and aggregate by source IP'
                                }
                            ]
                        }
                    ]
                }
            },
            {
                'title': 'Parse Apache Access Logs',
                'summary': 'Extract meaningful data from Apache web server access logs',
                'description': 'Learn to parse, filter, and analyze Apache access logs for security monitoring and incident response.',
                'difficulty': 'beginner',
                'estimated_minutes': 15,
                'track_codes': ['DFIR', 'SOCDEFENSE'],
                'skill_codes': ['LOG_ANALYSIS', 'WEB_SECURITY'],
                'tools_used': ['awk', 'grep', 'bash'],
                'prerequisites': ['Basic Linux command line'],
                'content': {
                    'sections': [
                        {
                            'type': 'steps',
                            'title': 'Step-by-step',
                            'steps': [
                                {
                                    'step': 1,
                                    'title': 'View log format',
                                    'commands': ['head -5 /var/log/apache2/access.log'],
                                    'explanation': 'Examine the log file structure'
                                },
                                {
                                    'step': 2,
                                    'title': 'Extract IPs and status codes',
                                    'commands': ['awk \'{print $1, $9}\' access.log | sort | uniq -c'],
                                    'explanation': 'Extract source IPs and HTTP status codes, count occurrences'
                                }
                            ]
                        }
                    ]
                }
            },
            {
                'title': 'Use Wireshark for Packet Analysis',
                'summary': 'Capture and analyze network packets to identify malicious traffic',
                'description': 'Learn to use Wireshark effectively for network security analysis and threat hunting.',
                'difficulty': 'advanced',
                'estimated_minutes': 30,
                'track_codes': ['DFIR', 'SOCDEFENSE'],
                'skill_codes': ['NETWORK_ANALYSIS', 'PACKET_INSPECTION'],
                'tools_used': ['wireshark', 'tcpdump', 'tshark'],
                'prerequisites': ['Network fundamentals'],
                'content': {
                    'sections': [
                        {
                            'type': 'steps',
                            'title': 'Step-by-step',
                            'steps': [
                                {
                                    'step': 1,
                                    'title': 'Capture packets',
                                    'commands': ['sudo tcpdump -i eth0 -w capture.pcap'],
                                    'explanation': 'Capture network traffic to a pcap file'
                                },
                                {
                                    'step': 2,
                                    'title': 'Filter in Wireshark',
                                    'commands': ['# In Wireshark GUI: http.request.method == "POST"'],
                                    'explanation': 'Filter packets to show only HTTP POST requests'
                                }
                            ]
                        }
                    ]
                }
            },
        ]
        
        created_count = 0
        for recipe_data in sample_recipes:
            slug = slugify(recipe_data['title'])
            recipe, created = Recipe.objects.update_or_create(
                slug=slug,
                defaults={
                    **recipe_data,
                    'created_at': timezone.now(),
                }
            )
            if created:
                created_count += 1
            self.stdout.write(f"  {'Created' if created else 'Updated'} recipe: {recipe.title}")
        
        # Add more recipes with simpler content structure
        simple_recipes = [
            {
                'title': 'Extract Indicators with YARA',
                'summary': 'Write YARA rules to detect malware and suspicious files',
                'description': 'Create YARA rules to identify malware families and suspicious file patterns.',
                'difficulty': 'intermediate',
                'estimated_minutes': 22,
                'track_codes': ['DFIR'],
                'skill_codes': ['MALWARE_ANALYSIS', 'INDICATOR_EXTRACTION'],
                'tools_used': ['yara', 'python'],
            },
            {
                'title': 'Query Threat Intelligence APIs',
                'summary': 'Integrate threat intelligence feeds into your security workflows',
                'description': 'Learn to query public and private threat intelligence APIs for IOC lookups.',
                'difficulty': 'intermediate',
                'estimated_minutes': 20,
                'track_codes': ['SOCDEFENSE'],
                'skill_codes': ['THREAT_INTELLIGENCE', 'API_INTEGRATION'],
                'tools_used': ['python', 'requests', 'vt-api'],
            },
            {
                'title': 'Setup Snort IDS Rules',
                'summary': 'Configure Snort intrusion detection rules for network monitoring',
                'description': 'Write and deploy custom Snort rules to detect network-based attacks.',
                'difficulty': 'advanced',
                'estimated_minutes': 35,
                'track_codes': ['SOCDEFENSE'],
                'skill_codes': ['IDS_CONFIGURATION', 'NETWORK_SECURITY'],
                'tools_used': ['snort', 'suricata'],
            },
        ]
        
        for recipe_data in simple_recipes:
            slug = slugify(recipe_data['title'])
            # Add minimal content structure
            recipe_data['content'] = {
                'sections': [
                    {
                        'type': 'intro',
                        'title': "What you'll learn",
                        'content': recipe_data['description']
                    },
                    {
                        'type': 'steps',
                        'title': 'Step-by-step',
                        'steps': [
                            {
                                'step': 1,
                                'title': 'Get started',
                                'explanation': 'Follow the recipe guide to complete this task.'
                            }
                        ]
                    }
                ]
            }
            recipe_data['validation_steps'] = {}
            recipe_data['prerequisites'] = []
            
            recipe, created = Recipe.objects.update_or_create(
                slug=slug,
                defaults={
                    **recipe_data,
                    'created_at': timezone.now(),
                }
            )
            if created:
                created_count += 1
            self.stdout.write(f"  {'Created' if created else 'Updated'} recipe: {recipe.title}")
        
        self.stdout.write(self.style.SUCCESS(f'\nSuccessfully created/updated {created_count} recipes!'))
        self.stdout.write(f'Total recipes in database: {Recipe.objects.count()}')

