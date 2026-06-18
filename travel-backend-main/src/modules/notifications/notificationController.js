const notificationService = require('./notificationService');
const { serializeBigInt } = require('../../utils/bigintSerializer');

exports.getAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.query;
    const { notifications, pagination } = await notificationService.getAllNotifications(userId, page, limit);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy danh sách thông báo thành công',
      data: notifications,
      pagination
    }));
  } catch (error) {
    return next(error);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    const updated = await notificationService.markAsRead(BigInt(id), userId);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Đánh dấu đã đọc thành công',
      data: updated
    }));
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    return next(error);
  }
};

exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID thông báo không hợp lệ'
      });
    }
    await notificationService.deleteNotification(BigInt(id), userId);
    return res.status(200).json({
      success: true,
      message: 'Xóa thông báo thành công'
    });
  } catch (error) {
    if (error.status) {
      return res.status(error.status).json({
        success: false,
        message: error.message
      });
    }
    return next(error);
  }
};
