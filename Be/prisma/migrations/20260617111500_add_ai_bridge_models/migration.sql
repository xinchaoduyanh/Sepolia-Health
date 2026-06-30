DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'BookingDraftStatus') THEN
    CREATE TYPE "BookingDraftStatus" AS ENUM ('PENDING', 'CONFIRMED', 'EXPIRED', 'CANCELLED');
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "BookingDraft" (
  "id" TEXT NOT NULL,
  "patientProfileId" INTEGER NOT NULL,
  "doctorId" INTEGER NOT NULL,
  "serviceId" INTEGER NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "estimatedPrice" INTEGER,
  "status" "BookingDraftStatus" NOT NULL DEFAULT 'PENDING',
  "idempotencyKey" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "confirmedAppointmentId" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "BookingDraft_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiSession" (
  "id" TEXT NOT NULL,
  "userId" INTEGER NOT NULL,
  "agentState" TEXT NOT NULL,
  "channelId" TEXT,
  "state" JSONB NOT NULL,
  "version" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "closedAt" TIMESTAMP(3),
  CONSTRAINT "AiSession_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AiTurn" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "traceId" TEXT NOT NULL,
  "userMessage" TEXT,
  "aiMessage" TEXT,
  "toolCalls" JSONB,
  "toolResults" JSONB,
  "model" TEXT,
  "latencyMs" INTEGER,
  "policyViolations" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AiTurn_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "BookingDraft_idempotencyKey_key" ON "BookingDraft"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "BookingDraft_confirmedAppointmentId_key" ON "BookingDraft"("confirmedAppointmentId");
CREATE INDEX IF NOT EXISTS "BookingDraft_status_expiresAt_idx" ON "BookingDraft"("status", "expiresAt");
CREATE INDEX IF NOT EXISTS "AiSession_userId_closedAt_idx" ON "AiSession"("userId", "closedAt");
CREATE INDEX IF NOT EXISTS "AiTurn_sessionId_createdAt_idx" ON "AiTurn"("sessionId", "createdAt");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookingDraft_patientProfileId_fkey') THEN
    ALTER TABLE "BookingDraft" ADD CONSTRAINT "BookingDraft_patientProfileId_fkey"
      FOREIGN KEY ("patientProfileId") REFERENCES "PatientProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookingDraft_doctorId_fkey') THEN
    ALTER TABLE "BookingDraft" ADD CONSTRAINT "BookingDraft_doctorId_fkey"
      FOREIGN KEY ("doctorId") REFERENCES "DoctorProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookingDraft_serviceId_fkey') THEN
    ALTER TABLE "BookingDraft" ADD CONSTRAINT "BookingDraft_serviceId_fkey"
      FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'BookingDraft_confirmedAppointmentId_fkey') THEN
    ALTER TABLE "BookingDraft" ADD CONSTRAINT "BookingDraft_confirmedAppointmentId_fkey"
      FOREIGN KEY ("confirmedAppointmentId") REFERENCES "Appointment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiSession_userId_fkey') THEN
    ALTER TABLE "AiSession" ADD CONSTRAINT "AiSession_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'AiTurn_sessionId_fkey') THEN
    ALTER TABLE "AiTurn" ADD CONSTRAINT "AiTurn_sessionId_fkey"
      FOREIGN KEY ("sessionId") REFERENCES "AiSession"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
  END IF;
END $$;
