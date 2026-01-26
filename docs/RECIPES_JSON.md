# Recipes JSON Structure Documentation

## Overview
Recipes are micro-skill learning units (15-30 minutes) that teach one specific cybersecurity skill through step-by-step procedures. Examples: "Write Basic Sigma Rule", "Parse logs with jq", "Setup ELK stack".

## Database Models

### Recipe Model
```json
{
  "id": "uuid",
  "title": "string", // e.g., "Write Basic Sigma Rule"
  "slug": "string", // URL-friendly identifier
  "summary": "string", // 1-2 sentence overview (max 500 chars)
  "description": "string", // Detailed "what this solves"

  "difficulty": "beginner" | "intermediate" | "advanced",

  "estimated_minutes": "integer", // 5-60 minutes

  // Arrays for filtering/searching
  "track_codes": ["string"], // ["SOCDEFENSE", "DFIR"]
  "skill_codes": ["string"], // ["SIEM_RULE_WRITING", "LOG_ANALYSIS"]
  "tools_used": ["string"], // ["sigma", "jq", "awk"]

  // Content structure
  "prerequisites": ["string"], // Other recipes or knowledge required
  "tools_and_environment": ["string"], // Tools, SIEMs, OS, labs, log types
  "inputs": ["string"], // What learner needs (log locations, alert IDs, dataset paths)

  "steps": [
    {
      "step_number": "integer",
      "instruction": "string", // What to do
      "expected_outcome": "string", // What should happen
      "evidence_hint": "string" // How to verify success
    }
  ],

  "validation_checks": ["string"], // Simple questions/checks to confirm skill execution

  // Legacy content field (deprecated)
  "content": {},

  // Metadata
  "source_type": "manual" | "llm_generated" | "external_doc" | "lab_platform" | "community",
  "is_active": "boolean",
  "usage_count": "integer",
  "avg_rating": "number",
  "mentor_curated": "boolean",
  "created_by": "uuid",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Recipe Structure Breakdown

### Core Content Fields

#### Prerequisites
Array of knowledge or tools required before starting:
```json
[
  "Basic understanding of cybersecurity concepts",
  "Familiarity with command-line interfaces",
  "Access to a Linux environment"
]
```

#### Tools and Environment
Specific tools, software, or environments needed:
```json
[
  "Sigma rule editor or text editor",
  "Access to Windows Event Logs",
  "Sigma CLI tool installed",
  "Python 3.x environment"
]
```

#### Inputs
What the learner needs to have ready:
```json
[
  "Sample Windows Security Event logs",
  "Specific alert ID or event pattern to detect",
  "Access to SIEM platform"
]
```

### Steps Array
Each step teaches one micro-action with clear instructions:

```json
[
  {
    "step_number": 1,
    "instruction": "Open your text editor and create a new file called 'suspicious_login.yml'",
    "expected_outcome": "New YAML file created and ready for editing",
    "evidence_hint": "File exists in directory and is empty"
  },
  {
    "step_number": 2,
    "instruction": "Add the basic Sigma rule structure with title, id, and status fields",
    "expected_outcome": "YAML file contains valid Sigma rule header",
    "evidence_hint": "File validates as proper YAML syntax"
  }
]
```

### Validation Checks
Simple verification questions or self-checks:
```json
[
  "Does your rule file validate without syntax errors?",
  "Can you explain what each field in your rule does?",
  "Would this rule detect the security event you specified?"
]
```

## Recipe Categories by Track

### Defender Track Recipes
- **SOC Operations**: Alert triage, incident response procedures
- **SIEM Management**: Rule writing, dashboard creation, log analysis
- **Threat Hunting**: Indicator searches, anomaly detection
- **Forensic Analysis**: Memory dumps, timeline creation, artifact collection

### Offensive Track Recipes
- **Reconnaissance**: OSINT gathering, network scanning, enumeration
- **Exploitation**: Vulnerability assessment, payload creation, exploit development
- **Post-Exploitation**: Privilege escalation, lateral movement, data exfiltration
- **Red Team Operations**: Campaign planning, C2 setup, reporting

### GRC Track Recipes
- **Compliance Auditing**: Policy implementation, control validation
- **Risk Assessment**: Threat modeling, vulnerability management
- **Security Governance**: Policy writing, procedure documentation
- **Audit Preparation**: Evidence collection, control testing

### Innovation Track Recipes
- **Security Research**: Vulnerability research, tool development
- **Automation**: Script writing, workflow automation
- **Integration**: API development, system integration
- **Innovation Labs**: Proof-of-concept development, prototyping

### Leadership Track Recipes
- **Team Management**: Project planning, resource allocation
- **Security Strategy**: Risk communication, executive reporting
- **Program Development**: Security program design, metrics definition
- **Stakeholder Engagement**: Presentation skills, influence techniques

## Recipe Difficulty Levels

### Beginner (Novice)
- **Duration**: 15-25 minutes
- **Prerequisites**: Basic computer skills
- **Content**: Step-by-step tutorials with screenshots
- **Validation**: Simple checklist verification
- **Examples**: "Install Wireshark", "Basic Nmap scan"

### Intermediate
- **Duration**: 25-35 minutes
- **Prerequisites**: Basic security concepts
- **Content**: Command-line tools with explanations
- **Validation**: Output verification and troubleshooting
- **Examples**: "Write Sigma rule", "Configure firewall rules"

### Advanced
- **Duration**: 35-50 minutes
- **Prerequisites**: Multiple tool experience
- **Content**: Complex multi-step procedures
- **Validation**: Advanced troubleshooting and optimization
- **Examples**: "Build custom IDS ruleset", "Implement zero-trust network"

### Mastery
- **Duration**: 45-60 minutes
- **Prerequisites**: Deep domain expertise
- **Content**: Enterprise-level implementations
- **Validation**: Performance testing and security validation
- **Examples**: "Design SOC architecture", "Implement threat intelligence platform"

## Recipe Generation Process

### LLM-Powered Generation
```typescript
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
}
```

### Generation Rules
1. **One Micro-Skill**: Each recipe teaches exactly one skill
2. **Concrete Steps**: Real commands, actual tool interactions
3. **Realistic Scenarios**: Authentic cybersecurity use cases
4. **Executable Content**: Students can actually run the procedures
5. **Evidence-Based**: Clear ways to verify successful completion

### Quality Assurance
- **Technical Accuracy**: Commands work as written
- **Security Best Practices**: No dangerous instructions
- **Progressive Difficulty**: Appropriate challenge level
- **Complete Coverage**: All prerequisites and tools specified

## Recipe Context Integration

### Mission Integration
Recipes appear within missions as recommended micro-skills:
```json
{
  "mission_id": "uuid",
  "recipe_recommendations": [
    "write-sigma-rule-basic",
    "parse-logs-with-jq",
    "setup-elk-stack"
  ]
}
```

### Contextual Links
```json
{
  "context_type": "mission" | "module" | "project" | "mentor_session",
  "context_id": "uuid",
  "recipe_id": "uuid",
  "position_order": "integer"
}
```

## Recipe Progress Tracking

### User Progress
```json
{
  "user_id": "uuid",
  "recipe_id": "uuid",
  "status": "not_started" | "in_progress" | "completed",
  "progress_percentage": "integer",
  "time_spent_minutes": "integer",
  "rating": "integer", // 1-5 stars
  "notes": "string",
  "completed_at": "datetime",
  "is_bookmarked": "boolean"
}
```

### Learning Analytics
- **Usage Statistics**: How often recipes are accessed
- **Completion Rates**: Success metrics by difficulty/track
- **Time Tracking**: Average completion times
- **Rating System**: User feedback and quality scores

## API Endpoints

### Public Endpoints (No Auth Required)
- `GET /recipes/` - List all active recipes with filtering
- `GET /recipes/{slug}/` - Get detailed recipe content
- `GET /recipes/{slug}/related/` - Get related recipes

### Authenticated Endpoints
- `POST /recipes/{slug}/progress/` - Update user progress
- `POST /recipes/{slug}/bookmark/` - Bookmark/unbookmark
- `GET /user/recipes/` - Get user's recipe progress
- `GET /user/recipes/bookmarked/` - Get bookmarked recipes

## Recipe Sources

### Source Types
```json
{
  "source_type": "markdown_repo" | "notion" | "lab_api" | "doc_url" | "internal_docs",
  "name": "string",
  "config": {
    "api_key": "string",
    "base_url": "string",
    "selectors": {},
    "credentials": {}
  },
  "ingestion_schedule": "cron_expression",
  "last_ingested": "datetime"
}
```

### LLM Job Processing
```json
{
  "source": "uuid",
  "content": "raw_markdown_or_text",
  "status": "pending" | "processing" | "done" | "failed",
  "generated_recipes": ["uuid"],
  "error_message": "string",
  "processing_time": "integer"
}
```

## Content Management

### Recipe Lifecycle
1. **Draft**: Initial creation, under review
2. **Published**: Active and available to students
3. **Deprecated**: Still accessible but marked for replacement
4. **Archived**: Removed from active use

### Quality Metrics
- **Technical Accuracy**: Commands work as documented
- **Completion Rate**: Percentage of users who finish
- **User Ratings**: Average satisfaction score
- **Time Accuracy**: Estimated vs. actual completion time
- **Update Frequency**: How often content needs refreshing

### Content Updates
- **Version Control**: Track changes over time
- **Deprecation Notices**: Warn about outdated content
- **Alternative Recipes**: Suggest replacements
- **User Feedback**: Incorporate improvement suggestions

