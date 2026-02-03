-- Fix migration record to match expected name
UPDATE django_migrations 
SET name = '0001_initial' 
WHERE app = 'programs' AND name = '0001_create_programs';

-- If no record exists, insert the correct one
INSERT INTO django_migrations (app, name, applied) 
SELECT 'programs', '0001_initial', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM django_migrations 
    WHERE app = 'programs' AND name = '0001_initial'
);