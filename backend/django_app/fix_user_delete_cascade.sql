-- Fix Foreign Key Constraint for User Deletion
-- This allows users to be deleted by cascading the deletion to related tables

-- Step 1: Check existing constraints
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname IN (
    'coaching_coaching_sessions_user_id_667ad724_fk_users_id',
    'user_track_progress_user_id_22617bc5_fk_users_id'
);

-- Step 2: Fix coaching_coaching_sessions
ALTER TABLE coaching_coaching_sessions 
DROP CONSTRAINT IF EXISTS coaching_coaching_sessions_user_id_667ad724_fk_users_id;

ALTER TABLE coaching_coaching_sessions 
ADD CONSTRAINT coaching_coaching_sessions_user_id_667ad724_fk_users_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Step 3: Fix user_track_progress
ALTER TABLE user_track_progress 
DROP CONSTRAINT IF EXISTS user_track_progress_user_id_22617bc5_fk_users_id;

ALTER TABLE user_track_progress 
ADD CONSTRAINT user_track_progress_user_id_22617bc5_fk_users_id 
FOREIGN KEY (user_id) 
REFERENCES users(id) 
ON DELETE CASCADE;

-- Step 4: Verify the new constraints
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conname IN (
    'coaching_coaching_sessions_user_id_667ad724_fk_users_id',
    'user_track_progress_user_id_22617bc5_fk_users_id'
);

-- Step 5: Check for other tables that might have similar issues
-- Run this to find all foreign keys to users table that don't have CASCADE
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE confrelid = 'users'::regclass
  AND contype = 'f'
  AND pg_get_constraintdef(oid) NOT LIKE '%ON DELETE CASCADE%'
ORDER BY table_name;
