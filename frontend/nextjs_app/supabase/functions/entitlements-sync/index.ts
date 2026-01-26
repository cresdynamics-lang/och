/**
 * Supabase Edge Function: Entitlements Sync
 * Feature flag propagation across systems
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

    // Get entitlements from view
    const { data: entitlements } = await supabaseClient
      .from('user_entitlements')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (!entitlements) {
      throw new Error('Entitlements not found');
    }

    // Broadcast entitlements change
    await supabaseClient.channel(`entitlements_${userId}`).send({
      type: 'broadcast',
      event: 'entitlements_updated',
      payload: entitlements,
    });

    // Update feature flags in other systems if needed
    // This would typically sync to:
    // - Coaching OS (AI Coach access)
    // - Missions (premium features)
    // - Portfolio (export permissions)
    // - Marketplace (contact enabled)

    return new Response(
      JSON.stringify({ success: true, entitlements }),
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

