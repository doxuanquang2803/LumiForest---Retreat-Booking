const crypto = require('crypto');
const paymentService = require('../services/paymentService');

class PaymentController {
  create = async (req, res, next) => {
    const payment = await paymentService.create(req.body, req.user?.id);
    return res.status(201).json({ success: true, message: 'Tạo thanh toán thành công', data: payment });
  };

  /**
   * POST /api/payments/callback
   * Payment gateway callback — verify HMAC-SHA256 signature before processing
   */
  callback = async (req, res, next) => {
    const { transactionId, status } = req.body;

    // HMAC-SHA256 signature verification
    const callbackSecret = process.env.PAYMENT_CALLBACK_SECRET;
    if (callbackSecret) {
      const signature = req.headers['x-payment-signature'];
      if (!signature) {
        return res.status(401).json({ success: false, message: 'Missing payment signature' });
      }

      const payload = JSON.stringify({ transactionId, status });
      const expectedSignature = crypto
        .createHmac('sha256', callbackSecret)
        .update(payload)
        .digest('hex');

      if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
        return res.status(403).json({ success: false, message: 'Invalid payment signature' });
      }
    }

    const payment = await paymentService.callback(transactionId, status);
    return res.status(200).json({ success: true, message: 'Cập nhật thanh toán thành công', data: payment });
  };

  // req.payment is pre-fetched and ownership-verified by checkPaymentOwnership middleware
  getById = async (req, res, next) => {
    return res.status(200).json({ success: true, message: 'Lấy chi tiết payment thành công', data: req.payment });
  };

  getMy = async (req, res, next) => {
    const { page, limit } = req.query;
    const result = await paymentService.getMy(req.user.id, page, limit);
    return res.status(200).json({
      success: true,
      message: 'Lấy lịch sử thanh toán của bạn thành công',
      data: result.payments,
      pagination: result.pagination,
    });
  };

  refund = async (req, res, next) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ success: false, message: 'ID không hợp lệ' });

    const payment = await paymentService.refund(id);
    return res.status(200).json({ success: true, message: 'Hoàn tiền thành công', data: payment });
  };

  getAll = async (req, res, next) => {
    const { page, limit, ...filters } = req.query;
    const result = await paymentService.getAll(filters, page, limit);
    return res.status(200).json({
      success: true,
      message: 'Lấy lịch sử thanh toán thành công',
      data: result.payments,
      pagination: result.pagination,
    });
  };
}

module.exports = new PaymentController();
