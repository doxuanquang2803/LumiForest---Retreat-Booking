const prisma = require('../config/prismaClient');
const crypto = require('crypto');
const qrCodeLib = require('qrcode');

/**
 * Helper to generate a voucher code in VCH-YYYYMMDD-XXXXXX format
 */
function generateVoucherCode() {
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomStr = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 characters
  return `VCH-${dateStr}-${randomStr}`;
}

class VoucherOrderService {
  /**
   * Helper to dynamically calculate order status (e.g. check for expiration)
   */
  _processOrderStatus(order) {
    if (!order) return order;
    
    let status = order.status;
    
    // If order is PAID but the voucher has expired, it is logically EXPIRED
    if (status === 'PAID' && order.voucher && new Date(order.voucher.validUntil) < new Date()) {
      status = 'EXPIRED';
    }
    
    return {
      ...order,
      status,
    };
  }

  /**
   * Create a voucher purchase order (starts in PENDING_PAYMENT status)
   */
  async create(data) {
    const { voucherId, userId, fullName, email, phone, quantity } = data;

    // Fetch the voucher
    const voucher = await prisma.voucher.findUnique({
      where: { id: BigInt(voucherId) },
    });

    if (!voucher) {
      const error = new Error('Không tìm thấy voucher tương ứng');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    const now = new Date();
    // Validate voucher validity
    if (voucher.status === 'INACTIVE' || voucher.status === 'EXPIRED' || new Date(voucher.validUntil) < now) {
      const error = new Error('Voucher này hiện tại không hoạt động hoặc đã hết hạn');
      error.status = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }

    // Calculate total price
    const totalPrice = Number(voucher.salePrice) * quantity;

    // Create order in PENDING_PAYMENT
    const order = await prisma.voucherOrder.create({
      data: {
        voucherId: BigInt(voucherId),
        userId: userId ? BigInt(userId) : null,
        fullName,
        email,
        phone,
        quantity,
        totalPrice,
        status: 'PENDING_PAYMENT',
      },
      include: {
        voucher: true,
      },
    });

    return this._processOrderStatus(order);
  }

  /**
   * Simulate order payment, decrement stock, and generate voucherCode
   */
  async pay(id) {
    const orderId = BigInt(id);

    // Fetch order first to check status
    const order = await prisma.voucherOrder.findUnique({
      where: { id: orderId },
      include: { voucher: true },
    });

    if (!order) {
      const error = new Error('Không tìm thấy đơn mua voucher');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    // Rule: Only PENDING_PAYMENT orders can be paid
    if (order.status !== 'PENDING_PAYMENT') {
      const error = new Error(`Không thể thanh toán đơn hàng có trạng thái: ${order.status}`);
      error.status = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }

    // Execute final stock check and updates inside a transaction
    return prisma.$transaction(async (tx) => {
      // Re-fetch voucher to ensure fresh stock data
      const voucher = await tx.voucher.findUnique({
        where: { id: order.voucherId },
      });

      if (!voucher) {
        throw new Error('Voucher không tồn tại');
      }

      const now = new Date();
      // Validate expiration
      if (new Date(voucher.validUntil) < now) {
        // Logically expired, cancel order
        await tx.voucherOrder.update({
          where: { id: orderId },
          data: { status: 'CANCELLED' },
        });
        const error = new Error('Thanh toán thất bại: Voucher đã hết hạn');
        error.status = 400;
        error.errorCode = 'VALIDATION_ERROR';
        throw error;
      }

      // Generate unique voucher codes for each item
      const orderItems = [];
      for (let i = 0; i < order.quantity; i++) {
        let voucherCode = null;
        let attempts = 0;
        while (attempts < 5) {
          const candidate = generateVoucherCode();
          const existing = await tx.voucherOrderItem.findUnique({
            where: { voucherCode: candidate },
          });
          if (!existing) {
            // Also ensure we don't pick the same candidate twice in this loop
            if (!orderItems.some(item => item.voucherCode === candidate)) {
              voucherCode = candidate;
              break;
            }
          }
          attempts++;
        }

        if (!voucherCode) {
          throw new Error('Không thể tạo mã voucher duy nhất sau nhiều lần thử');
        }

        orderItems.push({
          voucherOrderId: orderId,
          voucherCode,
          status: 'PAID'
        });
      }

      // Insert all items
      await tx.voucherOrderItem.createMany({
        data: orderItems
      });

      // Update order to PAID
      const updatedOrder = await tx.voucherOrder.update({
        where: { id: orderId },
        data: {
          status: 'PAID'
        },
        include: {
          voucher: true,
          items: true
        },
      });

      return this._processOrderStatus(updatedOrder);
    });
  }

  /**
   * Cancel a pending order
   */
  async cancel(id) {
    const orderId = BigInt(id);

    const order = await prisma.voucherOrder.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      const error = new Error('Không tìm thấy đơn hàng');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    if (order.status !== 'PENDING_PAYMENT') {
      const error = new Error(`Không thể hủy đơn hàng có trạng thái: ${order.status}`);
      error.status = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }

    const updated = await prisma.voucherOrder.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
      },
      include: {
        voucher: true,
      },
    });

    return this._processOrderStatus(updated);
  }

  /**
   * Redeem voucher at check-in (POST /api/voucher-orders/redeem)
   */
  async redeem(voucherCode) {
    // Perform retrieval and validation inside a Prisma transaction
    return prisma.$transaction(async (tx) => {
      const item = await tx.voucherOrderItem.findUnique({
        where: { voucherCode },
        include: {
          order: {
            include: { voucher: true }
          }
        },
      });

      if (!item) {
        const error = new Error('Mã voucher không hợp lệ hoặc không tồn tại');
        error.status = 404;
        error.errorCode = 'NOT_FOUND';
        throw error;
      }

      const order = item.order;

      // Check logically expired or invalid status
      const now = new Date();
      if (order.voucher && new Date(order.voucher.validUntil) < now) {
        // Auto update database status if expired
        await tx.voucherOrderItem.update({
          where: { id: item.id },
          data: { status: 'EXPIRED' },
        });
        const error = new Error('Mã voucher này đã hết hạn sử dụng và không thể quy đổi');
        error.status = 400;
        error.errorCode = 'VALIDATION_ERROR';
        throw error;
      }

      if (item.status === 'USED') {
        const error = new Error('Voucher này đã được quy đổi trước đó');
        error.status = 400;
        error.errorCode = 'VALIDATION_ERROR';
        throw error;
      }

      if (item.status !== 'PAID') {
        const error = new Error(`Không thể quy đổi mã voucher có trạng thái: ${item.status}`);
        error.status = 400;
        error.errorCode = 'VALIDATION_ERROR';
        throw error;
      }

      // Redeem voucher item
      const redeemedItem = await tx.voucherOrderItem.update({
        where: { id: item.id },
        data: {
          status: 'USED',
          redeemedAt: now,
        },
      });
      
      // Check if all items in this order are used, then mark the parent order as USED
      const totalItems = await tx.voucherOrderItem.count({
        where: { voucherOrderId: order.id }
      });
      const usedItems = await tx.voucherOrderItem.count({
        where: { voucherOrderId: order.id, status: 'USED' }
      });
      
      if (usedItems === totalItems) {
        await tx.voucherOrder.update({
          where: { id: order.id },
          data: { status: 'USED' }
        });
      }

      return redeemedItem;
    });
  }

  /**
   * Get dynamic QR image buffer for a voucher item
   */
  async getQrCodeBuffer(voucherCode) {
    const item = await prisma.voucherOrderItem.findUnique({
      where: { voucherCode },
    });

    if (!item) {
      const error = new Error('Mã voucher không hợp lệ');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    // Generate PNG QR image buffer from voucherCode
    return qrCodeLib.toBuffer(item.voucherCode, {
      type: 'png',
      width: 300,
      margin: 2,
    });
  }

  /**
   * Get order details by ID
   */
  async getById(id) {
    const order = await prisma.voucherOrder.findUnique({
      where: { id: BigInt(id) },
      include: { voucher: true, items: true },
    });
    return this._processOrderStatus(order);
  }

  /**
   * List all orders (Admin view)
   */
  async getAll(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where = {};

    if (filters.email) {
      where.email = filters.email;
    }
    if (filters.phone) {
      where.phone = filters.phone;
    }
    if (filters.userId !== undefined) {
      where.userId = filters.userId;
    }
    if (filters.status) {
      where.status = filters.status;
    }

    const [total, orders] = await Promise.all([
      prisma.voucherOrder.count({ where }),
      prisma.voucherOrder.findMany({
        where,
        skip,
        take,
        include: { voucher: true, items: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);
    const processedOrders = orders.map(o => this._processOrderStatus(o));

    return {
      orders: processedOrders,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }
}

module.exports = new VoucherOrderService();
