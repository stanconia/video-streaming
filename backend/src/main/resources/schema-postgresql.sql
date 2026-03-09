-- Fix: Allow null passwords for Google OAuth users
ALTER TABLE IF EXISTS users ALTER COLUMN password DROP NOT NULL;

-- Fix: Remove notifications type check constraint (enum validation handled by app layer)
ALTER TABLE IF EXISTS notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
