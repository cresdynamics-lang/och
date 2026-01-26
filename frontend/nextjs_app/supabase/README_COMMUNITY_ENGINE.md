# OCH Community Engine - Implementation Guide

## Overview

The OCH Community Engine is a social, gamified, educational network where students automatically join their university communities, interact with peers, discover cross-university events/competitions/achievements, and compete on live leaderboards.

## Database Setup

### 1. Run the Migration

Execute the SQL migration file to create all required tables:

```bash
# In Supabase Dashboard -> SQL Editor, or via CLI:
supabase migration up 001_community_engine.sql
```

Or run the SQL directly in your Supabase project's SQL editor.

### 2. Seed Initial Data (Optional)

```sql
-- Insert some sample universities
INSERT INTO universities (name, code, location_city, location_country) VALUES
  ('University of Nairobi', 'UON', 'Nairobi', 'Kenya'),
  ('Strathmore University', 'STRATH', 'Nairobi', 'Kenya'),
  ('Kenyatta University', 'KU', 'Nairobi', 'Kenya');

-- Create university communities
INSERT INTO communities (name, type, university_id)
SELECT name || ' Community', 'university', id
FROM universities;
```

## Features Implemented

### ✅ Core Features

1. **Auto-University Mapping**
   - Students automatically mapped to universities via email domain
   - Email domain detection (e.g., `student@uon.ac.ke` → UoN)
   - Auto-join university community on registration

2. **Multiple Feed Types**
   - My University feed (university-specific posts)
   - Global feed (cross-university highlights)
   - Competitions feed (hackathons, events)
   - Leaderboard (university vs global rankings)
   - Search (placeholder for future implementation)

3. **Post Types**
   - Text posts
   - Media posts (images/videos)
   - Event posts (with RSVP)
   - Achievement posts (linked to portfolio/circle progress)
   - Poll posts

4. **Engagement Features**
   - 5 emoji reactions (🔥, 💯, 👏, ❤️, 😂)
   - Threaded comments with nested replies
   - Real-time updates via Supabase Realtime
   - View counts and engagement metrics

5. **Gamification**
   - Live leaderboards (daily, weekly, monthly)
   - University rankings
   - Global rankings
   - Score calculation based on posts, reactions, and comments

6. **Moderation**
   - Faculty can moderate their own university
   - Post pinning and archiving
   - RLS policies for security

## File Structure

```
frontend/nextjs_app/
├── app/
│   └── community/
│       └── page.tsx                    # Main community page
├── components/
│   └── community/
│       ├── CommunityShell.tsx          # Main shell with tabs
│       ├── CommunityPostCard.tsx       # Post display component
│       ├── ReactionBar.tsx             # Emoji reactions
│       ├── UniversityStatsBar.tsx      # University stats header
│       ├── LeaderboardWidget.tsx       # Leaderboard display
│       ├── CreatePostModal.tsx         # Post creation modal
│       └── CommentThread.tsx           # Comments and replies
├── hooks/
│   └── useCommunityFeed.ts             # Main data hook with realtime
├── types/
│   └── community.ts                    # TypeScript types
└── supabase/
    └── migrations/
        └── 001_community_engine.sql    # Database schema
```

## Usage

### Accessing the Community

Navigate to `/community` in your Next.js app. Users must be authenticated.

### Creating a Post

1. Click the floating action button (✏️) in the bottom-right
2. Select post type (text, media, event, achievement, poll)
3. Fill in content and tags
4. Submit

### Reacting to Posts

Click any of the 5 emoji reaction buttons on a post to react. Reactions update in real-time.

### Commenting

Click "View comments" on any post to expand the comment thread. Reply to comments to create nested threads.

## Configuration

### Environment Variables

Ensure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### University Mapping

The system automatically maps students based on email domain. To add a new university:

1. Add university to `universities` table
2. Create a university community (type='university')
3. Students with matching email domains will auto-join

## Realtime Features

The community engine uses Supabase Realtime for:
- New post notifications
- Reaction count updates
- Comment updates
- Leaderboard updates

These work automatically once the migration is run and realtime is enabled in Supabase.

## Security

Row Level Security (RLS) policies are in place to ensure:
- Users can only post in communities they're members of
- Faculty can moderate only their own university
- Public read access to published posts
- Users can only modify their own reactions/comments

## Testing Checklist

- [ ] Student registers with `@uon.ac.ke` email → Auto-mapped to UoN
- [ ] Student sees UoN feed first
- [ ] Can create text/media/event/achievement/poll posts
- [ ] Reactions update in real-time
- [ ] Comments work with nested replies
- [ ] Leaderboard shows correct rankings
- [ ] Faculty can moderate their university
- [ ] Mobile responsive design works
- [ ] Search functionality (placeholder)

## Future Enhancements

- Full search implementation
- Push notifications
- Mobile app support
- Advanced filtering and sorting
- Post sharing
- User profiles integration
- Badge system integration
- Event RSVP functionality

## Notes

- The UI components (tabs, avatar, dialog) were created without Radix UI dependencies for compatibility
- Date formatting uses a simple utility instead of date-fns
- Some features may need additional backend integration (e.g., fetching user profiles, circle data)

