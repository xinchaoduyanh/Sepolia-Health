-- Step 7: Sample data (optional - for testing)
-- Run this ONLY if steps 1-6 have already been executed successfully
-- This will insert sample promotion and promotion display data

DO $$
DECLARE
    promotion_exists BOOLEAN;
    promotion_id INTEGER;
    discount_column_exists BOOLEAN;
BEGIN
    -- Check if promotion already exists
    SELECT EXISTS(SELECT 1 FROM "Promotion" WHERE "code" = 'CHRISTMAS2024') INTO promotion_exists;

    -- Check if "discount" column still exists (for backward compatibility)
    SELECT EXISTS(
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'Promotion' AND column_name = 'discount'
    ) INTO discount_column_exists;

    IF NOT promotion_exists THEN
        -- Insert sample promotion
        IF discount_column_exists THEN
            -- Include "discount" column for backward compatibility
            INSERT INTO "Promotion" (
                "title",
                "code",
                "description",
                "discount",
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
                10,  -- discount (for backward compatibility)
                10,  -- discountPercent
                50000,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP + INTERVAL '30 days',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            ) RETURNING "id" INTO promotion_id;
        ELSE
            -- "discount" column doesn't exist, only insert new columns
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
                10,  -- discountPercent
                50000,
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP + INTERVAL '30 days',
                CURRENT_TIMESTAMP,
                CURRENT_TIMESTAMP
            ) RETURNING "id" INTO promotion_id;
        END IF;

        RAISE NOTICE 'Created sample promotion with ID: %', promotion_id;

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

            RAISE NOTICE 'Created sample promotion display and activated it';
        ELSE
            RAISE NOTICE 'Skipped creating display - an active display already exists';
        END IF;
    ELSE
        -- Promotion exists, check if we need to create display
        SELECT "id" INTO promotion_id FROM "Promotion" WHERE "code" = 'CHRISTMAS2024' LIMIT 1;

        RAISE NOTICE 'Promotion CHRISTMAS2024 already exists with ID: %', promotion_id;

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
            );

            RAISE NOTICE 'Created sample promotion display and activated it';
        ELSE
            RAISE NOTICE 'Skipped creating display - an active display already exists';
        END IF;
    END IF;
END $$;

-- Verification queries (run these to check the results)
-- SELECT * FROM "Promotion" WHERE "code" = 'CHRISTMAS2024';
-- SELECT * FROM "PromotionDisplay" WHERE "isActive" = true;

