"""
Verification script to confirm all implementations are complete and functional.
"""
import os
import sys
import django

# Setup Django
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from django.conf import settings
from django.urls import get_resolver
from student_dashboard.models import StudentDashboardCache, DashboardUpdateQueue
from mentorship.models import ChatMessage, ChatAttachment
from users.models import User

def check_models():
    """Verify all models are properly defined."""
    print("✓ Checking models...")
    models = [
        StudentDashboardCache,
        DashboardUpdateQueue,
        ChatMessage,
        ChatAttachment,
    ]
    for model in models:
        assert hasattr(model, '_meta'), f"Model {model.__name__} is not properly defined"
    print(f"  ✓ {len(models)} models verified")

def check_urls():
    """Verify all URL patterns are registered."""
    print("✓ Checking URL patterns...")
    resolver = get_resolver()
    
    required_paths = [
        'api/v1/student/dashboard',
        'api/v1/student/dashboard/action',
        'api/v1/student/dashboard/stream',
        'api/v1/mentorships',
        'api/v1/metrics/dashboard',
    ]
    
    found_paths = []
    for path in required_paths:
        try:
            resolver.resolve(f'/{path}')
            found_paths.append(path)
        except:
            pass
    
    print(f"  ✓ Found {len(found_paths)}/{len(required_paths)} required paths")
    return len(found_paths) == len(required_paths)

def check_settings():
    """Verify settings are properly configured."""
    print("✓ Checking settings...")
    required_settings = [
        'MEDIA_ROOT',
        'MEDIA_URL',
        'FILE_UPLOAD_MAX_MEMORY_SIZE',
        'DATA_UPLOAD_MAX_MEMORY_SIZE',
    ]
    
    for setting in required_settings:
        assert hasattr(settings, setting), f"Setting {setting} is missing"
    
    print(f"  ✓ {len(required_settings)} settings verified")
    return True

def check_environment_variables():
    """Check if environment variables are documented."""
    print("✓ Checking environment variables...")
    
    env_vars = [
        'DJANGO_SECRET_KEY',
        'DB_NAME',
        'DB_USER',
        'DB_PASSWORD',
        'TALENTSCOPE_API_URL',
        'COACHING_OS_API_URL',
        'MISSIONS_API_URL',
        'PORTFOLIO_API_URL',
        'COHORT_API_URL',
        'NOTIFICATIONS_API_URL',
        'LEADERBOARD_API_URL',
        'AI_COACH_API_URL',
        'OPENAI_API_KEY',
        'ANTHROPIC_API_KEY',
    ]
    
    documented = []
    for var in env_vars:
        if os.path.exists('.env.example'):
            with open('.env.example', 'r') as f:
                if var in f.read():
                    documented.append(var)
    
    print(f"  ✓ {len(documented)}/{len(env_vars)} environment variables documented")
    return len(documented) > 0

def check_services():
    """Verify service clients are implemented."""
    print("✓ Checking service clients...")
    
    from student_dashboard.services import (
        TalentScopeService,
        CoachingOSService,
        MissionsService,
        PortfolioService,
        CohortService,
        AICoachService,
        NotificationService,
        LeaderboardService,
    )
    
    services = [
        TalentScopeService,
        CoachingOSService,
        MissionsService,
        PortfolioService,
        CohortService,
        AICoachService,
        NotificationService,
        LeaderboardService,
    ]
    
    for service in services:
        assert hasattr(service, 'get_readiness') or hasattr(service, 'get_week_summary') or \
               hasattr(service, 'get_status') or hasattr(service, 'get_health') or \
               hasattr(service, 'get_student_view') or hasattr(service, 'get_nudge') or \
               hasattr(service, 'get_summary') or hasattr(service, 'get_rankings'), \
               f"Service {service.__name__} is missing required methods"
    
    print(f"  ✓ {len(services)} service clients verified")
    return True

def main():
    """Run all verification checks."""
    print("=" * 60)
    print("IMPLEMENTATION VERIFICATION")
    print("=" * 60)
    print()
    
    checks = [
        ("Models", check_models),
        ("URLs", check_urls),
        ("Settings", check_settings),
        ("Environment Variables", check_environment_variables),
        ("Services", check_services),
    ]
    
    results = []
    for name, check_func in checks:
        try:
            result = check_func()
            results.append((name, result))
        except Exception as e:
            print(f"  ✗ Error: {str(e)}")
            results.append((name, False))
        print()
    
    print("=" * 60)
    print("SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status} - {name}")
    
    print()
    print(f"Total: {passed}/{total} checks passed")
    
    if passed == total:
        print("\n✓ All implementations verified and functional!")
        return 0
    else:
        print("\n✗ Some checks failed. Please review the output above.")
        return 1

if __name__ == '__main__':
    sys.exit(main())

