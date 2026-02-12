import os
os.environ['DJANGO_SETTINGS_MODULE'] = 'core.settings.development'
os.environ['USE_SQLITE'] = 'false'
os.environ['DB_PASSWORD'] = 'brian001'
os.chdir(r'C:\Users\HP\PycharmProjects\och\backend\django_app')
import sys
sys.path.insert(0, '.')
import django
django.setup()

from programs.models import Program, Track

program = Program.objects.get(name='Cyber Security Foundations')

tracks = [
    ('defensive-security', 'Defensive Security Track', 'Protecting systems, monitoring threats, incident response.'),
    ('offensive-security', 'Offensive Security Track', 'Penetration testing, red team operations, ethical hacking.'),
    ('grc', 'Governance, Risk & Compliance Track', 'Security governance, risk management, compliance frameworks.'),
    ('innovation', 'Innovation & Research Track', 'Security research, tool development, emerging technologies.'),
    ('leadership', 'Leadership & Strategy Track', 'Security leadership, team management, strategic planning.'),
]

created = 0
for key, name, desc in tracks:
    track, was_created = Track.objects.get_or_create(
        program=program,
        key=key,
        defaults={'name': name, 'track_type': 'primary', 'description': desc}
    )
    status = 'CREATED' if was_created else 'EXISTS'
    print(f'{status}: {key}')
    created += was_created

print(f'\nTotal: {created} new tracks created')
print(f'All tracks for {program.name}: {Track.objects.filter(program=program, track_type="primary").count()}')
