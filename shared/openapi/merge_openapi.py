#!/usr/bin/env python3
"""
Merge Django and FastAPI OpenAPI schemas into a single combined schema.
"""
import json
import sys
from pathlib import Path
from typing import Dict, Any

# Paths
BASE_DIR = Path(__file__).parent.parent.parent
DJANGO_SCHEMA_PATH = BASE_DIR / "shared" / "openapi" / "openapi_django.json"
FASTAPI_SCHEMA_PATH = BASE_DIR / "shared" / "openapi" / "openapi_fastapi.json"
MERGED_SCHEMA_PATH = BASE_DIR / "shared" / "openapi" / "merged_openapi.json"


def load_json_file(file_path: Path) -> Dict[str, Any]:
    """Load JSON file, return empty dict if not found."""
    if not file_path.exists():
        print(f"Warning: {file_path} not found, skipping...")
        return {}
    
    try:
        with open(file_path, 'r') as f:
            return json.load(f)
    except json.JSONDecodeError as e:
        print(f"Error: Invalid JSON in {file_path}: {e}")
        return {}


def merge_openapi_schemas(django_schema: Dict, fastapi_schema: Dict) -> Dict[str, Any]:
    """
    Merge Django and FastAPI OpenAPI schemas.
    
    Strategy:
    - Use Django schema as base (if available)
    - Add FastAPI paths under /ai/ prefix
    - Merge components/schemas
    - Combine servers list
    """
    merged = {
        "openapi": "3.0.3",
        "info": {
            "title": "Ongoza CyberHub API",
            "version": "1.0.0",
            "description": "Combined API documentation for Django REST API and FastAPI AI services"
        },
        "servers": [],
        "paths": {},
        "components": {
            "schemas": {},
            "securitySchemes": {}
        },
        "tags": []
    }
    
    # Merge servers
    if django_schema.get("servers"):
        merged["servers"].extend(django_schema["servers"])
    if fastapi_schema.get("servers"):
        merged["servers"].extend(fastapi_schema["servers"])
    
    if not merged["servers"]:
        merged["servers"] = [
            {"url": "http://localhost:8000", "description": "Development server"},
            {"url": "https://api.ongoza.cyberhub", "description": "Production server"}
        ]
    
    # Merge paths from Django (under /api/)
    if django_schema.get("paths"):
        for path, methods in django_schema["paths"].items():
            # Ensure path starts with /api/
            normalized_path = path if path.startswith("/api/") else f"/api{path}"
            merged["paths"][normalized_path] = methods
    
    # Merge paths from FastAPI (under /ai/)
    if fastapi_schema.get("paths"):
        for path, methods in fastapi_schema["paths"].items():
            # Ensure path starts with /ai/
            normalized_path = path if path.startswith("/ai/") else f"/ai{path}"
            merged["paths"][normalized_path] = methods
    
    # Merge components/schemas
    if django_schema.get("components", {}).get("schemas"):
        merged["components"]["schemas"].update(
            django_schema["components"]["schemas"]
        )
    
    if fastapi_schema.get("components", {}).get("schemas"):
        merged["components"]["schemas"].update(
            fastapi_schema["components"]["schemas"]
        )
    
    # Merge security schemes
    if django_schema.get("components", {}).get("securitySchemes"):
        merged["components"]["securitySchemes"].update(
            django_schema["components"]["securitySchemes"]
        )
    
    if fastapi_schema.get("components", {}).get("securitySchemes"):
        merged["components"]["securitySchemes"].update(
            fastapi_schema["components"]["securitySchemes"]
        )
    
    # Merge tags
    if django_schema.get("tags"):
        merged["tags"].extend(django_schema["tags"])
    if fastapi_schema.get("tags"):
        merged["tags"].extend(fastapi_schema["tags"])
    
    # Remove duplicate tags
    seen_tags = set()
    unique_tags = []
    for tag in merged["tags"]:
        tag_name = tag.get("name", "")
        if tag_name and tag_name not in seen_tags:
            seen_tags.add(tag_name)
            unique_tags.append(tag)
    merged["tags"] = unique_tags
    
    return merged


def main():
    """Main function to merge OpenAPI schemas."""
    print("Loading OpenAPI schemas...")
    
    django_schema = load_json_file(DJANGO_SCHEMA_PATH)
    fastapi_schema = load_json_file(FASTAPI_SCHEMA_PATH)
    
    if not django_schema and not fastapi_schema:
        print("Error: No OpenAPI schemas found!")
        print(f"  Expected Django schema at: {DJANGO_SCHEMA_PATH}")
        print(f"  Expected FastAPI schema at: {FASTAPI_SCHEMA_PATH}")
        sys.exit(1)
    
    print("Merging schemas...")
    merged_schema = merge_openapi_schemas(django_schema, fastapi_schema)
    
    # Ensure output directory exists
    MERGED_SCHEMA_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    # Write merged schema
    with open(MERGED_SCHEMA_PATH, 'w') as f:
        json.dump(merged_schema, f, indent=2)
    
    print(f"✓ Merged OpenAPI schema saved to: {MERGED_SCHEMA_PATH}")
    print(f"  - Total paths: {len(merged_schema.get('paths', {}))}")
    print(f"  - Total schemas: {len(merged_schema.get('components', {}).get('schemas', {}))}")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())






