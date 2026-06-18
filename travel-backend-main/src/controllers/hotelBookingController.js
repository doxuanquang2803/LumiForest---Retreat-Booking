const bookingService = require('../services/bookingService');

class HotelBookingController {
  create = async (req, res, next) => {
    const booking = await bookingService.create(req.body, req.user?.id);
    return res.status(201).json({ success: true, message: 'Đặt phòng thành công', data: booking });
  };

  getMy = async (req, res, next) => {
    const { page, limit, ...filters } = req.query;
    const result = await bookingService.getMy(req.user.id, filters, page, limit);
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách booking của bạn thành công',
      data: result.bookings,
      pagination: result.pagination,
    });
  };

  // req.booking is pre-fetched and ownership-verified by checkHotelBookingOwnership middleware
  getById = async (req, res, next) => {
    return res.status(200).json({ success: true, message: 'Lấy chi tiết booking thành công', data: req.booking });
  };

  getQrCode = async (req, res, next) => {
    try {
      const booking = req.booking;
      const qrCodeLib = require('qrcode');
      const qrText = JSON.stringify({
        bookingType: 'HOTEL',
        bookingId: booking.id,
        customerName: booking.fullName,
        phone: booking.phone,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
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

  // req.booking is pre-fetched and ownership-verified by checkHotelBookingOwnership middleware
  cancel = async (req, res, next) => {
    const booking = await bookingService.cancel(req.booking.id, req.user.id, req.user.role);
    return res.status(200).json({ success: true, message: 'Hủy booking thành công', data: booking });
  };

  checkIn = async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const booking = await bookingService.checkIn(id);
    return res.status(200).json({ success: true, message: 'Check-in thành công', data: booking });
  };

  checkOut = async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const booking = await bookingService.checkOut(id);
    return res.status(200).json({ success: true, message: 'Check-out thành công', data: booking });
  };

  getAll = async (req, res, next) => {
    const { page, limit, ...filters } = req.query;
    const result = await bookingService.getAll(filters, page, limit);
    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách booking thành công',
      data: result.bookings,
      pagination: result.pagination,
    });
  };

  updateStatus = async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const booking = await bookingService.updateStatus(id, req.body.status);
    return res.status(200).json({ success: true, message: 'Cập nhật trạng thái thành công', data: booking });
  };

  delete = async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    await bookingService.delete(id);
    return res.status(200).json({ success: true, message: 'Xóa booking thành công', data: {} });
  };
}

module.exports = new HotelBookingController();
