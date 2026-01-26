/**
 * Supabase Edge Function: Portfolio Review Sync
 * Syncs mentor review scores to TalentScope
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { reviewId, userId, reviewData } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get review and portfolio item
    const { data: review } = await supabaseClient
      .from('portfolio_reviews')
      .select('*, portfolio_items(*)')
      .eq('id', reviewId)
      .single();

    if (!review) throw new Error('Review not found');

    // Sync to TalentScope API
    const talentscopeUrl = Deno.env.get('TALENTSCOPE_API_URL');
    if (talentscopeUrl) {
      await fetch(`${talentscopeUrl}/signals`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${Deno.env.get('TALENTSCOPE_API_KEY')}`,
        },
        body: JSON.stringify({
          userId,
          type: 'portfolio_review',
          scores: review.rubric_scores,
          totalScore: review.total_score,
          portfolioItemId: review.portfolio_item_id,
          timestamp: new Date().toISOString(),
        }),
      });
    }

    // Update user readiness score
    const readinessScore = Math.round(review.total_score * 10);
    await supabaseClient
      .from('marketplace_profiles')
      .update({ readiness_score: readinessScore })
      .eq('user_id', userId);

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});

