import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  await prisma.source.deleteMany({});
  await prisma.notebook.deleteMany({});
  console.log("Database cleared.");
}

main().finally(() => prisma.$disconnect());
