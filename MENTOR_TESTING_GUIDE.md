# Mentor Role Testing Guide

Complete guide to test all mentor functionality end-to-end.

---

## Step 1: Create Test Users

### A. Create Additional Students (Mentees)

Run this script to create 3 test students:

```bash
cd backend/django_app
python manage.py shell
```

```python
from users.models import User, Role, UserRole

# Create 3 student users
students_data = [
    {
        'email': 'alice@student.com',
        'username': 'alice',
        'first_name': 'Alice',
        'last_name': 'Johnson',
        'password': 'student123'
    },
    {
        'email': 'bob@student.com',
        'username': 'bob',
        'first_name': 'Bob',
        'last_name': 'Smith',
        'password': 'student123'
    },
    {
        'email': 'charlie@student.com',
        'username': 'charlie',
        'first_name': 'Charlie',
        'last_name': 'Davis',
        'password': 'student123'
    },
]

student_role = Role.objects.get(name='student')

for student_data in students_data:
    password = student_data.pop('password')
    user, created = User.objects.get_or_create(
        email=student_data['email'],
        defaults={
            **student_data,
            'is_active': True,
            'email_verified': True,
            'account_status': 'active'
        }
    )
    if created:
        user.set_password(password)
        user.save()

        # Assign student role
        UserRole.objects.get_or_create(
            user=user,
            role=student_role,
            defaults={'scope': 'global', 'is_active': True}
        )
        print(f'[OK] Created student: {user.email}')
    else:
        print(f'[SKIP] Student already exists: {user.email}')

print('\n=== Test Users Created ===')
print('Alice: alice@student.com / student123')
print('Bob: bob@student.com / student123')
print('Charlie: charlie@student.com / student123')
```

---

## Step 2: Create Mentor-Mentee Assignments

Assign the 3 students to our mentor:

```python
from mentorship_coordination.models import MenteeMentorAssignment
from users.models import User
from django.utils import timezone

mentor = User.objects.get(email='mentor@ongozacyberhub.com')
alice = User.objects.get(email='alice@student.com')
bob = User.objects.get(email='bob@student.com')
charlie = User.objects.get(email='charlie@student.com')

# Create assignments
assignments = [
    {'mentee': alice, 'mentor': mentor, 'cohort_id': 'cohort-2026-01'},
    {'mentee': bob, 'mentor': mentor, 'cohort_id': 'cohort-2026-01'},
    {'mentee': charlie, 'mentor': mentor, 'cohort_id': 'cohort-2026-01'},
]

for assignment_data in assignments:
    assignment, created = MenteeMentorAssignment.objects.get_or_create(
        mentee=assignment_data['mentee'],
        mentor=assignment_data['mentor'],
        defaults={
            'cohort_id': assignment_data['cohort_id'],
            'status': 'active',
            'max_sessions': 12,
            'sessions_used': 0
        }
    )
    if created:
        print(f'[OK] Assigned {assignment.mentee.email} to {assignment.mentor.email}')
    else:
        print(f'[SKIP] Assignment already exists: {assignment.mentee.email}')

print(f'\n[OK] Mentor has {MenteeMentorAssignment.objects.filter(mentor=mentor, status="active").count()} active mentees')
```

---

## Step 3: Create Test Sessions

Create upcoming and past sessions:

```python
from mentorship_coordination.models import MentorSession, MenteeMentorAssignment, SessionAttendance
from django.utils import timezone
from datetime import timedelta

mentor = User.objects.get(email='mentor@ongozacyberhub.com')
alice = User.objects.get(email='alice@student.com')
bob = User.objects.get(email='bob@student.com')
charlie = User.objects.get(email='charlie@student.com')

# Get assignments
assignment_alice = MenteeMentorAssignment.objects.get(mentor=mentor, mentee=alice)
assignment_bob = MenteeMentorAssignment.objects.get(mentor=mentor, mentee=bob)

now = timezone.now()

# Session 1: Today's session (upcoming in 2 hours)
session1 = MentorSession.objects.create(
    assignment=assignment_alice,
    mentee=alice,
    mentor=mentor,
    title='Career Planning Discussion',
    type='one_on_one',
    start_time=now + timedelta(hours=2),
    end_time=now + timedelta(hours=3),
    zoom_url='https://zoom.us/j/123456789',
    notes='Discuss career goals and job search strategy'
)
print(f'[OK] Created upcoming session: {session1.title}')

# Session 2: Group session tomorrow
session2 = MentorSession.objects.create(
    assignment=assignment_bob,
    mentee=bob,
    mentor=mentor,
    title='Security Best Practices Workshop',
    type='group',
    start_time=now + timedelta(days=1, hours=14),
    end_time=now + timedelta(days=1, hours=16),
    zoom_url='https://zoom.us/j/987654321',
    notes='Group session on security fundamentals'
)
# Add multiple attendees for group session
for student in [alice, bob, charlie]:
    SessionAttendance.objects.create(
        session=session2,
        mentee=student,
        attended=False
    )
print(f'[OK] Created group session: {session2.title} with 3 attendees')

# Session 3: Past completed session
session3 = MentorSession.objects.create(
    assignment=assignment_alice,
    mentee=alice,
    mentor=mentor,
    title='Resume Review',
    type='one_on_one',
    start_time=now - timedelta(days=2),
    end_time=now - timedelta(days=2, hours=-1),
    zoom_url='https://zoom.us/j/111222333',
    notes='Reviewed resume and provided feedback',
    attended=True,
    structured_notes={
        'key_takeaways': [
            'Updated resume format to highlight technical skills',
            'Added quantifiable achievements',
            'Improved action verbs'
        ],
        'action_items': [
            {'task': 'Update LinkedIn profile', 'assignee': 'Alice', 'due': '2026-02-05'},
            {'task': 'Apply to 5 companies', 'assignee': 'Alice', 'due': '2026-02-10'}
        ]
    }
)
print(f'[OK] Created past session: {session3.title}')

print(f'\n[OK] Created {MentorSession.objects.filter(mentor=mentor).count()} sessions')
```

---

## Step 4: Create Work Queue Items

Create mission reviews and other tasks:

```python
from mentorship_coordination.models import MentorWorkQueue
from django.utils import timezone
from datetime import timedelta
import uuid

mentor = User.objects.get(email='mentor@ongozacyberhub.com')
alice = User.objects.get(email='alice@student.com')
bob = User.objects.get(email='bob@student.com')

now = timezone.now()

# Work item 1: Mission review (high priority, due today)
work1 = MentorWorkQueue.objects.create(
    mentor=mentor,
    mentee=alice,
    type='mission_review',
    priority='high',
    title='Review SIEM Lab Submission',
    description='Alice submitted SIEM lab - needs review and feedback',
    reference_id=uuid.uuid4(),
    sla_hours=24,
    due_at=now + timedelta(hours=4),
    status='pending'
)
print(f'[OK] Created work item: {work1.title}')

# Work item 2: Goal feedback (normal priority, due tomorrow)
work2 = MentorWorkQueue.objects.create(
    mentor=mentor,
    mentee=bob,
    type='goal_feedback',
    priority='normal',
    title='Review Q1 Career Goals',
    description='Bob needs feedback on career goals for Q1 2026',
    sla_hours=48,
    due_at=now + timedelta(days=1),
    status='pending'
)
print(f'[OK] Created work item: {work2.title}')

# Work item 3: Session notes (urgent, overdue)
work3 = MentorWorkQueue.objects.create(
    mentor=mentor,
    mentee=alice,
    type='session_notes',
    priority='urgent',
    title='Complete Session Notes - Resume Review',
    description='Add structured notes for completed resume review session',
    sla_hours=24,
    due_at=now - timedelta(hours=2),  # Overdue
    status='overdue'
)
print(f'[OK] Created overdue work item: {work3.title}')

print(f'\n[OK] Created {MentorWorkQueue.objects.filter(mentor=mentor).count()} work items')
```

---

## Step 5: Create Risk Flags

Flag at-risk mentees:

```python
from mentorship_coordination.models import MentorFlag
from users.models import User

mentor = User.objects.get(email='mentor@ongozacyberhub.com')
charlie = User.objects.get(email='charlie@student.com')

# Create a risk flag for Charlie
flag = MentorFlag.objects.create(
    mentor=mentor,
    mentee=charlie,
    reason='Student has missed 3 consecutive sessions and not responding to messages. Falling behind on curriculum.',
    severity='high',
    resolved=False,
    director_notified=True
)
print(f'[OK] Created risk flag for {charlie.email} - Severity: {flag.severity}')
```

---

## Step 6: Create Mission Submission (for testing review)

```python
from missions.models import Mission, MissionSubmission
from users.models import User
from django.utils import timezone
import uuid

# Get or create a test mission
alice = User.objects.get(email='alice@student.com')

mission, _ = Mission.objects.get_or_create(
    slug='siem-lab-01',
    defaults={
        'title': 'SIEM Lab: Log Analysis',
        'description': 'Analyze security logs using SIEM tools',
        'tier': 7,
        'mission_type': 'lab',
        'points': 100,
        'time_estimate_minutes': 120
    }
)

# Create submission
submission = MissionSubmission.objects.create(
    mission=mission,
    user=alice,
    cohort_id='cohort-2026-01',
    status='submitted',
    submission_text='I completed the SIEM lab. Here are my findings:\n\n1. Identified 15 failed login attempts\n2. Found suspicious outbound traffic to unknown IP\n3. Created detection rules for brute force attacks',
    submission_url='https://github.com/alice/siem-lab-01',
    submitted_at=timezone.now()
)
print(f'[OK] Created mission submission: {submission.id}')
print(f'    Mission: {mission.title}')
print(f'    Student: {alice.email}')
print(f'    Submission ID: {submission.id}')
```

Exit the Python shell:
```python
exit()
```

---

## Step 7: Test Mentor API Endpoints

### 7.1 Login as Mentor

```bash
# Get access token
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"mentor@ongozacyberhub.com","password":"mentor123"}' \
  | jq '.'

# Save the access_token from response
export MENTOR_TOKEN="your_access_token_here"
```

### 7.2 Test Mentor Dashboard

```bash
curl -X GET http://localhost:8000/api/v1/mentor/dashboard \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  | jq '.'
```

**Expected Output:**
```json
{
  "work_queue": {
    "overdue": 1,
    "today": 1,
    "high_priority": 1,
    "total_pending": 3
  },
  "today_sessions": [
    {
      "id": "...",
      "title": "Career Planning Discussion",
      "start_time": "...",
      "mentee_name": "Alice Johnson"
    }
  ],
  "at_risk_mentees": [
    {
      "mentee_id": "...",
      "name": "Charlie Davis",
      "flag_reason": "Student has missed 3 consecutive sessions..."
    }
  ],
  "capacity": {
    "weekly_slots": "3/10"
  }
}
```

### 7.3 Test Get Mentees List

```bash
# Get mentor ID first (from login response, typically user.id)
curl -X GET "http://localhost:8000/api/v1/mentors/3/mentees" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  | jq '.'
```

### 7.4 Test Get Sessions

```bash
curl -X GET "http://localhost:8000/api/v1/mentors/3/sessions" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  | jq '.'
```

### 7.5 Test Work Queue

```bash
curl -X GET http://localhost:8000/api/v1/mentor/workqueue \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  | jq '.'
```

### 7.6 Test Mission Review

```bash
# Replace {submission_id} with actual UUID from Step 6
curl -X POST "http://localhost:8000/api/v1/mentor/missions/{submission_id}/review" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "approved": true,
    "feedback": "Great work! Your analysis was thorough and accurate. Consider adding more detail on the remediation steps."
  }' \
  | jq '.'
```

### 7.7 Test Create Risk Flag

```bash
curl -X POST http://localhost:8000/api/v1/mentor/flags \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mentee_id": "alice_user_id",
    "reason": "Student struggling with advanced cryptography concepts",
    "severity": "medium"
  }' \
  | jq '.'
```

### 7.8 Test Get Flags

```bash
curl -X GET "http://localhost:8000/api/v1/mentors/3/flags" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  | jq '.'
```

### 7.9 Test Feedback Summary

```bash
curl -X GET "http://localhost:8000/api/v1/mentors/3/feedback-summary" \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  | jq '.'
```

### 7.10 Test Create Session

```bash
curl -X POST http://localhost:8000/api/v1/mentor/sessions \
  -H "Authorization: Bearer $MENTOR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mentee_id": "alice_user_id",
    "title": "Mid-Program Check-in",
    "type": "goal_review",
    "start_time": "2026-02-05T14:00:00Z",
    "duration_minutes": 60,
    "zoom_url": "https://zoom.us/j/123456789"
  }' \
  | jq '.'
```

---

## Step 8: Test as Student (Mentee)

### 8.1 Login as Alice

```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@student.com","password":"student123"}' \
  | jq '.'

export ALICE_TOKEN="alice_access_token_here"
```

### 8.2 Get My Mentor (as Alice)

```bash
# Replace {mentee_id} with Alice's user ID
curl -X GET "http://localhost:8000/api/v1/mentorship/mentees/{alice_id}/mentor" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  | jq '.'
```

### 8.3 Get My Sessions (as Alice)

```bash
curl -X GET http://localhost:8000/api/v1/mentorship/sessions \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  | jq '.'
```

### 8.4 Submit Session Feedback (as Alice)

```bash
# Replace {session_id} with a completed group session ID
curl -X POST "http://localhost:8000/api/v1/sessions/{session_id}/feedback" \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "overall_rating": 5,
    "mentor_engagement": 5,
    "mentor_preparation": 4,
    "session_value": 5,
    "strengths": "Very helpful session, mentor was well-prepared",
    "areas_for_improvement": "Would like more hands-on exercises"
  }' \
  | jq '.'
```

---

## Step 9: Verify Data in Django Admin

1. Start Django server:
```bash
cd backend/django_app
python manage.py runserver
```

2. Open browser: `http://localhost:8000/admin`

3. Login with admin credentials:
   - Email: `admin@ongozacyberhub.com`
   - Password: `admin123`

4. Check these models:
   - **Users** → Verify mentor and students exist
   - **User Roles** → Verify role assignments
   - **Mentee Mentor Assignments** → See 3 active assignments
   - **Mentor Sessions** → See 3 sessions
   - **Mentor Work Queue** → See 3 work items
   - **Mentor Flags** → See 1 risk flag
   - **Mission Submissions** → See 1 submission

---

## Step 10: Test Subscription Tier (Optional)

### Add Premium Subscription to Mentor

```bash
python manage.py shell
```

```python
from subscriptions.models import SubscriptionPlan, UserSubscription
from users.models import User
from django.utils import timezone

mentor = User.objects.get(email='mentor@ongozacyberhub.com')

# Get or create Premium plan
premium_plan, _ = SubscriptionPlan.objects.get_or_create(
    name='premium',
    defaults={
        'tier': 'premium',
        'price_monthly': 7.00,
        'features': ['curriculum_read', 'profiler_full', 'missions', 'ai_coach',
                     'portfolio', 'talentscope', 'mentorship', 'marketplace'],
        'missions_access_type': 'full',
        'mentorship_access': True,
        'talentscope_access': 'full',
        'marketplace_contact': True
    }
)

# Create subscription for mentor
subscription, created = UserSubscription.objects.get_or_create(
    user=mentor,
    defaults={
        'plan': premium_plan,
        'status': 'active',
        'started_at': timezone.now()
    }
)

if created:
    print(f'[OK] Created Premium subscription for {mentor.email}')
else:
    print(f'[SKIP] Subscription already exists')

exit()
```

Now test mission review again - it should work with Premium tier.

---

## Summary Checklist

- [ ] Created 3 test students (Alice, Bob, Charlie)
- [ ] Created 3 mentor-mentee assignments
- [ ] Created 3 sessions (upcoming, group, past)
- [ ] Created 3 work queue items (pending, overdue)
- [ ] Created 1 risk flag
- [ ] Created 1 mission submission
- [ ] Tested mentor login
- [ ] Tested mentor dashboard
- [ ] Tested get mentees
- [ ] Tested get sessions
- [ ] Tested work queue
- [ ] Tested mission review
- [ ] Tested create flag
- [ ] Tested feedback summary
- [ ] Tested student login
- [ ] Tested student get mentor
- [ ] Tested submit feedback
- [ ] Verified data in Django admin
- [ ] Added Premium subscription (optional)

---

## Quick Test Script (All-in-One)

Save this as `backend/django_app/seed_mentor_test_data.py`:

```python
"""
Seed test data for mentor testing.
Run: python manage.py shell < seed_mentor_test_data.py
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings.development')
django.setup()

from users.models import User, Role, UserRole
from mentorship_coordination.models import (
    MenteeMentorAssignment, MentorSession, MentorWorkQueue,
    MentorFlag, SessionAttendance
)
from missions.models import Mission, MissionSubmission
from django.utils import timezone
from datetime import timedelta
import uuid

print('=== Creating Test Users ===')

# Create students
students_data = [
    {'email': 'alice@student.com', 'username': 'alice', 'first_name': 'Alice', 'last_name': 'Johnson'},
    {'email': 'bob@student.com', 'username': 'bob', 'first_name': 'Bob', 'last_name': 'Smith'},
    {'email': 'charlie@student.com', 'username': 'charlie', 'first_name': 'Charlie', 'last_name': 'Davis'},
]

student_role = Role.objects.get(name='student')
students = []

for student_data in students_data:
    user, created = User.objects.get_or_create(
        email=student_data['email'],
        defaults={**student_data, 'is_active': True, 'email_verified': True, 'account_status': 'active'}
    )
    if created:
        user.set_password('student123')
        user.save()
        UserRole.objects.get_or_create(user=user, role=student_role, defaults={'scope': 'global', 'is_active': True})
        print(f'✓ Created: {user.email}')
    students.append(user)

print('\n=== Creating Assignments ===')

mentor = User.objects.get(email='mentor@ongozacyberhub.com')
for student in students:
    assignment, created = MenteeMentorAssignment.objects.get_or_create(
        mentee=student, mentor=mentor,
        defaults={'cohort_id': 'cohort-2026-01', 'status': 'active', 'max_sessions': 12}
    )
    if created:
        print(f'✓ Assigned {student.email} to mentor')

print('\n=== Creating Sessions ===')

now = timezone.now()
alice, bob, charlie = students

# Upcoming session
session1 = MentorSession.objects.create(
    assignment=MenteeMentorAssignment.objects.get(mentor=mentor, mentee=alice),
    mentee=alice, mentor=mentor, title='Career Planning',
    type='one_on_one', start_time=now + timedelta(hours=2),
    end_time=now + timedelta(hours=3), zoom_url='https://zoom.us/j/123'
)
print(f'✓ Created: {session1.title}')

# Group session
session2 = MentorSession.objects.create(
    assignment=MenteeMentorAssignment.objects.get(mentor=mentor, mentee=bob),
    mentee=bob, mentor=mentor, title='Security Workshop',
    type='group', start_time=now + timedelta(days=1, hours=14),
    end_time=now + timedelta(days=1, hours=16), zoom_url='https://zoom.us/j/456'
)
for s in students:
    SessionAttendance.objects.create(session=session2, mentee=s, attended=False)
print(f'✓ Created: {session2.title}')

print('\n=== Creating Work Items ===')

work1 = MentorWorkQueue.objects.create(
    mentor=mentor, mentee=alice, type='mission_review', priority='high',
    title='Review SIEM Lab', due_at=now + timedelta(hours=4), status='pending'
)
print(f'✓ Created: {work1.title}')

work2 = MentorWorkQueue.objects.create(
    mentor=mentor, mentee=alice, type='session_notes', priority='urgent',
    title='Complete Session Notes', due_at=now - timedelta(hours=2), status='overdue'
)
print(f'✓ Created: {work2.title}')

print('\n=== Creating Risk Flag ===')

flag = MentorFlag.objects.create(
    mentor=mentor, mentee=charlie, severity='high',
    reason='Missed 3 sessions, not responding to messages'
)
print(f'✓ Flagged: {charlie.email}')

print('\n=== Creating Mission Submission ===')

mission, _ = Mission.objects.get_or_create(
    slug='siem-lab-01',
    defaults={'title': 'SIEM Lab', 'tier': 7, 'mission_type': 'lab', 'points': 100}
)

submission = MissionSubmission.objects.create(
    mission=mission, user=alice, cohort_id='cohort-2026-01',
    status='submitted', submission_text='Completed SIEM analysis',
    submitted_at=timezone.now()
)
print(f'✓ Submission ID: {submission.id}')

print('\n=== Test Data Created Successfully ===')
print(f'Mentor: mentor@ongozacyberhub.com / mentor123')
print(f'Students: alice@student.com, bob@student.com, charlie@student.com / student123')
print(f'\nMentor Dashboard: http://localhost:8000/api/v1/mentor/dashboard')
```

Run it:
```bash
cd backend/django_app
python seed_mentor_test_data.py
```
