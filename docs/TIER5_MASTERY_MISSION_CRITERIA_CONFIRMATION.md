# Mastery Missions Creation Criteria - Confirmation

## Date: February 9, 2026
## Status: ✅ CONFIRMED - Model Supports All Criteria, Seed Scripts Need Enhancement

---

## Required Criteria: Each Track Has 10-15 Missions

### Current Implementation Status

**Model Support:** ✅ **CONFIRMED**
- Mission model supports all required fields
- Tier field includes 'mastery' option
- Track field supports all 5 tracks (defender, offensive, grc, innovation, leadership)

**Seed Script Status:** ⚠️ **PARTIAL**
- `create_comprehensive_programs.py` creates missions but doesn't specifically target 10-15 Mastery missions per track
- `create_tier7_missions.py` creates missions across all tiers but doesn't guarantee 10-15 Mastery missions per track
- Need to verify/update seed scripts to ensure 10-15 Mastery missions per track

---

## Required Mission Components

### 1. ✅ Narrative Context
**Model Field:** `story` and `story_narrative` (TextField)
**Status:** ✅ **CONFIRMED**
- Both fields exist in Mission model (lines 52-53)
- Used in seed scripts to provide mission scenarios
- Example: "You are a SOC analyst at the SOC. Your mentor hands you a stack of server logs..."

**Verification:**
- ✅ `story` field: `models.TextField(blank=True, help_text='Mission narrative/story context')`
- ✅ `story_narrative` field: `models.TextField(blank=True, help_text='Alternative field for story narrative')`
- ✅ Seed scripts populate story fields

---

### 2. ⚠️ Escalation Events
**Model Field:** Not explicitly defined, but can be stored in:
- `subtasks` JSONField (as subtask events)
- `branching_paths` JSONField (as decision consequences)
- `story_narrative` (as narrative progression)

**Status:** ⚠️ **PARTIAL - Needs Enhancement**
- Escalation events can be represented in subtasks or branching_paths
- No dedicated field for escalation events
- **Recommendation:** Add `escalation_events` JSONField or enhance `branching_paths` to include escalation triggers

**Current Workaround:**
- Escalation can be modeled in `subtasks` with event descriptions
- `branching_paths` can include escalation consequences

---

### 3. ✅ Branching Choices
**Model Field:** `branching_paths` (JSONField)
**Status:** ✅ **CONFIRMED**
- Field exists: `branching_paths = models.JSONField(default=dict, blank=True, help_text='Decision points structure: {subtask_id: {decision_id: str, choices: [], consequences: {}}}')`
- Structure supports decision points with choices and consequences
- API endpoints exist for decision recording

**Verification:**
- ✅ `branching_paths` JSONField in Mission model (line 67)
- ✅ Structure: `{subtask_id: {decision_id: str, choices: [], consequences: {}}}`
- ✅ API endpoints: `GET /api/v1/missions/{mission_id}/decisions`, `POST /api/v1/missions/{mission_id}/decisions/{decision_id}/choose`

---

### 4. ✅ Multi-Stage Subtasks
**Model Field:** `subtasks` (JSONField)
**Status:** ✅ **CONFIRMED**
- Field exists: `subtasks = models.JSONField(default=list, help_text='Array of mission subtasks with id, title, description, order_index')`
- Supports multiple subtasks with dependencies
- Structure includes: id, title, description, order_index, dependencies, evidence_schema

**Verification:**
- ✅ `subtasks` JSONField in Mission model (line 63)
- ✅ Structure supports: id, title, description, order_index, dependencies, evidence_schema
- ✅ MissionProgress tracks `current_subtask` and `subtasks_progress`

---

### 5. ⚠️ Environmental Cues
**Model Field:** Not explicitly defined, but can be stored in:
- `story_narrative` (as environmental descriptions)
- `subtasks` (as environmental context per subtask)
- `hints` (as environmental clues)

**Status:** ⚠️ **PARTIAL - Needs Enhancement**
- Environmental cues can be embedded in narrative or subtask descriptions
- No dedicated field for environmental cues
- **Recommendation:** Add `environmental_cues` JSONField or enhance subtask structure

**Current Workaround:**
- Environmental cues can be included in `story_narrative`
- Subtask descriptions can include environmental context

---

### 6. ✅ Attachments (pcaps, logs, datasets, evidence)
**Model Fields:** 
- `templates` JSONField (for mission attachments)
- `MissionFile` model (for user-submitted evidence)
- `MissionArtifact` model (for submission attachments)

**Status:** ✅ **CONFIRMED**
- `templates` field: `models.JSONField(default=list, blank=True, help_text='Professional templates: [{type: str, url: str, description: str}]')`
- `MissionFile` model stores uploaded evidence files
- `MissionArtifact` model stores submission attachments
- File types include: log, screenshot, document, code, video, other

**Verification:**
- ✅ `templates` JSONField in Mission model (line 70)
- ✅ `MissionFile` model for evidence uploads
- ✅ `MissionArtifact` model for submission attachments
- ✅ File type choices include: log, screenshot, document, code, video, other
- ✅ Evidence schema in subtasks supports file types: PCAP, PDF, TXT, PNG, DOCX

---

### 7. ✅ Expert Reference Reports (for benchmarking)
**Model Fields:**
- `ideal_path` JSONField (for ideal solution path)
- `templates` JSONField (can include expert reports)

**Status:** ✅ **CONFIRMED**
- `ideal_path` field: `models.JSONField(default=dict, blank=True, help_text='Ideal mission path for comparison: {subtask_id: {decision_id: str, choice_id: str, rationale: str}}')`
- `templates` can include expert reference reports
- Structure supports benchmarking against ideal solutions

**Verification:**
- ✅ `ideal_path` JSONField in Mission model (line 71)
- ✅ Structure: `{subtask_id: {decision_id: str, choice_id: str, rationale: str}}`
- ✅ `templates` can include expert reference reports
- ✅ Used for comparison and benchmarking

---

### 8. ✅ Mentor Review Points
**Model Fields:**
- `requires_mentor_review` (BooleanField)
- `subtask_scores` JSONField in MissionProgress (for per-subtask mentor feedback)
- `mentor_reviewed_at` (DateTimeField)

**Status:** ✅ **CONFIRMED**
- `requires_mentor_review`: `models.BooleanField(default=False, help_text='Requires $7 tier mentor review')`
- `subtask_scores` in MissionProgress: Stores mentor scores per subtask
- `mentor_reviewed_at`: Tracks when mentor completed review
- Seed scripts set `requires_mentor_review=True` for Mastery tier

**Verification:**
- ✅ `requires_mentor_review` BooleanField in Mission model (line 58)
- ✅ `subtask_scores` JSONField in MissionProgress model
- ✅ `mentor_reviewed_at` DateTimeField in MissionProgress model
- ✅ Seed scripts set `requires_mentor_review=True` for Mastery tier (line 368 in create_comprehensive_programs.py)

---

## Model Field Summary

| Criteria | Model Field | Status | Notes |
|----------|-------------|--------|-------|
| Narrative context | `story`, `story_narrative` | ✅ | Both fields exist |
| Escalation events | `subtasks`, `branching_paths` | ⚠️ | Can be modeled, no dedicated field |
| Branching choices | `branching_paths` | ✅ | Full JSONField support |
| Multi-stage subtasks | `subtasks` | ✅ | Full JSONField support with dependencies |
| Environmental cues | `story_narrative`, `subtasks` | ⚠️ | Can be embedded, no dedicated field |
| Attachments | `templates`, `MissionFile`, `MissionArtifact` | ✅ | Multiple models support |
| Expert reference reports | `ideal_path`, `templates` | ✅ | Full support |
| Mentor review points | `requires_mentor_review`, `subtask_scores` | ✅ | Full support |

---

## Seed Script Enhancement Recommendations

### 1. Ensure 10-15 Mastery Missions Per Track
**Current:** Seed scripts don't guarantee 10-15 Mastery missions per track
**Recommendation:** Update seed scripts to explicitly create 10-15 Mastery tier missions per track

### 2. Add Escalation Events Support
**Recommendation:** 
- Add `escalation_events` JSONField to Mission model, OR
- Enhance `branching_paths` structure to include escalation triggers

### 3. Add Environmental Cues Support
**Recommendation:**
- Add `environmental_cues` JSONField to Mission model, OR
- Enhance subtask structure to include environmental context field

---

## Verification Checklist

- [x] Mission model supports narrative context
- [x] Mission model supports branching choices
- [x] Mission model supports multi-stage subtasks
- [x] Mission model supports attachments
- [x] Mission model supports expert reference reports
- [x] Mission model supports mentor review points
- [ ] Seed scripts create 10-15 Mastery missions per track (needs verification/enhancement)
- [ ] Escalation events explicitly supported (can be modeled but no dedicated field)
- [ ] Environmental cues explicitly supported (can be embedded but no dedicated field)

---

## Files Referenced

### Models
- `/backend/django_app/missions/models.py` - Mission model
- `/backend/django_app/missions/models_mxp.py` - MissionProgress model

### Seed Scripts
- `/backend/django_app/create_comprehensive_programs.py` - Mission creation
- `/backend/django_app/scripts/create_tier7_missions.py` - Tier 7 mission seeding

---

## Status Summary

✅ **Model Support:** All required criteria are supported by the Mission model (with minor enhancements recommended for escalation events and environmental cues)

⚠️ **Seed Scripts:** Need verification/enhancement to ensure 10-15 Mastery missions per track are created with all criteria populated

✅ **API Support:** All required features have API endpoints for execution

---

## Next Steps

1. **Verify Seed Scripts:** Check if seed scripts create 10-15 Mastery missions per track
2. **Enhance Escalation Events:** Add dedicated field or enhance existing structure
3. **Enhance Environmental Cues:** Add dedicated field or enhance existing structure
4. **Update Seed Scripts:** Ensure all Mastery missions include all required criteria
