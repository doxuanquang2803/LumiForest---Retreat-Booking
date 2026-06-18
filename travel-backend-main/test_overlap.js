const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function test() {
  const roomId = 1;
  const newCheckIn = new Date('2026-06-02T00:00:00Z');
  const newCheckOut = new Date('2026-06-05T00:00:00Z');

  const conflicts = await prisma.hotelBooking.findMany({
    where: {
      roomId,
      status: { notIn: ['cancelled'] },
      checkIn: { lt: newCheckOut },
      checkOut: { gt: newCheckIn },
    }
  });
  console.log('Conflicts for 2-5:', conflicts.map(c => ({ id: c.id, checkIn: c.checkIn, checkOut: c.checkOut })));

  const allBookings = await prisma.hotelBooking.findMany({ where: { roomId } });
  console.log('All bookings:', allBookings.map(c => ({ id: c.id, checkIn: c.checkIn, checkOut: c.checkOut, status: c.status })));
}
test().catch(console.error).finally(() => prisma.$disconnect());
