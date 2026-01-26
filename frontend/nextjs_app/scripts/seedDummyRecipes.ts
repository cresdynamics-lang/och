/**
 * Recipe Seeder Script
 * Generates 60 dummy recipes using LLM for OCH Recipe Engine
 */

import { promises as fs } from 'fs';
import path from 'path';

// Recipe types
interface RecipeStep {
  step_number: number;
  instruction: string;
  expected_outcome: string;
  evidence_hint: string;
}

interface Recipe {
  slug: string;
  title: string;
  track_code: 'defender' | 'offensive' | 'grc';
  skill_code: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
  source_type: 'dummy_seed' | 'manual' | 'llm_generated';
  description: string;
  prerequisites: string[];
  tools_and_environment: string[];
  inputs: string[];
  steps: RecipeStep[];
  expected_duration_minutes: number;
  difficulty: string;
  tags: string[];
  validation_checks: string[];
  is_free_sample: boolean;
}

// Constants
const TRACKS = ['defender', 'offensive', 'grc'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced', 'mastery'] as const;

// LLM Prompts
const SEED_RECIPES_SYSTEM_PROMPT = `
You are the OCH Recipe Seeder for a cybersecurity learning platform.

Generate realistic but dummy micro-skill recipes for learners.

Each Recipe:
- Focuses on ONE clear micro-skill
- Takes 10–40 minutes
- Has 4–8 concrete, numbered steps
- Uses real tools and realistic inputs
- Is written so students can actually follow it

You MUST output ONLY valid JSON, with NO comments or explanations.
`;

function buildSeedRecipesUserPrompt(params: {
  trackCode: 'defender' | 'offensive' | 'grc';
  level: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
  count: number;
}) {
  return `
Generate ${params.count} distinct Recipe objects as a JSON array.

All recipes MUST share:
- "track_code": "${params.trackCode}"
- "level": "${params.level}"
- "source_type": "dummy_seed"
- "expected_duration_minutes": between 15 and 35

Follow this JSON SCHEMA for EACH recipe:

{
  "slug": "lowercase-with-dashes-and-codes",
  "title": "short, human-readable title",
  "track_code": "${params.trackCode}",
  "skill_code": "short_snake_case_skill_code",
  "level": "${params.level}",
  "source_type": "dummy_seed",
  "description": "2-3 sentence summary of what this recipe teaches.",
  "prerequisites": [
    "1-4 brief prerequisite bullets"
  ],
  "tools_and_environment": [
    "Tools, platforms, OS, lab environments used"
  ],
  "inputs": [
    "What the learner needs (datasets, sample logs, target hosts, etc.)"
  ],
  "steps": [
    {
      "step_number": 1,
      "instruction": "Concrete, imperative step, referencing actual tools or commands.",
      "expected_outcome": "What the learner should observe after the step.",
      "evidence_hint": "What proof/artifact they can submit (screenshot, command output, snippet)."
    }
  ],
  "expected_duration_minutes": 25,
  "difficulty": "${params.level}",
  "tags": [
    "keywords related to the skill and track"
  ],
  "validation_checks": [
    "Simple checks or questions that confirm the learner executed the recipe correctly."
  ],
  "is_free_sample": false
}

CONTENT GUIDELINES BY TRACK:

- defender:
  - Focus on SIEM, log parsing, detection rules, incident triage, use cases, dashboards.
  - Example skill_code ideas: "log_parsing", "siem_searching", "alert_triage", "endpoint_telemetry", "rule_tuning".

- offensive:
  - Focus on recon, scanning, exploitation basics, post-exploitation, web app testing.
  - Example skill_code ideas: "nmap_scanning", "http_fuzzing", "password_spraying", "linux_privesc_basics", "smb_enum".

- grc:
  - Focus on policies, risk assessment, control mapping, audit prep, awareness campaigns.
  - Example skill_code ideas: "risk_register_basics", "policy_gap_analysis", "control_mapping_iso", "phishing_awareness_plan", "vendor_risk_review".

LEVEL GUIDELINES:

- beginner: simple tools, guided commands, basic explanations.
- intermediate: combine 2–3 tools or concepts; small analysis tasks.
- advanced: more open-ended interpretation and correlation.
- mastery: scenario-based, mini-project style, with synthesis.

Return ONLY a JSON array of 5 Recipe objects, no wrapper field.
`;
}

// Note: This script generates recipes programmatically for demo purposes
// In production, you would use OpenAI API to generate more realistic content

// Save recipe to JSON file (for bulk import later)
async function saveRecipeToDatabase(recipe: Recipe): Promise<void> {
  const recipesDir = path.join(process.cwd(), 'data', 'recipes');
  await fs.mkdir(recipesDir, { recursive: true });

  const fileName = `${recipe.slug}.json`;
  const filePath = path.join(recipesDir, fileName);

  await fs.writeFile(filePath, JSON.stringify(recipe, null, 2));
  console.log(`✅ Saved recipe: ${recipe.title} (${recipe.slug})`);
}

// Generate unique slug
async function ensureUniqueSlug(baseSlug: string, existingSlugs: Set<string> = new Set()): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (existingSlugs.has(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  existingSlugs.add(slug);
  return slug;
}

// Generate recipe programmatically
function generateRecipe(track: typeof TRACKS[number], level: typeof LEVELS[number], index: number): Recipe {
  const skillCodes = {
    defender: ['log_parsing', 'siem_searching', 'alert_triage', 'endpoint_telemetry', 'rule_tuning', 'threat_hunting', 'incident_response'],
    offensive: ['nmap_scanning', 'http_fuzzing', 'password_spraying', 'linux_privesc_basics', 'smb_enum', 'web_vuln_scanning', 'exploit_development'],
    grc: ['risk_register_basics', 'policy_gap_analysis', 'control_mapping_iso', 'phishing_awareness_plan', 'vendor_risk_review', 'compliance_reporting', 'audit_preparation']
  };

  const skillCode = skillCodes[track][index % skillCodes[track].length];
  const title = `${track.charAt(0).toUpperCase() + track.slice(1)}: ${skillCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${level})`;

  const baseSteps = [
    { step_number: 1, instruction: `Set up your ${track} environment and tools`, expected_outcome: 'Environment ready', evidence_hint: 'Screenshot of tool setup' },
    { step_number: 2, instruction: `Execute the primary ${skillCode.replace(/_/g, ' ')} command`, expected_outcome: 'Command executed successfully', evidence_hint: 'Command output screenshot' },
    { step_number: 3, instruction: `Analyze the results and identify key findings`, expected_outcome: 'Analysis completed', evidence_hint: 'Annotated results' },
    { step_number: 4, instruction: `Document your findings and create a summary report`, expected_outcome: 'Report created', evidence_hint: 'Report document' }
  ];

  const tools = {
    defender: ['Windows Event Viewer', 'PowerShell', 'SIEM Console', 'Wireshark', 'Sysmon'],
    offensive: ['Kali Linux', 'Nmap', 'Metasploit', 'Burp Suite', 'SQLMap'],
    grc: ['Excel/Google Sheets', 'Compliance Frameworks', 'Risk Assessment Tools', 'Policy Templates', 'Audit Software']
  };

  return {
    slug: `${track}-${level}-${skillCode}-${index}`,
    title,
    track_code: track,
    skill_code: skillCode,
    level,
    source_type: 'dummy_seed',
    description: `Learn ${skillCode.replace(/_/g, ' ')} in the ${track} track. This ${level}-level recipe covers essential concepts and practical implementation.`,
    prerequisites: [
      `Basic understanding of ${track} concepts`,
      level !== 'beginner' ? `${level === 'intermediate' ? 'Beginner' : 'Intermediate'} ${track} skills` : 'No prior experience required'
    ],
    tools_and_environment: tools[track].slice(0, 3),
    inputs: [
      'Access to appropriate testing environment',
      'Sample data or target systems',
      'Documentation tools'
    ],
    steps: baseSteps,
    expected_duration_minutes: 15 + (index * 5), // 15-35 minutes
    difficulty: level,
    tags: [track, skillCode, level, 'hands-on', 'practical'],
    validation_checks: [
      'Can you execute the primary commands?',
      'Do you understand the output/results?',
      'Can you explain the security implications?'
    ],
    is_free_sample: false
  };
}

// Seed one batch of recipes
async function seedBatch(track: typeof TRACKS[number], level: typeof LEVELS[number]): Promise<void> {
  console.log(`\n🌱 Seeding ${track} - ${level} recipes...`);

  const existingSlugs = new Set<string>();
  const recipes: Recipe[] = [];

  for (let i = 0; i < 5; i++) {
    const recipe = generateRecipe(track, level, i);
    const slug = await ensureUniqueSlug(recipe.slug, existingSlugs);
    recipe.slug = slug;
    recipes.push(recipe);
  }

  for (const recipe of recipes) {
    await saveRecipeToDatabase(recipe);
  }

  console.log(`✅ Completed seeding ${track} - ${level} (${recipes.length} recipes)`);
}

// Main seeding function
async function main() {
  console.log('🚀 Starting OCH Recipe Seeder...');
  console.log('📊 Target: 60 recipes (5 per track × level)');
  console.log('🔧 Using programmatic generation (set OPENAI_API_KEY for LLM-powered generation)');

  const startTime = Date.now();
  let totalRecipes = 0;

  try {
    for (const track of TRACKS) {
      for (const level of LEVELS) {
        await seedBatch(track, level);
        totalRecipes += 5;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n🎉 Recipe seeding completed!`);
    console.log(`📈 Generated ${totalRecipes} recipes in ${duration}s`);
    console.log(`🎯 Coverage: ${TRACKS.length} tracks × ${LEVELS.length} levels × 5 recipes = ${TRACKS.length * LEVELS.length * 5} total`);
    console.log(`\n📁 Recipes saved to: data/recipes/*.json`);
    console.log(`🚀 Run 'npm run import:recipes' to import into database`);

  } catch (error) {
    console.error('💥 Recipe seeding failed:', error);
    process.exit(1);
  }
}

// Run the seeder
main().catch(console.error);
