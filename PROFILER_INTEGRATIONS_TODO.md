# Profiler Integration Points - Production Readiness Checklist

## Date: February 9, 2026
## Status: 🔄 IN PROGRESS - Verification & Implementation Required

---

## Integration Points Overview

This document tracks the implementation and verification of all Profiler integration points across the OCH platform.

---

## 1️⃣ Missions Engine Integration

### Requirement
**Difficulty score maps to mission assignment**

### Current Status
- ✅ Missions have `difficulty` field (1-5 scale: Beginner, Intermediate, Advanced, Expert, Master)
- ✅ Profiler stores `difficulty_selection` (novice, beginner, intermediate, advanced, elite)
- ⚠️ **MISSING**: Mapping between profiler difficulty_selection and mission difficulty
- ⚠️ **MISSING**: Mission assignment logic that uses profiler difficulty

### Tasks

#### ✅ Task 1.1: Verify profiler difficulty_selection is accessible
- [x] Check `ProfilerSession.difficulty_selection` field exists
- [x] Verify field is populated on completion
- [x] Confirm API endpoint returns difficulty_selection

#### ⚠️ Task 1.2: Create difficulty mapping function
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
```python
# backend/django_app/missions/services.py
def map_profiler_difficulty_to_mission_difficulty(profiler_difficulty: str) -> int:
    """
    Map profiler difficulty_selection to mission difficulty (1-5).
    
    Mapping:
    - novice → 1 (Beginner)
    - beginner → 1 (Beginner)
    - intermediate → 2 (Intermediate)
    - advanced → 3 (Advanced)
    - elite → 4 (Expert) or 5 (Master)
    """
    mapping = {
        'novice': 1,
        'beginner': 1,
        'intermediate': 2,
        'advanced': 3,
        'elite': 4,  # or 5 based on other factors
    }
    return mapping.get(profiler_difficulty.lower(), 1)  # Default to beginner
```

#### ⚠️ Task 1.3: Update mission assignment logic
**Status:** 🔴 **NOT IMPLEMENTED**

**Files to Modify:**
- `backend/django_app/missions/views_student.py` - `list_student_missions()`
- `backend/django_app/missions/views_mxp.py` - `mission_dashboard()`

**Action Required:**
```python
# In list_student_missions or mission_dashboard
from profiler.models import ProfilerSession
from missions.services import map_profiler_difficulty_to_mission_difficulty

# Get user's profiler difficulty
profiler_session = ProfilerSession.objects.filter(
    user=user,
    status__in=['finished', 'locked']
).order_by('-completed_at').first()

if profiler_session and profiler_session.difficulty_selection:
    max_difficulty = map_profiler_difficulty_to_mission_difficulty(
        profiler_session.difficulty_selection
    )
    # Filter missions to only show missions <= max_difficulty
    missions = missions.filter(difficulty__lte=max_difficulty)
else:
    # Default to beginner if no profiler data
    missions = missions.filter(difficulty=1)
```

#### ⚠️ Task 1.4: Test mission assignment with different difficulty levels
**Status:** 🔴 **NOT TESTED**

**Test Cases:**
- [ ] User with `novice` difficulty → Only sees difficulty 1 missions
- [ ] User with `intermediate` difficulty → Sees difficulty 1-2 missions
- [ ] User with `advanced` difficulty → Sees difficulty 1-3 missions
- [ ] User with `elite` difficulty → Sees difficulty 1-4 missions
- [ ] User without profiler → Defaults to difficulty 1

---

## 2️⃣ Recipe Engine Integration

### Requirement
**Tracks what recipes learners need to bridge gaps**

### Current Status
- ✅ Recipe Engine exists (`backend/django_app/recipes/`)
- ✅ Recipe recommendations exist (`RecipeRecommendation` model)
- ✅ Gap analysis logic exists in `CoachingOSIntegration.identifySkillGaps()`
- ⚠️ **MISSING**: Direct integration with profiler scores for gap analysis
- ⚠️ **MISSING**: API endpoint that uses profiler data for recipe recommendations

### Tasks

#### ✅ Task 2.1: Verify profiler results are accessible
- [x] Check `get_mentee_profiler_results` endpoint exists
- [x] Verify profiler scores are available (aptitude_score, technical_exposure_score)
- [x] Confirm behavioral_profile is accessible

#### ⚠️ Task 2.2: Create profiler-based gap analysis function
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
```python
# backend/django_app/recipes/services.py (NEW FILE)
from profiler.models import ProfilerSession, ProfilerResult

def analyze_gaps_from_profiler(user) -> Dict[str, Any]:
    """
    Analyze skill gaps based on profiler results.
    
    Returns:
    {
        'aptitude_gaps': [...],  # Areas where aptitude_score is low
        'technical_gaps': [...],  # Areas where technical_exposure_score is low
        'behavioral_gaps': [...],  # Areas for growth from behavioral_profile
        'recommended_recipe_skills': [...],  # Skill codes for recipe matching
    }
    """
    profiler_session = ProfilerSession.objects.filter(
        user=user,
        status__in=['finished', 'locked']
    ).order_by('-completed_at').first()
    
    if not profiler_session:
        return {'gaps': [], 'recommended_recipe_skills': []}
    
    gaps = []
    recommended_skills = []
    
    # Analyze aptitude breakdown
    try:
        result = profiler_session.result
        if result.aptitude_breakdown:
            for category, score in result.aptitude_breakdown.items():
                if score < 60:  # Below threshold
                    gaps.append({
                        'category': category,
                        'type': 'aptitude',
                        'score': score,
                        'priority': 'high' if score < 40 else 'medium'
                    })
                    # Map category to skill codes
                    skill_codes = map_category_to_skill_codes(category)
                    recommended_skills.extend(skill_codes)
    except ProfilerResult.DoesNotExist:
        pass
    
    # Analyze technical exposure
    if profiler_session.technical_exposure_score and profiler_session.technical_exposure_score < 60:
        gaps.append({
            'category': 'technical_exposure',
            'type': 'technical',
            'score': float(profiler_session.technical_exposure_score),
            'priority': 'high'
        })
    
    # Analyze behavioral profile
    if profiler_session.behavioral_profile:
        areas_for_growth = profiler_session.behavioral_profile.get('areas_for_growth', [])
        for area in areas_for_growth:
            gaps.append({
                'category': area,
                'type': 'behavioral',
                'priority': 'medium'
            })
    
    return {
        'gaps': gaps,
        'recommended_recipe_skills': list(set(recommended_skills))
    }
```

#### ⚠️ Task 2.3: Create API endpoint for profiler-based recipe recommendations
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
```python
# backend/django_app/recipes/views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_profiler_based_recipes(request):
    """
    GET /api/v1/recipes/profiler-recommendations
    Get recipe recommendations based on profiler gap analysis.
    """
    from recipes.services import analyze_gaps_from_profiler
    from recipes.models import Recipe
    
    user = request.user
    gaps_analysis = analyze_gaps_from_profiler(user)
    
    # Get recipes matching recommended skills
    skill_codes = gaps_analysis.get('recommended_recipe_skills', [])
    recipes = Recipe.objects.filter(
        skill_codes__overlap=skill_codes,
        is_active=True
    ).order_by('-usage_count')[:10]
    
    return Response({
        'gaps_analysis': gaps_analysis,
        'recommended_recipes': RecipeListSerializer(recipes, many=True).data
    })
```

#### ⚠️ Task 2.4: Integrate with existing recipe recommendation system
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
- Update `CoachingOSIntegration.getNextBestRecipes()` to include profiler data
- Update `MissionsEngineIntegration.getRecommendedRecipesForMission()` to consider profiler gaps

#### ⚠️ Task 2.5: Test recipe recommendations with profiler data
**Status:** 🔴 **NOT TESTED**

**Test Cases:**
- [ ] User with low technical_exposure_score → Gets technical recipes
- [ ] User with low aptitude in networking → Gets networking recipes
- [ ] User with behavioral gaps → Gets soft-skill recipes
- [ ] User without profiler → Falls back to existing logic

---

## 3️⃣ Mentorship Layer Integration

### Requirement
**Mentors see Profiler results to guide learners**

### Current Status
- ✅ `get_mentee_profiler_results` endpoint exists
- ✅ Coaching OS includes profiler data in `student_analytics`
- ✅ Frontend has `getMenteeResults()` in `profilerClient.ts`
- ⚠️ **NEEDS VERIFICATION**: Mentor dashboard displays profiler results
- ⚠️ **NEEDS VERIFICATION**: Coaching OS uses profiler data for guidance

### Tasks

#### ✅ Task 3.1: Verify API endpoint exists
- [x] `GET /api/v1/profiler/mentees/{mentee_id}/results` exists
- [x] Endpoint includes comprehensive profiler data
- [x] RBAC permissions verified

#### ⚠️ Task 3.2: Verify mentor dashboard displays profiler results
**Status:** 🟡 **NEEDS VERIFICATION**

**Files to Check:**
- `frontend/nextjs_app/app/mentor/dashboard/` - Mentor dashboard pages
- `frontend/nextjs_app/components/mentor/` - Mentor components

**Action Required:**
- [ ] Check if mentor dashboard calls `getMenteeResults()`
- [ ] Verify profiler results are displayed in mentor view
- [ ] Test with actual mentor account

#### ✅ Task 3.3: Verify Coaching OS integration
- [x] `student_analytics()` includes profiler data
- [x] `getStudentState()` in Next.js includes profiler data
- [x] Profiler data structure matches expected format

#### ⚠️ Task 3.4: Test mentor access to profiler results
**Status:** 🔴 **NOT TESTED**

**Test Cases:**
- [ ] Mentor can view mentee's profiler results
- [ ] Mentor sees aptitude_score, technical_exposure_score, track recommendation
- [ ] Mentor sees behavioral_profile and strengths
- [ ] Non-mentor cannot access mentee profiler results
- [ ] Coaching OS displays profiler data correctly

---

## 4️⃣ Portfolio & Assessment Engine Integration

### Requirement
**Stores first portfolio entry (Value Statement)**

### Current Status
- ✅ Value Statement is automatically created on profiler completion
- ✅ Stored in `PortfolioItem` table
- ✅ Type: `reflection`, Title: "My Value Statement"
- ✅ Extracted from Module 1 (Identity & Value) + Module 7 (Reflection)

### Tasks

#### ✅ Task 4.1: Verify portfolio entry creation
- [x] `complete_profiling()` creates portfolio entry
- [x] `create_value_statement_portfolio_entry()` in FastAPI service
- [x] Portfolio entry linked to user

#### ⚠️ Task 4.2: Verify portfolio entry is linked to profiler session
**Status:** 🟡 **NEEDS VERIFICATION**

**Action Required:**
- [ ] Check if `PortfolioItem` has field linking to `ProfilerSession`
- [ ] If not, add `profiler_session_id` field to `PortfolioItem` model
- [ ] Update creation logic to link portfolio entry to session

#### ⚠️ Task 4.3: Test portfolio entry creation with different responses
**Status:** 🔴 **NOT TESTED**

**Test Cases:**
- [ ] User with complete reflection → Value statement includes both parts
- [ ] User with partial reflection → Value statement includes available parts
- [ ] User with no reflection → Value statement includes identity insights only
- [ ] Portfolio entry is visible in user's portfolio
- [ ] Portfolio entry can be edited/updated by user

---

## 5️⃣ VIP Leadership Academy Integration

### Requirement
**Uses Value Statement as the seed of leadership identity**

### Current Status
- ⚠️ **MISSING**: API endpoint to retrieve Value Statement for leadership track
- ⚠️ **MISSING**: Leadership identity initialization using Value Statement
- ⚠️ **MISSING**: Integration with VIP Leadership Academy curriculum

### Tasks

#### ⚠️ Task 5.1: Create API endpoint to retrieve Value Statement
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
```python
# backend/django_app/profiler/views.py
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_value_statement(request):
    """
    GET /api/v1/profiler/value-statement
    Get user's Value Statement from portfolio for leadership identity seeding.
    """
    from dashboard.models import PortfolioItem
    
    value_statement_entry = PortfolioItem.objects.filter(
        user=request.user,
        item_type='reflection',
        title='My Value Statement'
    ).first()
    
    if not value_statement_entry:
        return Response({
            'value_statement': None,
            'message': 'Value statement not found. Please complete profiler first.'
        }, status=status.HTTP_404_NOT_FOUND)
    
    return Response({
        'value_statement': value_statement_entry.summary,
        'created_at': value_statement_entry.created_at.isoformat(),
        'profiler_session_id': value_statement_entry.profiler_session_id if hasattr(value_statement_entry, 'profiler_session_id') else None
    })
```

#### ⚠️ Task 5.2: Implement leadership identity initialization
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
- Check if VIP Leadership Academy curriculum exists
- Create service to initialize leadership identity from Value Statement
- Link Value Statement to leadership track enrollment

#### ⚠️ Task 5.3: Integrate with VIP Leadership Academy curriculum
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
- Check `backend/django_app/curriculum/management/commands/seed_leadership_curriculum.py`
- Ensure leadership curriculum references Value Statement
- Create onboarding flow that uses Value Statement

#### ⚠️ Task 5.4: Test leadership identity seeding
**Status:** 🔴 **NOT TESTED**

**Test Cases:**
- [ ] Leadership track user can retrieve Value Statement
- [ ] Value Statement is used in leadership onboarding
- [ ] Leadership identity is initialized from Value Statement
- [ ] Value Statement appears in leadership profile

---

## 6️⃣ Marketplace Integration

### Requirement
**Future: Track recommendation feeds talent matching**

### Current Status
- ✅ Marketplace exists (`backend/django_app/marketplace/`)
- ✅ Job matching exists (`job_matching.py`)
- ⚠️ **FUTURE**: Track recommendation integration not implemented
- ⚠️ **FUTURE**: Talent matching using profiler data

### Tasks

#### ⚠️ Task 6.1: Document future integration requirements
**Status:** 🟡 **IN PROGRESS**

**Action Required:**
- [x] Document requirement
- [ ] Create API design for track recommendation → talent matching
- [ ] Define data structure for matching algorithm

#### ⚠️ Task 6.2: Create placeholder API structure
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
```python
# backend/django_app/marketplace/views.py (FUTURE)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_talent_matches_by_track(request):
    """
    GET /api/v1/marketplace/talent-matches
    Future: Get job matches based on profiler track recommendation.
    """
    from profiler.models import ProfilerSession
    
    user = request.user
    profiler_session = ProfilerSession.objects.filter(
        user=user,
        status__in=['finished', 'locked']
    ).order_by('-completed_at').first()
    
    if not profiler_session or not profiler_session.recommended_track_id:
        return Response({
            'matches': [],
            'message': 'Complete profiler to get talent matches'
        })
    
    # FUTURE: Implement matching algorithm
    # - Match jobs by track_key
    # - Consider aptitude_score, technical_exposure_score
    # - Consider difficulty_selection for job level matching
    
    return Response({
        'recommended_track': str(profiler_session.recommended_track_id),
        'matches': [],  # Placeholder
        'message': 'Talent matching coming soon'
    })
```

#### ⚠️ Task 6.3: Design matching algorithm
**Status:** 🔴 **NOT STARTED**

**Action Required:**
- [ ] Define matching criteria (track, difficulty, skills)
- [ ] Design scoring algorithm
- [ ] Create database schema for matches
- [ ] Plan implementation timeline

---

## 7️⃣ Enterprise Dashboard Integration

### Requirement
**Cohort profiling visualized for companies**

### Current Status
- ✅ `get_cohort_profiler_analytics` endpoint exists
- ✅ `get_enterprise_profiler_analytics` endpoint exists
- ✅ RBAC permissions implemented
- ⚠️ **NEEDS VERIFICATION**: Frontend visualization
- ⚠️ **NEEDS VERIFICATION**: Data format matches frontend requirements

### Tasks

#### ✅ Task 7.1: Verify API endpoints exist
- [x] `GET /api/v1/profiler/cohorts/{cohort_id}/analytics` exists
- [x] `GET /api/v1/profiler/enterprises/{enterprise_id}/analytics` exists
- [x] Endpoints return comprehensive analytics data

#### ⚠️ Task 7.2: Verify frontend visualization
**Status:** 🟡 **NEEDS VERIFICATION**

**Files to Check:**
- `frontend/nextjs_app/app/dashboard/director/` - Director dashboard
- `frontend/nextjs_app/app/dashboard/admin/` - Admin dashboard

**Action Required:**
- [ ] Check if cohort analytics are displayed
- [ ] Check if enterprise analytics are displayed
- [ ] Verify charts/graphs use profiler data
- [ ] Test with actual enterprise account

#### ⚠️ Task 7.3: Verify data format for visualization
**Status:** 🟡 **NEEDS VERIFICATION**

**Action Required:**
- [ ] Check if analytics data format matches frontend expectations
- [ ] Verify cohort breakdown includes profiler metrics
- [ ] Verify enterprise breakdown includes profiler metrics
- [ ] Test data serialization

#### ⚠️ Task 7.4: Test enterprise dashboard access
**Status:** 🔴 **NOT TESTED**

**Test Cases:**
- [ ] Enterprise admin can access cohort analytics
- [ ] Director can access cohort analytics
- [ ] Cohort analytics show profiler completion rates
- [ ] Cohort analytics show track distribution
- [ ] Cohort analytics show score statistics
- [ ] Enterprise analytics aggregate cohort data correctly
- [ ] Non-admin cannot access enterprise analytics

---

## 8️⃣ Cross-Cutting Concerns

### Error Handling & Logging

#### ⚠️ Task 8.1: Add error handling for all integration points
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
- [ ] Add try-catch blocks for profiler data access
- [ ] Handle missing profiler data gracefully
- [ ] Log integration failures
- [ ] Return meaningful error messages

#### ⚠️ Task 8.2: Add logging for integration calls
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
- [ ] Log when profiler data is accessed
- [ ] Log when integrations fail
- [ ] Log performance metrics for integration calls

### Testing

#### ⚠️ Task 8.3: Create integration tests
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
- [ ] Test Missions Engine integration
- [ ] Test Recipe Engine integration
- [ ] Test Mentorship Layer integration
- [ ] Test Portfolio integration
- [ ] Test VIP Leadership Academy integration
- [ ] Test Enterprise Dashboard integration

### Documentation

#### ⚠️ Task 8.4: Document API contracts
**Status:** 🔴 **NOT IMPLEMENTED**

**Action Required:**
- [ ] Document data formats for each integration
- [ ] Document API endpoints
- [ ] Create integration guide for developers
- [ ] Document error codes and messages

---

## Summary

### Status Overview

| Integration Point | Status | Priority | Notes |
|------------------|--------|----------|-------|
| Missions Engine | 🔴 Not Implemented | High | Core functionality |
| Recipe Engine | 🔴 Not Implemented | High | Core functionality |
| Mentorship Layer | 🟡 Needs Verification | High | API exists, needs testing |
| Portfolio & Assessment | 🟡 Needs Verification | Medium | Creation works, linking needs check |
| VIP Leadership Academy | 🔴 Not Implemented | Medium | Future feature |
| Marketplace | 🔴 Not Implemented | Low | Future feature |
| Enterprise Dashboard | 🟡 Needs Verification | High | API exists, needs frontend check |

### Next Steps

1. **Immediate (High Priority):**
   - Implement Missions Engine difficulty mapping
   - Implement Recipe Engine gap analysis
   - Verify Mentorship Layer integration
   - Verify Enterprise Dashboard visualization

2. **Short Term (Medium Priority):**
   - Verify Portfolio entry linking
   - Implement VIP Leadership Academy integration
   - Add error handling and logging

3. **Long Term (Low Priority):**
   - Design Marketplace integration
   - Create comprehensive integration tests
   - Document all API contracts

---

## Files Modified/Created

### New Files Needed
- `backend/django_app/missions/services.py` - Difficulty mapping service
- `backend/django_app/recipes/services.py` - Gap analysis service
- `backend/django_app/profiler/integration_tests.py` - Integration tests

### Files to Modify
- `backend/django_app/missions/views_student.py` - Add profiler difficulty filtering
- `backend/django_app/missions/views_mxp.py` - Add profiler difficulty filtering
- `backend/django_app/recipes/views.py` - Add profiler-based recommendations
- `backend/django_app/profiler/views.py` - Add value statement endpoint
- `backend/django_app/dashboard/models.py` - Add profiler_session_id to PortfolioItem

---

## Testing Checklist

- [ ] Missions Engine: Difficulty filtering works
- [ ] Recipe Engine: Gap analysis works
- [ ] Recipe Engine: Recommendations match gaps
- [ ] Mentorship Layer: Mentors can view results
- [ ] Mentorship Layer: Coaching OS displays data
- [ ] Portfolio: Entry created and linked
- [ ] VIP Leadership: Value statement accessible
- [ ] Enterprise Dashboard: Analytics display correctly
- [ ] Error handling: Graceful failures
- [ ] Performance: Integration calls are fast

---

**Last Updated:** February 9, 2026
**Next Review:** After implementation of high-priority items
