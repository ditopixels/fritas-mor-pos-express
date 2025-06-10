
-- Add selection_type to product_options table
ALTER TABLE product_options 
ADD COLUMN selection_type text NOT NULL DEFAULT 'single' 
CHECK (selection_type IN ('single', 'multiple'));

-- Update existing options to be single by default
UPDATE product_options SET selection_type = 'single';
