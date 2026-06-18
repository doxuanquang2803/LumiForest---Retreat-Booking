require('dotenv').config();
const prisma = require('./src/config/prismaClient');
const paymentService = require('./src/services/paymentService');

async function test() {
  try {
    const tourBooking = await prisma.tourBooking.findFirst();
    if (!tourBooking) {
      console.log('No tour booking found');
      return;
    }
    console.log('TourBooking found:', tourBooking.id);
    
    const data = {
      bookingType: 'TOUR',
      tourBookingId: tourBooking.id,
      method: 'bank_transfer'
    };
    
    const payment = await paymentService.create(data, null);
    console.log('Payment created:', payment.id, payment.transactionId);
    
    const updated = await paymentService.callback(payment.transactionId, 'completed');
    console.log('Callback successful.');
    
    // Check if email was sent by verifying updated object has the right structure
    if (updated.tourBooking && updated.tourBooking.tour) {
      console.log('Customer Email:', updated.tourBooking.email);
    } else {
      console.log('Tour nested data missing in INCLUDE_ALL!');
    }
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await prisma.$disconnect();
  }
}
test();
