const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/hotelBookingController');
const auth = require('../middleware/auth');
const { authorizeRoles, isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { checkHotelBookingOwnership } = require('../middleware/checkOwnership');
const ROLES = require('../constants/roles');
const { createSchema, updateStatusSchema, querySchema } = require('../validations/bookingValidation');
const prisma = require('../config/prismaClient');
const crypto = require('crypto');

// ── Apartment bookings ──────────────────────────────────────────────────────
router.post('/apartment', auth, asyncHandler(async (req, res) => {
  const { item_id, name, phone, checkin, checkout, guests } = req.body;

  if (!item_id || !checkin || !checkout || !name || !phone) {
    return res.status(400).json({ success: false, message: 'Thiếu thông tin bắt buộc.' });
  }

  const d1 = new Date(checkin), d2 = new Date(checkout);
  if (d2 <= d1) return res.status(400).json({ success: false, message: 'Ngày trả phải sau ngày nhận.' });
  
  const { booking, apt } = await prisma.$transaction(async (tx) => {
    // 1. Lock the apartment row to prevent concurrent race conditions
    await tx.$executeRaw`SELECT 1 FROM apartments WHERE id = ${parseInt(item_id)} FOR UPDATE`;

    const apt = await tx.apartment.findUnique({ where: { id: parseInt(item_id) } });
    if (!apt) {
      throw Object.assign(new Error('Không tìm thấy căn hộ.'), { status: 404 });
    }

    const conflict = await tx.bookings.findFirst({
      where: {
        booking_type: 'apartment',
        item_id: BigInt(item_id),
        status: { notIn: ['cancelled', 'rejected'] },
        checkin: { lt: d2 },
        checkout: { gt: d1 },
      }
    });

    if (conflict) {
      throw Object.assign(new Error('Căn hộ đã được đặt trong khoảng thời gian này'), { status: 409 });
    }

    const nights = Math.ceil((d2 - d1) / 86400000);

    const booking = await tx.bookings.create({
      data: {
        booking_type:   'apartment',
        item_id:        BigInt(item_id),
        name,
        email:          req.user.email,
        phone,
        checkin:        d1,
        checkout:       d2,
        guests:         parseInt(guests) || 1,
        total_price:    apt.price * nights,
        status:         'pending',
        payment_status: 'unpaid',
      },
    });

    return { booking, apt };
  });

  return res.status(201).json({ success: true, message: 'Đặt căn hộ thành công', data: { ...booking, apartment: apt } });
}));

router.get('/apartment/my', auth, asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 50);

  const where = { email: req.user.email, booking_type: 'apartment' };

  const [total, bookings] = await Promise.all([
    prisma.bookings.count({ where }),
    prisma.bookings.findMany({
      where,
      orderBy: { created_at: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
  ]);

  // Attach apartment details
  const aptIds = [...new Set(bookings.map(b => Number(b.item_id)).filter(Boolean))];
  const apartments = aptIds.length
    ? await prisma.apartment.findMany({ where: { id: { in: aptIds } }, select: { id: true, title: true, location: true, address: true, thumbnail: true } })
    : [];
  const aptMap = Object.fromEntries(apartments.map(a => [a.id, a]));

  const data = bookings.map(b => ({ ...b, apartment: aptMap[Number(b.item_id)] || null }));

  return res.status(200).json({
    success: true,
    message: 'Lấy lịch sử đặt căn hộ thành công',
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}));

router.get('/apartment', auth, isStaffOrAdmin, asyncHandler(async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page, 10)  || 1);
  const limit = Math.max(1, parseInt(req.query.limit, 10) || 50);

  const [total, bookings] = await Promise.all([
    prisma.bookings.count({ where: { booking_type: 'apartment' } }),
    prisma.bookings.findMany({
      where: { booking_type: 'apartment' },
      orderBy: { created_at: 'desc' },
      skip:  (page - 1) * limit,
      take:  limit,
    }),
  ]);

  const aptIds = [...new Set(bookings.map(b => Number(b.item_id)).filter(Boolean))];
  const apartments = aptIds.length
    ? await prisma.apartment.findMany({ where: { id: { in: aptIds } }, select: { id: true, title: true, location: true, address: true, thumbnail: true } })
    : [];
  const aptMap = Object.fromEntries(apartments.map(a => [a.id, a]));

  const emails = [...new Set(bookings.map(b => b.email).filter(Boolean))];
  const users = emails.length
    ? await prisma.users.findMany({ where: { email: { in: emails } }, select: { id: true, name: true, email: true } })
    : [];
  const userMap = Object.fromEntries(users.map(u => [u.email, u]));

  const data = bookings.map(b => ({
    id: Number(b.id),
    createdAt: b.created_at,
    totalPrice: Number(b.total_price),
    status: b.status,
    paymentStatus: b.payment_status,
    checkin: b.checkin,
    checkout: b.checkout,
    guests: b.guests,
    apartment: aptMap[Number(b.item_id)] || null,
    user: userMap[b.email] ? { ...userMap[b.email], phone: b.phone } : { name: b.name, email: b.email, phone: b.phone },
  }));

  return res.status(200).json({
    success: true,
    message: 'Lấy tất cả lịch sử đặt căn hộ thành công',
    data,
    pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
  });
}));

router.get('/apartment/:id', auth, isStaffOrAdmin, asyncHandler(async (req, res) => {
  const id = BigInt(req.params.id);
  const booking = await prisma.bookings.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng.' });

  const apt = await prisma.apartment.findUnique({ where: { id: Number(booking.item_id) } });
  const user = await prisma.users.findFirst({ where: { email: booking.email }, select: { id: true, name: true, email: true } });

  return res.status(200).json({
    success: true,
    data: {
      id: Number(booking.id),
      createdAt: booking.created_at,
      totalPrice: Number(booking.total_price),
      paymentStatus: booking.payment_status,
      checkin: booking.checkin,
      checkout: booking.checkout,
      status: booking.status,
      guests: booking.guests,
      apartment: apt,
      user: user ? { ...user, phone: booking.phone } : { name: booking.name, email: booking.email, phone: booking.phone },
    }
  });
}));

router.put('/apartment/:id/cancel', auth, asyncHandler(async (req, res) => {
  const id = BigInt(req.params.id);
  const booking = await prisma.bookings.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng.' });
  if (booking.email !== req.user.email) return res.status(403).json({ success: false, message: 'Không có quyền.' });
  if (booking.status === 'cancelled') return res.status(400).json({ success: false, message: 'Đặt phòng đã hủy rồi.' });

  const updated = await prisma.bookings.update({ where: { id }, data: { status: 'cancelled' } });
  return res.status(200).json({ success: true, message: 'Hủy đặt căn hộ thành công', data: updated });
}));

router.get('/apartment/:id/qr', auth, asyncHandler(async (req, res) => {
  const id = BigInt(req.params.id);
  const booking = await prisma.bookings.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng.' });

  if (booking.email !== req.user.email && req.user.role !== 'ADMIN' && req.user.role !== 'STAFF' && req.user.role !== 'admin' && req.user.role !== 'staff') {
    return res.status(403).json({ success: false, message: 'Không có quyền.' });
  }

  const qrCodeLib = require('qrcode');
  const qrText = JSON.stringify({
    bookingType: 'APARTMENT',
    bookingId: booking.id.toString(),
    customerName: booking.name,
    phone: booking.phone,
    checkIn: booking.checkin,
    checkOut: booking.checkout,
    guests: booking.guests,
    status: booking.status,
    paymentStatus: booking.paymentStatus,
  });

  const buffer = await qrCodeLib.toBuffer(qrText, {
    type: 'png',
    width: 300,
    margin: 2,
  });

  res.setHeader('Content-Type', 'image/png');
  return res.send(buffer);
}));

router.put('/apartment/:id/status', auth, isStaffOrAdmin, asyncHandler(async (req, res) => {
  const id = BigInt(req.params.id);
  const booking = await prisma.bookings.findUnique({ where: { id } });
  if (!booking) return res.status(404).json({ success: false, message: 'Không tìm thấy đặt phòng.' });

  const updated = await prisma.bookings.update({
    where: { id },
    data: { status: req.body.status },
  });
  return res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: updated });
}));

// Static routes trước :id
router.get('/my',   auth, validate(querySchema), asyncHandler(bookingController.getMy));
router.get('/',     auth, isStaffOrAdmin, validate(querySchema), asyncHandler(bookingController.getAll));

// CRUD — any authenticated user can create; ownership checked for GET /:id
router.post('/',    auth, validate(createSchema), asyncHandler(bookingController.create));
router.get('/:id',  auth, checkHotelBookingOwnership, asyncHandler(bookingController.getById));
router.delete('/:id', auth, isAdmin, asyncHandler(bookingController.delete));

// Status actions — cancel requires ownership; checkin/checkout/status require STAFF/ADMIN
router.put('/:id/cancel',   auth, checkHotelBookingOwnership, asyncHandler(bookingController.cancel));
router.put('/:id/checkin',  auth, isStaffOrAdmin, asyncHandler(bookingController.checkIn));
router.put('/:id/checkout', auth, isStaffOrAdmin, asyncHandler(bookingController.checkOut));
router.put('/:id/status',   auth, isStaffOrAdmin, validate(updateStatusSchema), asyncHandler(bookingController.updateStatus));

module.exports = router;
