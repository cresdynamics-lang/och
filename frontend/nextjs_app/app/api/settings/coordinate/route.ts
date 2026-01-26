/**
 * Settings Coordination API Route
 * Handles cross-system updates when settings change
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { userId, type, changes } = body;

    // Verify user can only update their own settings
    if (userId !== user.id) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      );
    }

    // Handle different update types
    switch (type) {
      case 'profile_completeness':
        // Trigger profile completeness recalculation
        await supabase.rpc('calculate_profile_completeness', { user_id: userId });
        
        // Update marketplace eligibility if needed
        if (changes.profileCompleteness !== undefined && changes.profileCompleteness >= 80) {
          await supabase
            .from('marketplace_profiles')
            .upsert({
              user_id: userId,
              profile_status: 'foundation',
            }, {
              onConflict: 'user_id'
            });
        }
        break;

      case 'portfolio_visibility':
        // Sync portfolio visibility changes
        await supabase
          .channel(`portfolio_visibility_${userId}`)
          .send({
            type: 'broadcast',
            event: 'visibility_changed',
            payload: { visibility: changes.portfolioVisibility },
          });
        break;

      case 'subscription_tier':
        // Handle subscription tier changes
        if (changes.tier) {
          await supabase
            .from('user_entitlements')
            .update({ tier: changes.tier })
            .eq('user_id', userId);
        }
        break;

      case 'notification_preferences':
        // Broadcast notification preference changes
        await supabase
          .channel(`notifications_${userId}`)
          .send({
            type: 'broadcast',
            event: 'preferences_changed',
            payload: changes,
          });
        break;

      default:
        // Generic update - just acknowledge
        break;
    }

    return NextResponse.json({
      success: true,
      message: 'Settings coordinated successfully',
      type,
    });
  } catch (error) {
    console.error('Settings coordination error:', error);
    return NextResponse.json(
      { error: 'Failed to coordinate settings' },
      { status: 500 }
    );
  }
}

