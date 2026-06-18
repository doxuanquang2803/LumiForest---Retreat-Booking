const prisma = require('./src/config/prismaClient');

async function main() {
  try {
    const order = await prisma.voucherOrder.create({
      data: {
        voucherId: 1, // replace with an actual ID
        fullName: 'Test User',
        email: 'test@example.com',
        phone: '0123456789',
        quantity: 1,
        totalPrice: 100000,
        status: 'PENDING_PAYMENT',
      }
    });
    console.log('Success:', order);
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
