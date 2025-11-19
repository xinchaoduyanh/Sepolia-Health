-- CreateEnum
CREATE TYPE "AppTermsType" AS ENUM ('USAGE_REGULATIONS', 'DISPUTE_RESOLUTION', 'PRIVACY_POLICY', 'APP_FAQ');

-- CreateTable
CREATE TABLE "AppTerms" (
    "id" SERIAL NOT NULL,
    "type" "AppTermsType" NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" INTEGER,
    "updatedBy" INTEGER,

    CONSTRAINT "AppTerms_pkey" PRIMARY KEY ("id")
);

-- CreateIndex (Partial unique index to ensure only one active version per type)
CREATE UNIQUE INDEX "AppTerms_type_isActive_key" ON "AppTerms"("type") WHERE "isActive" = true;

-- CreateIndex
CREATE INDEX "AppTerms_type_idx" ON "AppTerms"("type");

-- CreateIndex
CREATE INDEX "AppTerms_isActive_idx" ON "AppTerms"("isActive");

