-- AI booking safety: deterministic confirm key, one open session per channel,
-- and a database-level final guard against overlapping active appointments.

ALTER TABLE "BookingDraft"
  ADD COLUMN IF NOT EXISTS "confirmIdempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "BookingDraft_confirmIdempotencyKey_key"
  ON "BookingDraft"("confirmIdempotencyKey");

CREATE UNIQUE INDEX IF NOT EXISTS "AiSession_one_open_channel_key"
  ON "AiSession"("channelId")
  WHERE "channelId" IS NOT NULL AND "closedAt" IS NULL;

CREATE EXTENSION IF NOT EXISTS btree_gist;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'Appointment_doctor_active_no_overlap'
  ) THEN
    ALTER TABLE "Appointment"
      ADD CONSTRAINT "Appointment_doctor_active_no_overlap"
      EXCLUDE USING gist (
        "doctorId" WITH =,
        tsrange("startTime", "endTime", '[)') WITH &&
      )
      WHERE ("status" IN ('UPCOMING', 'ON_GOING'));
  END IF;
END $$;

