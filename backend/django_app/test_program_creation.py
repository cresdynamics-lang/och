#!/usr/bin/env python
import os
import sys
import django

# Add the project directory to the Python path
sys.path.append('/path/to/your/project')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')

django.setup()

from programs.models import Program
from programs.serializers import ProgramSerializer

# Test data
test_data = {
    "name": "Test Program",
    "category": "technical",
    "description": "Test description",
    "duration_months": 6,
    "default_price": 1000.00,
    "currency": "USD",
    "outcomes": ["Test outcome"],
    "status": "active"
}

print("Testing program creation...")
print("Test data:", test_data)

try:
    serializer = ProgramSerializer(data=test_data)
    if serializer.is_valid():
        program = serializer.save()
        print("✅ Program created successfully:", program.id)
        print("Program data:", ProgramSerializer(program).data)
    else:
        print("❌ Validation errors:", serializer.errors)
except Exception as e:
    print("❌ Exception:", str(e))
    import traceback
    traceback.print_exc()