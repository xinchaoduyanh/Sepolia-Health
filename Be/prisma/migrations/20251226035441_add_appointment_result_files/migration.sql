-- CreateTable
CREATE TABLE "AppointmentResultFile" (
    "id" SERIAL NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileType" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "resultId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AppointmentResultFile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AppointmentResultFile_resultId_idx" ON "AppointmentResultFile"("resultId");

-- AddForeignKey
ALTER TABLE "AppointmentResultFile" ADD CONSTRAINT "AppointmentResultFile_resultId_fkey" FOREIGN KEY ("resultId") REFERENCES "AppointmentResult"("id") ON DELETE CASCADE ON UPDATE CASCADE;
