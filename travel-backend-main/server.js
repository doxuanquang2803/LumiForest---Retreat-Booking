require('dotenv').config();

// Fix BigInt JSON serialization issue
BigInt.prototype.toJSON = function () {
  const intValue = Number(this);
  return Number.isSafeInteger(intValue) ? intValue : this.toString();
};

const express = require('express');
const path = require('path');
const cors = require('./src/middleware/cors');

const roomRoutes = require('./src/routes/rooms');
const bookingRoutes = require('./src/routes/bookings');
const paymentRoutes = require('./src/routes/payments');
const contactRoutes = require('./src/routes/contact');
const blogRoutes = require('./src/routes/blog');
const apartmentRoutes = require('./src/routes/apartments');
const apartmentImageRoutes = require('./src/routes/apartmentImages');
const voucherRoutes = require('./src/routes/vouchers');
const voucherOrderRoutes = require('./src/routes/voucherOrders');
const corporateVoucherRoutes = require('./src/routes/corporateVouchers');
const settingsRoutes = require('./src/routes/settings');

const tourRoutes = require('./src/routes/tours');
const tourImageRoutes = require('./src/routes/tourImages');
const tourBookingRoutes = require('./src/routes/tourBookings');

const authRoutes = require('./src/routes/auth');
const userRoutes = require('./src/routes/users');
const trashRoutes = require('./src/routes/trash');

const wishlistRoutes = require('./src/modules/wishlist/wishlistRoutes');
const notificationRoutes = require('./src/modules/notifications/notificationRoutes');
const reviewRoutes = require('./src/modules/reviews/reviewRoutes');
const adminRoutes = require('./src/modules/admin/adminRoutes');
const hotelRoutes = require('./src/routes/hotels');
const hotelImageRoutes = require('./src/routes/hotelImages');
const roomImageRoutes = require('./src/routes/roomImages');
const hotelBookingRoutes = require('./src/routes/hotelBookings');

const app = express();

app.use(cors);
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/apartments', apartmentRoutes);
app.use('/api/apartment-images', apartmentImageRoutes);
app.use('/api/vouchers', voucherRoutes);
app.use('/api/voucher-orders', voucherOrderRoutes);
app.use('/api/corporate-vouchers', corporateVoucherRoutes);
app.use('/api/settings', settingsRoutes);

app.use('/api/tours', tourRoutes);
app.use('/api/tour-images', tourImageRoutes);
app.use('/api/tour-bookings', tourBookingRoutes);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/trash', trashRoutes);

app.use('/api/wishlist', wishlistRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/hotel-images', hotelImageRoutes);
app.use('/api/room-images', roomImageRoutes);
app.use('/api/hotel-bookings', hotelBookingRoutes);


app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error(err);
  let status = err.status || 500;
  let errorCode = 'SERVER_ERROR';
  let message = err.message || 'Đã xảy ra lỗi hệ thống';

  // Handle Multer upload errors
  if (err.name === 'MulterError') {
    status = 400;
    errorCode = 'VALIDATION_ERROR';
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      message = 'Tên trường (Key) tải lên không hợp lệ. Tên trường bắt buộc phải là "image" hoặc "thumbnail"';
    } else if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB)';
    }
  } else {
    if (status === 400) errorCode = 'VALIDATION_ERROR';
    else if (status === 401) errorCode = 'UNAUTHORIZED';
    else if (status === 403) errorCode = 'FORBIDDEN';
    else if (status === 404) errorCode = 'NOT_FOUND';
  }

  return res.status(status).json({
    success: false,
    message: message,
    errorCode: errorCode,
  });
});

const initCronJobs = require('./src/cronJobs');
initCronJobs();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server chạy tại http://localhost:${PORT}`);
}); // Force nodemon restart (updated)
