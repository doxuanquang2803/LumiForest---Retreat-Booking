require('dotenv').config();
const prisma = require('./src/config/prismaClient');
const bookingService = require('./src/services/bookingService');
const tourBookingService = require('./src/services/tourBookingService');

async function testHotelBookingConcurrency() {
  console.log('--- Testing Hotel Booking Concurrency ---');
  let room = await prisma.room.findFirst({ where: { status: 'available' } });
  if (!room) {
    const hotel = await prisma.hotel.findFirst();
    if (!hotel) {
      console.log('No hotel found, skipping hotel concurrency test.');
      return;
    }
    room = await prisma.room.create({
      data: {
        hotelId: hotel.id,
        name: 'Concurrency Test Room',
        type: 'Deluxe',
        description: 'Test room',
        price: 100,
        maxGuests: 2,
        thumbnail: 'image.jpg',
        status: 'available',
      }
    });
  }

  const roomId = room.id;
  const bookingData = {
    roomId,
    checkIn: '2026-07-01',
    checkOut: '2026-07-03',
    fullName: 'Test User',
    email: 'test@example.com',
    phone: '123456789',
    guests: 2
  };

  await prisma.hotelBooking.deleteMany({
    where: {
      roomId,
      checkIn: new Date(bookingData.checkIn),
      checkOut: new Date(bookingData.checkOut),
    }
  });

  console.log(`Attempting 2 concurrent bookings for Room ID ${roomId}...`);

  const results = await Promise.allSettled([
    bookingService.create(bookingData, null),
    bookingService.create(bookingData, null)
  ]);

  let successes = 0;
  let failures = 0;

  results.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      successes++;
      console.log(`Request ${index + 1} succeeded: Booking ID ${res.value.id}`);
    } else {
      failures++;
      console.log(`Request ${index + 1} failed: ${res.reason.message}`);
    }
  });

  console.log(`Results: ${successes} succeeded, ${failures} failed.`);
  if (successes === 1 && failures === 1) {
    console.log('SUCCESS: Concurrency check passed! Exactly one booking succeeded.');
  } else {
    console.error('FAILURE: Concurrency check failed! Double booking occurred or both failed.');
  }
}

async function testTourBookingConcurrency() {
  console.log('\n--- Testing Tour Booking Concurrency ---');
  let tour = await prisma.tour.findFirst({ where: { status: 'active', deletedAt: null } });
  if (!tour) {
    console.log('No active tour found, skipping tour concurrency test.');
    return;
  }

  const tourId = tour.id;
  const oldMaxGuests = tour.maxGuests;

  // Let's set its maxGuests to a small number, e.g., 5, to test capacity overflow
  await prisma.tour.update({
    where: { id: tourId },
    data: { maxGuests: 5 }
  });

  const bookingDate = '2026-07-01';

  await prisma.tourBooking.deleteMany({
    where: {
      tourId,
      bookingDate: new Date(bookingDate),
    }
  });

  await prisma.tour.update({
    where: { id: tourId },
    data: { bookingCount: 0 }
  });

  console.log(`Tour maxGuests = 5. Attempting 2 concurrent bookings of 3 guests each...`);

  const results = await Promise.allSettled([
    tourBookingService.create({
      tourId,
      fullName: 'User A',
      email: 'usera@example.com',
      phone: '123456789',
      bookingDate,
      guests: 3
    }),
    tourBookingService.create({
      tourId,
      fullName: 'User B',
      email: 'userb@example.com',
      phone: '987654321',
      bookingDate,
      guests: 3
    })
  ]);

  let successes = 0;
  let failures = 0;

  results.forEach((res, index) => {
    if (res.status === 'fulfilled') {
      successes++;
      console.log(`Request ${index + 1} succeeded: Booking ID ${res.value.id}`);
    } else {
      failures++;
      console.log(`Request ${index + 1} failed: ${res.reason.message}`);
    }
  });

  // Restore maxGuests
  await prisma.tour.update({
    where: { id: tourId },
    data: { maxGuests: oldMaxGuests }
  });

  console.log(`Results: ${successes} succeeded, ${failures} failed.`);
  if (successes === 1 && failures === 1) {
    console.log('SUCCESS: Concurrency check passed! Capacity limit enforced under concurrency.');
  } else {
    console.error('FAILURE: Concurrency check failed!');
  }
}

async function main() {
  try {
    await testHotelBookingConcurrency();
    await testTourBookingConcurrency();
  } catch (err) {
    console.error('Error during test execution:', err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
