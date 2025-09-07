// Usage: node scripts/seed-admin.js [email] [password]
const { PrismaClient, Role } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || 'admin@example.com';
  const password = process.argv[3] || 'admin123';
  const name = 'Admin';

  const existing = await prisma.user.findUnique({ where: { email } });
  const passwordHash = await bcrypt.hash(password, 10);
  if (existing) {
    await prisma.user.update({ where: { email }, data: { passwordHash, role: Role.ADMIN, isActive: true } });
    console.log(`Updated existing admin user: ${email}`);
  } else {
    await prisma.user.create({ data: { name, email, passwordHash, role: Role.ADMIN, isActive: true } });
    console.log(`Created admin user: ${email}`);
  }
  console.log(`Login with: ${email} / ${password}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});


