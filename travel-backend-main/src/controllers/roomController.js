const roomService = require('../services/roomService');

class RoomController {
  getAll = async (req, res, next) => {
    try {
      const { page, limit, ...filters } = req.query;
      const { rooms, pagination } = await roomService.getAll(filters, page, limit);
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách phòng thành công',
        data: rooms,
        pagination: { page: pagination.page, limit: pagination.limit, total: pagination.total, totalPages: pagination.totalPages },
      });
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID phòng không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const room = await roomService.getById(id);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phòng', errorCode: 'NOT_FOUND' });
      }

      return res.status(200).json({ success: true, message: 'Lấy chi tiết phòng thành công', data: room });
    } catch (error) {
      return next(error);
    }
  };

  getByHotelId = async (req, res, next) => {
    try {
      const hotelId = parseInt(req.params.hotelId, 10);
      if (isNaN(hotelId)) {
        return res.status(400).json({ success: false, message: 'ID khách sạn không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const rooms = await roomService.getByHotelId(hotelId, req.query);
      return res.status(200).json({ success: true, message: 'Lấy danh sách phòng theo khách sạn thành công', data: rooms });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const room = await roomService.create(req.body);
      return res.status(201).json({ success: true, message: 'Tạo phòng thành công', data: room });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID phòng không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const existing = await roomService.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để cập nhật', errorCode: 'NOT_FOUND' });
      }

      const updated = await roomService.update(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật phòng thành công', data: updated });
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID phòng không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const existing = await roomService.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phòng để xóa', errorCode: 'NOT_FOUND' });
      }

      await roomService.delete(id);
      return res.status(200).json({ success: true, message: 'Xóa phòng thành công', data: {} });
    } catch (error) {
      return next(error);
    }
  };

  getAvailability = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID phòng không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const room = await roomService.getById(id);
      if (!room) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phòng', errorCode: 'NOT_FOUND' });
      }

      return res.status(200).json({
        success: true,
        message: 'Lấy trạng thái phòng thành công',
        data: { available: room.status === 'available', status: room.status },
      });
    } catch (error) {
      return next(error);
    }
  };

  updateStatus = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID phòng không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const existing = await roomService.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy phòng', errorCode: 'NOT_FOUND' });
      }

      const updated = await roomService.updateStatus(id, req.body.status);
      return res.status(200).json({ success: true, message: 'Cập nhật trạng thái phòng thành công', data: updated });
    } catch (error) {
      return next(error);
    }
  };

  getBookedDates = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID phòng không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const prisma = require('../config/prismaClient');
      const bookings = await prisma.hotelBooking.findMany({
        where: {
          roomId: id,
          status: { notIn: ['cancelled'] },
        },
        select: {
          checkIn: true,
          checkOut: true,
        },
      });

      const bookedRanges = bookings.map((b) => ({
        checkIn: b.checkIn.toISOString().split('T')[0],
        checkOut: b.checkOut.toISOString().split('T')[0],
      }));

      return res.status(200).json({ success: true, data: bookedRanges });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new RoomController();
