const hotelService = require('../services/hotelService');

class HotelController {
  getAll = async (req, res, next) => {
    try {
      const { page, limit, ...filters } = req.query;
      const { hotels, pagination } = await hotelService.getAll(filters, page, limit);
      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách khách sạn thành công',
        data: hotels,
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total: pagination.total,
          totalPages: pagination.totalPages,
        },
      });
    } catch (error) {
      return next(error);
    }
  };

  getById = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID khách sạn không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const hotel = await hotelService.getById(id);
      if (!hotel) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy khách sạn', errorCode: 'NOT_FOUND' });
      }

      return res.status(200).json({ success: true, message: 'Lấy chi tiết khách sạn thành công', data: hotel });
    } catch (error) {
      return next(error);
    }
  };

  create = async (req, res, next) => {
    try {
      const hotel = await hotelService.create(req.body);
      return res.status(201).json({ success: true, message: 'Tạo khách sạn thành công', data: hotel });
    } catch (error) {
      return next(error);
    }
  };

  update = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID khách sạn không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const existing = await hotelService.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy khách sạn để cập nhật', errorCode: 'NOT_FOUND' });
      }

      const updated = await hotelService.update(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật khách sạn thành công', data: updated });
    } catch (error) {
      return next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID khách sạn không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const existing = await hotelService.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy khách sạn để xóa', errorCode: 'NOT_FOUND' });
      }

      await hotelService.delete(id);
      return res.status(200).json({ success: true, message: 'Xóa khách sạn thành công', data: {} });
    } catch (error) {
      return next(error);
    }
  };

  search = async (req, res, next) => {
    try {
      const { page, limit, q } = req.query;
      const { hotels, pagination } = await hotelService.getAll({ q }, page, limit);
      return res.status(200).json({
        success: true,
        message: 'Tìm kiếm khách sạn thành công',
        data: hotels,
        pagination: { page: pagination.page, limit: pagination.limit, total: pagination.total, totalPages: pagination.totalPages },
      });
    } catch (error) {
      return next(error);
    }
  };

  filter = async (req, res, next) => {
    try {
      const { page, limit, ...filters } = req.query;
      const { hotels, pagination } = await hotelService.getAll(filters, page, limit);
      return res.status(200).json({
        success: true,
        message: 'Lọc danh sách khách sạn thành công',
        data: hotels,
        pagination: { page: pagination.page, limit: pagination.limit, total: pagination.total, totalPages: pagination.totalPages },
      });
    } catch (error) {
      return next(error);
    }
  };

  getFeatured = async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 8;
      const hotels = await hotelService.getFeatured(limit);
      return res.status(200).json({ success: true, message: 'Lấy khách sạn nổi bật thành công', data: hotels });
    } catch (error) {
      return next(error);
    }
  };

  getPopular = async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit, 10) : 10;
      const hotels = await hotelService.getPopular(limit);
      return res.status(200).json({ success: true, message: 'Lấy khách sạn phổ biến thành công', data: hotels });
    } catch (error) {
      return next(error);
    }
  };

  getRecommendations = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID khách sạn không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const existing = await hotelService.getById(id);
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy khách sạn', errorCode: 'NOT_FOUND' });
      }

      const hotels = await hotelService.getRecommendations(id);
      return res.status(200).json({ success: true, message: 'Lấy khách sạn đề xuất thành công', data: hotels });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new HotelController();
