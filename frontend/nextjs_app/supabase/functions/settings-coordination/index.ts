/**
 * Supabase Edge Function: Settings Coordination
 * Master event handler for cross-system updates
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
    const { userId, type, changes } = await req.json();

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    switch (type) {
      case 'profile_completeness': {
        // Update Marketplace profile status
        const { data: settings } = await supabaseClient
          .from('user_settings')
          .select('profile_completeness, marketplace_contact_enabled')
          .eq('user_id', userId)
          .single();

        if (settings) {
          await supabaseClient
            .from('marketplace_profiles')
            .update({
              profile_status: settings.profile_completeness >= 90 
                ? 'job_ready' 
                : settings.profile_completeness >= 70 
                ? 'emerging' 
                : 'foundation',
              is_contact_enabled: settings.marketplace_contact_enabled,
            })
            .eq('user_id', userId);
        }
        break;
      }

      case 'subscription_upgrade': {
        // Unlock gated features
        await supabaseClient.rpc('update_user_entitlements', {
          user_id: userId,
        });

        // Send welcome notification
        await supabaseClient
          .from('notifications')
          .insert({
            user_id: userId,
            type: 'system',
            title: 'Welcome to Professional Tier!',
            message: 'You now have access to all premium features.',
          });
        break;
      }

      case 'notification_preferences': {
        // Update notification engine preferences
        // This would typically update a notification service
        console.log('Notification preferences updated:', changes);
        break;
      }

      case 'privacy': {
        // Sync portfolio visibility
        if (changes.portfolio_visibility) {
          await supabaseClient
            .from('portfolio_items')
            .update({ visibility: changes.portfolio_visibility })
            .eq('user_id', userId)
            .eq('status', 'approved');
        }
        break;
      }
    }

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

