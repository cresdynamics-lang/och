/**
 * OCH Recipe Progress API Route
 * Update user's progress on a specific recipe
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { ProgressUpdateRequestSchema } from '@/lib/types/recipes';
import { djangoClient } from '@/services/djangoClient';

// POST /api/users/[userId]/recipes/[recipeId]/progress - Update recipe progress
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string; recipeId: string } }
) {
  try {
    const { userId, recipeId } = params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(recipeId)) {
      return NextResponse.json(
        { error: 'Invalid user ID or recipe ID format' },
        { status: 400 }
      );
    }

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedRequest = ProgressUpdateRequestSchema.parse(body);

    // Call Django API via djangoClient
    const data = await djangoClient.recipes.updateRecipeProgress(userId, recipeId, validatedRequest);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Recipe progress update error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Progress update failed' },
      { status: 500 }
    );
  }
}

// GET /api/users/[userId]/recipes/[recipeId]/progress - Get current progress
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; recipeId: string } }
) {
  try {
    const { userId, recipeId } = params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId) || !uuidRegex.test(recipeId)) {
      return NextResponse.json(
        { error: 'Invalid user ID or recipe ID format' },
        { status: 400 }
      );
    }

    // Call Django API via djangoClient
    const data = await djangoClient.recipes.getRecipeProgress(userId, recipeId);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Recipe progress get error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get progress' },
      { status: 500 }
    );
  }
}
