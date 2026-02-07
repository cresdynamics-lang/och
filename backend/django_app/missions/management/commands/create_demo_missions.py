"""
Management command to create demo missions with subtasks for all tracks
"""
from django.core.management.base import BaseCommand
from missions.models import Mission
from programs.models import Track
import uuid


class Command(BaseCommand):
    help = 'Create demo missions with subtasks for all tracks'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Creating missions for all tracks...'))

        tracks = Track.objects.all()
        self.stdout.write(f'Found {tracks.count()} tracks\n')

        missions_data = {
            "Defensive Security Track": [
                {
                    "title": "Security Operations Center (SOC) Fundamentals",
                    "description": "Learn the core responsibilities of a SOC analyst including threat detection, incident response, and security monitoring. This mission covers SIEM tools, log analysis, and alert triage.",
                    "difficulty": 2,
                    "mission_type": "beginner",
                    "estimated_duration_min": 180,
                    "skills_tags": ["SIEM", "Log Analysis", "Threat Detection", "Alert Triage", "SOC Operations"],
                    "requires_mentor_review": False,
                    "subtasks": [
                        {"id": str(uuid.uuid4()), "title": "Introduction to SIEM Tools", "description": "Explore Splunk/ELK Stack and understand how security events are collected and correlated", "order_index": 1},
                        {"id": str(uuid.uuid4()), "title": "Log Analysis Techniques", "description": "Learn to analyze firewall, IDS/IPS, and authentication logs for suspicious activity", "order_index": 2},
                        {"id": str(uuid.uuid4()), "title": "Alert Triage Workflow", "description": "Practice triaging security alerts using a standardized incident classification framework", "order_index": 3},
                        {"id": str(uuid.uuid4()), "title": "Threat Intelligence Integration", "description": "Integrate threat intelligence feeds into your SIEM for enhanced detection", "order_index": 4},
                    ]
                },
                {
                    "title": "Network Intrusion Detection and Prevention",
                    "description": "Master network-based intrusion detection using Snort and Suricata. Learn to write custom IDS rules, analyze PCAP files, and detect advanced network attacks.",
                    "difficulty": 3,
                    "mission_type": "intermediate",
                    "estimated_duration_min": 240,
                    "skills_tags": ["IDS/IPS", "Snort", "Suricata", "PCAP Analysis", "Network Security", "Rule Writing"],
                    "requires_mentor_review": True,
                    "subtasks": [
                        {"id": str(uuid.uuid4()), "title": "IDS/IPS Architecture", "description": "Understand the difference between signature-based and anomaly-based detection", "order_index": 1},
                        {"id": str(uuid.uuid4()), "title": "Snort Rule Development", "description": "Write Snort rules to detect port scans, DDoS attacks, and malware C2 traffic", "order_index": 2},
                        {"id": str(uuid.uuid4()), "title": "PCAP Forensics", "description": "Analyze packet captures using Wireshark to identify attack patterns", "order_index": 3},
                        {"id": str(uuid.uuid4()), "title": "Tuning False Positives", "description": "Optimize IDS rules to reduce false positive rates while maintaining detection coverage", "order_index": 4},
                        {"id": str(uuid.uuid4()), "title": "Advanced Evasion Techniques", "description": "Study how attackers evade IDS and implement countermeasures", "order_index": 5},
                    ]
                },
                {
                    "title": "Incident Response Playbook Development",
                    "description": "Develop and execute incident response playbooks for common attack scenarios including ransomware, phishing, and data breaches. Learn NIST IR framework.",
                    "difficulty": 4,
                    "mission_type": "advanced",
                    "estimated_duration_min": 300,
                    "skills_tags": ["Incident Response", "NIST Framework", "Forensics", "Containment", "Remediation", "Playbooks"],
                    "requires_mentor_review": True,
                    "subtasks": [
                        {"id": str(uuid.uuid4()), "title": "NIST IR Framework", "description": "Study the 4 phases: Preparation, Detection/Analysis, Containment/Eradication, Recovery", "order_index": 1},
                        {"id": str(uuid.uuid4()), "title": "Ransomware Response Playbook", "description": "Create a step-by-step playbook for ransomware incidents including isolation and recovery", "order_index": 2},
                        {"id": str(uuid.uuid4()), "title": "Phishing Investigation", "description": "Analyze phishing emails, extract IOCs, and coordinate user remediation", "order_index": 3},
                        {"id": str(uuid.uuid4()), "title": "Data Breach Response", "description": "Handle data exfiltration incidents including legal/compliance considerations", "order_index": 4},
                        {"id": str(uuid.uuid4()), "title": "Post-Incident Review", "description": "Conduct lessons learned sessions and update playbooks based on real incidents", "order_index": 5},
                    ]
                },
            ],
            "default": [
                {
                    "title": "Introduction to Cybersecurity",
                    "description": "Foundational cybersecurity concepts including the CIA triad, defense in depth, and basic security principles. Perfect for beginners starting their security journey.",
                    "difficulty": 1,
                    "mission_type": "beginner",
                    "estimated_duration_min": 120,
                    "skills_tags": ["CIA Triad", "Security Fundamentals", "Risk Management", "Security Awareness"],
                    "requires_mentor_review": False,
                    "subtasks": [
                        {"id": str(uuid.uuid4()), "title": "CIA Triad Explained", "description": "Understand Confidentiality, Integrity, and Availability principles", "order_index": 1},
                        {"id": str(uuid.uuid4()), "title": "Threat Landscape Overview", "description": "Study common threats: malware, social engineering, insider threats", "order_index": 2},
                        {"id": str(uuid.uuid4()), "title": "Defense in Depth Strategy", "description": "Learn layered security controls and the principle of least privilege", "order_index": 3},
                    ]
                },
                {
                    "title": "Linux Command Line for Security Professionals",
                    "description": "Master essential Linux commands for security operations including file manipulation, process management, networking tools, and log analysis.",
                    "difficulty": 2,
                    "mission_type": "beginner",
                    "estimated_duration_min": 180,
                    "skills_tags": ["Linux", "Command Line", "Bash", "Networking Tools", "Log Analysis"],
                    "requires_mentor_review": False,
                    "subtasks": [
                        {"id": str(uuid.uuid4()), "title": "File System Navigation", "description": "Master ls, cd, find, grep, and file permissions", "order_index": 1},
                        {"id": str(uuid.uuid4()), "title": "Process Management", "description": "Learn ps, top, kill, and background job management", "order_index": 2},
                        {"id": str(uuid.uuid4()), "title": "Network Commands", "description": "Use netstat, ss, tcpdump, nmap for network reconnaissance", "order_index": 3},
                        {"id": str(uuid.uuid4()), "title": "Log Analysis with CLI", "description": "Parse logs using awk, sed, cut, sort, uniq", "order_index": 4},
                    ]
                },
                {
                    "title": "Cloud Security Essentials (AWS)",
                    "description": "Secure AWS cloud environments including IAM, VPC security groups, S3 bucket policies, and CloudTrail monitoring. Learn cloud security best practices.",
                    "difficulty": 3,
                    "mission_type": "intermediate",
                    "estimated_duration_min": 240,
                    "skills_tags": ["AWS", "Cloud Security", "IAM", "S3 Security", "CloudTrail", "VPC"],
                    "requires_mentor_review": True,
                    "subtasks": [
                        {"id": str(uuid.uuid4()), "title": "IAM Best Practices", "description": "Implement least privilege access with IAM roles and policies", "order_index": 1},
                        {"id": str(uuid.uuid4()), "title": "S3 Bucket Security", "description": "Secure S3 buckets against public exposure and data leaks", "order_index": 2},
                        {"id": str(uuid.uuid4()), "title": "VPC Network Segmentation", "description": "Design secure VPCs with proper subnet isolation and security groups", "order_index": 3},
                        {"id": str(uuid.uuid4()), "title": "CloudTrail Monitoring", "description": "Enable and analyze CloudTrail logs for security events", "order_index": 4},
                        {"id": str(uuid.uuid4()), "title": "Security Hub Integration", "description": "Use AWS Security Hub for compliance and threat detection", "order_index": 5},
                    ]
                },
                {
                    "title": "Web Application Security Fundamentals",
                    "description": "Understand the OWASP Top 10 vulnerabilities and learn to identify and exploit common web application security flaws including SQL injection, XSS, and CSRF.",
                    "difficulty": 2,
                    "mission_type": "beginner",
                    "estimated_duration_min": 200,
                    "skills_tags": ["OWASP Top 10", "SQL Injection", "XSS", "CSRF", "Web Security"],
                    "requires_mentor_review": False,
                    "subtasks": [
                        {"id": str(uuid.uuid4()), "title": "OWASP Top 10 Overview", "description": "Study each of the OWASP Top 10 vulnerabilities and their real-world impact", "order_index": 1},
                        {"id": str(uuid.uuid4()), "title": "SQL Injection Attacks", "description": "Exploit SQL injection vulnerabilities using manual and automated techniques", "order_index": 2},
                        {"id": str(uuid.uuid4()), "title": "Cross-Site Scripting (XSS)", "description": "Identify and exploit stored, reflected, and DOM-based XSS vulnerabilities", "order_index": 3},
                        {"id": str(uuid.uuid4()), "title": "CSRF and Session Management", "description": "Test CSRF protections and session fixation vulnerabilities", "order_index": 4},
                    ]
                },
                {
                    "title": "Python for Security Automation",
                    "description": "Build security automation tools using Python including vulnerability scanners, log parsers, and threat intelligence integrations.",
                    "difficulty": 3,
                    "mission_type": "intermediate",
                    "estimated_duration_min": 240,
                    "skills_tags": ["Python", "Automation", "Security Tools", "API Integration", "Scripting"],
                    "requires_mentor_review": True,
                    "subtasks": [
                        {"id": str(uuid.uuid4()), "title": "Python Security Libraries", "description": "Learn to use Scapy, Requests, Beautiful Soup for security tasks", "order_index": 1},
                        {"id": str(uuid.uuid4()), "title": "Build a Port Scanner", "description": "Create a multi-threaded port scanner with service detection", "order_index": 2},
                        {"id": str(uuid.uuid4()), "title": "Log Parser Development", "description": "Parse and analyze security logs to extract IOCs automatically", "order_index": 3},
                        {"id": str(uuid.uuid4()), "title": "Threat Intel API Integration", "description": "Integrate VirusTotal, AlienVault OTX, or Shodan APIs", "order_index": 4},
                        {"id": str(uuid.uuid4()), "title": "Automation Framework", "description": "Build a CLI security toolkit with multiple modules", "order_index": 5},
                    ]
                },
            ]
        }

        created_count = 0

        for track in tracks:
            track_name = track.name

            # Get missions for this track or use default
            track_missions = missions_data.get(track_name, missions_data["default"])

            self.stdout.write(f'\n{self.style.HTTP_INFO(f"Track: {track_name}")} (ID: {track.id})')

            for mission_data in track_missions:
                mission = Mission.objects.create(
                    track_id=str(track.id),
                    title=mission_data["title"],
                    description=mission_data["description"],
                    difficulty=mission_data["difficulty"],
                    mission_type=mission_data["mission_type"],
                    estimated_duration_min=mission_data["estimated_duration_min"],
                    skills_tags=mission_data["skills_tags"],
                    subtasks=mission_data["subtasks"],
                    requires_mentor_review=mission_data["requires_mentor_review"],
                    requires_lab_integration=False,
                    is_active=True,
                )
                created_count += 1
                self.stdout.write(f'  {self.style.SUCCESS("[OK]")} Created: {mission.title} ({len(mission.subtasks)} subtasks)')

        self.stdout.write('\n' + '='*60)
        self.stdout.write(self.style.SUCCESS(f'Total missions created: {created_count}'))
        self.stdout.write('='*60)
