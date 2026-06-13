import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const users = await prisma.user.findMany();
  console.log('USERS IN DB:', users.length);
  console.log(users.map(u => ({ id: u.id, username: u.username, email: u.email })));
}
main();
