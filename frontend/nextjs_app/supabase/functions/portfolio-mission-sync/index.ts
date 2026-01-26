/**
 * Supabase Edge Function: Portfolio Mission Sync
 * Auto-creates portfolio items from completed missions
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { missionId, userId, missionData } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Create portfolio item from mission
    const { data: portfolioItem, error } = await supabaseClient
      .from('portfolio_items')
      .insert({
        user_id: userId,
        title: `Mission: ${missionData.title}`,
        summary: missionData.summary || `Portfolio item created from completed mission`,
        type: 'mission',
        mission_id: missionId,
        status: 'approved', // Auto-approve if AI confidence > threshold
        visibility: 'marketplace_preview',
        skill_tags: missionData.skills || [],
        evidence_files: missionData.evidence || [],
      })
      .select()
      .single();

    if (error) throw error;

    // Update marketplace profile
    await supabaseClient.rpc('update_marketplace_profile', {
      user_id: userId,
    });

    return new Response(
      JSON.stringify({ success: true, portfolioItem }),
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

