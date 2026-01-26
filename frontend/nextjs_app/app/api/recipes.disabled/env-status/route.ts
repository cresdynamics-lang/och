import { NextResponse } from 'next/server';
import { validateAIEnvironment } from '@/lib/env';

export async function GET() {
  try {
    const status = validateAIEnvironment();
    return NextResponse.json({
      grok: status.hasGrok,
      groq: status.hasGroq,
      groqSecondary: false, // Secondary models currently decommissioned
      llama: status.hasLlama,
      supabase: false // Converted to PostgreSQL
    });
  } catch (error) {
    // Return status even if validation fails
    return NextResponse.json({
      grok: !!process.env.GROK_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      groqSecondary: false, // Secondary models currently decommissioned
      llama: !!process.env.LLAMA_ENDPOINT,
      supabase: false // Converted to PostgreSQL
    });
  }
}



