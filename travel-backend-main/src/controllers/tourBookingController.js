const { ZodError } = require('zod');
const tourBookingService = require('../services/tourBookingService');
const { createSchema } = require('../validations/tourBookingValidation');

class TourBookingController {
  /**
   * POST /api/tour-bookings
   * Create a new tour booking
   */
  create = async (req, res, next) => {
    // Validate request body using Zod inside controller
    const validatedData = await createSchema.body.parseAsync(req.body);

    // Associate user ID from JWT
    const bookingPayload = {
      ...validatedData,
      userId: validatedData.userId || req.user.id,
    };

    const booking = await tourBookingService.create(bookingPayload);

    return res.status(201).json({
      success: true,
      message: 'Đặt tour du lịch thành công',
      data: booking,
    });
  };

  /**
   * GET /api/tour-bookings
   * Get all tour bookings (Staff/Admin only)
   */
  getAll = async (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));

    const { bookings, pagination } = await tourBookingService.getAll(page, limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn đặt tour thành công',
      data: bookings,
      pagination,
    });
  };

  /**
   * GET /api/tour-bookings/my
   * Get all bookings of the logged-in user
   */
  getMyBookings = async (req, res, next) => {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));

    // Use authenticated user's ID from JWT
    const userId = req.user.id;

    const { bookings, pagination } = await tourBookingService.getByUserId(userId, page, limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn đặt tour của bạn thành công',
      data: bookings,
      pagination,
    });
  };

  /**
   * GET /api/tour-bookings/:id
   * Get detail of a specific booking — req.tourBooking pre-fetched by ownership middleware
   */
  getById = async (req, res, next) => {
    return res.status(200).json({
      success: true,
      message: 'Lấy chi tiết đơn đặt tour thành công',
      data: req.tourBooking,
    });
  };

  /**
   * PUT /api/tour-bookings/:id/cancel
   * Cancel a booking — req.tourBooking pre-fetched by ownership middleware
   */
  cancel = async (req, res, next) => {
    const cancelledBooking = await tourBookingService.cancel(req.tourBooking.id);

    return res.status(200).json({
      success: true,
      message: 'Hủy đặt tour thành công',
      data: cancelledBooking,
    });
  };

  getQrCode = async (req, res, next) => {
    try {
      const booking = req.tourBooking;
      const qrCodeLib = require('qrcode');
      const qrText = JSON.stringify({
        bookingType: 'TOUR',
        bookingId: booking.id,
        customerName: booking.fullName,
        phone: booking.phone,
        bookingDate: booking.bookingDate,
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
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new TourBookingController();
