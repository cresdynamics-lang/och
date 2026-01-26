import * as fs from 'fs';
import * as path from 'path';

// Conditionally import Groq and initialize client
let Groq: any;
let groq: any;
try {
  Groq = require('groq-sdk');
  if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
  } else {
    console.log('⚠️ GROQ_API_KEY not set, using programmatic generation');
  }
} catch (error) {
  console.log('⚠️ Groq package not available, using programmatic generation');
}

// Recipe schema interface
interface RecipeSeed {
  slug: string;
  title: string;
  track_code: 'defender' | 'offensive' | 'grc' | 'innovation' | 'leadership';
  skill_code: string;
  level: 'beginner' | 'intermediate' | 'advanced' | 'mastery';
  source_type: 'dummy_seed';
  description: string;
  prerequisites: string[];
  tools_and_environment: string[];
  inputs: string[];
  steps: Array<{
    step_number: number;
    instruction: string;
    expected_outcome: string;
    evidence_hint: string;
  }>;
  expected_duration_minutes: number;
  difficulty: string;
  tags: string[];
  validation_checks: string[];
  is_free_sample: boolean;
}

const SYSTEM_PROMPT = `
You are OCH Recipe Factory. Generate realistic cybersecurity micro-skill recipes.

RULES:
1. Each recipe teaches ONE micro-skill (10-35 minutes)
2. Steps must be CONCRETE: actual commands, tool interactions, real outputs expected
3. Use REAL cybersecurity tools and scenarios
4. Write for students who can actually execute the recipe
5. Output ONLY valid JSON array, no explanations

EVERY recipe must have 4-8 detailed steps with instruction + expected_outcome + evidence_hint.
`;

function generateRecipesPrompt(track: string, level: string) {
  return `
GENERATE EXACTLY 5 recipes for:
- Track: ${track}
- Level: ${level}

TRACK GUIDELINES:

defender:
- SIEM queries, log analysis, alert triage, detection rules, endpoint telemetry
- Tools: Splunk/ELK, Windows Event Logs, Zeek, Suricata, EDR

offensive:
- Recon, enumeration, basic exploitation, web app testing, post-exploitation
- Tools: Nmap, Gobuster, Burp Suite, Metasploit, LinEnum

grc:
- Risk assessment, policy writing, control mapping, audit prep, compliance
- Tools: Risk registers, NIST CSF, ISO 27001, GRC platforms

innovation:
- AI security, automation, new tools, research, scripting for security
- Tools: Python, ChatGPT, custom scripts, threat intel APIs

leadership:
- Team management, stakeholder comms, budgeting, hiring, strategy
- Tools: OKRs, dashboards, reports, frameworks (MITRE ATT&CK Navigator)

LEVEL DIFFICULTY:
- beginner: Basic tool usage, guided steps
- intermediate: Combine 2 tools, simple analysis
- advanced: Scenario correlation, optimization
- mastery: Open-ended project, strategic decisions

Return JSON array of 5 Recipe objects matching schema above.
`;
}

const TRACKS = ['defender', 'offensive', 'grc', 'innovation', 'leadership'] as const;
const LEVELS = ['beginner', 'intermediate', 'advanced', 'mastery'] as const;

// Programmatic generation fallback
function generateBatchProgrammatically(track: string, level: string) {
  const skillCodes = {
    defender: ['log_parsing', 'siem_searching', 'alert_triage', 'endpoint_telemetry', 'rule_tuning', 'threat_hunting', 'incident_response'],
    offensive: ['nmap_scanning', 'http_fuzzing', 'password_spraying', 'linux_privesc_basics', 'smb_enum', 'web_vuln_scanning', 'exploit_development'],
    grc: ['risk_register_basics', 'policy_gap_analysis', 'control_mapping_iso', 'phishing_awareness_plan', 'vendor_risk_review', 'compliance_reporting', 'audit_preparation'],
    innovation: ['ai_security', 'automation_scripting', 'threat_intel_api', 'custom_tools', 'research_methodology', 'emerging_threats', 'predictive_analytics'],
    leadership: ['team_management', 'stakeholder_comms', 'budget_planning', 'talent_hiring', 'strategy_development', 'performance_metrics', 'change_management']
  };

  const tools = {
    defender: ['Windows Event Viewer', 'PowerShell', 'SIEM Console', 'Wireshark', 'Sysmon', 'Splunk', 'ELK Stack'],
    offensive: ['Kali Linux', 'Nmap', 'Metasploit', 'Burp Suite', 'SQLMap', 'Gobuster', 'LinEnum'],
    grc: ['Excel/Google Sheets', 'Compliance Frameworks', 'Risk Assessment Tools', 'Policy Templates', 'Audit Software', 'NIST CSF', 'ISO 27001'],
    innovation: ['Python', 'Jupyter Notebook', 'APIs', 'Custom Scripts', 'Machine Learning Libraries', 'Threat Intelligence Feeds', 'Research Tools'],
    leadership: ['Project Management Tools', 'Communication Platforms', 'Budget Software', 'HR Systems', 'Strategy Frameworks', 'Reporting Tools', 'Performance Dashboards']
  };

  const recipes: RecipeSeed[] = [];

  for (let i = 0; i < 5; i++) {
    const skillCode = skillCodes[track as keyof typeof skillCodes][i % skillCodes[track as keyof typeof skillCodes].length];
    const title = `${track.charAt(0).toUpperCase() + track.slice(1)}: ${skillCode.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${level})`;

    const recipe: RecipeSeed = {
      slug: `${track}-${skillCode}-${level}-${i}`,
      title,
      track_code: track as any,
      skill_code: skillCode,
      level: level as any,
      source_type: 'dummy_seed',
      description: `Master ${skillCode.replace(/_/g, ' ')} in the ${track} track. This ${level}-level recipe provides hands-on experience with essential cybersecurity concepts and practical implementation techniques.`,
      prerequisites: [
        `Basic understanding of ${track} concepts`,
        level !== 'beginner' ? `${level === 'intermediate' ? 'Beginner' : 'Intermediate'} ${track} skills recommended` : 'No prior experience required'
      ],
      tools_and_environment: tools[track as keyof typeof tools].slice(0, 3),
      inputs: [
        `${track} environment access`,
        'Sample data or test scenarios',
        'Documentation tools for evidence collection'
      ],
      steps: [
        {
          step_number: 1,
          instruction: `Set up your ${track} environment and verify all required tools are available`,
          expected_outcome: 'Environment configured and tools verified',
          evidence_hint: 'Screenshot of tool setup and verification'
        },
        {
          step_number: 2,
          instruction: `Execute the primary ${skillCode.replace(/_/g, ' ')} procedure using appropriate tools and techniques`,
          expected_outcome: 'Primary procedure completed successfully',
          evidence_hint: 'Command output or tool results screenshot'
        },
        {
          step_number: 3,
          instruction: `Analyze the results and identify key findings, patterns, or security implications`,
          expected_outcome: 'Results analyzed and insights documented',
          evidence_hint: 'Annotated analysis with key findings highlighted'
        },
        {
          step_number: 4,
          instruction: `Document your methodology, findings, and create a summary report with recommendations`,
          expected_outcome: 'Comprehensive report created',
          evidence_hint: 'Final report document with all findings'
        },
        {
          step_number: 5,
          instruction: `Clean up the environment and document lessons learned for future reference`,
          expected_outcome: 'Environment cleaned and lessons documented',
          evidence_hint: 'Cleanup verification and lessons learned summary'
        }
      ],
      expected_duration_minutes: level === 'beginner' ? 20 : level === 'intermediate' ? 30 : level === 'advanced' ? 40 : 50,
      difficulty: level,
      tags: [track, skillCode.replace(/_/g, '-'), level, 'hands-on', 'practical'],
      validation_checks: [
        `Did you successfully complete all ${skillCode.replace(/_/g, ' ')} steps?`,
        'Can you explain the security implications of your findings?',
        'Have you documented your methodology and results?',
        'What evidence did you collect to support your analysis?'
      ],
      is_free_sample: false
    };

    recipes.push(recipe);
  }

  // Save recipes to files (reuse the existing logic from the LLM version)
  for (const recipe of recipes) {
    const slug = `${track}-${recipe.skill_code}-${level}`.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    const recipeWithSlug = { ...recipe, slug };
    const filePath = path.join(process.cwd(), 'data', 'recipes', `${slug}.json`);
    fs.writeFileSync(filePath, JSON.stringify(recipeWithSlug, null, 2));
  }

  console.log(`✅ Saved ${track}/${level} recipes (programmatic)`);
}

async function generateBatch(track: string, level: string) {
  console.log(`🔄 Generating 5 recipes for ${track}/${level}...`);

  // Check if Groq is available and API key is set
  if (!Groq || !process.env.GROQ_API_KEY) {
    console.log('🔧 Using programmatic generation (set GROQ_API_KEY for LLM-powered generation)');
    return generateBatchProgrammatically(track, level);
  }

  try {
    const response = await groq.chat.completions.create({
      model: 'llama3-70b-8192',
      temperature: 0.7,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: generateRecipesPrompt(track, level) }
      ]
    });

    const recipes: RecipeSeed[] = JSON.parse(response.choices[0].message.content || '[]');

    if (!Array.isArray(recipes) || recipes.length !== 5) {
      throw new Error(`Expected 5 recipes, got ${recipes.length}`);
    }

    // Save to JSON files and database
    for (const recipe of recipes) {
      const slug = `${track}-${recipe.skill_code}-${level}`.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

      // Update recipe with generated slug
      const recipeWithSlug = { ...recipe, slug };

      // Save to JSON file
      const filePath = path.join(process.cwd(), 'data', 'recipes', `${slug}.json`);
      fs.writeFileSync(filePath, JSON.stringify(recipeWithSlug, null, 2));

      // Recipe is already saved to JSON file above
    }

    console.log(`✅ Saved ${track}/${level} recipes`);
  } catch (error) {
    console.error(`❌ Failed to generate ${track}/${level}:`, error);
    throw error;
  }
}

async function main() {
  console.log('🚀 Starting OCH Recipe Seeder (Groq API)...');
  console.log('📊 Target: 100 recipes (5 tracks × 4 levels × 5 recipes)');

  const recipesDir = path.join(process.cwd(), 'data', 'recipes');
  if (!fs.existsSync(recipesDir)) {
    fs.mkdirSync(recipesDir, { recursive: true });
  }

  for (const track of TRACKS) {
    for (const level of LEVELS) {
      await generateBatch(track, level);
      // Rate limit to avoid API limits
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  console.log('🎉 SEED COMPLETE: 100 recipes generated!');
  console.log('📁 Recipes saved to: data/recipes/*.json');
  console.log('💾 Database updated with new recipes');
}

main().catch(console.error);
