/**
 * OCH Recipe Engine API Routes
 * Production-ready recipe management endpoints
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import {
  RecipeListResponseSchema,
  RecipeQueryParamsSchema,
  RecipeGenerationRequestSchema,
} from '@/lib/types/recipes';
import { djangoClient } from '@/services/djangoClient';
import { recipeLLMService } from '@/lib/services/recipeLLM';

// GET /api/recipes - List recipes with filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Parse query parameters
    const queryParams = {
      track_code: searchParams.get('track_code') || undefined,
      skill_code: searchParams.get('skill_code') || undefined,
      level: searchParams.get('level') || undefined,
      difficulty: searchParams.get('difficulty') || undefined,
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : undefined,
    };

    // Validate query parameters
    const validatedParams = RecipeQueryParamsSchema.parse(queryParams);

    // Call Django API via djangoClient
    const data = await djangoClient.recipes.listRecipes(validatedParams);

    // Transform Django paginated response to Next.js expected format
    const transformedData = {
      recipes: data.results || data,
      total: data.count || (data.results ? data.results.length : 0),
      page: 1, // Django pagination starts at 1
      page_size: data.results ? data.results.length : 0
    };


    // Validate response against schema
    const validatedResponse = RecipeListResponseSchema.parse(transformedData);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Recipe list error:', error);

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

// POST /api/recipes/generate - Generate new recipe via LLM
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
    const validatedRequest = RecipeGenerationRequestSchema.parse(body);

    // Generate recipe using LLM service and Django API
    const recipe = await djangoClient.recipes.generateRecipe(validatedRequest);

    return NextResponse.json(recipe, { status: 201 });
  } catch (error) {
    console.error('Recipe generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Recipe generation failed' },
      { status: 500 }
    );
  }
}
