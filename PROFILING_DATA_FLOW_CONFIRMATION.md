# Profiling Data Flow & Integration Confirmation

## ✅ Data Capture & Storage

### 1. **Question Responses Storage**
- **FastAPI Session**: All question responses are stored in `ProfilingSession.responses` (List[ProfilingResponse])
- **Each Response Contains**:
  - `question_id`: Unique identifier for the question
  - `selected_option`: User's answer value
  - `response_time_ms`: Time taken to answer (for anti-cheat analysis)

### 2. **Telemetry Data Collection**
The profiling system collects comprehensive telemetry:
- **Technical Exposure Score**: Calculated from technical_exposure module responses
- **Work Style Cluster**: Analyzed from work_style module responses
- **Scenario Choices**: All scenario_preference module responses
- **Difficulty Selection**: User's self-selected difficulty level
- **Track Alignment Percentages**: Scores for all 5 tracks (defender, offensive, innovation, leadership, grc)
- **Completion Status**: Session completion metadata

### 3. **Django User Profile Sync**
When profiling completes:
- **Endpoint**: `POST /api/v1/profiler/sync-fastapi`
- **Data Synced**:
  - `user.profiling_complete = True`
  - `user.profiling_completed_at = <timestamp>`
  - `user.profiling_session_id = <session_uuid>`
  - `user.track_key = <primary_track>` (from recommendation)
  - Track alignment percentages stored in `ProfilerSession.track_alignment_percentages`

### 4. **Portfolio Integration**
- **Value Statement**: Automatically created as first portfolio entry
- **Extracted from**: Identity/value module responses + reflection responses
- **Stored in**: Django Portfolio system via `/api/v1/portfolio/items/` endpoint

## ✅ Coaching OS Integration

### 1. **Profiling Data Access**
- Coaching system accesses profiling data via Django User model:
  - `user.profiling_complete` - Boolean flag
  - `user.profiling_session_id` - Links to ProfilerSession
  - `user.track_key` - Recommended track
  - `ProfilerSession.track_alignment_percentages` - Track scores

### 2. **Personalized Recommendations**
- **Endpoint**: `/api/users/:userId/coaching/recommendations?track_slug=<track>`
- **Uses**:
  - User's recommended track from profiler
  - Track alignment percentages
  - User progress data
  - Weak areas identified from profiling

### 3. **Coaching Session Guidance**
- Coaching OS uses profiling data to:
  - Suggest focus areas based on track alignment
  - Recommend learning paths aligned with user's profile
  - Provide personalized feedback based on strengths/weaknesses

## ✅ Recipe System Integration

### 1. **Gap Analysis from Profiler**
- **Function**: `analyze_gaps_from_profiler(user)` in `recipes/services.py`
- **Accesses**:
  - User's `ProfilerSession` via `user.profiling_session_id`
  - Track alignment percentages
  - Technical exposure score
  - Work style cluster
  - Difficulty selection

### 2. **Recipe Recommendations**
- **Endpoint**: `GET /api/v1/recipes/profiler-recommendations`
- **Process**:
  1. Verifies profiler accessibility (`verify_profiler_accessibility`)
  2. Analyzes gaps from profiler data
  3. Maps gaps to recipe skill codes
  4. Returns recipes matching recommended skills
  5. Orders by usage_count and avg_rating

### 3. **Skill-Based Matching**
- Recipes are filtered by `skill_codes` that match profiler-identified gaps
- Only active recipes (`is_active=True`) are returned
- Top 10 recipes returned based on popularity and ratings

## ✅ Data Flow Diagram

```
User Completes Profiling
    ↓
FastAPI: ProfilingSession.responses stored
    ↓
FastAPI: Telemetry calculated (scores, clusters, choices)
    ↓
FastAPI: Track recommendations generated
    ↓
Frontend: Calls /api/v1/profiler/sync-fastapi
    ↓
Django: Updates User.profiling_complete = True
Django: Stores track_key, session_id, alignment percentages
Django: Creates ProfilerSession with telemetry
    ↓
Portfolio: Value Statement created automatically
    ↓
Coaching OS: Accesses profiling data for recommendations
    ↓
Recipe System: Analyzes gaps, recommends recipes
```

## ✅ Verification Checklist

- [x] Question responses stored in FastAPI session
- [x] Telemetry data calculated and stored
- [x] Django user profile updated on completion
- [x] Track recommendation synced to user.track_key
- [x] Portfolio entry (Value Statement) created
- [x] Coaching OS can access profiling data
- [x] Recipe system analyzes gaps from profiler
- [x] Personalized recommendations generated

## ✅ API Endpoints Used

1. **FastAPI**:
   - `POST /api/v1/profiling/enhanced/session/{session_id}/complete` - Complete profiling
   - `GET /api/v1/profiling/enhanced/session/{session_id}/blueprint` - Get blueprint

2. **Django**:
   - `POST /api/v1/profiler/sync-fastapi` - Sync completion to Django
   - `GET /api/v1/recipes/profiler-recommendations` - Get recipe recommendations
   - `POST /api/v1/portfolio/items/` - Create portfolio entry

3. **Coaching**:
   - `GET /api/users/:userId/coaching/recommendations` - Get coaching recommendations

## ✅ Data Persistence

All profiling data is persisted:
- **FastAPI**: In-memory sessions (should be moved to Redis/DB in production)
- **Django**: 
  - `users` table: profiling flags and track_key
  - `profilersessions` table: full session data and telemetry
  - `portfolio_items` table: Value Statement entry

## ✅ Next Steps for Production

1. **Move FastAPI sessions to Redis/Database** for persistence
2. **Add background job** to sync FastAPI → Django periodically
3. **Enhance recipe matching** with more sophisticated gap analysis
4. **Add coaching session integration** with real-time profiling data access
5. **Implement analytics** to track profiling → recipe → coaching effectiveness
