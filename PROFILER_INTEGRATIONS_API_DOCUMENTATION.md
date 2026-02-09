# Profiler Integrations API Documentation

## Date: February 9, 2026
## Status: ✅ COMPLETE

---

## API Contracts and Data Formats

This document provides complete API contracts for all profiler integration endpoints.

---

## 1. Missions Engine Integration

### Get User's Max Mission Difficulty

**Internal Function:** `missions.services.get_max_mission_difficulty_for_user(user)`

**Returns:** `int` (1-5)

**Mapping:**
- `novice` → 1 (Beginner)
- `beginner` → 1 (Beginner)
- `intermediate` → 2 (Intermediate)
- `advanced` → 3 (Advanced)
- `elite` → 4 (Expert)

**Error Handling:**
- Returns 1 (Beginner) if profiler not completed
- Logs warnings on errors

---

## 2. Recipe Engine Integration

### GET /api/v1/recipes/profiler-recommendations

**Authentication:** Required

**Request:**
```http
GET /api/v1/recipes/profiler-recommendations
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "gaps_analysis": {
    "gaps": [
      {
        "category": "networking",
        "type": "aptitude",
        "score": 45.5,
        "priority": "high"
      },
      {
        "category": "technical_exposure",
        "type": "technical",
        "score": 55.0,
        "priority": "medium"
      }
    ],
    "recommended_recipe_skills": ["NET", "NETW", "TCPIP", "TECH", "BASICS"],
    "aptitude_score": 72.5,
    "technical_exposure_score": 55.0
  },
  "recommended_recipes": [
    {
      "id": "uuid",
      "slug": "networking-basics",
      "title": "Networking Basics",
      "difficulty": "beginner",
      "estimated_minutes": 30,
      "skill_codes": ["NET", "NETW"]
    }
  ],
  "total_gaps": 2,
  "total_skills": 5,
  "profiler_status": {
    "accessible": true,
    "session_id": "uuid",
    "has_scores": true,
    "has_breakdown": true,
    "message": "Profiler results accessible"
  }
}
```

**Response (200 OK - No Profiler):**
```json
{
  "gaps_analysis": {
    "gaps": [],
    "recommended_recipe_skills": []
  },
  "recommended_recipes": [],
  "total_gaps": 0,
  "total_skills": 0,
  "profiler_status": {
    "accessible": false,
    "session_id": null,
    "has_scores": false,
    "has_breakdown": false,
    "message": "No profiler session found"
  },
  "message": "Complete profiler to get personalized recipe recommendations"
}
```

**Error Response (500):**
```json
{
  "error": "Failed to get recipe recommendations",
  "message": "Error details"
}
```

---

## 3. Mentorship Layer Integration

### GET /api/v1/profiler/mentees/{mentee_id}/results

**Authentication:** Required (Mentor/Coach/Admin)

**Request:**
```http
GET /api/v1/profiler/mentees/{mentee_id}/results
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "mentee_id": 123,
  "mentee_email": "mentee@example.com",
  "mentee_name": "John Doe",
  "session_id": "uuid",
  "completed_at": "2026-02-09T12:00:00Z",
  "is_locked": true,
  "scores": {
    "overall": 85.5,
    "aptitude": 82.3,
    "behavioral": 88.7
  },
  "recommended_track": {
    "track_id": "uuid",
    "confidence": 0.92
  },
  "strengths": ["analytical thinking", "problem solving"],
  "areas_for_growth": ["networking", "documentation"],
  "behavioral_profile": {
    "traits": {...},
    "strengths": [...],
    "areas_for_growth": [...]
  },
  "future_you_persona": {
    "name": "Cyber Sentinel",
    "archetype": "Defender"
  },
  "aptitude_breakdown": {
    "networking": 75.0,
    "security": 85.0
  },
  "recommended_tracks": [...],
  "learning_path_suggestions": [...],
  "och_mapping": {...},
  "enhanced_results": {...},
  "anti_cheat": {
    "score": 15.5,
    "suspicious_patterns": [],
    "device_fingerprint": "..."
  }
}
```

**Error Responses:**
- `403 Forbidden`: Permission denied
- `404 Not Found`: Mentee or profiler session not found

---

## 4. Portfolio & Assessment Engine Integration

### Portfolio Entry Creation (Automatic)

**Trigger:** Profiler completion

**Created Entry:**
```json
{
  "title": "My Value Statement",
  "item_type": "reflection",
  "status": "approved",
  "visibility": "private",
  "profiler_session_id": "uuid",
  "summary": "I am drawn to cybersecurity because: ... My goal is: ..."
}
```

---

## 5. VIP Leadership Academy Integration

### GET /api/v1/profiler/value-statement

**Authentication:** Required

**Request:**
```http
GET /api/v1/profiler/value-statement
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "value_statement": "I am drawn to cybersecurity because: ... My goal is: ...",
  "created_at": "2026-02-09T12:00:00Z",
  "profiler_session_id": "uuid",
  "status": "approved",
  "visibility": "private"
}
```

**Response (404 Not Found):**
```json
{
  "value_statement": null,
  "message": "Value statement not found. Please complete profiler first."
}
```

---

## 6. Marketplace Integration (Future)

### GET /api/v1/marketplace/talent-matches/profiler

**Authentication:** Required

**Request:**
```http
GET /api/v1/marketplace/talent-matches/profiler
Authorization: Bearer <token>
```

**Response (200 OK - Profiler Complete):**
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

**Response (200 OK - No Profiler):**
```json
{
  "matches": [],
  "message": "Complete profiler to get talent matches",
  "profiler_complete": false
}
```

**Future Implementation:**
- Track alignment matching
- Skill-based matching
- Difficulty level matching
- Behavioral fit scoring

---

## 7. Enterprise Dashboard Integration

### GET /api/v1/profiler/admin/cohorts/{cohort_id}/analytics

**Authentication:** Required (Admin/Director)

**Request:**
```http
GET /api/v1/profiler/admin/cohorts/{cohort_id}/analytics
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "cohort_id": "uuid",
  "cohort_name": "Cohort 2026",
  "total_students": 50,
  "profiled_students": 45,
  "profiled_percentage": 90.0,
  "not_profiled_count": 5,
  "score_statistics": {
    "average_aptitude": 78.5,
    "average_overall": 82.3,
    "min_aptitude": 45.0,
    "max_aptitude": 95.0,
    "min_overall": 50.0,
    "max_overall": 98.0
  },
  "track_distribution": {
    "defender": 15,
    "offensive": 12,
    "grc": 8,
    "innovation": 6,
    "leadership": 4
  },
  "top_strengths": [
    {"strength": "analytical thinking", "count": 30},
    {"strength": "problem solving", "count": 25}
  ],
  "students": [...]
}
```

### GET /api/v1/profiler/admin/enterprise/analytics

**Authentication:** Required (Admin)

**Request:**
```http
GET /api/v1/profiler/admin/enterprise/analytics?sponsor_id={sponsor_id}&cohort_id={cohort_id}&date_from={date}&date_to={date}
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "sponsor_id": "uuid",
  "cohort_id": "uuid",
  "date_range": {
    "from": "2026-01-01",
    "to": "2026-02-09"
  },
  "total_employees": 200,
  "profiled_employees": 180,
  "profiled_percentage": 90.0,
  "score_statistics": {...},
  "track_distribution": {...},
  "cohort_breakdown": {...},
  "readiness_distribution": {
    "novice": 10,
    "beginner": 50,
    "intermediate": 80,
    "advanced": 40
  }
}
```

**Error Responses:**
- `403 Forbidden`: Not admin/director
- `404 Not Found`: Cohort/enterprise not found

---

## Error Handling Standards

All endpoints follow these error handling patterns:

1. **Logging:**
   - Info: Normal operations
   - Warning: Recoverable errors
   - Error: Critical failures with `exc_info=True`

2. **Error Responses:**
   - `400 Bad Request`: Invalid input
   - `403 Forbidden`: Permission denied
   - `404 Not Found`: Resource not found
   - `500 Internal Server Error`: Server error

3. **Graceful Degradation:**
   - Missing profiler data → Return empty/default results
   - Integration failures → Log and continue with fallback

---

## Data Formats

### Profiler Difficulty Selection
- Values: `novice`, `beginner`, `intermediate`, `advanced`, `elite`
- Type: `string`

### Mission Difficulty
- Values: `1`, `2`, `3`, `4`, `5`
- Type: `integer`
- Mapping: See Missions Engine Integration section

### Skill Codes
- Format: Array of strings
- Examples: `["NET", "SEC", "PYTHON"]`
- Type: `List[str]`

### Scores
- Range: `0.0` to `100.0`
- Type: `Decimal` (backend), `float` (API)
- Precision: 2 decimal places

### Track IDs
- Format: UUID string
- Type: `string` (UUID)

---

## Rate Limiting

- All endpoints: Standard API rate limits apply
- Profiler endpoints: No special rate limiting
- Analytics endpoints: Cached for 5 minutes

---

## Versioning

- Current version: `v1`
- Base path: `/api/v1/`
- Future versions: `/api/v2/`

---

**Last Updated:** February 9, 2026
