-- =============================================================================
-- Remove Sponsor Enrollment Functionality - SAFE VERSION
-- This version runs each operation in separate transactions to avoid abort issues
-- 
-- Run: psql $DATABASE_URL -f backend/django_app/sql/remove_sponsor_enrollments_safe.sql
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Convert all sponsor enrollments to director enrollments
-- -----------------------------------------------------------------------------
DO $$
BEGIN
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
        
        RAISE NOTICE 'Converted sponsor enrollments to director enrollments';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating enrollment_type: %', SQLERRM;
END $$;

-- Update seat_type separately
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'enrollments'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'enrollments' 
        AND column_name = 'seat_type'
    ) THEN
        UPDATE enrollments
        SET seat_type = 'scholarship'
        WHERE seat_type = 'sponsored' AND enrollment_type = 'director';
        
        RAISE NOTICE 'Converted sponsored seats to scholarship seats';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error updating seat_type: %', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 2. Delete sponsor-student cohort enrollments
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
    RAISE NOTICE 'Error deleting from sponsor_student_cohorts: %', SQLERRM;
END $$;

-- -----------------------------------------------------------------------------
-- 3. Delete sponsor-student links
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
    RAISE NOTICE 'Error deleting from sponsor_student_links: %', SQLERRM;
END $$;

-- =============================================================================
-- Summary: All operations completed. Check notices above for any errors.
-- =============================================================================
