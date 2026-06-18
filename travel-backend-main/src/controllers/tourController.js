const fs = require('fs');
const path = require('path');
const { ZodError } = require('zod');
const tourService = require('../services/tourService');
const { createSchema, updateSchema, querySchema } = require('../validations/tourValidation');

/**
 * Helper function to generate safe URL slugs from string (supporting Vietnamese characters)
 */
const slugify = (text) => {
  return text
    .toString()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[đĐ]/g, 'd')
    .replace(/([^a-z0-9\s-]|_)+/g, '') // remove invalid chars
    .trim()
    .replace(/\s+/g, '-') // replace spaces with -
    .replace(/-+/g, '-'); // replace multiple - with single -
};

/**
 * Controller to handle all HTTP requests for Tours
 */
class TourController {
  /**
   * GET /api/tours
   * Fetch all active tours with pagination
   */
  getAll = async (req, res, next) => {
    try {
      const { page, limit } = req.query;
      const { tours, pagination } = await tourService.getAll(page, limit);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách tour thành công',
        data: tours,
        pagination,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/tours/:id
   * Fetch a single active tour by ID
   */
  getById = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID tour không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const tour = await tourService.getById(id);
      if (!tour) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tour du lịch',
          errorCode: 'NOT_FOUND',
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Lấy chi tiết tour thành công',
        data: tour,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/tours
   * Create a new tour (supports multipart file upload for thumbnail)
   */
  create = async (req, res, next) => {
    try {
      if (req.file) {
        req.body.thumbnail = `/uploads/${req.file.filename}`;
      }

      // Perform validation inside controller to handle cleanup on errors
      const validatedData = await createSchema.body.parseAsync(req.body);

      // Generate slug if not provided
      if (!validatedData.slug) {
        validatedData.slug = slugify(validatedData.title);
      }

      // Check slug uniqueness
      const existingTour = await tourService.getBySlug(validatedData.slug, true);
      if (existingTour) {
        validatedData.slug = `${validatedData.slug}-${Date.now()}`;
      }

      const newTour = await tourService.create(validatedData);

      return res.status(201).json({
        success: true,
        message: 'Tạo tour du lịch thành công',
        data: newTour,
      });
    } catch (error) {
      // Clean up uploaded file if database insertion or validation fails
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }

      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return next(error);
    }
  };

  /**
   * PUT /api/tours/:id
   * Update tour details (supports updating the thumbnail image)
   */
  update = async (req, res, next) => {
    let newFileUploaded = false;
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID tour không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const existingTour = await tourService.getById(id);
      if (!existingTour) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tour du lịch để cập nhật',
          errorCode: 'NOT_FOUND',
        });
      }

      if (req.file) {
        req.body.thumbnail = `/uploads/${req.file.filename}`;
        newFileUploaded = true;
      }

      // Perform validation inside controller to handle cleanup on errors
      const validatedData = await updateSchema.body.parseAsync(req.body);

      // If title is updated, update slug if not explicitly provided
      if (validatedData.title && !validatedData.slug) {
        validatedData.slug = slugify(validatedData.title);
        if (validatedData.slug !== existingTour.slug) {
          const existingSlug = await tourService.getBySlug(validatedData.slug, true);
          if (existingSlug) {
            validatedData.slug = `${validatedData.slug}-${Date.now()}`;
          }
        }
      }

      const updatedTour = await tourService.update(id, validatedData);

      // Clean up the old local file if a new file was uploaded successfully
      if (newFileUploaded && existingTour.thumbnail && existingTour.thumbnail.startsWith('/uploads/')) {
        const oldFilePath = path.join(__dirname, '../../', existingTour.thumbnail);
        fs.unlink(oldFilePath, () => {});
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật thông tin tour thành công',
        data: updatedTour,
      });
    } catch (error) {
      // Clean up uploaded file if update fails
      if (req.file) {
        fs.unlink(req.file.path, () => {});
      }

      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu đầu vào không hợp lệ',
          errors: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        });
      }
      return next(error);
    }
  };

  /**
   * DELETE /api/tours/:id
   * Soft delete a tour by setting its deletedAt timestamp
   */
  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID tour không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const existingTour = await tourService.getById(id);
      if (!existingTour) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tour du lịch để xóa',
          errorCode: 'NOT_FOUND',
        });
      }

      await tourService.softDelete(id);

      return res.status(200).json({
        success: true,
        message: 'Xóa tour thành công (soft delete)',
        data: {},
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/tours/search?keyword=
   * Search active tours by title or location keyword
   */
  search = async (req, res, next) => {
    try {
      const { keyword, page, limit } = req.query;
      const { tours, pagination } = await tourService.search(keyword, page, limit);

      return res.status(200).json({
        success: true,
        message: 'Tìm kiếm danh sách tour thành công',
        data: tours,
        pagination,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/tours/filter
   * Filter active tours using various criteria
   */
  filter = async (req, res, next) => {
    try {
      const { page, limit, sortBy, ...filters } = req.query;
      const { tours, pagination } = await tourService.filter({ ...filters, sortBy }, page, limit);

      return res.status(200).json({
        success: true,
        message: 'Lọc danh sách tour thành công',
        data: tours,
        pagination,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/tours/popular
   * Fetch top 10 popular tours sorted by bookingCount desc, rating desc
   */
  popular = async (req, res, next) => {
    try {
      const tours = await tourService.getPopular(10);

      return res.status(200).json({
        success: true,
        message: 'Lấy danh sách tour nổi bật thành công',
        data: tours,
      });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new TourController();
