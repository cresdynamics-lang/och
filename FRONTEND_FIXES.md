# Frontend Issues & Fixes

## Issue 1: Getting Logged Out on Page Reload ❌

### **Problem:**
Users get logged out when they reload the page after 15 minutes.

### **Root Cause:**
The access token cookie expires too quickly (15 minutes) while the localStorage token lasts longer. On reload, if the cookie is expired, the authentication check fails.

**File:** `frontend/nextjs_app/app/api/auth/login/route.ts` (Line 142-148)

```typescript
// CURRENT (WRONG) - Token expires in 15 minutes:
nextResponse.cookies.set('access_token', loginResponse.access_token, {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 15, // ❌ 15 minutes - TOO SHORT!
  path: '/',
});
```

### **Fix:**
Change the access token cookie to match the refresh token duration (30 days):

```typescript
// FIXED - Token lasts 30 days:
nextResponse.cookies.set('access_token', loginResponse.access_token, {
  httpOnly: false,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  maxAge: 60 * 60 * 24 * 30, // ✅ 30 days
  path: '/',
});
```

---

## Issue 2: Mentor Dashboard Has Too Many Buttons 🔘

### **Problem:**
The mentor dashboard is cluttered with too many buttons:
- 4 KPI cards (each with button)
- Multiple "Review now" buttons
- Multiple "Open mentee" buttons
- "Join" buttons for sessions
- 5 Quick Action cards
- Multiple "Review" and "Open" buttons for missions
- Pagination buttons

### **Current Button Count:**
- ~15-20 visible buttons on initial load
- Can increase to 30+ with data

### **UI/UX Issues:**
1. **Button Overload** - Too many CTAs compete for attention
2. **Redundant Actions** - Multiple ways to do the same thing
3. **No Visual Hierarchy** - Everything looks equally important
4. **Cognitive Load** - Hard to know what to click first

### **Recommended Fixes:**

#### Fix 1: Consolidate Quick Actions
**Current:**
```
Quick Actions card with 5 separate action buttons:
- Mission review
- Mentees
- Sessions
- Analytics
- Cohorts & Tracks
```

**Improved:**
Remove Quick Actions card - these are already in the main navigation sidebar

#### Fix 2: Make Cards Clickable Instead of Adding Buttons
**Current:**
```tsx
<Card>
  <div>Pending Reviews: 5</div>
  <Button>Open Review Queue</Button>
</Card>
```

**Improved:**
```tsx
<Link href="/dashboard/mentor/missions">
  <Card className="cursor-pointer hover:bg-och-midnight/70">
    <div>Pending Reviews: 5</div>
    <span className="text-xs text-och-steel">Click to review →</span>
  </Card>
</Link>
```

#### Fix 3: Use Inline Actions Only for Primary CTAs
**Current:** Every item has a button
**Improved:** Only show buttons for high-priority actions

**Example - Pending Missions:**
```tsx
// Current: Every mission has "Review now" button
<div className="space-y-2">
  {pendingMissions.map(m => (
    <div>
      <div>{m.mission_title}</div>
      <Button>Review now</Button>  {/* ❌ Too many buttons */}
    </div>
  ))}
</div>

// Improved: Make entire row clickable
<div className="space-y-2">
  {pendingMissions.map(m => (
    <Link href={`/dashboard/mentor/missions?submission=${m.id}`}>
      <div className="cursor-pointer hover:bg-och-defender/10 p-3 rounded-lg">
        <div>{m.mission_title}</div>
        <div className="text-xs text-och-steel">Click to review →</div>
      </div>
    </Link>
  ))}
</div>
```

#### Fix 4: Reduce Mission List Buttons
**Current:** Each mission has 2 buttons ("Review" + "Open")
**Improved:** Single action or clickable row

#### Fix 5: Session "Join" Buttons - Keep These
These are good - they're time-sensitive primary actions

---

---

## 📋 **COMPLETE UI ANALYSIS AVAILABLE**

For a comprehensive analysis of ALL mentor UI pages including:
- Detailed button counts per page
- Code examples with line numbers
- Priority-based action plan
- Before/after comparisons
- Testing checklist

**See:** [`MENTOR_UI_COMPREHENSIVE_ANALYSIS.md`](./MENTOR_UI_COMPREHENSIVE_ANALYSIS.md)

---

## Applying the Fixes

### Quick Fix (Logout Issue Only):
