/**
 * OCH Recipe Source Ingestion API Route
 * Trigger ingestion for a specific recipe source
 */

import { NextRequest, NextResponse } from 'next/server';
import { djangoClient } from '@/services/djangoClient';

// POST /api/recipe-sources/[sourceId]/ingest - Trigger ingestion for a source
export async function POST(
  request: NextRequest,
  { params }: { params: { sourceId: string } }
) {
  try {
    const sourceId = params.sourceId;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sourceId)) {
      return NextResponse.json(
        { error: 'Invalid source ID format' },
        { status: 400 }
      );
    }

    // Check authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Call Django API via djangoClient
    const data = await djangoClient.recipes.ingestRecipeSource(sourceId);

    return NextResponse.json(data, { status: 202 }); // Accepted for async processing
  } catch (error) {
    console.error('Recipe source ingestion error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ingestion failed' },
      { status: 500 }
    );
  }
}
