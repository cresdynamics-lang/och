/**
 * OCH Recipe Sources API Route
 * Manage recipe sources for ingestion
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { RecipeSourceCreateRequestSchema } from '@/lib/types/recipes';
import { djangoClient } from '@/services/djangoClient';

// GET /api/recipe-sources - List all recipe sources
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call Django API via djangoClient
    const data = await djangoClient.recipes.listRecipeSources();

    return NextResponse.json(data);
  } catch (error) {
    console.error('Recipe sources list error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list recipe sources' },
      { status: 500 }
    );
  }
}

// POST /api/recipe-sources - Create new recipe source
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedRequest = RecipeSourceCreateRequestSchema.parse(body);

    // Call Django API via djangoClient
    const data = await djangoClient.recipes.createRecipeSource(validatedRequest);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Recipe source creation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create recipe source' },
      { status: 500 }
    );
  }
}
