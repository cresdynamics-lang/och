# Profiler Questions JSON Structure Documentation

## Overview
The OCH CyberHub profiler system uses structured JSON questions to assess user aptitude and behavioral traits for track recommendation and persona generation.

## Database Models

### ProfilerQuestion Model
```json
{
  "id": "uuid",
  "question_type": "aptitude" | "behavioral",
  "answer_type": "multiple_choice" | "scale" | "likert" | "text" | "boolean",
  "question_text": "string",
  "question_order": "integer",
  "options": ["string"], // Only for multiple_choice questions
  "correct_answer": null | "mixed", // Only for aptitude questions
  "points": "integer",
  "category": "string", // e.g., "networking", "problem_solving", "work_style"
  "tags": ["string"],
  "is_active": "boolean",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

### ProfilerSession Model
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "status": "started" | "in_progress" | "aptitude_complete" | "behavioral_complete" | "current_self_complete" | "future_you_complete" | "finished" | "locked",
  "session_token": "string", // Redis tracking token
  "current_section": "welcome" | "instructions" | "aptitude" | "behavioral" | "results",
  "current_question_index": "integer",
  "total_questions": "integer",

  // Assessment data
  "aptitude_responses": {
    "question_id": "answer_value"
  },
  "behavioral_responses": {
    "question_id": "answer_value"
  },
  "current_self_assessment": {
    "skills": {},
    "behaviors": {},
    "learning_style": {}
  },
  "futureyou_persona": {
    "name": "string",
    "archetype": "string",
    "skills": ["string"]
  },

  // Results
  "aptitude_score": "decimal",
  "behavioral_profile": {},
  "strengths": ["string"],
  "recommended_track_id": "uuid",
  "track_confidence": "decimal",

  // Timing
  "started_at": "datetime",
  "last_activity": "datetime",
  "completed_at": "datetime",
  "time_spent_seconds": "integer",

  // Lock mechanism
  "is_locked": "boolean",
  "locked_at": "datetime",
  "admin_reset_by": "uuid"
}
```

## Question Types

### Aptitude Questions
Test technical knowledge and skills. Use scale or multiple choice format.

**Example Aptitude Questions:**
```json
[
  {
    "question_text": "How would you rate your understanding of network protocols (TCP/IP, HTTP, DNS)?",
    "answer_type": "scale",
    "question_order": 1,
    "category": "networking",
    "points": 10
  },
  {
    "question_text": "How comfortable are you with using command-line tools (Linux/Unix)?",
    "answer_type": "scale",
    "question_order": 2,
    "category": "technical_skills",
    "points": 10
  },
  {
    "question_text": "How would you approach troubleshooting a network connectivity issue?",
    "answer_type": "multiple_choice",
    "question_order": 4,
    "category": "problem_solving",
    "options": [
      "Check physical connections first",
      "Start with DNS resolution",
      "Use network diagnostic tools",
      "Check firewall rules"
    ],
    "points": 10
  }
]
```

### Behavioral Questions
Assess personality traits, work preferences, and learning styles. Use Likert scale format.

**Example Behavioral Questions:**
```json
[
  {
    "question_text": "I prefer working independently rather than in a team",
    "answer_type": "likert",
    "question_order": 1,
    "category": "work_style"
  },
  {
    "question_text": "I enjoy solving complex problems that require deep thinking",
    "answer_type": "likert",
    "question_order": 2,
    "category": "problem_solving"
  },
  {
    "question_text": "I learn best by doing hands-on practice",
    "answer_type": "likert",
    "question_order": 3,
    "category": "learning_style"
  },
  {
    "question_text": "I am comfortable taking on leadership roles",
    "answer_type": "likert",
    "question_order": 4,
    "category": "leadership"
  }
]
```

## Answer Types

### Scale (1-10)
- Numeric rating from 1 (lowest) to 10 (highest)
- Example: "Rate your knowledge of cybersecurity fundamentals"
- Response: `8`

### Likert Scale
- Agreement scale: Strongly Disagree (1) to Strongly Agree (5)
- Example: "I prefer working independently rather than in a team"
- Response: `4`

### Multiple Choice
- Array of predefined options
- Single selection
- Example: "What is your experience with programming/scripting?"
- Response: `"Intermediate (can write functions)"`

### Boolean
- Yes/No questions
- Response: `true` or `false`

### Text Response
- Free-form text input
- Used for detailed responses
- Response: `"I have experience with Python and JavaScript"`

## Scoring and Analysis

### Aptitude Scoring
- Each question has point values
- Correct answers earn full points
- Scale questions: higher values = more points
- Total aptitude score: 0-100

### Behavioral Analysis
- Likert responses aggregated by category
- Categories: work_style, problem_solving, learning_style, leadership, motivation, collaboration
- Results used for track recommendations and persona generation

### Track Recommendation
- Based on aptitude scores and behavioral profiles
- Confidence score: 0.0-1.0
- Returns recommended track with reasoning

## Session Flow

1. **Welcome** - Introduction and instructions
2. **Aptitude Assessment** - Technical knowledge questions
3. **Behavioral Assessment** - Personality and preference questions
4. **Current Self Assessment** - Self-rating of skills and behaviors
5. **Future You Generation** - AI persona creation
6. **Results** - Track recommendations and analysis

## Data Storage

### Redis Integration
- Session tokens stored in Redis for real-time tracking
- Question progression and timing tracked
- Prevents session tampering

### Database Tables
- `profilersessions` - Main session data
- `profilerquestions` - Question templates
- `profileranswers` - Individual responses
- `profilerresults` - Final analysis and recommendations

## API Endpoints

- `GET /profiler/questions/` - Get questions for session
- `POST /profiler/session/` - Start new session
- `PUT /profiler/session/{id}/` - Update session progress
- `POST /profiler/session/{id}/complete/` - Complete assessment
- `GET /profiler/results/{user_id}/` - Get user results

## Integration Points

- **User Onboarding** - First-time user assessment
- **Track Enrollment** - Automatic track recommendations
- **Mentor Matching** - Personality-based pairing
- **Learning Path** - Personalized curriculum suggestions
- **Progress Analytics** - Track development over time

