-- Add status column if not exists
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'User' AND column_name = 'status') THEN
        ALTER TABLE "User" ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'UNVERIFIED';
    END IF;
END $$;

-- Update existing users to ACTIVE status
UPDATE "User" SET "status" = 'ACTIVE' WHERE "status" = 'UNVERIFIED';
