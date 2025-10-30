/*
  Warnings:

  - You are about to drop the column `method` on the `Transaction` table. All the data in the column will be lost.
  - The `status` column on the `Transaction` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - A unique constraint covering the columns `[providerTransactionId]` on the table `Transaction` will be added. If there are existing duplicate values, this will fail.
  - Made the column `createdAt` on table `Service` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `billingId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `provider` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."TransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED');

-- AlterTable
ALTER TABLE "public"."Service" ALTER COLUMN "createdAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "public"."Transaction" DROP COLUMN "method",
ADD COLUMN     "billingId" INTEGER NOT NULL,
ADD COLUMN     "provider" TEXT NOT NULL,
ADD COLUMN     "providerMessage" TEXT,
ADD COLUMN     "providerTransactionId" TEXT,
ADD COLUMN     "rawWebhookPayload" JSONB,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "public"."TransactionStatus" NOT NULL DEFAULT 'PENDING';

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_providerTransactionId_key" ON "public"."Transaction"("providerTransactionId");

-- CreateIndex
CREATE INDEX "Transaction_billingId_idx" ON "public"."Transaction"("billingId");

-- AddForeignKey
ALTER TABLE "public"."Transaction" ADD CONSTRAINT "Transaction_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "public"."Billing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
