// Usage: node scripts/seed-driver.js [email] [password] [name] [phone]
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'driver@example.com';
  const password = process.argv[3] || 'driver123';
  const name = process.argv[4] || 'Demo Driver';
  const phone = process.argv[5] || null;

  // Create a shared id so User(id) === Driver(id)
  const id = randomUUID();

  // Create Driver
  const driver = await prisma.driver.create({ data: { id, name, phone } });

  // Create User with same id
  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.create({ data: { id, name, email, passwordHash, role: Role.DRIVER, isActive: true } });

  console.log('Created driver and user with shared id');
  console.log(`Login with: ${email} / ${password}`);
  console.log(`Driver ID: ${id}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


