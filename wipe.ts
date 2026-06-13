import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Wiping dummy data...');
  await prisma.comment.deleteMany();
  await prisma.prediction.deleteMany();
  await prisma.outcome.deleteMany();
  await prisma.market.deleteMany();
  console.log('Done.');
}

main().finally(() => prisma.$disconnect());
