/* eslint-disable */
const { PrismaClient, TruckStatus, Role } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
	const depot = await prisma.depot.upsert({
		where: { code: 'MAIN' },
		update: {},
		create: {
			name: 'Main Depot',
			code: 'MAIN',
			address: '123 Logistics Way',
		},
	});

	// Users
	const passwordHash = require('bcryptjs').hashSync('password123', 10);
	await prisma.user.upsert({
		where: { email: 'admin@example.com' },
		update: {},
		create: { name: 'Admin', email: 'admin@example.com', role: Role.ADMIN, passwordHash },
	});
	await prisma.user.upsert({
		where: { email: 'manager@example.com' },
		update: {},
		create: { name: 'Manager', email: 'manager@example.com', role: Role.FLEET_MANAGER, passwordHash },
	});

	await prisma.truck.upsert({
		where: { vin: '1HTMKADN43H561298' },
		update: {},
		create: {
			vin: '1HTMKADN43H561298',
			plate: 'ABC-1234',
			year: 2020,
			colorTag: 'green',
			barcode: 'TRK-0001',
			status: TruckStatus.ACTIVE,
			depot: { connect: { id: depot.id } },
		},
	});

	console.log('Seed complete.');
}

main()
	.catch((e) => {
		console.error(e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
