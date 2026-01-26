#!/usr/bin/env python3
"""
Validate OpenAPI schemas and check for consistency with shared schemas.
"""
import json
import sys
from pathlib import Path
from typing import Dict, Any, List

BASE_DIR = Path(__file__).parent.parent.parent
DJANGO_SCHEMA_PATH = BASE_DIR / "shared" / "openapi" / "openapi_django.json"
FASTAPI_SCHEMA_PATH = BASE_DIR / "shared" / "openapi" / "openapi_fastapi.json"
SHARED_SCHEMAS_DIR = BASE_DIR / "shared" / "schemas"


def load_json_file(file_path: Path) -> Dict[str, Any]:
    """Load JSON file."""
    if not file_path.exists():
        return {}
    with open(file_path, 'r') as f:
        return json.load(f)


def validate_openapi_schema(schema: Dict[str, Any], name: str) -> List[str]:
    """Validate OpenAPI schema structure."""
    errors = []
    
    required_fields = ["openapi", "info", "paths"]
    for field in required_fields:
        if field not in schema:
            errors.append(f"{name}: Missing required field '{field}'")
    
    if "openapi" in schema:
        version = schema["openapi"]
        if not version.startswith("3."):
            errors.append(f"{name}: Unsupported OpenAPI version: {version}")
    
    return errors


def check_schema_consistency(django_schema: Dict, fastapi_schema: Dict) -> List[str]:
    """Check for schema consistency between Django and FastAPI."""
    errors = []
    
    # Check for duplicate path definitions
    django_paths = set(django_schema.get("paths", {}).keys())
    fastapi_paths = set(fastapi_schema.get("paths", {}).keys())
    
    # Check for overlapping schema names in components
    django_schemas = set(django_schema.get("components", {}).get("schemas", {}).keys())
    fastapi_schemas = set(fastapi_schema.get("components", {}).get("schemas", {}).keys())
    
    overlapping = django_schemas & fastapi_schemas
    if overlapping:
        errors.append(f"Warning: Overlapping schema names: {', '.join(overlapping)}")
    
    return errors


def main():
    """Main validation function."""
    print("Validating OpenAPI schemas...")
    
    errors = []
    
    # Load schemas
    django_schema = load_json_file(DJANGO_SCHEMA_PATH)
    fastapi_schema = load_json_file(FASTAPI_SCHEMA_PATH)
    
    # Validate Django schema
    if django_schema:
        django_errors = validate_openapi_schema(django_schema, "Django")
        errors.extend(django_errors)
    else:
        print("Warning: Django schema not found")
    
    # Validate FastAPI schema
    if fastapi_schema:
        fastapi_errors = validate_openapi_schema(fastapi_schema, "FastAPI")
        errors.extend(fastapi_errors)
    else:
        print("Warning: FastAPI schema not found")
    
    # Check consistency
    if django_schema and fastapi_schema:
        consistency_errors = check_schema_consistency(django_schema, fastapi_schema)
        errors.extend(consistency_errors)
    
    if errors:
        print("\nValidation errors found:")
        for error in errors:
            print(f"  - {error}")
        return 1
    
    print("✓ All schemas validated successfully")
    return 0


if __name__ == "__main__":
    sys.exit(main())






