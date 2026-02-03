# Director Dashboard System Test Guide

## Prerequisites
1. Backend server running on `http://localhost:8000`
2. Frontend server running on `http://localhost:3000`
3. Director user account: `director@gmail.com` with program_director role
4. Test data: Programs, tracks, cohorts, and enrollments

## Test Environment Setup
```bash
# 1. Create director user and assign role
python manage.py shell
from django.contrib.auth import get_user_model
User = get_user_model()
director = User.objects.create_user(email='director@gmail.com', password='testpass123')

# 2. Run role assignment SQL
psql -d your_db -f assign_roles.sql

# 3. Create test data
python manage.py shell
# Create test programs, tracks, cohorts, enrollments
```

## HIGH PRIORITY FEATURES TESTING

### 1. Program & Track Management
**Test Steps:**
1. Login as director@gmail.com
2. Navigate to `/dashboard/director/programs`
3. Click "Create Program"
4. Fill form: Name, Category, Duration, Price
5. Save program
6. Navigate to `/dashboard/director/tracks`
7. Create track linked to program
8. Verify program/track appears in listings

**Expected Results:**
- ✅ Program creation form loads
- ✅ Program saves successfully
- ✅ Track creation works
- ✅ Data persists and displays

### 2. Cohort Management
**Test Steps:**
1. Navigate to `/dashboard/director/cohorts`
2. Click "Create Cohort"
3. Fill: Name, Track, Dates, Seat Cap, Mode
4. Save cohort
5. Navigate to cohort detail page
6. Test status transitions: Draft → Active → Running
7. Edit cohort details

**Expected Results:**
- ✅ Cohort creation form works
- ✅ Status transitions function
- ✅ Seat utilization calculates
- ✅ Edit functionality works

### 3. Calendar Management
**Test Steps:**
1. Navigate to `/dashboard/director/calendar`
2. View calendar interface
3. Create milestone event
4. Drag and drop event (if implemented)
5. Edit event details
6. Delete event

**Expected Results:**
- ✅ Calendar loads with events
- ✅ Event creation works
- ✅ Event editing functions
- ✅ Events sync with cohorts

### 4. Mentor Assignment
**Test Steps:**
1. Navigate to `/dashboard/director/mentors`
2. View mentor list
3. Go to cohort mentor assignment
4. Assign mentor with role (Primary/Support)
5. View mentor capacity utilization
6. Remove mentor assignment

**Expected Results:**
- ✅ Mentor list displays
- ✅ Assignment interface works
- ✅ Roles are properly set
- ✅ Capacity tracking functions

### 5. Enrollment Approval
**Test Steps:**
1. Navigate to `/dashboard/director/enrollment`
2. View pending enrollments
3. Approve enrollment
4. Reject enrollment
5. Override seat limits
6. Manage waitlist

**Expected Results:**
- ✅ Pending enrollments display
- ✅ Approval/rejection works
- ✅ Seat management functions
- ✅ Waitlist processes correctly

## MEDIUM PRIORITY FEATURES TESTING

### 6. Program Rules & Completion
**Test Steps:**
1. Navigate to `/dashboard/director/rules`
2. Create completion rule
3. Set graduation criteria
4. Test rule validation
5. View completion tracking

**Expected Results:**
- ✅ Rules interface loads
- ✅ Rule creation works
- ✅ Validation functions
- ✅ Tracking displays

### 7. Reports & Analytics
**Test Steps:**
1. Navigate to `/dashboard/director/reports`
2. Generate enrollment report
3. Export CSV/JSON
4. Filter by date range
5. View cohort analytics

**Expected Results:**
- ✅ Reports generate
- ✅ Export functions work
- ✅ Filters apply correctly
- ✅ Data accuracy verified

## LOW PRIORITY FEATURES TESTING

### 8. Advanced Analytics
**Test Steps:**
1. Navigate to `/dashboard/director/analytics`
2. Click "Advanced Analytics"
3. Test each tab:
   - Enrollment Funnel
   - Cohort Comparison
   - Mentor Analytics
   - Revenue Analytics
   - Predictive Analytics
4. Verify data visualization
5. Test export functionality

**Expected Results:**
- ✅ Modal opens correctly
- ✅ All tabs load data
- ✅ Charts render properly
- ✅ Export works
- ✅ Data is meaningful

### 9. Certificate Management
**Test Steps:**
1. Navigate to `/dashboard/director/certificates`
2. View certificate list
3. Filter by status/program
4. Select pending certificates
5. Generate certificates (bulk)
6. Download issued certificate
7. Test template selection

**Expected Results:**
- ✅ Certificate list displays
- ✅ Filters work correctly
- ✅ Bulk generation functions
- ✅ Download works
- ✅ Templates apply

## API ENDPOINT TESTING

### Core Endpoints to Test:
```
GET /api/v1/programs/director/dashboard/summary/
GET /api/v1/programs/director/cohorts/
POST /api/v1/programs/director/programs/
POST /api/v1/programs/director/cohorts/
GET /api/v1/programs/director/mentors/
POST /api/v1/programs/director/certificates/generate_certificate/
GET /api/v1/programs/director/advanced-analytics/enrollment_funnel/
```

## INTEGRATION TESTING

### Cross-Feature Tests:
1. **Program → Track → Cohort Flow**
   - Create program → Create track → Create cohort
   - Verify data relationships

2. **Enrollment → Certificate Flow**
   - Enroll student → Complete program → Generate certificate
   - Verify end-to-end process

3. **Mentor → Cohort → Analytics Flow**
   - Assign mentor → Track utilization → View analytics
   - Verify data consistency

## PERFORMANCE TESTING

### Load Tests:
1. Create 100+ programs
2. Create 50+ cohorts
3. Generate 1000+ enrollments
4. Test dashboard performance
5. Verify analytics load times

## ERROR HANDLING TESTING

### Error Scenarios:
1. Invalid form submissions
2. Network failures
3. Permission denied scenarios
4. Data validation errors
5. Server errors (500)

## BROWSER COMPATIBILITY

### Test Browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

### Mobile Testing:
- iOS Safari
- Android Chrome
- Responsive design verification

## SECURITY TESTING

### Security Checks:
1. Director role enforcement
2. CSRF protection
3. Input validation
4. SQL injection prevention
5. XSS protection

## REGRESSION TESTING

### After Each Update:
1. Run full test suite
2. Verify existing functionality
3. Test new features
4. Check for breaking changes

## TEST COMPLETION CHECKLIST

- [ ] All high priority features tested
- [ ] All medium priority features tested
- [ ] All low priority features tested
- [ ] API endpoints verified
- [ ] Integration tests passed
- [ ] Performance acceptable
- [ ] Error handling works
- [ ] Security checks passed
- [ ] Browser compatibility verified
- [ ] Mobile responsiveness confirmed

## ISSUE REPORTING

### Bug Report Template:
```
**Feature:** [Feature Name]
**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected Result:** [What should happen]
**Actual Result:** [What actually happened]
**Browser:** [Browser and version]
**Screenshots:** [If applicable]
```

## SUCCESS CRITERIA

✅ **High Priority (Core Functionality):** 100% working
✅ **Medium Priority (Management Features):** 95% working
✅ **Low Priority (Enhancement Features):** 90% working

The director dashboard is considered fully functional when all high priority features work perfectly, medium priority features have minimal issues, and low priority features provide enhanced value without blocking core operations.