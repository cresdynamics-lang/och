/**
 * Supabase Edge Function: Marketplace Ranking
 * Updates marketplace rankings based on views and scores
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
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get all marketplace profiles
    const { data: profiles } = await supabaseClient
      .from('marketplace_profiles')
      .select('*');

    if (!profiles) throw new Error('No profiles found');

    // Calculate rankings (simplified - full algorithm in marketplace.ts)
    const rankings = profiles
      .map((profile) => {
        const score =
          profile.total_views * 0.15 +
          profile.readiness_score * 0.25 +
          profile.portfolio_health * 10 * 0.20;
        return { ...profile, ranking_score: score };
      })
      .sort((a, b) => b.ranking_score - a.ranking_score);

    // Update profile statuses based on ranking
    for (let i = 0; i < rankings.length; i++) {
      const profile = rankings[i];
      let status = 'foundation';
      
      if (profile.ranking_score > 70) {
        status = 'job_ready';
      } else if (profile.ranking_score > 40) {
        status = 'emerging';
      }

      await supabaseClient
        .from('marketplace_profiles')
        .update({ profile_status: status })
        .eq('id', profile.id);
    }

    return new Response(
      JSON.stringify({ success: true, updated: rankings.length }),
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

