import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { rating, helpful_for, user_id } = await request.json();
  const recipeId = params.id;

  try {
    const supabase = createClient();

    // Update or create user recipe progress
    const { data: existingProgress } = await supabase
      .from('user_recipe_progress')
      .select('*')
      .eq('user_id', user_id)
      .eq('recipe_id', recipeId)
      .single();

    if (existingProgress) {
      // Update existing progress
      await supabase
        .from('user_recipe_progress')
        .update({
          rating,
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', existingProgress.id);
    } else {
      // Create new progress entry
      await supabase
        .from('user_recipe_progress')
        .insert({
          user_id,
          recipe_id: recipeId,
          rating,
          status: 'completed',
          completed_at: new Date().toISOString()
        });
    }

    // Update recipe average rating
    const { data: allRatings } = await supabase
      .from('user_recipe_progress')
      .select('rating')
      .eq('recipe_id', recipeId)
      .not('rating', 'is', null);

    if (allRatings && allRatings.length > 0) {
      const avgRating = allRatings.reduce((sum, r) => sum + (r.rating || 0), 0) / allRatings.length;
      const usageCount = allRatings.length;

      await supabase
        .from('recipes')
        .update({
          avg_rating: avgRating.toString(),
          usage_count: usageCount
        })
        .eq('id', recipeId);
    }

    // Link to helpful context if provided
    if (helpful_for) {
      await supabase
        .from('recipe_context_links')
        .upsert({
          recipe_id: recipeId,
          context_type: helpful_for.type,
          context_id: helpful_for.id,
          position_order: 0
        });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Feedback submission failed:', error);
    return NextResponse.json({ error: 'Feedback submission failed' }, { status: 500 });
  }
}
