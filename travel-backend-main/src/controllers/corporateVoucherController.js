const corporateVoucherService = require('../services/corporateVoucherService');
// Trigger nodemon restart

class CorporateVoucherController {
  /**
   * POST /api/corporate-vouchers/purchase
   */
  purchase = async (req, res, next) => {
    try {
      const companyId = req.user.id;
      const { totalQuantity, voucherId } = req.body;
      const file = req.file;

      if (!totalQuantity || totalQuantity <= 0) {
        return res.status(400).json({ success: false, message: 'Số lượng mua phải lớn hơn 0' });
      }
      if (!voucherId) {
        return res.status(400).json({ success: false, message: 'Vui lòng chọn voucher' });
      }

      let employeeData = null;
      if (file) {
        // Parse and validate Excel file synchronously here to return errors before payment
        const parseResult = await corporateVoucherService.validateAndParseExcel(file.buffer, totalQuantity);
        if (!parseResult.success) {
          return res.status(400).json({
            success: false,
            message: 'Tệp Excel không hợp lệ',
            errors: parseResult.errors,
          });
        }
        employeeData = parseResult.data;
      }

      const batch = await corporateVoucherService.purchaseBatch(companyId, voucherId, parseInt(totalQuantity), employeeData);

      return res.status(201).json({
        success: true,
        message: 'Tạo lô voucher thành công, vui lòng thanh toán.',
        data: batch,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * GET /api/corporate-vouchers/pool
   */
  getPoolStats = async (req, res, next) => {
    try {
      const companyId = req.user.id;
      const stats = await corporateVoucherService.getPoolStats(companyId);

      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      return next(error);
    }
  };

  /**
   * POST /api/corporate-vouchers/assign
   * Form-data with 'excel' file field and 'batchId'
   */
  assign = async (req, res, next) => {
    try {
      const { batchId } = req.body;
      const file = req.file;

      if (!file) {
        return res.status(400).json({ success: false, message: 'Vui lòng tải lên tệp Excel.' });
      }
      if (!batchId) {
        return res.status(400).json({ success: false, message: 'Thiếu batchId.' });
      }

      // Check available quantity first
      const stats = await corporateVoucherService.getPoolStats(req.user.id);
      const availableQuantity = stats.UNASSIGNED;

      // 1. Validate & Parse Excel
      const validationResult = await corporateVoucherService.validateAndParseExcel(file.buffer, availableQuantity);

      if (!validationResult.success) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu Excel không hợp lệ.',
          errors: validationResult.errors,
        });
      }

      // 2. Assign vouchers
      const assignedCount = await corporateVoucherService.assignVouchers(
        BigInt(batchId),
        validationResult.data,
        req.user.id,
        req.user.id
      );

      return res.status(200).json({
        success: true,
        message: `Cấp phát thành công ${assignedCount} voucher và đang tiến hành gửi email.`,
      });
    } catch (error) {
      if (error.message.includes('đã được cấp') || error.message.includes('Không đủ số lượng')) {
        return res.status(400).json({ success: false, message: error.message });
      }
      return next(error);
    }
  };

  /**
   * POST /api/corporate-vouchers/redeem
   */
  redeem = async (req, res, next) => {
    try {
      const { voucherCode, redeemToken } = req.body;
      const userEmail = req.user.email; // Requires authenticated user

      if (!voucherCode || !redeemToken) {
        return res.status(400).json({ success: false, message: 'Thiếu voucherCode hoặc redeemToken.' });
      }

      const redeemed = await corporateVoucherService.redeemVoucher(voucherCode, redeemToken, userEmail, req.user.id);

      return res.status(200).json({
        success: true,
        message: 'Đổi voucher thành công.',
        data: {
          voucherCode: redeemed.code,
          redeemedAt: redeemed.redeemedAt
        }
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * POST /api/corporate-vouchers/:id/resend-email
   */
  resendEmail = async (req, res, next) => {
    try {
      const { id } = req.params;
      await corporateVoucherService.resendEmail(id);

      return res.status(200).json({
        success: true,
        message: 'Gửi lại email thành công.',
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };

  /**
   * PUT /api/corporate-vouchers/:id/cancel
   */
  cancel = async (req, res, next) => {
    try {
      const { id } = req.params;
      const adminId = req.user.id;
      await corporateVoucherService.cancelVoucher(id, adminId);

      return res.status(200).json({
        success: true,
        message: 'Hủy voucher thành công.',
      });
    } catch (error) {
      return res.status(400).json({ success: false, message: error.message });
    }
  };
}

module.exports = new CorporateVoucherController();
