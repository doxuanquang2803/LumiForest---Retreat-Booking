const voucherOrderService = require('../services/voucherOrderService');

/**
 * Controller to handle all HTTP requests for Voucher Orders
 */
class VoucherOrderController {
  /**
   * POST /api/voucher-orders
   * Purchase a voucher (creates order in PENDING_PAYMENT)
   */
  create = async (req, res, next) => {
    const orderData = {
      ...req.body,
      userId: req.user.id,
    };
    const order = await voucherOrderService.create(orderData);
    return res.status(201).json({
      success: true,
      message: 'Tạo đơn mua voucher thành công. Vui lòng thanh toán để nhận mã voucher.',
      data: order,
    });
  };

  /**
   * POST /api/voucher-orders/:id/pay
   * Simulate payment success — req.voucherOrder pre-fetched by ownership middleware
   */
  pay = async (req, res, next) => {
    const order = await voucherOrderService.pay(req.voucherOrder.id);
    return res.status(200).json({
      success: true,
      message: 'Thanh toán đơn hàng thành công. Mã voucher đã được tạo.',
      data: order,
    });
  };

  /**
   * PUT /api/voucher-orders/:id/cancel
   * Cancel a pending order — req.voucherOrder pre-fetched by ownership middleware
   */
  cancel = async (req, res, next) => {
    const order = await voucherOrderService.cancel(req.voucherOrder.id);
    return res.status(200).json({
      success: true,
      message: 'Hủy đơn mua voucher thành công',
      data: order,
    });
  };

  /**
   * POST /api/voucher-orders/redeem
   * Redeem voucher at check-in (Staff/Admin only)
   */
  redeem = async (req, res, next) => {
    const { voucherCode } = req.body;
    const order = await voucherOrderService.redeem(voucherCode);
    return res.status(200).json({
      success: true,
      message: 'Quy đổi (Redeem) voucher thành công',
      data: order,
    });
  };

  /**
   * GET /api/voucher-orders/qr/:code
   * Get dynamic QR image buffer
   */
  getQrCode = async (req, res, next) => {
    const buffer = await voucherOrderService.getQrCodeBuffer(req.params.code);
    
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    return res.status(200).send(buffer);
  };

  /**
   * GET /api/voucher-orders/:id
   * Get order details — req.voucherOrder pre-fetched by ownership middleware
   */
  getById = async (req, res, next) => {
    return res.status(200).json({
      success: true,
      message: 'Lấy thông tin chi tiết đơn hàng thành công',
      data: req.voucherOrder,
    });
  };

  /**
   * GET /api/voucher-orders
   * List all orders (Staff/Admin view)
   */
  getAll = async (req, res, next) => {
    const { page, limit, ...filters } = req.query;
    const { orders, pagination } = await voucherOrderService.getAll(filters, page, limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng thành công',
      data: orders,
      pagination,
    });
  };

  /**
   * GET /api/voucher-orders/my
   * Get logged-in user's own orders
   */
  getMyOrders = async (req, res, next) => {
    const { page, limit } = req.query;

    const filters = { userId: BigInt(req.user.id) };

    const { orders, pagination } = await voucherOrderService.getAll(filters, page, limit);

    return res.status(200).json({
      success: true,
      message: 'Lấy danh sách đơn hàng của tôi thành công',
      data: orders,
      pagination,
    });
  };
}

module.exports = new VoucherOrderController();
