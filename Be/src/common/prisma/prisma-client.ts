import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma } from '@prisma/client';

export function createPrismaClientOptions(): Prisma.PrismaClientOptions {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return {};
  }

  const adapter = new PrismaPg({ connectionString: databaseUrl });
  return { adapter };
}
