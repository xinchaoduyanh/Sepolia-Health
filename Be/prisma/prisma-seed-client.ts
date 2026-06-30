import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

export function createSeedPrismaClient() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    return new PrismaClient();
  }
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}
