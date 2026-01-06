import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const billingCount = await prisma.billing.count();
  const appointmentCount = await prisma.appointment.count();
  const paidBillingCount = await prisma.billing.count({
    where: { status: 'PAID' },
  });
  console.log({ billingCount, appointmentCount, paidBillingCount });
}
main().finally(() => prisma.$disconnect());
