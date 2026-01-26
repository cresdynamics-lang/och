# Missions JSON Structure Documentation

## Overview
Missions are comprehensive cybersecurity learning experiences that combine multiple skills into real-world scenarios. They provide narrative-driven challenges with objectives, subtasks, and evaluation criteria. Missions range from 2-8 hours and represent significant learning milestones.

## Database Models

### Mission Model
```json
{
  "id": "uuid",
  "code": "string", // Unique mission code like "SIEM-03"
  "title": "string",
  "description": "string", // Mission overview
  "story": "string", // Narrative context and scenario

  // Classification
  "track": "defender" | "offensive" | "grc" | "innovation" | "leadership",
  "tier": "beginner" | "intermediate" | "advanced" | "mastery" | "capstone",
  "difficulty": "novice" | "beginner" | "intermediate" | "advanced" | "elite",
  "type": "lab" | "scenario" | "project" | "capstone",

  // Timing
  "estimated_duration_minutes": "integer", // Primary duration field
  "est_hours": "integer", // Legacy field

  // Content Structure
  "objectives": ["string"], // Mission goals and learning outcomes
  "subtasks": [
    {
      "id": "integer",
      "title": "string",
      "description": "string",
      "dependencies": ["integer"], // IDs of prerequisite subtasks
      "evidence_schema": {
        "required": "boolean",
        "file_types": ["string"], // ["pdf", "docx", "txt"]
        "max_files": "integer",
        "description": "string"
      },
      "estimated_minutes": "integer"
    }
  ],

  // Requirements & Prerequisites
  "competencies": ["string"], // Required skills/knowledge
  "requirements": ["string"], // Tools, access, prerequisites

  // Recommendations
  "recipe_recommendations": ["string"], // Recipe slugs for micro-skills
  "success_criteria": {
    "technical_accuracy": "string",
    "completeness": "string",
    "best_practices": "string",
    "documentation": "string"
  },

  // Metadata
  "track_id": "uuid", // Reference to track
  "track_key": "string", // Like "soc_analyst"
  "requires_mentor_review": "boolean",
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

## Mission Structure Breakdown

### Narrative Elements

#### Story Context
Rich narrative that makes the mission engaging:
```json
{
  "story": "You are a SOC analyst at CyberDefense Corp. An advanced persistent threat (APT) has infiltrated the network. Intelligence suggests the attackers are exfiltrating sensitive data. Your mission: identify the breach, contain the threat, and prevent further damage."
}
```

#### Objectives
Clear, measurable learning outcomes:
```json
{
  "objectives": [
    "Analyze 100GB of security logs to identify suspicious activity",
    "Create custom Sigma rules to detect the attack pattern",
    "Implement containment measures to prevent data exfiltration",
    "Document findings and recommend prevention strategies"
  ]
}
```

### Subtask Structure

#### Complex Dependencies
Subtasks can have prerequisite relationships:
```json
{
  "subtasks": [
    {
      "id": 1,
      "title": "Initial Reconnaissance",
      "description": "Gather intelligence about the suspected breach",
      "dependencies": [],
      "evidence_schema": {
        "required": true,
        "file_types": ["pdf", "txt"],
        "description": "Reconnaissance report with findings"
      },
      "estimated_minutes": 45
    },
    {
      "id": 2,
      "title": "Log Analysis",
      "description": "Analyze security logs for IOCs",
      "dependencies": [1], // Must complete recon first
      "evidence_schema": {
        "required": true,
        "file_types": ["xlsx", "csv"],
        "description": "Log analysis spreadsheet with identified events"
      },
      "estimated_minutes": 90
    }
  ]
}
```

### Track-Specific Mission Types

## Defender Track Missions

### SOC Operations (Beginner-Intermediate)
```json
{
  "code": "SOC-01",
  "title": "Alert Triage Fundamentals",
  "type": "lab",
  "tier": "beginner",
  "objectives": [
    "Process 50 security alerts",
    "Classify alerts by severity and type",
    "Document triage decisions and reasoning"
  ],
  "subtasks": [
    {
      "title": "Alert Review Process",
      "description": "Establish systematic alert review methodology"
    },
    {
      "title": "Severity Classification",
      "description": "Apply correct severity ratings based on impact"
    }
  ]
}
```

### Threat Hunting (Advanced-Mastery)
```json
{
  "code": "TH-02",
  "title": "Advanced Threat Hunting Campaign",
  "type": "scenario",
  "tier": "advanced",
  "story": "Intelligence indicates a nation-state actor is targeting your industry. Develop and execute a comprehensive threat hunting campaign.",
  "objectives": [
    "Develop threat hypotheses based on intelligence",
    "Create and execute hunting queries across enterprise data",
    "Validate findings and escalate appropriately"
  ]
}
```

## Offensive Track Missions

### Red Team Operations
```json
{
  "code": "RED-03",
  "title": "Enterprise Network Penetration",
  "type": "scenario",
  "tier": "intermediate",
  "story": "You've been contracted to perform a red team assessment of a Fortune 500 company's network. Execute a full-scope penetration test while maintaining operational security.",
  "objectives": [
    "Gain initial access through social engineering",
    "Escalate privileges to domain admin level",
    "Maintain persistence and exfiltrate sensitive data",
    "Document all actions and provide remediation recommendations"
  ]
}
```

## GRC Track Missions

### Compliance Auditing
```json
{
  "code": "GRC-02",
  "title": "PCI DSS Compliance Assessment",
  "type": "project",
  "tier": "intermediate",
  "objectives": [
    "Conduct gap analysis against PCI DSS requirements",
    "Develop remediation roadmap with timelines",
    "Create compliance evidence package"
  ]
}
```

## Innovation Track Missions

### Security Research
```json
{
  "code": "INN-04",
  "title": "Zero-Day Vulnerability Research",
  "type": "project",
  "tier": "mastery",
  "story": "Research and develop proof-of-concept exploit for a novel vulnerability class affecting modern web applications.",
  "objectives": [
    "Identify novel attack vector",
    "Develop working proof-of-concept",
    "Create responsible disclosure report"
  ]
}
```

## Leadership Track Missions

### Security Program Management
```json
{
  "code": "LEAD-03",
  "title": "CISO Strategic Planning",
  "type": "capstone",
  "tier": "capstone",
  "objectives": [
    "Develop 3-year security strategy aligned with business objectives",
    "Design security program roadmap with metrics and KPIs",
    "Create executive presentation and stakeholder communication plan"
  ]
}
```

## Mission Progress Tracking

### User Mission Progress
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "mission_id": "uuid",
  "status": "not_started" | "in_progress" | "submitted" | "completed" | "failed",
  "current_subtask": "integer", // Current subtask being worked on
  "subtasks_progress": {
    "1": { // subtask_id
      "completed": "boolean",
      "evidence": ["url1", "url2"], // File URLs
      "notes": "string",
      "completed_at": "datetime"
    }
  },
  "started_at": "datetime",
  "last_activity": "datetime",
  "submitted_at": "datetime",
  "time_spent_minutes": "integer"
}
```

### Mission Submission
```json
{
  "id": "uuid",
  "mission_id": "uuid",
  "user_id": "uuid",
  "status": "submitted" | "ai_reviewed" | "mentor_reviewed" | "completed",
  "ai_score": "decimal", // 0-100
  "mentor_score": "decimal", // 0-100
  "ai_feedback": "string",
  "mentor_feedback": "string",
  "notes": "string",
  "submitted_at": "datetime",
  "ai_reviewed_at": "datetime",
  "mentor_reviewed_at": "datetime",
  "reviewed_at": "datetime"
}
```

## Evidence Management

### Mission Artifacts
```json
{
  "id": "uuid",
  "submission_id": "uuid",
  "kind": "evidence" | "screenshot" | "report" | "code",
  "url": "string", // File URL
  "filename": "string",
  "size_bytes": "integer",
  "metadata": {
    "description": "string",
    "tags": ["string"],
    "uploaded_at": "datetime"
  }
}
```

### Evidence Schema Validation
Each subtask defines what evidence is required:
```json
{
  "evidence_schema": {
    "required": true,
    "file_types": ["pdf", "docx", "xlsx"],
    "max_files": 5,
    "description": "Submit analysis report with findings and recommendations"
  }
}
```

## AI and Mentor Review System

### AI Feedback
```json
{
  "id": "uuid",
  "submission_id": "uuid",
  "score": "decimal", // 0-100
  "strengths": ["string"],
  "gaps": ["string"],
  "suggestions": ["string"],
  "competencies_detected": ["string"],
  "full_feedback": "string",
  "created_at": "datetime"
}
```

### Mentor Review
```json
{
  "id": "uuid",
  "submission_id": "uuid",
  "mentor_id": "uuid",
  "score": "decimal",
  "feedback": "string",
  "approved": "boolean",
  "competencies": ["string"],
  "review_notes": "string",
  "reviewed_at": "datetime"
}
```

## Mission Lifecycle

### Creation Process
1. **Concept Development**: Story, objectives, learning outcomes
2. **Content Design**: Subtasks, dependencies, evidence requirements
3. **Technical Implementation**: Environment setup, tools configuration
4. **Quality Assurance**: Technical accuracy, completion testing
5. **Mentor Calibration**: Review criteria standardization

### Review and Approval
1. **Technical Review**: Commands, tools, security practices
2. **Educational Review**: Learning objectives, difficulty progression
3. **Mentor Calibration**: Scoring rubrics, feedback templates
4. **Beta Testing**: Student pilots, feedback incorporation
5. **Production Release**: Active status, student availability

### Maintenance Cycle
1. **Usage Analytics**: Completion rates, time tracking, difficulty assessment
2. **Quality Metrics**: Student feedback, technical accuracy
3. **Content Updates**: Tool versions, security best practices
4. **Deprecation Planning**: Replacement mission development

## Mission Types and Formats

### Lab Missions
- **Focus**: Technical skill execution
- **Duration**: 2-4 hours
- **Evidence**: Command outputs, configurations, screenshots
- **Example**: "Build and Configure SIEM Dashboard"

### Scenario Missions
- **Focus**: Real-world problem solving
- **Duration**: 4-6 hours
- **Evidence**: Investigation reports, analysis spreadsheets
- **Example**: "APT Investigation and Response"

### Project Missions
- **Focus**: Comprehensive implementation
- **Duration**: 6-8 hours
- **Evidence**: Complete system configurations, documentation
- **Example**: "Enterprise Security Architecture Design"

### Capstone Missions
- **Focus**: Leadership and strategic thinking
- **Duration**: 8-12 hours
- **Evidence**: Strategic plans, executive presentations
- **Example**: "Chief Information Security Officer Simulation"

## API Endpoints

### Mission Management (Director/Admin)
- `GET /missions/` - List all missions with filters
- `POST /missions/` - Create new mission
- `GET /missions/{id}/` - Get mission details
- `PUT /missions/{id}/` - Update mission
- `DELETE /missions/{id}/` - Delete mission

### Student Mission Access
- `GET /student/missions/` - Get available missions for student
- `GET /student/missions/{id}/` - Get mission details
- `POST /student/missions/{id}/start` - Start mission
- `POST /student/missions/{id}/submit` - Submit completed mission

### Progress Tracking
- `GET /progress/missions/` - Get student's mission progress
- `PUT /progress/missions/{id}/` - Update mission progress
- `POST /progress/missions/{id}/subtasks/{subtask_id}` - Complete subtask

### Review System
- `GET /reviews/missions/{submission_id}` - Get submission reviews
- `POST /reviews/ai/` - Request AI review
- `POST /reviews/mentor/` - Request mentor review
- `PUT /reviews/mentor/{id}` - Submit mentor feedback

## Integration Points

### Recipe Recommendations
Missions suggest relevant micro-skill recipes:
```json
{
  "mission_id": "uuid",
  "recipe_recommendations": [
    "write-sigma-rule-basic",
    "parse-logs-with-jq",
    "analyze-network-traffic"
  ]
}
```

### Module Integration
Missions are organized within learning modules:
```json
{
  "module_id": "uuid",
  "mission_id": "uuid",
  "position_order": "integer",
  "is_required": "boolean",
  "prerequisites": ["uuid"] // Other mission IDs
}
```

### Track Progression
Missions form the backbone of track advancement:
```json
{
  "track_id": "uuid",
  "missions": [
    {
      "mission_id": "uuid",
      "tier": "beginner",
      "required_for_advancement": true
    }
  ]
}
```

## Quality Assurance

### Technical Validation
- **Environment Testing**: All required tools and data available
- **Step Verification**: Each subtask can be completed as written
- **Evidence Collection**: File upload and validation working
- **Time Estimates**: Duration estimates accurate

### Educational Validation
- **Learning Outcomes**: Objectives clearly defined and achievable
- **Difficulty Calibration**: Appropriate challenge level
- **Prerequisite Alignment**: Required knowledge matches student level
- **Assessment Rubrics**: Clear success criteria

### Operational Readiness
- **Mentor Training**: Reviewers calibrated on scoring
- **Support Resources**: Help documentation and troubleshooting guides
- **Technical Support**: Environment access and tool issues
- **Progress Tracking**: Submission and review workflow tested

