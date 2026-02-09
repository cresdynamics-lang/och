# Foundations Content Architecture - Implementation Plan

## Date: February 9, 2026
## Status: 📋 PLANNING COMPLETE - Ready for Implementation

---

## Executive Summary

This document provides a detailed implementation plan to align Foundations Tier 1 with the complete content architecture specification, ensuring all content items, navigation flows, screens, telemetry, integrations, and success criteria are properly implemented and coordinated.

---

## 🎯 Implementation Phases

### Phase 1: Content Verification & Enhancement (Priority: High)

#### 1.1 Verify All Orientation Videos
- [ ] Audit all 8 required videos in seed data
- [ ] Ensure video_url fields are populated
- [ ] Verify content matches specification
- [ ] Add missing video URLs if needed

#### 1.2 Create Missing Diagrams
- [ ] **OCH Ecosystem Map** - Add to "Welcome to OCH" module
- [ ] **Mission/Recipe Engine** - Add to "How Mission-Driven Learning Works" module
- [ ] **Learning Pathway Map** - Add to "Role-Based Tracks Explained" module
- [ ] **Portfolio Flow** - Add to "Portfolio & Marketplace Overview" module

**Action Items:**
- Design diagrams (or source from design team)
- Upload to CDN/storage
- Update module `diagram_url` fields

#### 1.3 Enhance Interactive Elements
- [ ] Convert "Mission Preview" module to show actual mission preview
- [ ] Convert "Recipe Demo" module to show actual recipe demo
- [ ] Enhance Track Overview with interactive preview
- [ ] Add Portfolio Card Example component

---

### Phase 2: Missing Screens Implementation (Priority: High)

#### 2.1 Mission Preview Screen
**File:** `frontend/nextjs_app/app/dashboard/student/foundations/components/MissionPreview.tsx`

**Requirements:**
- Fetch sample mission from Missions Engine
- Display mission card preview
- Show mission structure (objectives, subtasks, recipes)
- Track interaction (viewed, time spent)

**Integration:**
- API: `GET /api/v1/missions/sample` (create endpoint)
- Component: Use existing MissionCard component as reference

#### 2.2 Recipe Demo Screen
**File:** `frontend/nextjs_app/app/dashboard/student/foundations/components/RecipeDemo.tsx`

**Requirements:**
- Fetch sample recipe from Recipe Engine
- Display recipe preview
- Show recipe structure (steps, skills, time)
- Track interaction (viewed, time spent)

**Integration:**
- API: `GET /api/v1/recipes/sample` (create endpoint)
- Component: Use existing RecipeCard component as reference

#### 2.3 Portfolio Overview Screen
**File:** `frontend/nextjs_app/app/dashboard/student/foundations/components/PortfolioOverview.tsx`

**Requirements:**
- Explain portfolio concept
- Show example portfolio card
- Explain portfolio → marketplace connection
- Show how missions build portfolio

**Integration:**
- Use PortfolioCardExample component
- Connect to Portfolio API for example

#### 2.4 Mentorship Overview Screen
**File:** `frontend/nextjs_app/app/dashboard/student/foundations/components/MentorshipOverview.tsx`

**Requirements:**
- Explain mentorship layer
- Show how mentors support learning
- Explain mentor access to reflections
- Show mentorship workflow

**Integration:**
- Connect to Mentorship API for examples

#### 2.5 Persistent Progress Sidebar
**File:** `frontend/nextjs_app/app/dashboard/student/foundations/components/ProgressSidebar.tsx`

**Requirements:**
- Show completion percentage
- List all modules with status
- Show current module
- Allow quick navigation
- Persistent across all Foundations screens

**Integration:**
- Use FoundationsStatus data
- Add to all Foundations views

---

### Phase 3: Telemetry & Tracking (Priority: Medium)

#### 3.1 Interaction Tracking
**Model Enhancement:** `backend/django_app/foundations/models.py`

**Add Fields:**
```python
interactions = models.JSONField(
    default=dict,
    blank=True,
    help_text='Interaction tracking: {mission_preview: {viewed: bool, time_spent: int}, recipe_demo: {...}}'
)
```

**Implementation:**
- Track mission preview interactions
- Track recipe demo interactions
- Store in `FoundationsProgress.interactions`

#### 3.2 Time Tracking Enhancement
**Current:** `total_time_spent_minutes` exists but may not be updated

**Action:**
- Add time tracking on module view
- Update `total_time_spent_minutes` on module completion
- Track time per module in `modules_completed`

#### 3.3 Drop-off Analytics
**Current:** `drop_off_module_id` field exists

**Action:**
- Track when user leaves Foundations without completing
- Update `drop_off_module_id` on exit
- Create analytics endpoint for drop-off data

---

### Phase 4: Integration Points (Priority: Medium)

#### 4.1 Missions Engine Integration
**Endpoint:** `GET /api/v1/missions/sample`

**Implementation:**
```python
# backend/django_app/missions/views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sample_mission(request):
    """Get a sample mission for Foundations preview."""
    # Return a beginner-friendly sample mission
    sample_mission = Mission.objects.filter(
        difficulty_level='beginner',
        is_active=True
    ).order_by('?').first()
    
    if not sample_mission:
        return Response({'error': 'No sample mission available'}, status=404)
    
    # Return mission data (without starting it)
    return Response({
        'id': str(sample_mission.id),
        'title': sample_mission.title,
        'description': sample_mission.description,
        'objectives': sample_mission.objectives,
        'estimated_time_minutes': sample_mission.estimated_time_minutes,
        'difficulty_level': sample_mission.difficulty_level,
        'preview_only': True
    })
```

#### 4.2 Recipe Engine Integration
**Endpoint:** `GET /api/v1/recipes/sample`

**Implementation:**
```python
# backend/django_app/recipes/views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_sample_recipe(request):
    """Get a sample recipe for Foundations preview."""
    # Return a beginner-friendly sample recipe
    sample_recipe = Recipe.objects.filter(
        difficulty_level='beginner',
        is_active=True
    ).order_by('?').first()
    
    if not sample_recipe:
        return Response({'error': 'No sample recipe available'}, status=404)
    
    # Return recipe data (without starting it)
    return Response({
        'id': str(sample_recipe.id),
        'title': sample_recipe.title,
        'description': sample_recipe.description,
        'estimated_minutes': sample_recipe.estimated_minutes,
        'skill_codes': sample_recipe.skill_codes,
        'preview_only': True
    })
```

#### 4.3 Mentor Access to Reflections
**Current:** `goals_reflection` stored in FoundationsProgress

**Action:**
- Verify `GET /api/v1/profiler/mentees/{id}/results` includes foundations data
- Add foundations reflection to mentor mentee view
- Ensure mentors can see orientation goals

#### 4.4 Portfolio Entry Creation
**Action:**
- Verify that on Foundations completion, first portfolio entry is created
- Use `value_statement` and `goals_reflection` as first entry
- Connect to Portfolio API

#### 4.5 Enterprise Dashboard Sync
**Endpoint:** `POST /api/v1/enterprise/{cohort_id}/foundations-readiness`

**Implementation:**
- Sync Foundations completion status to enterprise cohorts
- Update cohort analytics with orientation readiness
- Track cohort-level Foundations completion rates

---

### Phase 5: Success Criteria Implementation (Priority: Low)

#### 5.1 Clarity Feedback Mechanism
**Endpoint:** `POST /api/v1/foundations/feedback`

**Implementation:**
- Add feedback form after Foundations completion
- Ask: "How clear was OCH's structure?" (1-5 scale)
- Track >90% positive feedback metric
- Store in analytics

#### 5.2 Drop-off Rate Tracking
**Analytics Endpoint:** `GET /api/v1/foundations/admin/analytics/drop-off`

**Implementation:**
- Calculate drop-off rate per module
- Identify modules with >15% drop-off
- Provide recommendations for improvement

#### 5.3 Mobile Responsiveness
**Action:**
- Test all Foundations screens on mobile devices
- Fix any responsive issues
- Ensure touch interactions work properly

---

## 📁 File Structure

### New Files to Create

```
frontend/nextjs_app/app/dashboard/student/foundations/
├── components/
│   ├── MissionPreview.tsx          # NEW
│   ├── RecipeDemo.tsx                # NEW
│   ├── PortfolioOverview.tsx        # NEW
│   ├── MentorshipOverview.tsx       # NEW
│   ├── PortfolioCardExample.tsx     # NEW
│   ├── ProgressSidebar.tsx          # NEW
│   └── FoundationsAssessment.tsx   # VERIFY EXISTS

backend/django_app/
├── foundations/
│   ├── views.py                     # ENHANCE
│   └── models.py                    # ENHANCE (add interactions field)
├── missions/
│   └── views.py                     # ADD sample endpoint
├── recipes/
│   └── views.py                     # ADD sample endpoint
└── enterprise/                      # CREATE IF NEEDED
    └── views.py                     # ADD foundations sync endpoint
```

---

## 🔄 Implementation Order

1. **Week 1: Content & Diagrams**
   - Verify all videos exist and have URLs
   - Create/upload 4 diagrams
   - Update module diagram_url fields

2. **Week 2: Interactive Components**
   - Create MissionPreview component
   - Create RecipeDemo component
   - Create sample mission/recipe API endpoints

3. **Week 3: Missing Screens**
   - Create PortfolioOverview screen
   - Create MentorshipOverview screen
   - Create ProgressSidebar component

4. **Week 4: Telemetry & Integration**
   - Implement interaction tracking
   - Enhance time tracking
   - Verify mentor access to reflections
   - Verify portfolio entry creation

5. **Week 5: Testing & Polish**
   - Test all navigation flows
   - Test mobile responsiveness
   - Implement feedback mechanism
   - Create analytics dashboard

---

## ✅ Verification Checklist

After implementation, verify:

- [ ] All 8 orientation videos exist and have URLs
- [ ] All 4 diagrams exist and are displayed
- [ ] All 4 interactive elements work (Mission, Recipe, Track, Portfolio)
- [ ] All 11 navigation steps flow correctly
- [ ] All 12 UI screens exist and are functional
- [ ] All telemetry data is tracked
- [ ] All integration points work
- [ ] Success criteria can be measured
- [ ] Mobile responsiveness verified
- [ ] No navigation dead-ends

---

**Last Updated:** February 9, 2026
**Status:** 📋 READY FOR IMPLEMENTATION
