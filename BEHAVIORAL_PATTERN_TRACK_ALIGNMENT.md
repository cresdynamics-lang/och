# Behavioral Pattern-Based Track Alignment Implementation

## Overview
This document describes the implementation of behavioral pattern-based track recommendations and admin permissions for the AI Profiler system, aligned with the product specification requirements.

## Behavioral Pattern-Based Track Recommendations

### Track-Specific Behavioral Patterns

The profiler now analyzes specific behavioral patterns to enhance track recommendations:

#### 1. **Defender Track**
**Pattern Requirements:**
- High pattern-recognition
- High stability
- Risk sensitivity

**Implementation:**
- Analyzes responses for pattern recognition indicators (questions about patterns, recognition)
- Evaluates stability preferences (questions about consistency, routine, stability)
- Assesses risk sensitivity (questions about risk assessment, evaluation)
- Applies weighted boost: `(pattern_recognition * 0.4 + stability * 0.3 + risk_sensitivity * 0.3) * 15 points`

#### 2. **Offensive Track**
**Pattern Requirements:**
- High curiosity
- High exploration
- Analytical lateral thinking

**Implementation:**
- Analyzes curiosity indicators (questions about curiosity, exploration, discovery)
- Evaluates exploration mindset (questions about exploring, discovering)
- Assesses analytical lateral thinking (questions about creative thinking, different approaches)
- Applies weighted boost: `(curiosity * 0.35 + exploration * 0.35 + analytical_lateral_thinking * 0.3) * 15 points`

#### 3. **GRC Track**
**Pattern Requirements:**
- High documentation clarity
- Structured thinking
- Governance alignment

**Implementation:**
- Analyzes documentation clarity (questions about documentation, reporting, compliance)
- Evaluates structured thinking (questions about structure, organization, frameworks)
- Assesses governance alignment (questions about governance, compliance, regulations)
- Applies weighted boost: `(documentation_clarity * 0.35 + structured_thinking * 0.35 + governance_alignment * 0.3) * 15 points`

#### 4. **Innovation Track**
**Pattern Requirements:**
- High creativity
- Automation interest
- Systems thinking

**Implementation:**
- Analyzes creativity indicators (questions about creativity, innovation, design)
- Evaluates automation interest (questions about automation, tools, scripts)
- Assesses systems thinking (questions about systems, architecture, design)
- Applies weighted boost: `(creativity * 0.35 + automation_interest * 0.35 + systems_thinking * 0.3) * 15 points`

#### 5. **Leadership Track**
**Pattern Requirements:**
- High communication
- Decision clarity
- Value-driven responses

**Implementation:**
- Analyzes communication skills (questions about communication, explanation, presentation)
- Evaluates decision clarity (questions about decisions, choices)
- Assesses value-driven approach (questions about values, business objectives)
- Applies weighted boost: `(communication * 0.35 + decision_clarity * 0.35 + value_driven * 0.3) * 15 points`

### Behavioral Pattern Extraction

The system extracts behavioral patterns from user responses:

```python
def _extract_behavioral_patterns(self, session: ProfilingSession) -> Dict[str, float]:
    """Extract behavioral patterns from session responses for track alignment."""
    patterns = {
        'pattern_recognition': 0.0,
        'stability': 0.0,
        'risk_sensitivity': 0.0,
        'curiosity': 0.0,
        'exploration': 0.0,
        'analytical_lateral_thinking': 0.0,
        'documentation_clarity': 0.0,
        'structured_thinking': 0.0,
        'governance_alignment': 0.0,
        'creativity': 0.0,
        'automation_interest': 0.0,
        'systems_thinking': 0.0,
        'communication': 0.0,
        'decision_clarity': 0.0,
        'value_driven': 0.0,
    }
    # ... pattern extraction logic ...
    return patterns
```

### Score Adjustment Logic

Behavioral patterns are applied as score adjustments:

```python
def _apply_behavioral_pattern_scoring(self, base_scores: Dict[str, float], patterns: Dict[str, float]) -> Dict[str, float]:
    """Apply behavioral pattern adjustments to track scores."""
    adjusted_scores = base_scores.copy()
    
    # Apply track-specific boosts based on behavioral patterns
    # Each track gets up to 15 points boost based on pattern alignment
    
    return adjusted_scores
```

### Enhanced Reasoning

Track recommendations now include behavioral pattern insights:

- **Defender:** "Your high pattern-recognition ability makes you excellent at identifying threats..."
- **Offensive:** "Your high curiosity drives you to explore vulnerabilities..."
- **GRC:** "Your documentation clarity is essential for compliance..."
- **Innovation:** "Your creativity drives innovation in security research..."
- **Leadership:** "Your strong communication skills are essential for leading teams..."

## Permissions Implementation

### ✅ Learner Permissions
**Requirement:** Learner can take profiler once.

**Implementation Status:** ✅ **COMPLETE**

**Features:**
- Session locking mechanism (`is_locked` field)
- One-time attempt enforcement
- Anti-cheat system prevents multiple attempts
- Locked sessions cannot be restarted
- Admin reset required for retakes

**Code Location:**
- `backend/django_app/profiler/models.py` - `ProfilerSession.is_locked`
- `backend/django_app/profiler/views.py` - Lock check in `start_profiler()`
- `backend/fastapi_app/routers/v1/profiling.py` - Session validation

### ✅ Mentor Permissions
**Requirement:** Mentor can view learner outputs.

**Implementation Status:** ✅ **COMPLETE**

**Features:**
- `GET /api/v1/profiler/mentees/{mentee_id}/future-you` - Future-You persona
- `GET /api/v1/profiler/mentees/{mentee_id}/results` - Comprehensive profiler results
- RBAC checks: Only assigned mentors can access
- Assignment verification via `MenteeMentorAssignment`
- Includes anti-cheat information for mentor review

**Code Location:**
- `backend/django_app/profiler/views.py` - `get_future_you_by_mentee()`, `get_mentee_profiler_results()`

### ✅ Admin Permissions
**Requirement:** Admin can reset profiler, adjust scores.

**Implementation Status:** ✅ **COMPLETE**

#### Admin Reset Profiler
**Endpoint:** `POST /api/v1/profiler/admin/users/{user_id}/reset`

**Features:**
- Admin-only access (admin role or is_staff)
- Resets all profiler sessions for a user
- Unlocks sessions (`is_locked = False`)
- Clears lock timestamps
- Records admin who performed reset
- Resets user's `profiling_complete` flag

**Request:**
```http
POST /api/v1/profiler/admin/users/{user_id}/reset
Authorization: Bearer {admin_token}
```

**Response:**
```json
{
  "message": "Profiler reset successfully for user {email}",
  "user_id": "uuid",
  "sessions_reset": 2,
  "reset_by": "admin@example.com",
  "reset_at": "2026-02-09T12:00:00Z"
}
```

#### Admin Adjust Scores
**Endpoint:** `POST /api/v1/profiler/admin/sessions/{session_id}/adjust-scores`

**Features:**
- Admin-only access (admin role or is_staff)
- Adjusts aptitude_score, overall_score, behavioral_score, track_confidence
- Validates score ranges (0-100 for scores, 0.0-1.0 for confidence)
- Updates both ProfilerSession and ProfilerResult
- Logs adjustments for audit trail
- Returns detailed adjustment information

**Request:**
```http
POST /api/v1/profiler/admin/sessions/{session_id}/adjust-scores
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "aptitude_score": 85.5,
  "overall_score": 82.0,
  "behavioral_score": 78.5,
  "track_confidence": 0.92,
  "reason": "Score adjustment after review"
}
```

**Response:**
```json
{
  "message": "Scores adjusted successfully",
  "session_id": "uuid",
  "adjustments": [
    {
      "field": "aptitude_score",
      "old_value": 75.0,
      "new_value": 85.5
    },
    {
      "field": "track_confidence",
      "old_value": 0.85,
      "new_value": 0.92
    }
  ],
  "adjusted_by": "admin@example.com",
  "adjusted_at": "2026-02-09T12:00:00Z",
  "reason": "Score adjustment after review"
}
```

## Files Modified

### Backend - FastAPI
1. **`backend/fastapi_app/services/profiling_service_enhanced.py`**
   - Added `_extract_behavioral_patterns()` method
   - Added `_apply_behavioral_pattern_scoring()` method
   - Enhanced `generate_recommendations()` to use behavioral patterns
   - Enhanced `_generate_reasoning()` with behavioral pattern insights
   - Updated `complete_session()` to pass session to recommendations

### Backend - Django
1. **`backend/django_app/profiler/views.py`**
   - Added `admin_reset_profiler()` function
   - Added `admin_adjust_scores()` function

2. **`backend/django_app/profiler/urls.py`**
   - Added URL patterns for admin endpoints:
     - `profiler/admin/users/<user_id>/reset`
     - `profiler/admin/sessions/<session_id>/adjust-scores`

## Behavioral Pattern Detection

The system analyzes question text and selected options to detect behavioral patterns:

### Pattern Detection Rules

1. **Pattern Recognition (Defender)**
   - Keywords: "pattern", "recognize"
   - High if: Selected options A or B

2. **Stability (Defender)**
   - Keywords: "stable", "consistent", "routine"
   - High if: Selected options A or B

3. **Risk Sensitivity (Defender)**
   - Keywords: "risk" + ("assess" or "evaluate")
   - High if: Selected options A or B

4. **Curiosity (Offensive)**
   - Keywords: "curious", "explore", "discover"
   - High if: Selected options B or C

5. **Exploration (Offensive)**
   - Keywords: "explore", "discover"
   - High if: Selected options B or C

6. **Analytical Lateral Thinking (Offensive)**
   - Keywords: "think" + ("different" or "creative")
   - High if: Selected options B or C

7. **Documentation Clarity (GRC)**
   - Keywords: "document", "report", "compliance"
   - High if: Selected options A or B

8. **Structured Thinking (GRC)**
   - Keywords: "structure", "organize", "framework"
   - High if: Selected options A or B

9. **Governance Alignment (GRC)**
   - Keywords: "governance", "compliance", "regulation"
   - High if: Selected options A or B

10. **Creativity (Innovation)**
    - Keywords: "creative", "innovate", "design"
    - High if: Selected options B or C

11. **Automation Interest (Innovation)**
    - Keywords: "automate", "tool", "script"
    - High if: Selected options B or C

12. **Systems Thinking (Innovation)**
    - Keywords: "system", "architecture", "design"
    - High if: Selected options B or C

13. **Communication (Leadership)**
    - Keywords: "communicate", "explain", "present"
    - High if: Selected options C or D

14. **Decision Clarity (Leadership)**
    - Keywords: "decide", "decision", "choose"
    - High if: Selected options C or D

15. **Value-Driven (Leadership)**
    - Keywords: "value", "business", "objective"
    - High if: Selected options C or D

## Score Boost Calculation

Each track receives a score boost based on behavioral pattern alignment:

```python
# Example: Defender track boost
defender_boost = (
    pattern_recognition * 0.4 +
    stability * 0.3 +
    risk_sensitivity * 0.3
) * 15

# Maximum boost: 15 points
# Applied to base score calculated from responses
```

## Testing Checklist

- [x] Behavioral patterns extracted correctly from responses
- [x] Track scores adjusted based on behavioral patterns
- [x] Defender track boosted by pattern-recognition + stability + risk sensitivity
- [x] Offensive track boosted by curiosity + exploration + lateral thinking
- [x] GRC track boosted by documentation + structured thinking + governance
- [x] Innovation track boosted by creativity + automation + systems thinking
- [x] Leadership track boosted by communication + decision clarity + values
- [x] Learner can only take profiler once (locked after completion)
- [x] Mentor can view assigned mentee profiler results
- [x] Admin can reset profiler for any user
- [x] Admin can adjust scores for any session
- [x] Admin endpoints require admin role
- [x] Score adjustments validated (0-100 range)
- [x] Audit trail logged for admin actions

## Usage Examples

### Behavioral Pattern Analysis
```python
# Patterns are automatically extracted during session completion
session = ProfilingSession(...)
patterns = service._extract_behavioral_patterns(session)

# Patterns used to adjust scores
adjusted_scores = service._apply_behavioral_pattern_scoring(base_scores, patterns)

# Recommendations generated with behavioral insights
recommendations = service.generate_recommendations(adjusted_scores, session)
```

### Admin Reset Profiler
```bash
curl -X POST \
  https://api.och.com/api/v1/profiler/admin/users/123/reset \
  -H "Authorization: Bearer {admin_token}"
```

### Admin Adjust Scores
```bash
curl -X POST \
  https://api.och.com/api/v1/profiler/admin/sessions/{session_id}/adjust-scores \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json" \
  -d '{
    "aptitude_score": 85.5,
    "track_confidence": 0.92,
    "reason": "Score adjustment after review"
  }'
```

## Status

✅ **COMPLETE** - All requirements implemented:
- ✅ Behavioral pattern-based track recommendations
- ✅ Learner: One-time profiler attempt
- ✅ Mentor: View learner outputs
- ✅ Admin: Reset profiler
- ✅ Admin: Adjust scores
