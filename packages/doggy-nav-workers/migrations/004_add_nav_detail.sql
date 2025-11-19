-- Add markdown detail column to bookmarks
ALTER TABLE bookmarks ADD COLUMN detail TEXT DEFAULT '';

-- Initialize existing rows with their short description so details render immediately
UPDATE bookmarks SET detail = description WHERE detail IS NULL OR detail = '';
