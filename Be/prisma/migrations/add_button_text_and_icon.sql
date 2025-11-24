-- Add buttonText and iconName columns to PromotionDisplay table

ALTER TABLE "PromotionDisplay"
ADD COLUMN "buttonText" VARCHAR(255) NOT NULL DEFAULT 'Nhận ngay',
ADD COLUMN "iconName" VARCHAR(255) NOT NULL DEFAULT 'gift-outline';

-- Update existing records to have default values (already set by DEFAULT clause)
-- No need for UPDATE statement as DEFAULT will handle it

-- Verify the changes
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'PromotionDisplay'
ORDER BY ordinal_position;
