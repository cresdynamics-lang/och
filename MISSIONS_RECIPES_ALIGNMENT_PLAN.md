# Missions & Recipe Engine Alignment & Implementation Plan

## Status: In Progress
## Date: February 9, 2026

---

## Executive Summary

This document outlines the alignment verification and implementation plan for the Missions Engine and Recipe Engine according to Tier 7 specifications. The plan identifies gaps, missing features, and required implementations to ensure full compliance with the product specification.

---

## Current State Analysis

### Missions Engine - Existing Features ✅
- Mission templates (Beginner → Mastery)
- Subtasks structure
- Evidence upload (multi-file)
- Mentor review system
- AI scoring
- Portfolio integration (partial)
- Basic analytics

### Missions Engine - Missing Features ❌
1. **Branching Paths/Decision Points** - Not implemented
2. **Time-bound Missions** - No time_constraint_hours field
3. **Hint System** - Not implemented
4. **Story Narrative** - Missing from Mission model
5. **Objectives Array** - Missing structured objectives
6. **Mission Code** - Missing unique code field
7. **Recipe Recommendations** - Not linked to missions
8. **Rubric System** - Partial (needs per-subtask scoring)
9. **Reflection Requirement** - Field exists but not enforced
10. **Decision Path Tracking** - Not tracked
11. **Comprehensive Telemetry** - Missing drop-off, time per stage, tool usage

### Recipe Engine - Existing Features ✅
- Recipe storage with micro-learning structure
- Recipe types (technical, analysis, etc.)
- Recipe recommendation API (profiler-based)
- Recipe progress tracking
- Recipe context links (missions, modules)

### Recipe Engine - Missing Features ❌
1. **Mission Stage-Based Recommendations** - Not fully implemented
2. **Recipe Usage Analytics** - Basic tracking exists, needs enhancement
3. **Recipe Sidebar Integration** - Component exists but needs mission integration
4. **Recipe Effectiveness Metrics** - No admin endpoint
5. **Correlation with Mission Success** - Not tracked

---

## Implementation Plan

### Phase 1: Mission Model Enhancements (HIGH PRIORITY)

#### 1.1 Add Missing Fields to Mission Model
- [ ] Add `code` field (unique mission code like "SIEM-03")
- [ ] Add `story` or `story_narrative` field
- [ ] Add `objectives` JSONField (array of objectives)
- [ ] Add `tier` field (beginner/intermediate/advanced/mastery)
- [ ] Add `track` field (defender/offensive/grc/innovation/leadership)
- [ ] Add `recipe_recommendations` JSONField
- [ ] Add `success_criteria` JSONField
- [ ] Add `rubric_id` UUIDField
- [ ] Add `time_constraint_hours` IntegerField
- [ ] Add `branching_paths` JSONField (decision points structure)
- [ ] Add `hints` JSONField (hint system)

#### 1.2 Enhance MissionProgress Model
- [ ] Add `decision_paths` JSONField (track user decisions)
- [ ] Add `time_per_stage` JSONField (track time spent per subtask)
- [ ] Add `hints_used` JSONField (track hint usage)
- [ ] Add `tools_used` JSONField (track tool usage)
- [ ] Add `drop_off_stage` IntegerField (track where user left)
- [ ] Add `reflection_required` BooleanField
- [ ] Add `reflection_submitted` BooleanField

### Phase 2: Branching Paths & Decision Points (HIGH PRIORITY)

#### 2.1 Decision Point Model
- [ ] Create `MissionDecisionPoint` model
- [ ] Fields: mission, subtask_number, decision_id, choices (JSON), consequences (JSON)
- [ ] Track user decisions in MissionProgress

#### 2.2 Decision Point API
- [ ] `POST /api/v1/missions/{id}/decisions/{decision_id}/choose` - Record user choice
- [ ] `GET /api/v1/missions/{id}/decisions` - Get available decisions
- [ ] Update mission flow to handle branching

### Phase 3: Time-Bound Missions (MEDIUM PRIORITY)

#### 3.1 Time Constraint Logic
- [ ] Add `time_constraint_hours` to Mission model
- [ ] Add `started_at` tracking in MissionProgress
- [ ] Add `deadline_at` calculation
- [ ] Add deadline warnings in frontend
- [ ] Add auto-submit on deadline (optional)

### Phase 4: Hint System (MEDIUM PRIORITY)

#### 4.1 Hint Model & API
- [ ] Add `hints` JSONField to Mission model
- [ ] Structure: `[{subtask_id: int, hint_text: str, hint_level: int}]`
- [ ] `GET /api/v1/missions/{id}/hints/{subtask_id}` - Get hint
- [ ] Track hint usage in MissionProgress

### Phase 5: Enhanced Rubric System (HIGH PRIORITY)

#### 5.1 Per-Subtask Rubric Scoring
- [ ] Enhance mentor review to score per subtask
- [ ] Add `subtask_scores` JSONField to MissionProgress
- [ ] Update mentor review API to accept subtask scores
- [ ] Calculate weighted final score

### Phase 6: Recipe Engine Enhancements (HIGH PRIORITY)

#### 6.1 Mission Stage-Based Recommendations
- [ ] Enhance recipe recommendation logic
- [ ] Consider current mission subtask
- [ ] Consider user's progress in mission
- [ ] Consider required skills for next subtask

#### 6.2 Recipe Usage Analytics
- [ ] Track recipe view time
- [ ] Track recipe completion rate
- [ ] Track correlation with mission success
- [ ] Create analytics endpoint for admin

#### 6.3 Recipe Sidebar Integration
- [ ] Ensure RecipeSidebar component works in mission context
- [ ] Auto-suggest recipes based on current subtask
- [ ] Track "Mark as used" button clicks

### Phase 7: Telemetry & Analytics (HIGH PRIORITY)

#### 7.1 Mission Telemetry
- [ ] Track mission attempts
- [ ] Track completion rates
- [ ] Track subtask performance
- [ ] Track decision paths
- [ ] Track drop-off points
- [ ] Track time per stage
- [ ] Track tool usage

#### 7.2 Recipe Telemetry
- [ ] Track recipe views
- [ ] Track recipe completion
- [ ] Track recipe effectiveness (correlation with mission success)
- [ ] Track recipe usage patterns

#### 7.3 Analytics Endpoints
- [ ] `GET /api/v1/missions/analytics/performance` - Mission performance dashboard
- [ ] `GET /api/v1/recipes/analytics/effectiveness` - Recipe effectiveness metrics
- [ ] `GET /api/v1/missions/analytics/heatmap` - Completion heatmaps
- [ ] `GET /api/v1/missions/analytics/benchmarks` - Benchmark scoring

### Phase 8: Integration Points (HIGH PRIORITY)

#### 8.1 Foundations Integration
- [ ] Verify missions unlock progressively after Foundations completion
- [ ] Ensure Beginner missions available first
- [ ] Gate Intermediate/Advanced/Mastery based on progress

#### 8.2 Mentor Integration
- [ ] Ensure mentors can recommend recipes in feedback
- [ ] Add recipe recommendation field to mentor review API
- [ ] Display recommended recipes in mentor feedback

#### 8.3 Portfolio Integration
- [ ] Ensure mission artifacts auto-add to portfolio
- [ ] Include mission metadata (score, rubric, completion date)
- [ ] Link portfolio items to mission submissions

#### 8.4 Enterprise Dashboard Integration
- [ ] Create mission performance endpoint for enterprise
- [ ] Aggregate mission completion rates by cohort
- [ ] Include skill mastery metrics from missions

### Phase 9: UI Screens Verification (MEDIUM PRIORITY)

#### 9.1 Missions Engine Screens
- [ ] Mission Dashboard ✅ (exists)
- [ ] Mission Overview Screen ✅ (exists)
- [ ] Mission Stage Screen ✅ (exists)
- [ ] Decision Engine Screen ❌ (needs implementation)
- [ ] Evidence Upload Modal ✅ (exists)
- [ ] Mission Reflection Page ✅ (exists)
- [ ] Mentor Review + Rubric Screen ✅ (exists)
- [ ] Mission Completion Screen ✅ (exists)
- [ ] Mission Performance Dashboard ❌ (needs implementation)

#### 9.2 Recipe Engine Screens
- [ ] Recipe Library Page ✅ (exists)
- [ ] Recipe Detail Page ✅ (exists)
- [ ] Recipe Sidebar ✅ (exists)
- [ ] Recipe Usage Analytics Screen ❌ (needs implementation)
- [ ] Related Recipes Screen ✅ (exists)

---

## Implementation Priority

### Critical (Must Have)
1. Mission model enhancements (story, objectives, code, tier, track)
2. Branching paths/decision points
3. Enhanced rubric system (per-subtask scoring)
4. Recipe stage-based recommendations
5. Comprehensive telemetry

### High Priority
1. Time-bound missions
2. Hint system
3. Recipe effectiveness metrics
4. Mission performance dashboard
5. Enterprise dashboard integration

### Medium Priority
1. Decision Engine UI screen
2. Recipe Usage Analytics UI screen
3. Enhanced analytics endpoints

---

## Success Criteria

### User Experience
- ✅ Missions feel immersive and realistic
- ✅ Recipes are helpful and easy to access
- ✅ Clear learning value from missions
- ✅ Learners produce portfolio artifacts confidently
- ✅ Minimal confusion navigating multi-step stages

### Platform Success
- ✅ Zero mission workflow breaks
- ✅ Evidence uploads reliable at scale
- ✅ Mentor scoring smooth and in sync
- ✅ Recipe recommendations accurate
- ✅ Telemetry captured consistently
- ✅ Mission branching logic stable
- ✅ Performance efficient under high load

---

## Next Steps

1. Start with Phase 1: Mission Model Enhancements
2. Implement branching paths (Phase 2)
3. Enhance rubric system (Phase 5)
4. Implement recipe stage-based recommendations (Phase 6.1)
5. Add comprehensive telemetry (Phase 7)
6. Verify all integration points (Phase 8)
7. Test and validate all features

---

## Notes

- All changes must maintain backward compatibility
- Database migrations required for model changes
- Frontend components may need updates for new features
- API documentation must be updated
- Test coverage required for all new features
