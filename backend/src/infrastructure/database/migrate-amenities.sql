ALTER TABLE amenities ADD COLUMN IF NOT EXISTS description VARCHAR(255);

UPDATE amenities SET description = icon WHERE icon IS NOT NULL;

ALTER TABLE amenities DROP COLUMN IF EXISTS icon;
