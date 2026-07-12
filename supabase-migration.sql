-- Migration: Add gallery_urls support to poktan_profiles table
-- Run this SQL in your Supabase SQL Editor

-- 1. Add gallery_urls column if it doesn't exist (supports array of text/URLs)
ALTER TABLE poktan_profiles 
ADD COLUMN IF NOT EXISTS gallery_urls TEXT[];

-- 2. Add comment for documentation
COMMENT ON COLUMN poktan_profiles.gallery_urls IS 'Array of gallery image URLs from Supabase Storage';

-- 3. Ensure diskon_persen column exists with default 0
ALTER TABLE poktan_profiles 
ADD COLUMN IF NOT EXISTS diskon_persen INTEGER DEFAULT 0;

-- 4. Add constraint to ensure diskon_persen is between 0 and 100
ALTER TABLE poktan_profiles 
ADD CONSTRAINT diskon_persen_range 
CHECK (diskon_persen >= 0 AND diskon_persen <= 100);

-- 5. Update existing rows to have empty array if gallery_urls is NULL
UPDATE poktan_profiles 
SET gallery_urls = ARRAY[]::TEXT[] 
WHERE gallery_urls IS NULL;

-- 6. Optional: Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_poktan_profiles_gallery 
ON poktan_profiles USING GIN (gallery_urls);

-- 7. Verify the changes
SELECT 
  column_name, 
  data_type, 
  column_default,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'poktan_profiles' 
  AND column_name IN ('gallery_urls', 'diskon_persen');
