-- Migration: Promotion Management Feature
-- Description: Add Promotion, PromotionDisplay, and UserPromotion tables
-- Date: 2024-12-XX

-- Step 1: Update Promotion table
-- Add columns one by one to handle NOT NULL constraints properly
DO $$
BEGIN
    -- Add title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Promotion' AND column_name = 'title') THEN
        ALTER TABLE "Promotion" ADD COLUMN "title" TEXT;
        UPDATE "Promotion" SET "title" = 'Untitled Promotion' WHERE "title" IS NULL;
        ALTER TABLE "Promotion" ALTER COLUMN "title" SET NOT NULL;
        ALTER TABLE "Promotion" ALTER COLUMN "title" SET DEFAULT 'Untitled Promotion';
    END IF;

    -- Add discountPercent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Promotion' AND column_name = 'discountPercent') THEN
        ALTER TABLE "Promotion" ADD COLUMN "discountPercent" DOUBLE PRECISION;
        -- Migrate from old discount field if it exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Promotion' AND column_name = 'discount') THEN
            UPDATE "Promotion" SET "discountPercent" = "discount" WHERE "discountPercent" IS NULL AND "discount" IS NOT NULL;
        END IF;
        UPDATE "Promotion" SET "discountPercent" = 0 WHERE "discountPercent" IS NULL;
        ALTER TABLE "Promotion" ALTER COLUMN "discountPercent" SET NOT NULL;
        ALTER TABLE "Promotion" ALTER COLUMN "discountPercent" SET DEFAULT 0;
    END IF;

    -- Add maxDiscountAmount column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Promotion' AND column_name = 'maxDiscountAmount') THEN
        ALTER TABLE "Promotion" ADD COLUMN "maxDiscountAmount" DOUBLE PRECISION;
        UPDATE "Promotion" SET "maxDiscountAmount" = 0 WHERE "maxDiscountAmount" IS NULL;
        ALTER TABLE "Promotion" ALTER COLUMN "maxDiscountAmount" SET NOT NULL;
        ALTER TABLE "Promotion" ALTER COLUMN "maxDiscountAmount" SET DEFAULT 0;
    END IF;

    -- Add createdBy column (nullable)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Promotion' AND column_name = 'createdBy') THEN
        ALTER TABLE "Promotion" ADD COLUMN "createdBy" INTEGER;
    END IF;

    -- Add updatedBy column (nullable)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Promotion' AND column_name = 'updatedBy') THEN
        ALTER TABLE "Promotion" ADD COLUMN "updatedBy" INTEGER;
    END IF;

    -- Add createdAt column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Promotion' AND column_name = 'createdAt') THEN
        ALTER TABLE "Promotion" ADD COLUMN "createdAt" TIMESTAMP(3);
        UPDATE "Promotion" SET "createdAt" = CURRENT_TIMESTAMP WHERE "createdAt" IS NULL;
        ALTER TABLE "Promotion" ALTER COLUMN "createdAt" SET NOT NULL;
        ALTER TABLE "Promotion" ALTER COLUMN "createdAt" SET DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- Add updatedAt column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Promotion' AND column_name = 'updatedAt') THEN
        ALTER TABLE "Promotion" ADD COLUMN "updatedAt" TIMESTAMP(3);
        UPDATE "Promotion" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
        ALTER TABLE "Promotion" ALTER COLUMN "updatedAt" SET NOT NULL;
        ALTER TABLE "Promotion" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Step 2: Create PromotionDisplay table
CREATE TABLE IF NOT EXISTS "PromotionDisplay" (
    "id" SERIAL NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "backgroundColor" TEXT NOT NULL,
    "textColor" TEXT NOT NULL,
    "buttonColor" TEXT NOT NULL,
    "buttonTextColor" TEXT NOT NULL,
    "imageUrl" TEXT,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "archivedAt" TIMESTAMP(3),

    CONSTRAINT "PromotionDisplay_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create UserPromotion table
CREATE TABLE IF NOT EXISTS "UserPromotion" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "promotionId" INTEGER NOT NULL,
    "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "appointmentId" INTEGER,

    CONSTRAINT "UserPromotion_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "UserPromotion_userId_promotionId_key" UNIQUE ("userId", "promotionId")
);

-- Step 4: Add foreign keys
ALTER TABLE "PromotionDisplay"
ADD CONSTRAINT "PromotionDisplay_promotionId_fkey"
FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserPromotion"
ADD CONSTRAINT "UserPromotion_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserPromotion"
ADD CONSTRAINT "UserPromotion_promotionId_fkey"
FOREIGN KEY ("promotionId") REFERENCES "Promotion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "UserPromotion"
ADD CONSTRAINT "UserPromotion_appointmentId_fkey"
FOREIGN KEY ("appointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Step 5: Add indexes
CREATE INDEX IF NOT EXISTS "PromotionDisplay_isActive_idx" ON "PromotionDisplay"("isActive");
CREATE INDEX IF NOT EXISTS "PromotionDisplay_promotionId_idx" ON "PromotionDisplay"("promotionId");
CREATE INDEX IF NOT EXISTS "UserPromotion_userId_idx" ON "UserPromotion"("userId");
CREATE INDEX IF NOT EXISTS "UserPromotion_promotionId_idx" ON "UserPromotion"("promotionId");

-- Step 6: Add relation to Appointment table (if not exists)
-- Note: This should already be handled by Prisma, but adding for safety
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Appointment' AND column_name = 'userPromotions'
    ) THEN
        -- This is handled by Prisma relations, no direct column needed
        NULL;
    END IF;
END $$;

-- Step 7: Sample data (optional - for testing)
-- Insert a sample promotion (only if it doesn't exist)
DO $$
DECLARE
    promotion_exists BOOLEAN;
    promotion_id INTEGER;
BEGIN
    -- Check if promotion already exists
    SELECT EXISTS(SELECT 1 FROM "Promotion" WHERE "code" = 'CHRISTMAS2024') INTO promotion_exists;

    IF NOT promotion_exists THEN
        -- Insert sample promotion
        INSERT INTO "Promotion" (
            "title",
            "code",
            "description",
            "discountPercent",
            "maxDiscountAmount",
            "validFrom",
            "validTo",
            "createdAt",
            "updatedAt"
        ) VALUES (
            'Ưu đãi Giáng Sinh',
            'CHRISTMAS2024',
            'Nhận ngay voucher 10% nhân dịp Giáng Sinh sắp tới',
            10,
            50000,
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP + INTERVAL '30 days',
            CURRENT_TIMESTAMP,
            CURRENT_TIMESTAMP
        ) RETURNING "id" INTO promotion_id;

        -- Insert sample promotion display only if no active display exists
        IF NOT EXISTS (
            SELECT 1 FROM "PromotionDisplay" WHERE "isActive" = true
        ) THEN
            INSERT INTO "PromotionDisplay" (
                "promotionId",
                "displayOrder",
                "isActive",
                "backgroundColor",
                "textColor",
                "buttonColor",
                "buttonTextColor",
                "createdAt",
                "updatedAt"
            ) VALUES (
                promotion_id,
                0,
                true,
                '["#1E3A5F", "#2C5282"]',
                '#FFFFFF',
                'rgba(255,255,255,0.25)',
                '#FFFFFF',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            );
        END IF;
    ELSE
        -- Promotion exists, check if we need to create display
        SELECT "id" INTO promotion_id FROM "Promotion" WHERE "code" = 'CHRISTMAS2024' LIMIT 1;

        -- Only create display if no active display exists
        IF NOT EXISTS (
            SELECT 1 FROM "PromotionDisplay" WHERE "isActive" = true
        ) THEN
            INSERT INTO "PromotionDisplay" (
                "promotionId",
                "displayOrder",
                "isActive",
                "backgroundColor",
                "textColor",
                "buttonColor",
                "buttonTextColor",
                "createdAt",
                "updatedAt"
            ) VALUES (
                promotion_id,
                0,
                true,
                '["#1E3A5F", "#2C5282"]',
                '#FFFFFF',
                'rgba(255,255,255,0.25)',
                '#FFFFFF',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            ) ON CONFLICT DO NOTHING;
        END IF;
    END IF;
END $$;

-- Verification queries (run these to check)
-- SELECT * FROM "Promotion";
-- SELECT * FROM "PromotionDisplay";
-- SELECT * FROM "UserPromotion";

