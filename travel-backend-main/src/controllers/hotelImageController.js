const path = require('path');
const hotelImageService = require('../services/hotelImageService');
const { uploadToSupabase, deleteFromSupabase } = require('../lib/supabaseStorage');

const BUCKET_NAME = 'hotel-images';
const FOLDER_NAME = 'hotels';

class HotelImageController {
  create = async (req, res, next) => {
    try {
      if (req.file) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const fileName = uniqueSuffix + path.extname(req.file.originalname);
        const publicUrl = await uploadToSupabase(req.file.buffer, fileName, req.file.mimetype, BUCKET_NAME, FOLDER_NAME);
        req.body.imageUrl = publicUrl;
      }

      if (!req.body.imageUrl) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng cung cấp file ảnh (field name: image) hoặc đường dẫn imageUrl',
          errorCode: 'VALIDATION_ERROR',
        });
      }

      const image = await hotelImageService.create(req.body);
      return res.status(201).json({ success: true, message: 'Thêm hình ảnh khách sạn thành công', data: image });
    } catch (error) {
      if (req.body.imageUrl && req.body.imageUrl.includes('supabase')) {
        await deleteFromSupabase(req.body.imageUrl).catch(() => {});
      }
      return next(error);
    }
  };

  delete = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID hình ảnh không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const deletedImage = await hotelImageService.delete(id);

      if (deletedImage && deletedImage.imageUrl) {
        await deleteFromSupabase(deletedImage.imageUrl).catch(() => {});
      }

      return res.status(200).json({ success: true, message: 'Xóa hình ảnh khách sạn thành công', data: {} });
    } catch (error) {
      return next(error);
    }
  };

  setThumbnail = async (req, res, next) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({ success: false, message: 'ID hình ảnh không hợp lệ', errorCode: 'VALIDATION_ERROR' });
      }

      const updated = await hotelImageService.setThumbnail(id);
      return res.status(200).json({ success: true, message: 'Đặt ảnh thumbnail thành công', data: updated });
    } catch (error) {
      return next(error);
    }
  };
}

module.exports = new HotelImageController();
