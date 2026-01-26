/**
 * OCH Recipe Detail API Route
 * Get individual recipe details
 */

import { NextRequest, NextResponse } from 'next/server';
import { RecipeDetailResponseSchema } from '@/lib/types/recipes';
import { djangoClient } from '@/services/djangoClient';
import { z } from 'zod';

// GET /api/recipes/[id] - Get recipe details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const recipeId = params.id;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(recipeId)) {
      return NextResponse.json(
        { error: 'Invalid recipe ID format' },
        { status: 400 }
      );
    }

    // Call Django API via djangoClient
    const data = await djangoClient.recipes.getRecipe(recipeId);

    // Validate response against schema
    const validatedResponse = RecipeDetailResponseSchema.parse(data);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Recipe detail error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid response format', details: error.issues },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
