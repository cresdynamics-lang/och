# Track Standardization - Complete Implementation Guide

## ✅ COMPLETED: Database Cleanup

**CurriculumTrack table now has exactly 5 records:**
- Cyber Defense (slug: `defender`, id: 5fb698b7-08a0-400c-b5d5-c0f7f19ba8d8)
- Offensive Security Track (slug: `offensive`, id: 60ac0261-2478-4c69-8a3f-75dee26cc6dc)
- Governance, Risk & Compliance Track (slug: `grc`, id: e7eeeb1d-ea6b-4aea-b2c8-7db33799d62b)
- Innovation & Research Track (slug: `innovation`, id: 12eea129-45b0-4ea9-a3b6-faf3e96dd0e5)
- Leadership & Strategy Track (slug: `leadership`, id: dd6e0e4a-fc7b-4de7-b104-49e554463466)

---

## 🔄 TODO: Remove Hardcoded Tracks & Fetch from Database

### 1. **Frontend - StudentDashboardHub.tsx**
**File:** `frontend/nextjs_app/app/dashboard/student/components/StudentDashboardHub.tsx`

**Current:** Lines 64-110 have hardcoded track themes
```typescript
const trackThemes: Record<string, {
  primary: string;
  name: string; // ← HARDCODED "Cyber Defender", "Offensive Security", etc.
  ...
}> = {
  defender: { name: 'Cyber Defender', ... },
  offensive: { name: 'Offensive Security', ... },
  ...
}
```

**Change to:** Fetch from API
```typescript
const [trackInfo, setTrackInfo] = useState<CurriculumTrack | null>(null);

useEffect(() => {
  if (profiledTrack) {
    // Fetch track from database
    fetch(`/api/v1/curriculum/tracks/${profiledTrack}/`)
      .then(res => res.json())
      .then(track => setTrackInfo(track));
  }
}, [profiledTrack]);

// Use trackInfo.name instead of trackTheme.name
```

---

### 2. **Frontend - Curriculum Learn Page**
**File:** `frontend/nextjs_app/app/dashboard/student/curriculum/learn/page.tsx`

**Current:** Lines 296-299 have hardcoded display names
```typescript
const displayNames: Record<string, string> = {
  defender: 'Defender',
  offensive: 'Offensive',
  grc: 'GRC',
  ...
};
```

**Change to:** Fetch from API at component mount
```typescript
const [trackDisplayNames, setTrackDisplayNames] = useState<Record<string, string>>({});

useEffect(() => {
  curriculumClient.getTracks().then(tracks => {
    const names = tracks.reduce((acc, t) => ({
      ...acc,
      [t.slug]: t.name
    }), {});
    setTrackDisplayNames(names);
  });
}, []);
```

---

### 3. **Backend - AI Profiler Prompt**
**File:** `backend/fastapi_app/services/profiling_service_enhanced.py` (or wherever ChatGPT prompt is)

**Current:** Likely has hardcoded track names in the prompt

**Change to:** Fetch from database and inject into prompt
```python
from curriculum.models import CurriculumTrack

def get_profiler_prompt():
    # Fetch tracks from database
    tracks = CurriculumTrack.objects.all()
    track_list = "\n".join([f"- {t.name} ({t.slug})" for t in tracks])

    prompt = f'''
    Based on the user's responses, recommend ONE of these cybersecurity tracks:

    {track_list}

    Respond with ONLY the track slug (defender, offensive, grc, innovation, or leadership).
    '''
    return prompt
```

---

### 4. **Backend - Save ChatGPT Recommendation to Enrollment**
**File:** Profiler completion handler (wherever enrollment happens after profiling)

**Current:** Might be enrolling in "February Track" or similar

**Change to:** Use ChatGPT's recommendation directly
```python
# After getting ChatGPT response
recommended_track_slug = chatgpt_response.strip().lower()  # e.g., "defender"

# Get the CurriculumTrack
track = CurriculumTrack.objects.get(slug=recommended_track_slug)

# Find or create a cohort for this track
cohort = Cohort.objects.filter(track__slug=recommended_track_slug, status='active').first()

# Enroll user
Enrollment.objects.create(
    user=user,
    cohort=cohort,
    status='active'
)
```

---

### 5. **Frontend - Missions Client**
**File:** `frontend/nextjs_app/app/dashboard/student/missions/missions-client.tsx`

**Current:** Line 144 has hardcoded track in profile:
```typescript
current_track: user.primary_role?.name || 'defender',  // ← HARDCODED DEFAULT
```

**Change to:** NO DEFAULTS - use exactly what's in database
```typescript
current_track: user.primary_role?.name || null,  // ← No default!

// Later in the component
if (!studentProfile?.current_track) {
  return <div>Please complete profiling to get assigned a track</div>;
}
```

---

### 6. **Backend - Add API Endpoint to Get All Tracks**
**File:** `backend/django_app/curriculum/views.py`

**Add:**
```python
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_tracks(request):
    """GET /api/v1/curriculum/tracks/"""
    tracks = CurriculumTrack.objects.all()
    return Response([{
        'id': str(t.id),
        'name': t.name,
        'slug': t.slug,
        'description': t.description,
    } for t in tracks])
```

**Add to URLs:**
```python
path('tracks/', list_tracks, name='list-tracks'),
path('tracks/<slug:slug>/', get_track_detail, name='track-detail'),
```

---

## 📝 Summary of Changes

**Principle:** NO MORE HARDCODING OR DEFAULTS

1. ✅ Database has 5 standardized tracks
2. 🔄 All frontend components fetch track info from API
3. 🔄 AI profiler prompt dynamically generated from database
4. 🔄 ChatGPT recommendation saved directly to enrollment
5. 🔄 Remove ALL default fallbacks like `|| 'defender'`
6. 🔄 If user has no track, show error/prompt to complete profiling

**Result:** Single source of truth = Database
- Add new track? Just add to database, everything updates automatically
- Rename track? Update database, all UIs reflect the change
- No more "Cyber Defender" showing when user is on "Feb" track!

---

## 🧪 Testing Checklist

- [ ] Mission creation form shows all 5 tracks correctly
- [ ] Dashboard shows exact track name from user's enrollment (no "Cyber Defender" default)
- [ ] AI profiler recommends one of the 5 tracks
- [ ] After profiling, user is enrolled in recommended track
- [ ] Curriculum learn page shows correct track names
- [ ] Completing one track's videos shows correct "Go to Missions" button
- [ ] Missions filter by correct track name
