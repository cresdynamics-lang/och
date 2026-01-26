import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  console.log('[API] Recipes GET request received:', request.url);

  try {
    const { searchParams } = new URL(request.url);
    const track = searchParams.get('track_code');
    const level = searchParams.get('level');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Get user track from cookies (for authenticated users)
    const userTrack = request.cookies.get('user_track')?.value;

    const recipesDir = path.join(process.cwd(), 'data', 'recipes');

    if (!fs.existsSync(recipesDir)) {
      return NextResponse.json({ recipes: [], total: 0 });
    }

    const recipeFiles = fs.readdirSync(recipesDir)
      .filter(file => file.endsWith('.json'))
      .map(file => {
        try {
          const content = fs.readFileSync(path.join(recipesDir, file), 'utf-8');
          return JSON.parse(content);
        } catch (error) {
          console.error(`Error parsing ${file}:`, error);
          return null;
        }
      })
      .filter(recipe => recipe !== null);

    // Filter recipes based on query parameters and user track
    let filteredRecipes = recipeFiles;

    if (track) {
      filteredRecipes = filteredRecipes.filter(recipe => recipe.track_code === track);
    } else if (userTrack) {
      // If no specific track requested but user has a track, prioritize their track
      // but still show some recipes from other tracks (limited)
      const userTrackRecipes = recipeFiles.filter(recipe => recipe.track_code === userTrack);
      const otherTrackRecipes = recipeFiles.filter(recipe => recipe.track_code !== userTrack);

      // Show all recipes from user's track, plus 2 from each other track
      const limitedOtherRecipes = [];
      const tracks = Array.from(new Set(otherTrackRecipes.map(r => r.track_code)));

      for (const otherTrack of tracks) {
        const trackRecipes = otherTrackRecipes.filter(r => r.track_code === otherTrack);
        limitedOtherRecipes.push(...trackRecipes.slice(0, 2)); // Only 2 per other track
      }

      filteredRecipes = [...userTrackRecipes, ...limitedOtherRecipes];
    }

    if (level) {
      filteredRecipes = filteredRecipes.filter(recipe => recipe.level === level);
    }

    // Sort by creation date (newest first)
    filteredRecipes.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

    // Apply limit
    const limitedRecipes = filteredRecipes.slice(0, limit);

    // Add required fields for RecipeListResponse
    const formattedRecipes = limitedRecipes.map(recipe => ({
      ...recipe,
      is_bookmarked: false, // Default to not bookmarked since we don't have user auth
      user_status: null,
      user_rating: null,
      context_labels: [],
      is_user_track: userTrack ? recipe.track_code === userTrack : true, // All accessible if no user track
      track_access: userTrack ? (recipe.track_code === userTrack ? 'full' : 'preview') : 'full'
    }));

    return NextResponse.json({
      recipes: formattedRecipes,
      total: filteredRecipes.length,
      page_size: limit
    });

  } catch (error) {
    console.error('Error fetching recipes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recipes' },
      { status: 500 }
    );
  }
}
