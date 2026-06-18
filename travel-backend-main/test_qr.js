const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const jwt = require('jsonwebtoken');
require('dotenv').config();

async function main() {
  const booking = await prisma.bookings.findFirst({ where: { booking_type: 'apartment' } });
  if (!booking) {
    console.log("No apartment bookings found");
    return;
  }
  console.log("Found booking:", booking.id);
  
  const token = jwt.sign({ id: 1, role: 'staff' }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1d' });
  console.log("Token:", token);
  
  const res = await fetch(`http://localhost:3000/api/bookings/apartment/${booking.id}/qr`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  console.log("Status:", res.status);
  const text = await res.text();
  console.log("Response starts with:", text.substring(0, 100));
}
main().catch(console.error).finally(() => prisma.$disconnect());
