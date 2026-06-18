require('dotenv').config();
const prisma = require('../src/config/prismaClient');
const bcrypt = require('bcryptjs');

async function main() {
  console.log('Bắt đầu seed người dùng thử nghiệm...');
  
  const hashedPassword = await bcrypt.hash('password123', 10);
  
  // Upsert mock user (ID 1)
  const user1 = await prisma.users.upsert({
    where: { id: BigInt(1) },
    update: {
      email: 'mockuser@example.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'active',
      deletedAt: null
    },
    create: {
      id: BigInt(1),
      name: 'Mock User',
      email: 'mockuser@example.com',
      password: hashedPassword,
      role: 'CUSTOMER',
      status: 'active'
    }
  });
  console.log(`Đã seed Mock User: ID = ${user1.id.toString()}, Email = ${user1.email}, Role = ${user1.role}`);

  // Upsert mock admin (ID 2)
  const user2 = await prisma.users.upsert({
    where: { id: BigInt(2) },
    update: {
      email: 'mockadmin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'active',
      deletedAt: null
    },
    create: {
      id: BigInt(2),
      name: 'Mock Admin',
      email: 'mockadmin@example.com',
      password: hashedPassword,
      role: 'ADMIN',
      status: 'active'
    }
  });
  console.log(`Đã seed Mock Admin: ID = ${user2.id.toString()}, Email = ${user2.email}, Role = ${user2.role}`);

  console.log('Hoàn thành seed người dùng thử nghiệm!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed người dùng:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
