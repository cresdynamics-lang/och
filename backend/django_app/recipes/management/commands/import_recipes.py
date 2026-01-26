"""
Django management command to import recipes from JSON files.
"""

import json
import os
from pathlib import Path
from django.core.management.base import BaseCommand
from recipes.models import Recipe


class Command(BaseCommand):
    help = 'Import recipes from JSON files in the frontend data directory'

    def add_arguments(self, parser):
        parser.add_argument(
            '--data-dir',
            type=str,
            default='../../../frontend/nextjs_app/data/recipes',
            help='Path to the recipes data directory (relative to this file)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be imported without actually importing'
        )

    def handle(self, *args, **options):
        import json
        import uuid
        data_dir = Path('/home/frank/Documents/Vs Code/ongozacyberhub/frontend/nextjs_app/data/recipes')

        if not data_dir.exists():
            self.stdout.write(
                self.style.ERROR(f'Data directory does not exist: {data_dir}')
            )
            return

        json_files = list(data_dir.glob('*.json'))
        if not json_files:
            self.stdout.write(
                self.style.WARNING(f'No JSON files found in {data_dir}')
            )
            return

        self.stdout.write(
            self.style.SUCCESS(f'Found {len(json_files)} recipe files to import')
        )

        imported_count = 0
        skipped_count = 0
        error_count = 0

        for json_file in sorted(json_files):
            try:
                with open(json_file, 'r', encoding='utf-8') as f:
                    recipe_data = json.load(f)

                # Skip if recipe already exists
                if Recipe.objects.filter(slug=recipe_data['slug']).exists():
                    self.stdout.write(
                        self.style.WARNING(f'Skipping existing recipe: {recipe_data["title"]}')
                    )
                    skipped_count += 1
                    continue

                # Transform data to match Django model
                django_recipe_data = {
                    'title': recipe_data['title'],
                    'slug': recipe_data['slug'],
                    'summary': recipe_data['description'][:200],  # Truncate for summary
                    'description': recipe_data['description'],
                    'difficulty': recipe_data['level'],  # Map level to difficulty
                    'estimated_minutes': recipe_data['expected_duration_minutes'],
                    'track_codes': recipe_data.get('track_codes', [recipe_data['track_code']]),
                    'skill_codes': recipe_data.get('skill_codes', [recipe_data['skill_code']]),
                    'tools_used': recipe_data.get('tools_used', []),  # Legacy field
                    'prerequisites': recipe_data.get('prerequisites', []),
                    'tools_and_environment': recipe_data.get('tools_and_environment', []),
                    'inputs': recipe_data.get('inputs', []),
                    'steps': recipe_data.get('steps', []),
                    'validation_checks': recipe_data.get('validation_checks', []),
                    'content': recipe_data.get('content', {}),  # Legacy field
                    'validation_steps': recipe_data.get('validation_steps', []),  # Legacy field
                    'thumbnail_url': recipe_data.get('thumbnail_url', ''),
                    'mentor_curated': recipe_data.get('mentor_curated', False),
                    'usage_count': recipe_data.get('usage_count', 0),
                    'avg_rating': recipe_data.get('avg_rating', 0.0),
                    'is_free_sample': recipe_data.get('is_free_sample', False),
                    'is_active': True,
                }

                if not options['dry_run']:
                    # Use Django ORM but exclude fields that don't exist in database
                    safe_recipe_data = {k: v for k, v in django_recipe_data.items()
                                      if k != 'is_free_sample'}
                    try:
                        Recipe.objects.create(**safe_recipe_data)
                    except Exception as create_error:
                        self.stdout.write(
                            self.style.ERROR(f'Failed to create recipe via ORM: {str(create_error)}')
                        )
                        raise

                imported_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'Imported: {recipe_data["title"]}')
                )

            except Exception as e:
                error_count += 1
                self.stdout.write(
                    self.style.ERROR(f'Error importing {json_file.name}: {str(e)}')
                )

        # Summary
        self.stdout.write('\n' + '='*50)
        if options['dry_run']:
            self.stdout.write(
                self.style.SUCCESS(f'DRY RUN - Would import {imported_count} recipes')
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(f'Successfully imported {imported_count} recipes')
            )

        if skipped_count > 0:
            self.stdout.write(
                self.style.WARNING(f'Skipped {skipped_count} existing recipes')
            )

        if error_count > 0:
            self.stdout.write(
                self.style.ERROR(f'Failed to import {error_count} recipes')
            )
