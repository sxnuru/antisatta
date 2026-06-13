import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.market.count();
  const markets = await prisma.market.findMany({ select: { title: true, matchScore: true, matchStatus: true }});
  console.log(`Ingested ${count} World Cup markets!`);
  console.log(markets);
}

main().finally(() => prisma.$disconnect());
