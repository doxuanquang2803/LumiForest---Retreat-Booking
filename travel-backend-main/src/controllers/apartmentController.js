const apartmentService = require('../services/apartmentService');

/**
 * Controller to handle all HTTP requests for Apartments
 */
class ApartmentController {
  /**
   * GET /api/apartments
   * Fetch all apartments with pagination and query filters
   */
  getAll = async (req, res, next) => {
    try {
      const { page, limit, ...filters } = req.query;
      const { apartments, pagination } = await apartmentService.getAll(filters, page, limit);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách căn hộ thành công',
        data: apartments,
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

  /**
   * GET /api/apartments/:id
   * Fetch a single apartment by ID
   */
  getById = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID căn hộ không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const apartment = await apartmentService.getById(id);
      if (!apartment) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy căn hộ',
          errorCode: 'NOT_FOUND',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết căn hộ thành công',
        data: apartment,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/apartments
   * Create a new apartment
   */
  create = async (req, res, next) => {
    try {
      const apartment = await apartmentService.create(req.body);

      return res.status(201).json({
        success: true,
        message: 'Tạo căn hộ thành công',
        data: apartment,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/apartments/:id
   * Update an existing apartment
   */
  update = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID căn hộ không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      // Check if apartment exists
      const existing = await apartmentService.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy căn hộ để cập nhật',
          errorCode: 'NOT_FOUND',
        });
      }

      const updatedApartment = await apartmentService.update(id, req.body);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật căn hộ thành công',
        data: updatedApartment,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/apartments/:id
   * Delete an apartment
   */
  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID căn hộ không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      // Check if apartment exists
      const existing = await apartmentService.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy căn hộ để xóa',
          errorCode: 'NOT_FOUND',
        });
      }

      await apartmentService.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Xóa căn hộ thành công',
        data: {},
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/apartments/search?q=
   * Search apartments by query q
   */
  search = async (req, res, next) => {
    try {
      const { q, page, limit } = req.query;
      const { apartments, pagination } = await apartmentService.getAll({ q }, page, limit);

      return res.status(200).json({
        success: true,
        message: 'Tìm kiếm căn hộ thành công',
        data: apartments,
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

  /**
   * GET /api/apartments/filter
   * Filter apartments using various criteria
   */
  filter = async (req, res, next) => {
    try {
      const { page, limit, ...filters } = req.query;
      const { apartments, pagination } = await apartmentService.getAll(filters, page, limit);

      return res.status(200).json({
        success: true,
        message: 'Lọc danh sách căn hộ thành công',
        data: apartments,
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

  getBookedDates = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID căn hộ không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const prisma = require('../config/prismaClient');
      const bookings = await prisma.bookings.findMany({
        where: {
          item_id: BigInt(id),
          booking_type: 'apartment',
          status: { notIn: ['cancelled'] },
        },
        select: {
          checkin: true,
          checkout: true,
        },
      });

      const bookedRanges = bookings.map((b) => ({
        checkIn: b.checkin.toISOString().split('T')[0],
        checkOut: b.checkout.toISOString().split('T')[0],
      }));

      return res.status(200).json({ success: true, data: bookedRanges });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new ApartmentController();
