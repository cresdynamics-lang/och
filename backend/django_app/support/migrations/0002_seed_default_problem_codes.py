# Generated manually – seed default problem codes for support tracking

from django.db import migrations


def seed_problem_codes(apps, schema_editor):
    ProblemCode = apps.get_model('support', 'ProblemCode')
    defaults = [
        {'code': 'AUTH-001', 'name': 'Login / access issue', 'category': 'auth', 'description': 'User cannot log in or access account'},
        {'code': 'BILL-001', 'name': 'Billing or payment question', 'category': 'billing', 'description': 'Invoice, payment, or subscription question'},
        {'code': 'CURR-001', 'name': 'Curriculum or content issue', 'category': 'curriculum', 'description': 'Module, mission, or learning content problem'},
        {'code': 'MENT-001', 'name': 'Mentorship or matching', 'category': 'mentorship', 'description': 'Mentor/mentee matching or session issue'},
        {'code': 'TECH-001', 'name': 'Technical / bug', 'category': 'technical', 'description': 'Bug, error, or platform malfunction'},
        {'code': 'ACCT-001', 'name': 'Account or profile', 'category': 'account', 'description': 'Profile, settings, or account data'},
        {'code': 'PLAT-001', 'name': 'Platform general', 'category': 'platform', 'description': 'General platform question or feedback'},
    ]
    for d in defaults:
        ProblemCode.objects.get_or_create(code=d['code'], defaults=d)


def reverse_seed(apps, schema_editor):
    ProblemCode = apps.get_model('support', 'ProblemCode')
    codes = ['AUTH-001', 'BILL-001', 'CURR-001', 'MENT-001', 'TECH-001', 'ACCT-001', 'PLAT-001']
    ProblemCode.objects.filter(code__in=codes).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('support', '0001_initial_support'),
    ]

    operations = [
        migrations.RunPython(seed_problem_codes, reverse_seed),
    ]
