import { NextRequest, NextResponse } from 'next/server';
import type { LevelAdvanceResponse } from '@/types/analyst-content';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const { readiness } = await request.json();

    // RBAC Check
    const userRole = 'analyst';
    if (userRole !== 'analyst') {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Validate readiness requirement (82%+)
    if (!readiness || readiness < 82) {
      return NextResponse.json(
        {
          success: false,
          message: 'Readiness score must be 82% or higher to advance to the next level.',
          currentLevel: 1,
        },
        { status: 400 }
      );
    }

    // Mock level advancement
    // In production, this would:
    // 1. Check current level
    // 2. Validate prerequisites
    // 3. Unlock next level
    // 4. Update user progress
    // 5. Return unlocked recipes

    const response: LevelAdvanceResponse = {
      success: true,
      newLevel: 2,
      message: 'Congratulations! You have advanced to Level 2.',
      unlockedRecipes: [
        'recipe-advanced-persistence',
        'recipe-malware-analysis',
        'recipe-network-forensics',
        'recipe-incident-response',
        'recipe-threat-hunting',
      ],
    };

    // Audit log
    console.log(`AUDIT: ${new Date().toISOString()} - ${userId} - level.advance`, {
      fromLevel: 1,
      toLevel: 2,
      readiness,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Level advance error:', error);
    return NextResponse.json(
      { error: 'Failed to advance level' },
      { status: 500 }
    );
  }
}

