require('dotenv').config();
const prisma = require('../src/config/prismaClient');

async function main() {
  console.log('Starting role migration...');

  // Update 'admin' to 'ADMIN'
  const adminUpdate = await prisma.users.updateMany({
    where: { role: 'admin' },
    data: { role: 'ADMIN' },
  });
  console.log(`Updated ${adminUpdate.count} 'admin' users to 'ADMIN'`);

  // Update 'user' to 'CUSTOMER'
  const userUpdate = await prisma.users.updateMany({
    where: { role: 'user' },
    data: { role: 'CUSTOMER' },
  });
  console.log(`Updated ${userUpdate.count} 'user' users to 'CUSTOMER'`);

  // Update any other role that might be null or unrecognized to 'CUSTOMER'
  const otherUpdate = await prisma.users.updateMany({
    where: { 
      NOT: {
        role: {
          in: ['ADMIN', 'CUSTOMER', 'STAFF']
        }
      }
    },
    data: { role: 'CUSTOMER' },
  });
  console.log(`Updated ${otherUpdate.count} other/null users to 'CUSTOMER'`);

  console.log('Role migration completed!');
}

main()
  .catch((e) => {
    console.error('Error during role migration:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
