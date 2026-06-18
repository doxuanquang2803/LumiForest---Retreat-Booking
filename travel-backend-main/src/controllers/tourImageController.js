const path = require('path');
const tourImageService = require('../services/tourImageService');
const { uploadToSupabase, deleteFromSupabase } = require('../lib/supabaseStorage');

/**
 * Controller to handle all HTTP requests for Tour Images
 * Images are uploaded to Supabase Storage
 */
class TourImageController {
  /**
   * POST /api/tour-images
   * Add a new image to a tour (uploads to Supabase Storage)
   */
  create = async (req, res, next) => {
    try {
      if (req.file) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileName = uniqueSuffix + path.extname(req.file.originalname);

        // Upload to Supabase Storage
        const publicUrl = await uploadToSupabase(req.file.buffer, fileName, req.file.mimetype);
        req.body.imageUrl = publicUrl;
      }

      if (!req.body.imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp file ảnh (field name: image) hoặc đường dẫn imageUrl',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const image = await tourImageService.create(req.body);

      return res.status(201).json({
        success: true,
        message: 'Thêm hình ảnh tour thành công',
        data: image,
      });
    } catch (error) {
      // If upload succeeded but DB insert failed, clean up from Supabase
      if (req.body.imageUrl && req.body.imageUrl.includes('supabase')) {
        await deleteFromSupabase(req.body.imageUrl).catch(() => {});
      }
      return next(error);
    }
  };

  /**
   * DELETE /api/tour-images/:id
   * Remove an image from database and Supabase Storage
   */
  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID hình ảnh không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      // Delete from database (service also syncs tour thumbnail/gallery)
      const deletedImage = await tourImageService.delete(id);

      // Clean up file from Supabase Storage
      if (deletedImage && deletedImage.imageUrl) {
        await deleteFromSupabase(deletedImage.imageUrl).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        message: 'Xóa hình ảnh tour thành công',
        data: {},
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * PUT /api/tour-images/:id
   * Update an image (replaces file on Supabase Storage)
   */
  update = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID hình ảnh không hợp lệ',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      // Check if the image exists
      const existing = await tourImageService.getById(id);
      if (!existing) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hình ảnh để cập nhật',
          errorCode: 'NOT_FOUND',
        });
      }

      if (req.file) {
        // Generate unique filename and upload to Supabase
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileName = uniqueSuffix + path.extname(req.file.originalname);
        const publicUrl = await uploadToSupabase(req.file.buffer, fileName, req.file.mimetype);
        req.body.imageUrl = publicUrl;
      }

      // Update in database (service also syncs tour thumbnail/gallery)
      const updatedImage = await tourImageService.update(id, req.body);

      // Delete the old file from Supabase if a new file was uploaded
      if (req.file && existing.imageUrl) {
        await deleteFromSupabase(existing.imageUrl).catch(() => {});
      }

      return res.status(200).json({
        success: true,
        message: 'Cập nhật hình ảnh tour thành công',
        data: updatedImage,
      });
    } catch (error) {
      // Clean up newly uploaded file if DB update fails
      if (req.body.imageUrl && req.body.imageUrl.includes('supabase')) {
        await deleteFromSupabase(req.body.imageUrl).catch(() => {});
      }
      return next(error);
    }
  };
}

module.exports = new TourImageController();
