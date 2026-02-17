-- =============================================================================
-- Remove Sponsor Enrollment Functionality
-- This script removes all sponsor enrollment data and converts sponsor enrollments
-- to director enrollments (since sponsors should only post jobs, not enroll students)
-- 
-- Run: psql $DATABASE_URL -f backend/django_app/sql/remove_sponsor_enrollments.sql
-- Or from Django: python manage.py dbshell < backend/django_app/sql/remove_sponsor_enrollments.sql
-- =============================================================================

-- First, rollback any existing aborted transaction
ROLLBACK;

-- Start fresh transaction
BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Convert all sponsor enrollments to director enrollments
--    (Keep the enrollments but change enrollment_type from 'sponsor' to 'director')
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    -- Check if enrollments table exists and has the columns
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'enrollments'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'enrollments' 
        AND column_name = 'enrollment_type'
    ) THEN
        UPDATE enrollments
        SET enrollment_type = 'director'
        WHERE enrollment_type = 'sponsor';
        
        -- Update seat_type from 'sponsored' to 'scholarship' for clarity
        -- (These are now director-managed, not sponsor-managed)
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' 
            AND table_name = 'enrollments' 
            AND column_name = 'seat_type'
        ) THEN
            UPDATE enrollments
            SET seat_type = 'scholarship'
            WHERE seat_type = 'sponsored' AND enrollment_type = 'director';
        END IF;
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Log error but continue
    RAISE NOTICE 'Error updating enrollments: %', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Delete sponsor-student cohort enrollments (sponsor_student_cohorts table)
--    These are separate from main enrollments table
--    Only delete if table exists
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sponsor_student_cohorts'
    ) THEN
        DELETE FROM sponsor_student_cohorts;
        RAISE NOTICE 'Deleted records from sponsor_student_cohorts';
    ELSE
        RAISE NOTICE 'Table sponsor_student_cohorts does not exist, skipping';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Log error but continue
    RAISE NOTICE 'Error deleting from sponsor_student_cohorts: %', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Delete sponsor-student links (sponsor_student_links table)
--    These were used to link sponsors to students they could enroll
--    Only delete if table exists
-- -----------------------------------------------------------------------------
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'sponsor_student_links'
    ) THEN
        DELETE FROM sponsor_student_links;
        RAISE NOTICE 'Deleted records from sponsor_student_links';
    ELSE
        RAISE NOTICE 'Table sponsor_student_links does not exist, skipping';
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Log error but continue
    RAISE NOTICE 'Error deleting from sponsor_student_links: %', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 4. Note: We keep sponsor_cohort_assignments table
--    This is for sponsor funding/partnership assignments, not enrollment
--    Sponsors can still be assigned to cohorts for funding purposes
--    but they cannot enroll students

COMMIT;

-- =============================================================================
-- Summary of Changes:
-- 1. All enrollments with enrollment_type='sponsor' converted to 'director'
-- 2. All enrollments with seat_type='sponsored' converted to 'scholarship'
-- 3. All sponsor_student_cohorts records deleted (if table exists)
-- 4. All sponsor_student_links records deleted (if table exists)
-- 5. sponsor_cohort_assignments kept (for funding/partnership tracking only)
-- =============================================================================

-- Verification queries (uncomment to run):
-- SELECT COUNT(*) as sponsor_enrollments FROM enrollments WHERE enrollment_type = 'sponsor';
-- SELECT COUNT(*) as sponsored_seats FROM enrollments WHERE seat_type = 'sponsored';
-- SELECT COUNT(*) as sponsor_links FROM sponsor_student_links WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_student_links');
-- SELECT COUNT(*) as sponsor_cohorts FROM sponsor_student_cohorts WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sponsor_student_cohorts');
