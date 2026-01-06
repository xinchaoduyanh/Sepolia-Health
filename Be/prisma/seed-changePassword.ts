import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // const users = await prisma.user.findMany();

  // for (const user of users) {
  //   const hashedPassword = await bcrypt.hash(String(user.password), 10);

  //   await prisma.user.update({
  //     where: { id: user.id },
  //     data: { password: hashedPassword },
  //   });

  //   console.log(`✔ Updated user ${user.id}`);
  // }
  const hashedPassword = await bcrypt.hash('1', 10);
  await prisma.user.updateMany({ data: { password: hashedPassword } });
  console.log('update completed');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
