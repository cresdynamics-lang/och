/**
 * OCH User Recipes API Route
 * Get user's recipe progress and available recipes
 */

import { NextRequest, NextResponse } from 'next/server';
import { UserRecipesResponseSchema } from '@/lib/types/recipes';
import { djangoClient } from '@/services/djangoClient';
import { z } from 'zod';

// GET /api/users/[userId]/recipes - Get user's recipes with progress
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const userId = params.userId;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return NextResponse.json(
        { error: 'Invalid user ID format' },
        { status: 400 }
      );
    }

    // Call Django API via djangoClient
    const data = await djangoClient.recipes.getUserRecipes(userId);

    // Validate response against schema
    const validatedResponse = UserRecipesResponseSchema.parse(data);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('User recipes error:', error);

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
