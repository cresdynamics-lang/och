import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;
    const recipesDir = path.join(process.cwd(), 'data', 'recipes');

    if (!fs.existsSync(recipesDir)) {
      return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });
    }

    const recipeFiles = fs.readdirSync(recipesDir)
      .filter(file => file.endsWith('.json'));

    for (const file of recipeFiles) {
      try {
        const content = fs.readFileSync(path.join(recipesDir, file), 'utf-8');
        const recipe = JSON.parse(content);

        if (recipe.slug === slug) {
          return NextResponse.json({
            ...recipe,
            is_bookmarked: false,
            user_status: null,
            user_rating: null,
            context_labels: []
          });
        }
      } catch (error) {
        console.error(`Error parsing ${file}:`, error);
        continue;
      }
    }

    return NextResponse.json({ error: 'Recipe not found' }, { status: 404 });

  } catch (error) {
    console.error('Error fetching recipe:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipe' },
      { status: 500 }
    );
  }
}
