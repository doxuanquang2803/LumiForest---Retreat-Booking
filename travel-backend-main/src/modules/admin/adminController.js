const adminService = require('./adminService');
const { serializeBigInt } = require('../../utils/bigintSerializer');
const ROLES = require('../../constants/roles');

exports.getUsers = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getUsers(page, limit);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy danh sách người dùng thành công',
      data: result.users,
      pagination: result.pagination
    }));
  } catch (error) {
    return next(error);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
    }

    // Prevent admin from changing their own role
    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Không thể thay đổi vai trò của chính mình' });
    }

    // Normalize role to uppercase
    const role = req.body.role?.toUpperCase();
    const validRoles = Object.values(ROLES);
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Role không hợp lệ. Chỉ chấp nhận: ${validRoles.join(', ')}`,
      });
    }

    const updated = await adminService.updateUserRole(BigInt(id), role);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Cập nhật vai trò người dùng thành công',
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

exports.softDeleteUser = async (req, res, next) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ success: false, message: 'ID người dùng không hợp lệ' });
    }
    // Prevent admin from soft deleting themselves
    if (String(id) === String(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản của chính mình' });
    }
    await adminService.softDeleteUser(BigInt(id));
    return res.status(200).json({
      success: true,
      message: 'Xóa người dùng thành công (soft delete)'
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

exports.getBookings = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getBookings(page, limit);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy danh sách đặt dịch vụ thành công',
      data: result.bookings,
      pagination: result.pagination
    }));
  } catch (error) {
    return next(error);
  }
};

exports.getPayments = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getPayments(page, limit);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy danh sách thanh toán thành công',
      data: result.payments,
      pagination: result.pagination
    }));
  } catch (error) {
    return next(error);
  }
};

exports.getStatistics = async (req, res, next) => {
  try {
    const stats = await adminService.getStatistics();
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy số liệu thống kê thành công',
      data: stats
    }));
  } catch (error) {
    return next(error);
  }
};

exports.getRevenue = async (req, res, next) => {
  try {
    const { day, month, year } = req.query;
    const revenue = await adminService.calculateRevenue(day, month, year);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy báo cáo doanh thu thành công',
      data: revenue
    }));
  } catch (error) {
    return next(error);
  }
};

exports.getAuditLogs = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await adminService.getAuditLogs(page, limit);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy nhật ký kiểm toán thành công',
      data: result.logs,
      pagination: result.pagination
    }));
  } catch (error) {
    return next(error);
  }
};

exports.getChartData = async (req, res, next) => {
  try {
    const { year, month, type } = req.query;
    const data = await adminService.getRevenueChartData(year, month, type);
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy dữ liệu biểu đồ thành công',
      data: data
    }));
  } catch (error) {
    return next(error);
  }
};

exports.getTopLocations = async (req, res, next) => {
  try {
    const data = await adminService.getTopLocations();
    return res.status(200).json(serializeBigInt({
      success: true,
      message: 'Lấy danh sách địa điểm phổ biến thành công',
      data: data
    }));
  } catch (error) {
    return next(error);
  }
};
