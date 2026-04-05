-- Add listing_type to distinguish businesses from professionals
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'business'
CHECK (listing_type IN ('business', 'professional'));

UPDATE businesses SET listing_type = 'business' WHERE listing_type IS NULL;

CREATE INDEX IF NOT EXISTS idx_businesses_listing_type ON businesses(listing_type);

-- Add professional-specific columns
ALTER TABLE businesses
ADD COLUMN IF NOT EXISTS specialties TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS certifications TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS service_area TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS years_experience INTEGER,
ADD COLUMN IF NOT EXISTS professional_title TEXT;
