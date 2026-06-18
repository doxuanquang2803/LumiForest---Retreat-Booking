const path = require('path');
const settingsService = require('../services/settingsService');
const { uploadToSupabase } = require('../lib/supabaseStorage');
const auditLogger = require('../utils/auditLogger');

class SettingsController {
  getAll = async (req, res, next) => {
    try {
      const settings = await settingsService.getAll();
      return res.status(200).json({ success: true, data: settings });
    } catch (err) {
      return next(err);
    }
  };

  getByKey = async (req, res, next) => {
    try {
      const { key } = req.params;
      const value = await settingsService.getByKey(key);
      if (value === null) {
        return res.status(404).json({ success: false, message: `Không tìm thấy cấu hình cho khóa ${key}`, errorCode: 'NOT_FOUND' });
      }
      return res.status(200).json({ success: true, data: value });
    } catch (err) {
      return next(err);
    }
  };

  update = async (req, res, next) => {
    try {
      const { key, value } = req.body;
      if (!key) {
        return res.status(400).json({ success: false, message: 'Khóa cài đặt (key) không được để trống', errorCode: 'VALIDATION_ERROR' });
      }

      await settingsService.upsert(key, value);

      if (req.user && req.user.id) {
        await auditLogger.log('UPDATE_SETTINGS', req.user.id, 'SystemSetting', null, { key, value });
      }

      return res.status(200).json({ success: true, message: 'Cập nhật cấu hình thành công' });
    } catch (err) {
      return next(err);
    }
  };

  uploadImage = async (req, res, next) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'Không tìm thấy file ảnh để tải lên', errorCode: 'VALIDATION_ERROR' });
      }

      const ext = path.extname(req.file.originalname) || '.png';
      const fileName = `settings-${Date.now()}-${Math.floor(Math.random() * 1e9)}${ext}`;

      const publicUrl = await uploadToSupabase(req.file.buffer, fileName, req.file.mimetype, 'tour-images', 'settings');

      return res.status(200).json({
        success: true,
        message: 'Tải ảnh lên thành công',
        data: { imageUrl: publicUrl }
      });
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = new SettingsController();
