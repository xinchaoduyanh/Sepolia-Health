-- CreateTable
CREATE TABLE "public"."PaymentCode" (
    "id" SERIAL NOT NULL,
    "code" TEXT NOT NULL,
    "billingId" INTEGER NOT NULL,
    "isUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PaymentCode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCode_code_key" ON "public"."PaymentCode"("code");

-- CreateIndex
CREATE UNIQUE INDEX "PaymentCode_billingId_key" ON "public"."PaymentCode"("billingId");

-- CreateIndex
CREATE INDEX "PaymentCode_code_idx" ON "public"."PaymentCode"("code");

-- AddForeignKey
ALTER TABLE "public"."PaymentCode" ADD CONSTRAINT "PaymentCode_billingId_fkey" FOREIGN KEY ("billingId") REFERENCES "public"."Billing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
