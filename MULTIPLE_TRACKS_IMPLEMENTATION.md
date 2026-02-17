# Multiple Curriculum Tracks Assignment Implementation

## Overview
Implemented the ability to assign multiple curriculum tracks to a cohort instead of just one. The tracks displayed are the curriculum tracks from `/dashboard/director/tracks`.

## Changes Made

### Backend Changes

#### 1. Updated `programs/api_serializers.py`
- Added `curriculum_tracks` field to `CreateCohortSerializer` as a list of track slugs
- Added `curriculum_tracks` field to `CohortSerializer` for reading
- Updated the `create` method to handle the `curriculum_tracks` field

**Key Changes:**
```python
curriculum_tracks = serializers.ListField(
    child=serializers.CharField(),
    required=False,
    allow_empty=True,
    help_text='List of curriculum track slugs'
)
```

### Frontend Changes

#### 2. Updated `app/dashboard/director/cohorts/[id]/page.tsx`

**State Changes:**
- Changed `selectedTrackId` (string) to `selectedTrackIds` (array) to support multiple selections
- Added `curriculumTracks` state to store available curriculum tracks

**Data Fetching:**
- Added curriculum tracks fetching from `/curriculum/tracks/` endpoint in the useEffect

**Track Assignment Logic:**
- Updated `handleAssignTrack` to send `curriculum_tracks` array instead of single `track` ID
- Modified to handle multiple track slugs

**UI Changes:**
- Added "Curriculum Tracks" section in cohort details showing all assigned tracks as badges
- Replaced single-select dropdown with multi-select checkbox interface in the modal
- Shows selected tracks count and preview in the modal
- Displays curriculum tracks from the `/dashboard/director/tracks` page

## How It Works

1. **Viewing Assigned Tracks:**
   - In the cohort detail page, the "Curriculum Tracks" section displays all assigned tracks as badges
   - Each badge shows the track title/name

2. **Assigning Tracks:**
   - Click "Assign Tracks" or "Change Tracks" button
   - A modal opens showing all available curriculum tracks from `/dashboard/director/tracks`
   - Select multiple tracks using checkboxes
   - Preview of selected tracks is shown at the bottom
   - Click "Assign Tracks" to save

3. **Data Storage:**
   - Tracks are stored in the `curriculum_tracks` JSONB field as an array of track slugs
   - Example: `["defender", "offensive", "grc"]`

## Database Schema

The `cohorts` table already has the `curriculum_tracks` column:
```sql
ALTER TABLE cohorts ADD COLUMN IF NOT EXISTS curriculum_tracks JSONB DEFAULT '[]'::jsonb;
```

## API Endpoints Used

- `GET /curriculum/tracks/` - Fetches available curriculum tracks
- `PATCH /programs/cohorts/{id}/` - Updates cohort with curriculum_tracks array

## Benefits

1. **Flexibility:** Cohorts can now be assigned multiple learning tracks
2. **Better Organization:** Directors can create cohorts that span multiple curriculum areas
3. **Improved UX:** Clear visual representation of all assigned tracks
4. **Scalability:** Easy to add/remove tracks without affecting other cohort data

## Testing

To test the implementation:
1. Navigate to a cohort detail page: `/dashboard/director/cohorts/{cohort-id}`
2. Click "Assign Tracks" button
3. Select multiple tracks from the list
4. Click "Assign Tracks" to save
5. Verify tracks appear in the "Curriculum Tracks" section
6. Refresh the page to ensure data persists
