# Missions Implementation Guide

## Features Implemented

### 1. Table/List View
- ✅ Frontend redesigned with `MissionsTableView` component
- ✅ Pagination support
- ✅ Responsive table layout

### 2. Mission Locking
- ✅ Missions from other tracks are locked
- ✅ Missions above student's difficulty level are locked
- ✅ Locked missions show limited view with lock icon
- ✅ Lock reason displayed on hover/click

### 3. Beginner Level Assignment
- New users are assigned `beginner` difficulty by default
- Track assignment comes from enrollment

### 4. Auto-Progression
- Progression rules per track:
  - **Defender**: 3 beginner → intermediate, 5 intermediate → advanced, 3 advanced → capstone
  - **Offensive**: 3 beginner → intermediate, 5 intermediate → advanced, 3 advanced → capstone
  - **GRC**: 4 beginner → intermediate, 6 intermediate → advanced, 4 advanced → capstone
  - **Innovation**: 3 beginner → intermediate, 5 intermediate → advanced, 3 advanced → capstone
  - **Leadership**: 4 beginner → intermediate, 6 intermediate → advanced, 4 advanced → capstone

## Backend Updates Needed

### 1. Update `list_student_missions` view
Add logic to:
- Get student's track from enrollment
- Get student's current difficulty level
- Mark missions as locked if:
  - Mission track doesn't match student track
  - Mission difficulty > student difficulty
- Return `is_locked` and `lock_reason` in response

### 2. Create difficulty progression service
Create `missions/services.py` with:
- `get_student_difficulty(user)` - Get current difficulty
- `check_progression(user, track_key)` - Check if student should progress
- `update_difficulty(user, new_difficulty)` - Update difficulty level

### 3. Hook into mission approval
When a mission is approved:
- Count completed missions at current difficulty
- Check if progression threshold is met
- Auto-update difficulty if threshold reached

## Track Configuration

The 5 tracks are:
1. **defender** - Security Operations & Defense
2. **offensive** - Penetration Testing & Red Team
3. **grc** - Governance, Risk & Compliance
4. **innovation** - Security Research & Development
5. **leadership** - Security Leadership & Strategy

## API Response Format

```json
{
  "id": "mission-id",
  "code": "M001",
  "title": "Mission Title",
  "difficulty": "beginner",
  "track_key": "defender",
  "is_locked": false,
  "lock_reason": null,
  "status": "not_started",
  ...
}
```



