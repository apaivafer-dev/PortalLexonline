-- Migration: Add company_id and enforce isolation
BEGIN;

-- 1. Users
ALTER TABLE users ADD COLUMN IF NOT EXISTS company_id TEXT;
UPDATE users SET company_id = id WHERE company_id IS NULL;
-- Note: Already added to db.ts CREATE TABLE, but this ensures existing tables are updated.

-- 2. Pipelines
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS company_id TEXT;
UPDATE pipelines p SET company_id = (SELECT company_id FROM users u WHERE u.id = p.user_id);
-- Fallback for pipelines where user might be missing but we have user_id
UPDATE pipelines SET company_id = user_id WHERE company_id IS NULL;

-- 3. Leads
ALTER TABLE leads ADD COLUMN IF NOT EXISTS company_id TEXT;
UPDATE leads l SET company_id = (SELECT company_id FROM users u WHERE u.id = l.user_id);
UPDATE leads SET company_id = user_id WHERE company_id IS NULL;

-- 4. Constraints (Optional but recommended)
-- ALTER TABLE users ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE pipelines ALTER COLUMN company_id SET NOT NULL;
-- ALTER TABLE leads ALTER COLUMN company_id SET NOT NULL;

COMMIT;
