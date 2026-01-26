/**
 * Supabase Edge Function: Profile Completeness Calculator
 * Auto-updates profile completeness
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
    const { userId } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get current settings
    const { data: settings } = await supabaseClient
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!settings) {
      throw new Error('Settings not found');
    }

    // Check portfolio items
    const { count: portfolioCount } = await supabaseClient
      .from('portfolio_items')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'approved');

    // Calculate completeness (trigger will handle this, but we can also do it here)
    let completeness = 0;
    if (settings.avatar_uploaded) completeness += 20;
    if (settings.linkedin_linked) completeness += 15;
    if (settings.bio_completed) completeness += 25;
    if (settings.timezone_set) completeness += 10;
    if (settings.portfolio_visibility === 'marketplace_preview' || settings.portfolio_visibility === 'public') {
      completeness += 15;
    }
    if ((portfolioCount || 0) > 0) completeness += 15;

    completeness = Math.min(100, completeness);

    // Update settings (trigger will recalculate, but this ensures it's done)
    await supabaseClient
      .from('user_settings')
      .update({ profile_completeness: completeness })
      .eq('user_id', userId);

    return new Response(
      JSON.stringify({ success: true, completeness }),
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

