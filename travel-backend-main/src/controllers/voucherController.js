const voucherService = require('../services/voucherService');

/**
 * Controller to handle all HTTP requests for Vouchers
 */
class VoucherController {
  /**
   * GET /api/vouchers
   * Fetch all vouchers with pagination, search (?q=) and query filters
   */
  getAll = async (req, res, next) => {
    try {
      const { page, limit, ...filters } = req.query;
      const { vouchers, pagination } = await voucherService.getAll(filters, page, limit);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách voucher thành công',
        data: vouchers,
        pagination,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/vouchers/active
   * Fetch all active, in-stock, and non-expired vouchers
   */
  getActive = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const { vouchers, pagination } = await voucherService.getActive(page, limit);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách voucher đang hoạt động thành công',
        data: vouchers,
        pagination,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/vouchers/expired
   * Fetch all expired vouchers
   */
  getExpired = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const { vouchers, pagination } = await voucherService.getExpired(page, limit);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách voucher đã hết hạn thành công',
        data: vouchers,
        pagination,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/vouchers/:id
   * Fetch a single voucher by ID
   */
  getById = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID voucher không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const voucher = await voucherService.getById(id);
      if (!voucher) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy voucher',
          errorCode: 'NOT_FOUND',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết voucher thành công',
        data: voucher,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/vouchers
   * Create a new voucher
   */
  create = async (req, res, next) => {
    try {
      const voucher = await voucherService.create(req.body);

      return res.status(201).json({
        success: true,
        message: 'Tạo voucher thành công',
        data: voucher,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/vouchers/:id
   * Update an existing voucher
   */
  update = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID voucher không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const updated = await voucherService.update(id, req.body);

      return res.status(200).json({
        success: true,
        message: 'Cập nhật voucher thành công',
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/vouchers/:id
   * Delete a voucher
   */
  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID voucher không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      await voucherService.delete(id);

      return res.status(200).json({
        success: true,
        message: 'Xóa voucher thành công',
        data: {},
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/vouchers/:id/image
   * Upload an image for a voucher (uploads to Supabase Storage and updates database)
   */
  uploadImage = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID voucher không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const existing = await voucherService.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy voucher',
          errorCode: 'NOT_FOUND',
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp file ảnh (field name: image)',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const path = require('path');
      const { uploadToSupabase, deleteFromSupabase } = require('../lib/supabaseStorage');
      
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = uniqueSuffix + path.extname(req.file.originalname);

      // Upload to Supabase Storage (bucket: 'tour-images', folder: 'vouchers')
      const publicUrl = await uploadToSupabase(req.file.buffer, fileName, req.file.mimetype, 'tour-images', 'vouchers');

      // Update in database
      const updated = await voucherService.update(id, { image: publicUrl });

      // Clean up the old file from Supabase if it existed
      if (existing.image && existing.image.includes('supabase')) {
        await deleteFromSupabase(existing.image).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        message: 'Tải lên hình ảnh voucher thành công',
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * DELETE /api/vouchers/:id/image
   * Delete a voucher's image
   */
  deleteImage = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID voucher không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const existing = await voucherService.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy voucher',
          errorCode: 'NOT_FOUND',
        });
      }

      // Update image to null in database
      const updated = await voucherService.update(id, { image: null });

      // Delete file from Supabase
      const { deleteFromSupabase } = require('../lib/supabaseStorage');
      if (existing.image && existing.image.includes('supabase')) {
        await deleteFromSupabase(existing.image).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        message: 'Xóa hình ảnh voucher thành công',
        data: updated,
      });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new VoucherController();

