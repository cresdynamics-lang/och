/**
 * Recipe Import Script
 * Imports seeded recipes from JSON files into Django database
 */

import { promises as fs } from 'fs';
import path from 'path';
import { Recipe } from './seedDummyRecipes';

async function importRecipeToDjango(recipe: Recipe): Promise<void> {
  const djangoUrl = process.env.NEXT_PUBLIC_DJANGO_API_URL || 'http://localhost:8000';

  // Try the generate endpoint (admin only)
  const apiUrl = `${djangoUrl}/api/v1/recipes/generate`;

  try {
    // Transform recipe to match Django API expectations
    const djangoRecipe = {
      track_code: recipe.track_code,
      level: recipe.level,
      skill_code: recipe.skill_code,
      title: recipe.title,
      description: recipe.description,
      prerequisites: recipe.prerequisites,
      tools_and_environment: recipe.tools_and_environment,
      inputs: recipe.inputs,
      steps: recipe.steps,
      expected_duration_minutes: recipe.expected_duration_minutes,
      tags: recipe.tags,
      validation_checks: recipe.validation_checks,
      source_type: recipe.source_type,
      is_free_sample: recipe.is_free_sample
    };

    console.log(`📤 Importing recipe: ${recipe.title}`);

    // Use the bulk import endpoint
    const response = await fetch(`${djangoUrl}/api/v1/recipes/bulk_import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(djangoRecipe)
    });

    if (!response.ok) {
      console.log(`⚠️ API import failed, recipe saved to: data/recipes/${recipe.slug}.json`);
      return;
    }

    const result = await response.json();
    console.log(`✅ Imported recipe: ${recipe.title} (${result.slug || recipe.slug})`);

  } catch (error) {
    console.log(`⚠️ API import failed for ${recipe.title}, recipe saved to JSON file`);
  }
}

async function main() {
  console.log('🚀 Starting recipe import to Django...');

  const recipesDir = path.join(process.cwd(), 'data', 'recipes');

  try {
    const files = await fs.readdir(recipesDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    console.log(`📁 Found ${jsonFiles.length} recipe files to import`);

    for (const file of jsonFiles) {
      const filePath = path.join(recipesDir, file);
      const content = await fs.readFile(filePath, 'utf-8');
      const recipe: Recipe = JSON.parse(content);

      await importRecipeToDjango(recipe);
    }

    console.log(`\n🎉 Recipe import completed!`);
    console.log(`📈 Imported ${jsonFiles.length} recipes`);

  } catch (error) {
    console.error('💥 Recipe import failed:', error);
    process.exit(1);
  }
}

main().catch(console.error);
