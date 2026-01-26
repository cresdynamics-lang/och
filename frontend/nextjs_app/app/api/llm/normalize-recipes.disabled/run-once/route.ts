/**
 * OCH Recipe LLM Worker API Route
 * Process pending LLM jobs for recipe normalization/generation
 */

import { NextRequest, NextResponse } from 'next/server';
import { recipeLLMService } from '@/lib/services/recipeLLM';
import { djangoClient } from '@/services/djangoClient';

// POST /api/llm/normalize-recipes/run-once - Process pending LLM jobs
export async function POST(request: NextRequest) {
  try {
    // Check authentication (admin only)
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get pending jobs from Django via djangoClient
    const jobsData = await djangoClient.recipes.getPendingLLMJobs();
    const pendingJobs = jobsData.results || jobsData;

    if (!pendingJobs || pendingJobs.length === 0) {
      return NextResponse.json({
        message: 'No pending jobs to process',
        processed: 0,
        successful: 0,
        failed: 0
      });
    }

    let processed = 0;
    let successful = 0;
    let failed = 0;
    const results = [];

    // Process each job
    for (const job of pendingJobs) {
      try {
        processed++;

        // Update job status to processing
        await djangoClient.recipes.updateLLMJob(job.id, { status: 'processing' });

        // Process the job with LLM service
        const { recipe, error } = await recipeLLMService.processLLMJob(job);

        if (recipe && !error) {
          // Create the recipe in Django
          const recipeData = {
            ...recipe,
            source_type: job.source_type,
            version: 1,
            is_active: true,
          };

          const createdRecipe = await djangoClient.recipes.generateRecipe(recipeData);

          // Update job as completed with recipe reference
          await djangoClient.recipes.updateLLMJob(job.id, {
            status: 'done',
            normalized_recipe_id: createdRecipe.id,
          });

          successful++;
          results.push({
            job_id: job.id,
            status: 'success',
            recipe_id: createdRecipe.id,
            recipe_title: createdRecipe.title,
          });
        } else {
          // Update job as failed
          await djangoClient.recipes.updateLLMJob(job.id, {
            status: 'failed',
            error_message: error || 'Unknown error',
          });

          failed++;
          results.push({
            job_id: job.id,
            status: 'failed',
            error: error || 'Unknown error',
          });
        }
      } catch (jobError) {
        console.error(`Job ${job.id} failed:`, jobError);

        // Mark job as failed
        await djangoClient.recipes.updateLLMJob(job.id, {
          status: 'failed',
          error_message: jobError instanceof Error ? jobError.message : 'Processing failed',
        });

        failed++;
        results.push({
          job_id: job.id,
          status: 'failed',
          error: jobError instanceof Error ? jobError.message : 'Processing failed',
        });
      }
    }

    return NextResponse.json({
      message: `Processed ${processed} jobs`,
      processed,
      successful,
      failed,
      results,
    });
  } catch (error) {
    console.error('LLM worker error:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'LLM worker failed' },
      { status: 500 }
    );
  }
}
