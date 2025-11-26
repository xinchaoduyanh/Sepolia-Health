-- CreateIndex
CREATE INDEX "Appointment_startTime_status_clinicId_idx" ON "Appointment"("startTime", "status", "clinicId");

-- CreateIndex
CREATE INDEX "Appointment_status_clinicId_startTime_idx" ON "Appointment"("status", "clinicId", "startTime");

-- CreateIndex
CREATE INDEX "Billing_status_appointmentId_idx" ON "Billing"("status", "appointmentId");
