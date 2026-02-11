# Marketplace Profiler Integration - Future Requirements

## Date: February 9, 2026
## Status: 📋 DOCUMENTED - Implementation Deferred

---

## Overview

This document outlines the future integration between the Profiler and Marketplace for talent matching based on profiler results.

---

## Integration Requirements

### 1. Track Recommendation → Job Matching

**Requirement:**
- Match job postings to users based on profiler track recommendation
- Consider track confidence score
- Filter jobs by track alignment

**Implementation Plan:**
```python
# Matching criteria:
1. Track alignment (70% weight)
   - profiler.recommended_track_id matches job.track_key
   - Consider track_confidence for scoring

2. Skill matching (20% weight)
   - profiler.aptitude_breakdown vs job.required_skills
   - Calculate skill overlap percentage

3. Difficulty level (5% weight)
   - profiler.difficulty_selection vs job.level
   - Match difficulty levels appropriately

4. Behavioral fit (5% weight)
   - profiler.behavioral_profile vs job.culture_fit
   - Match work style preferences
```

---

### 2. Score-Based Matching

**Requirement:**
- Use aptitude_score and technical_exposure_score for job readiness
- Match users to jobs appropriate for their skill level
- Consider overall_score for general readiness

**Scoring Algorithm:**
```python
match_score = (
    track_alignment_score * 0.70 +
    skill_match_score * 0.20 +
    difficulty_match_score * 0.05 +
    behavioral_fit_score * 0.05
)

# Filter matches by minimum threshold (e.g., 60%)
# Sort by match_score descending
```

---

### 3. Job Level Matching

**Requirement:**
- Map profiler difficulty_selection to job levels
- Match users to appropriate entry/mid/senior positions

**Mapping:**
- `novice` → Entry-level jobs
- `beginner` → Entry-level jobs
- `intermediate` → Mid-level jobs
- `advanced` → Senior-level jobs
- `elite` → Expert/Lead-level jobs

---

### 4. Behavioral Profile Matching

**Requirement:**
- Match work style preferences to job culture
- Consider behavioral_profile traits
- Match communication styles

**Matching Criteria:**
- Collaborative vs Independent work
- Documentation preferences
- Risk tolerance
- Leadership traits

---

## API Endpoint (Placeholder)

### GET /api/v1/marketplace/talent-matches/profiler

**Status:** ✅ Placeholder implemented

**Current Response:**
```json
{
  "recommended_track": "uuid",
  "track_confidence": 0.92,
  "aptitude_score": 85.5,
  "difficulty_selection": "intermediate",
  "matches": [],
  "message": "Talent matching based on profiler results coming soon",
  "profiler_complete": true
}
```

**Future Response (When Implemented):**
```json
{
  "recommended_track": "defender",
  "track_confidence": 0.92,
  "aptitude_score": 85.5,
  "difficulty_selection": "intermediate",
  "matches": [
    {
      "job_id": "uuid",
      "job_title": "SOC Analyst",
      "company": "Security Corp",
      "match_score": 87.5,
      "match_reasons": [
        "track_match",
        "skill_alignment",
        "difficulty_match"
      ],
      "required_skills": ["SIEM", "SOC"],
      "matched_skills": ["SIEM", "SOC", "NET"],
      "job_level": "mid",
      "location": "Remote"
    }
  ],
  "total_matches": 15,
  "filtered_by_profiler": true
}
```

---

## Database Schema Requirements

### JobPosting Model Extensions (Future)

```python
# Additional fields needed:
track_key = CharField(max_length=50)  # Link to profiler tracks
required_skills = JSONField()  # Array of skill codes
job_level = CharField(choices=[
    ('entry', 'Entry Level'),
    ('mid', 'Mid Level'),
    ('senior', 'Senior Level'),
    ('expert', 'Expert Level')
])
culture_fit = JSONField()  # Behavioral preferences
```

### MarketplaceProfile Model Extensions (Future)

```python
# Link to profiler session:
profiler_session_id = UUIDField()
profiler_track_recommendation = UUIDField()
profiler_scores = JSONField()  # Store profiler scores
```

---

## Implementation Timeline

### Phase 1: Data Collection (Current)
- ✅ Profiler stores track recommendation
- ✅ Profiler stores scores and breakdowns
- ✅ Marketplace placeholder endpoint created

### Phase 2: Basic Matching (Future)
- [ ] Implement track-based job filtering
- [ ] Implement skill matching algorithm
- [ ] Add match scoring

### Phase 3: Advanced Matching (Future)
- [ ] Implement difficulty level matching
- [ ] Implement behavioral fit scoring
- [ ] Add job recommendation ranking

### Phase 4: Optimization (Future)
- [ ] Cache match results
- [ ] Optimize query performance
- [ ] Add match explanation details

---

## Testing Requirements

### Unit Tests
- [ ] Track matching algorithm
- [ ] Skill matching algorithm
- [ ] Score calculation
- [ ] Difficulty mapping

### Integration Tests
- [ ] End-to-end matching flow
- [ ] Profiler → Marketplace data flow
- [ ] Match result accuracy

### Performance Tests
- [ ] Query performance with large datasets
- [ ] Cache effectiveness
- [ ] Response time targets (<500ms)

---

## Success Metrics

1. **Match Accuracy:**
   - Target: 80%+ match score for top recommendations
   - Measure: User application rate to matched jobs

2. **Coverage:**
   - Target: 90%+ of profiled users get matches
   - Measure: Percentage of users with matches

3. **Relevance:**
   - Target: 70%+ user satisfaction with matches
   - Measure: User feedback on match quality

---

## Notes

- Implementation deferred to future sprint
- Placeholder endpoint allows frontend development
- Full implementation requires job posting schema updates
- Matching algorithm can be refined based on user feedback

---

**Last Updated:** February 9, 2026
**Next Review:** When Marketplace matching feature is prioritized
