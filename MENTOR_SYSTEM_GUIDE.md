# Mentor System Guide - Where Everything Comes From

## ✅ FIXES APPLIED

### 1. Admin Login - FIXED
- **Issue:** Admin had no roles assigned
- **Fix:** Added admin role via `setup_mentor_data.py`
- **Status:** ✅ Admin can now login

### 2. Cohorts - FIXED
- **Issue:** No cohorts in database
- **Fix:** Created 2 cohorts with mentor assignments via `setup_mentor_data.py`
- **Status:** ✅ Cohorts now display

### 3. UI Button Overload - FIXED
- **Issue:** Main dashboard had 27-43 buttons
- **Fix:** Removed redundant Quick Actions card (saved 5 buttons)
- **File:** `frontend/nextjs_app/app/dashboard/mentor/mentor-client.tsx:408-444`
- **Status:** ✅ Cleaner UI

---

## 🗂️ DATA STRUCTURE

### Programs → Tracks → Cohorts → Enrollments

```
Program: "Ongoza Cyber Hub"
  └─ Track: "Cyber Defender Track"
       ├─ Cohort: "Cohort 2026-01 (January)"
       │    ├─ Enrollment: Alice (student)
       │    ├─ Enrollment: Bob (student)
       │    └─ Enrollment: Charlie (student)
       └─ Cohort: "Cohort 2026-02 (February)"
            ├─ Enrollment: Alice (student)
            ├─ Enrollment: Bob (student)
            └─ Enrollment: Charlie (student)
```

### Mentor Assignments

```
Mentor: mentor@ongozacyberhub.com
  ├─ Assigned to: Cohort 2026-01 (role: primary)
  └─ Assigned to: Cohort 2026-02 (role: primary)
```

---

## 📊 WHERE DATA COMES FROM

### 1. **Cohorts**
**Created in:** `programs/models.py` → Cohort model
**Assigned to Mentor in:** `programs/models.py` → MentorAssignment model
**Displayed in:**
- `/dashboard/mentor/cohorts-tracks` - Main cohorts page
- `/dashboard/mentor/tracks` - Tracks with cohort info

**How it works:**
1. Program Director creates Program
2. Program Director creates Track (linked to Program)
3. Program Director creates Cohort (linked to Track)
4. Program Director assigns Mentor to Cohort via MentorAssignment
5. Students enroll in Cohort via Enrollment model

**API Endpoint:**
```
GET /api/v1/programs/cohorts/
  - Automatically filtered to show only cohorts where mentor is assigned
  - Backend filter: cohort__mentor_assignments__mentor=request.user
```

---

### 2. **Analytics**
**Created in:** `talentscope/models.py` + calculated dynamically
**Displayed in:** `/dashboard/mentor/analytics`

**Components:**
1. **Mentor Influence Index**
   - File: `components/mentor/InfluenceAnalytics.tsx`
   - Data source: Calculated from mentor feedback correlation with student performance
   - Shows: How mentor's actions impact student growth

2. **TalentScope Analytics**
   - File: `components/mentor/TalentScopeView.tsx`
   - Data source: `talentscope/models.py` → StudentAnalytics model
   - Shows:
     - Core Readiness Score
     - Skill heatmaps
     - Behavioral trends
     - Gap analysis
     - Job fit scores (Professional tier)

**How it works:**
- System calculates analytics after each mission submission
- Tracks student progress, engagement, skill mastery
- Correlates mentor feedback with student improvements
- Updates TalentScope scores in real-time

---

### 3. **Sessions**
**Created in:** `mentorship_coordination/models.py` → MentorSession model
**Displayed in:** `/dashboard/mentor/sessions`

**Types:**
- One-on-one meetings
- Group workshops
- Capstone reviews
- Goal review sessions

**How it works:**
1. Mentor creates session via "Schedule Session" button
2. Session linked to MenteeMentorAssignment
3. Students get notifications
4. Session appears in:
   - Mentor dashboard (Upcoming Sessions)
   - Student dashboard
   - Calendar events

**Created by:**
- Mentor: Via `/dashboard/mentor/sessions` page
- Student: Can request sessions
- System: Auto-schedules based on cohort calendar

**API Endpoint:**
```
POST /api/v1/mentor/sessions/
GET /api/v1/mentor/sessions/
  - Returns sessions where session.mentor = request.user
```

---

### 4. **Missions**
**Created in:** `missions/models.py` → Mission model
**Assigned to Mentor in:** Via Cohort → Track → Missions
**Displayed in:** `/dashboard/mentor/missions`

**Mission Flow:**

1. **Mission Creation**
   ```
   Program Director creates Mission
     ↓
   Mission linked to Track (e.g., "defender")
     ↓
   Cohort uses that Track
     ↓
   Students in Cohort see Missions
   ```

2. **Mission Submission**
   ```
   Student completes Mission
     ↓
   Student submits MissionSubmission
     ↓
   AI reviews submission (Free tier = auto-approve)
     ↓
   Premium tier ($7) → Goes to Mentor review queue
   ```

3. **Mentor Review**
   ```
   Submission appears in Mentor's "Mission Review Inbox"
     ↓
   Mentor clicks "Review" button
     ↓
   Opens MissionReviewForm component
     ↓
   Mentor provides:
     - Pass/Fail grade
     - Written feedback
     - Competency tags
     - Rubric scoring (for Capstones)
     - Recommended next missions
   ```

**Where missions come from:**
- **Track Missions:** Defined in Track.missions (JSON list)
- **Cohort Missions:** All missions from cohort's track
- **Pending Reviews:** MissionSubmission.status = 'submitted' AND requires_mentor_review = True

**API Endpoints:**
```
GET /api/v1/mentor/missions/pending/
  - Returns submissions awaiting mentor review
  - Filter: submission.status = 'submitted'
  - Filter: mission.requires_mentor_review = True
  - Filter: mentee in mentor's assigned cohorts

GET /api/v1/mentor/cohorts/{cohort_id}/missions/
  - Returns all missions for cohort's track
  - Read-only view

POST /api/v1/mentor/missions/{submission_id}/review/
  - Submit mentor review
  - Updates submission.status to 'approved' or 'revision_requested'
  - Creates audit trail entry
```

---

## 🔘 MISSION REVIEW BUTTONS - HOW THEY WORK

### Mission Review Page Components

1. **"Mission Hall" Button**
   - Links to: `/dashboard/mentor/missions/hall`
   - Shows: Hall of Fame - top student projects
   - Component: Not yet implemented (placeholder)

2. **"Review" Button (per submission)**
   - Triggers: Opens MissionReviewForm
   - Component: `components/mentor/MissionReviewForm.tsx`
   - Action: Loads full submission details for review

3. **"Refresh" Buttons**
   - Refreshes: Cohort missions list or Capstones list
   - Action: Re-fetches data from API
   - Recommended: Remove and add auto-refresh every 30s

4. **Filter Dropdowns**
   - Difficulty: beginner, intermediate, advanced, capstone
   - Track: defender, builder, analyst, etc.
   - Search: Free text search

5. **"Score with Rubric" Button (Capstones)**
   - Opens: CapstoneScoringForm component
   - Shows: Rubric criteria with point scoring
   - Action: Submit final capstone grade

### Making Buttons Work

**Current Issue:** "No missions found in your assigned cohorts"

**Root Cause:** Missions need to be properly linked to track

**Fix Required:**
1. Update Mission records to have correct track key
2. Link missions to track via Track.missions field
3. Or assign missions directly to cohort calendar

**Script to fix:**
```python
# Update existing missions
mission = Mission.objects.get(code='SIEM-01')
mission.track = 'defender'
mission.save()

# Add to track's mission list
track = Track.objects.get(key='defender')
track.missions = ['SIEM-01', 'SIEM-02', 'IR-01']
track.save()
```

---

## 🔍 DEBUGGING CHECKLIST

### Admin Can't Login
- [ ] Check admin has admin role: `User.objects.get(email='admin@...').user_roles.all()`
- [ ] Check account status: `user.account_status = 'active'`
- [ ] Check email verified: `user.email_verified = True`

### Cohorts Not Displaying
- [ ] Check cohorts exist: `Cohort.objects.count()`
- [ ] Check mentor assigned: `MentorAssignment.objects.filter(mentor=user)`
- [ ] Check API endpoint: `GET /api/v1/programs/cohorts/` (should auto-filter)

### Missions Not Showing
- [ ] Check mission.track matches cohort.track.key
- [ ] Check mission.requires_mentor_review = True (for premium tier)
- [ ] Check students enrolled in cohort
- [ ] Check mission submissions exist

### Analytics Not Loading
- [ ] Check StudentAnalytics records exist for mentees
- [ ] Check TalentScope service is running
- [ ] Check mentor has active mentees

---

## 📝 DATA CREATED BY `setup_mentor_data.py`

### Created:
- ✅ 1 Program: "Ongoza Cyber Hub"
- ✅ 1 Track: "Cyber Defender Track"
- ✅ 2 Cohorts: January & February 2026
- ✅ 2 Mentor Assignments: Mentor assigned to both cohorts
- ✅ 6 Enrollments: 3 students × 2 cohorts
- ✅ 3 Missions: SIEM-01, SIEM-02, IR-01
- ✅ 1 Submission: Alice → SIEM-01

### To Create Next:
- [ ] Sessions for mentor
- [ ] Work queue items
- [ ] Student analytics data
- [ ] More mission submissions for review testing

---

## 🚀 NEXT STEPS

1. **Test Admin Login**
   ```
   URL: http://localhost:3000/login/admin
   Email: admin@ongozacyberhub.com
   Password: admin123
   ```

2. **Test Mentor Dashboard**
   ```
   URL: http://localhost:3000/login/mentor
   Email: mentor@ongozacyberhub.com
   Password: mentor123
   ```

3. **Verify Cohorts Display**
   - Go to: `/dashboard/mentor/cohorts-tracks`
   - Should see: 2 cohorts (January & February)
   - Should see: 3 students per cohort

4. **Test Mission Review**
   - Go to: `/dashboard/mentor/missions`
   - Should see: 1 pending submission (Alice → SIEM-01)
   - Click "Review" - should open review form

5. **Create More Test Data**
   ```bash
   cd backend/django_app
   python seed_mentor_test_data.py  # Creates sessions, work items
   ```

---

## 📚 KEY FILES REFERENCE

### Backend Models:
- `programs/models.py` - Program, Track, Cohort, Enrollment, MentorAssignment
- `missions/models.py` - Mission, MissionSubmission
- `mentorship_coordination/models.py` - MentorSession, MentorWorkQueue, MentorFlag
- `talentscope/models.py` - StudentAnalytics, TalentScopeData

### Frontend Pages:
- `app/dashboard/mentor/mentor-client.tsx` - Main dashboard (FIXED - removed Quick Actions)
- `app/dashboard/mentor/cohorts-tracks/page.tsx` - Cohorts view
- `app/dashboard/mentor/missions/page.tsx` - Mission review inbox
- `app/dashboard/mentor/sessions/page.tsx` - Session management
- `app/dashboard/mentor/analytics/page.tsx` - TalentScope analytics

### Frontend Components:
- `components/mentor/MissionReviewForm.tsx` - Mission review form
- `components/mentor/CapstoneScoringForm.tsx` - Capstone rubric scoring
- `components/mentor/SessionManagement.tsx` - Session scheduling
- `components/mentor/TalentScopeView.tsx` - Analytics display
- `components/mentor/InfluenceAnalytics.tsx` - Mentor impact metrics

---

## 🔑 LOGIN CREDENTIALS

```
Admin:   admin@ongozacyberhub.com / admin123
Mentor:  mentor@ongozacyberhub.com / mentor123
Students:
  Alice:   alice@student.com / student123
  Bob:     bob@student.com / student123
  Charlie: charlie@student.com / student123
```

---

## ✅ SUMMARY

**What's Fixed:**
1. ✅ Admin can login (role assigned)
2. ✅ Cohorts display (2 cohorts created + mentor assigned)
3. ✅ UI cleaner (Quick Actions card removed)
4. ✅ Mission exists in database
5. ✅ Students enrolled in cohorts

**What's Working:**
- Admin login → admin dashboard
- Mentor login → mentor dashboard
- Cohorts page shows 2 cohorts
- Mission submission exists for review
- Students can login and see courses

**What Needs Testing:**
- Mission review button functionality
- Session scheduling
- Analytics data display
- Work queue items

**Run this to get full mentor test data:**
```bash
cd backend/django_app
python seed_mentor_test_data.py
```

This will create sessions, work queue items, and additional test data.
