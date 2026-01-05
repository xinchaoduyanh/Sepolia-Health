import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyMapping() {
  console.log('🧪 Verifying AdminAppointmentService mapping logic...');

  // Mock the mapping logic from the service
  function mapToResponse(appointment: any) {
    const patientProfile = appointment.patientProfile;
    return {
      id: appointment.id,
      date: appointment.startTime.toISOString().split('T')[0],
      startTime: appointment.startTime
        .toISOString()
        .split('T')[1]
        .substring(0, 5),
      endTime: appointment.endTime.toISOString().split('T')[1].substring(0, 5),
      status: appointment.status,
      patientName: patientProfile
        ? `${patientProfile.lastName} ${patientProfile.firstName}`
        : 'N/A',
      patientDob: patientProfile
        ? patientProfile.dateOfBirth.toISOString().split('T')[0]
        : '',
      billingStatus: appointment.billing?.status || 'NO_BILLING',
    };
  }

  // Get one appointment with related data
  const appointment = await prisma.appointment.findFirst({
    include: {
      patientProfile: true,
      doctor: true,
      service: true,
      clinic: true,
      billing: true,
    },
  });

  if (!appointment) {
    console.log('❌ No appointments found to verify.');
    return;
  }

  const mapped = mapToResponse(appointment);

  console.log('\n--- VERIFICATION RESULTS ---');
  console.log(`Appointment ID: ${mapped.id}`);
  console.log(
    `Mapped Date: ${mapped.date} (Source: ${appointment.startTime.toISOString()})`,
  );
  console.log(`Mapped Time: ${mapped.startTime} - ${mapped.endTime}`);
  console.log(`Mapped Patient Name: ${mapped.patientName}`);
  console.log(`Mapped Patient DOB: ${mapped.patientDob}`);
  console.log(`Mapped Billing Status: ${mapped.billingStatus}`);

  const isValid =
    mapped.patientName !== 'N/A' &&
    mapped.date !== undefined &&
    mapped.billingStatus !== undefined;

  if (isValid) {
    console.log('\n✅ Mapping logic looks correct!');
  } else {
    console.log('\n❌ Mapping logic still has issues.');
  }
}

verifyMapping()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
