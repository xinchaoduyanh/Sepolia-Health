-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('UNVERIFIED', 'ACTIVE', 'DEACTIVE');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "isVerified",
DROP COLUMN "verifiedAt",
DROP COLUMN "lastLoginAt",
ADD COLUMN "status" "UserStatus" NOT NULL DEFAULT 'UNVERIFIED';
