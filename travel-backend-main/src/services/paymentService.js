const prisma = require('../config/prismaClient');
const crypto = require('crypto');

const INCLUDE_ALL = {
  booking:      { include: { room: { include: { hotel: true } } } },
  tourBooking:  { include: { tour: true } },
  voucherOrder: { include: { voucher: true } },
};

class PaymentService {
  async create(data, userId) {
    const { bookingType = 'HOTEL', method, notes } = data;

    const paymentData = {
      bookingType,
      userId:            userId ? BigInt(userId) : null,
      method:            method ?? 'bank_transfer',
      status:            'pending',
      transactionId:     crypto.randomBytes(16).toString('hex'),
      notes:             notes ?? null,
      bookingId:         null,
      tourBookingId:     null,
      apartmentBookingId: null,
      voucherOrderId:    null,
    };

    if (bookingType === 'HOTEL') {
      const bookingId = Number(data.bookingId);
      if (isNaN(bookingId)) {
        throw Object.assign(new Error('Booking ID không hợp lệ'), { status: 400 });
      }
      const booking = await prisma.hotelBooking.findUnique({ where: { id: bookingId } });
      if (!booking)
        throw Object.assign(new Error('Không tìm thấy booking'), { status: 404 });
      if (booking.status === 'cancelled')
        throw Object.assign(new Error('Không thể thanh toán booking đã hủy'), { status: 400 });
      if (booking.paymentStatus === 'paid')
        throw Object.assign(new Error('Booking này đã được thanh toán'), { status: 400 });

      if (userId && booking.userId && booking.userId.toString() !== userId.toString()) {
        const user = await prisma.users.findUnique({ where: { id: BigInt(userId) } });
        if (user?.role !== 'ADMIN')
          throw Object.assign(new Error('Không có quyền thanh toán booking này'), { status: 403 });
      }

      paymentData.bookingId = bookingId;
      paymentData.amount    = booking.totalPrice;

    } else if (bookingType === 'TOUR') {
      const tourBookingId = Number(data.tourBookingId);
      if (isNaN(tourBookingId)) {
        throw Object.assign(new Error('Tour Booking ID không hợp lệ'), { status: 400 });
      }
      const booking = await prisma.tourBooking.findUnique({ where: { id: tourBookingId } });
      if (!booking)
        throw Object.assign(new Error('Không tìm thấy tour booking'), { status: 404 });
      if (booking.paymentStatus === 'paid')
        throw Object.assign(new Error('Tour booking này đã được thanh toán'), { status: 400 });

      paymentData.tourBookingId = tourBookingId;
      paymentData.amount        = booking.totalPrice;

    } else if (bookingType === 'APARTMENT') {
      if (!data.amount || data.amount <= 0)
        throw Object.assign(new Error('Số tiền không hợp lệ'), { status: 400 });

      paymentData.apartmentBookingId = data.apartmentBookingId ? BigInt(data.apartmentBookingId) : null;
      paymentData.amount             = Number(data.amount);

    } else if (bookingType === 'VOUCHER') {
      const voucherOrderId = data.voucherOrderId ? BigInt(data.voucherOrderId) : null;
      if (!voucherOrderId) {
        throw Object.assign(new Error('Voucher Order ID không hợp lệ'), { status: 400 });
      }
      const order = await prisma.voucherOrder.findUnique({
        where: { id: voucherOrderId },
      });
      if (!order)
        throw Object.assign(new Error('Không tìm thấy đơn voucher'), { status: 404 });
      if (order.status === 'PAID')
        throw Object.assign(new Error('Đơn voucher này đã được thanh toán'), { status: 400 });
      if (order.status !== 'PENDING_PAYMENT')
        throw Object.assign(new Error('Đơn voucher không ở trạng thái chờ thanh toán'), { status: 400 });

      paymentData.voucherOrderId = voucherOrderId;
      paymentData.amount         = Number(order.totalPrice);

    } else if (bookingType === 'CORPORATE_BATCH') {
      const corporateBatchId = data.corporateBatchId ? BigInt(data.corporateBatchId) : null;
      if (!corporateBatchId) {
        throw Object.assign(new Error('Corporate Batch ID không hợp lệ'), { status: 400 });
      }
      const batch = await prisma.corporatePurchaseBatch.findUnique({
        where: { id: corporateBatchId },
      });
      if (!batch)
        throw Object.assign(new Error('Không tìm thấy lô doanh nghiệp'), { status: 404 });
      if (batch.paymentStatus === 'PAID')
        throw Object.assign(new Error('Lô này đã được thanh toán'), { status: 400 });
      if (batch.paymentStatus !== 'PENDING')
        throw Object.assign(new Error('Lô doanh nghiệp không ở trạng thái chờ thanh toán'), { status: 400 });

      paymentData.corporateBatchId = corporateBatchId;
      paymentData.amount         = Number(batch.totalPrice);

    } else {
      throw Object.assign(new Error('Loại booking không hợp lệ'), { status: 400 });
    }

    return prisma.payment.create({ data: paymentData, include: INCLUDE_ALL });
  }

  async callback(transactionId, status) {
    const payment = await prisma.payment.findUnique({ where: { transactionId } });
    if (!payment)
      throw Object.assign(new Error('Không tìm thấy giao dịch'), { status: 404 });

    const updateData = { status };
    if (status === 'completed') updateData.paidAt = new Date();

    const updated = await prisma.payment.update({
      where: { transactionId },
      data:  updateData,
      include: INCLUDE_ALL,
    });

    if (status === 'completed') {
      const sideEffects = [];

      if (payment.bookingId) {
        sideEffects.push(
          prisma.hotelBooking.update({
            where: { id: payment.bookingId },
            data:  { paymentStatus: 'paid', status: 'confirmed' },
          })
        );
      }

      if (payment.tourBookingId) {
        sideEffects.push(
          prisma.tourBooking.update({
            where: { id: payment.tourBookingId },
            data:  { paymentStatus: 'paid', status: 'confirmed' },
          })
        );
      }

      if (payment.apartmentBookingId) {
        sideEffects.push(
          prisma.bookings.update({
            where: { id: payment.apartmentBookingId },
            data:  { payment_status: 'paid', status: 'confirmed' },
          })
        );
      }

      if (sideEffects.length > 0) await Promise.all(sideEffects);

      let itemName = 'dịch vụ';
      let customerEmail = null;
      let customerName = null;
      let phone = null;
      let aptBooking = null;

      if (updated.booking && updated.booking.room && updated.booking.room.hotel) {
        itemName = 'Phòng ' + updated.booking.room.name + ' - Khách sạn ' + updated.booking.room.hotel.name;
        customerEmail = updated.booking.email;
        customerName = updated.booking.fullName;
        phone = updated.booking.phone;
      } else if (updated.tourBooking && updated.tourBooking.tour) {
        itemName = 'tour ' + updated.tourBooking.tour.title;
        customerEmail = updated.tourBooking.email;
        customerName = updated.tourBooking.fullName;
        phone = updated.tourBooking.phone;
      } else if (updated.apartmentBookingId) {
        aptBooking = await prisma.bookings.findUnique({
           where: { id: updated.apartmentBookingId },
        });
        if (aptBooking) {
          const apt = await prisma.apartment.findUnique({
            where: { id: Number(aptBooking.item_id) },
          });
          itemName = 'căn hộ ' + (apt ? apt.title : '');
          customerEmail = aptBooking.email;
          customerName = aptBooking.name;
          phone = aptBooking.phone;
        }
      } else if (updated.voucherOrder && updated.voucherOrder.voucher) {
        itemName = 'voucher ' + updated.voucherOrder.voucher.title;
        customerEmail = updated.voucherOrder.email;
        customerName = updated.voucherOrder.fullName;
        phone = updated.voucherOrder.phone;
      } else if (updated.corporateBatchId) {
        itemName = 'lô voucher doanh nghiệp';
      }

      if (payment.userId) {
        await prisma.notification.create({
          data: {
            userId: payment.userId,
            title: 'Thanh toán thành công',
            message: `Giao dịch thanh toán cho ${itemName} đã được xác nhận thành công.`,
            type: 'PAYMENT_SUCCESS'
          }
        });
      }

      // Generate QR Code and Send Email in the background (Non-blocking)
      if (customerEmail) {
        (async () => {
          try {
            const qrCodeLib = require('qrcode');
            const emailService = require('./emailService');
            
            const qrText = JSON.stringify({
              transactionId: payment.transactionId,
              amount: payment.amount,
              status: 'completed',
              itemName,
              customerName
            });

            const qrCodeBuffer = await qrCodeLib.toBuffer(qrText, {
              type: 'png',
              width: 300,
              margin: 2,
            });

            const bookingDetails = {
              transactionId: payment.transactionId,
              itemName,
              customerName,
              phone,
              amount: payment.amount
            };

            await emailService.sendInvoiceEmail(customerEmail, bookingDetails, qrCodeBuffer);
          } catch (error) {
            console.error('Lỗi khi tạo QR code hoặc gửi email hóa đơn:', error);
          }
        })();
      }

      // Voucher: delegate to voucherOrderService (stock check, code generation)
      if (payment.voucherOrderId) {
        const voucherOrderService = require('./voucherOrderService');
        const paidOrder = await voucherOrderService.pay(payment.voucherOrderId);
        return { ...updated, voucherOrder: paidOrder };
      }

      // Corporate Batch: delegate to corporateVoucherService
      if (payment.corporateBatchId) {
        const corporateVoucherService = require('./corporateVoucherService');
        const paidBatch = await corporateVoucherService.processBatchFulfillment(payment.corporateBatchId);
        return { ...updated, corporateBatch: paidBatch };
      }
    }

    return updated;
  }

  async getById(id) {
    return prisma.payment.findUnique({
      where: { id },
      include: INCLUDE_ALL,
    });
  }

  async getMy(userId, page = 1, limit = 10) {
    page  = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.max(1, parseInt(limit, 10) || 10);
    const where = { userId: BigInt(userId) };

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        include: INCLUDE_ALL,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { payments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async refund(id) {
    const payment = await this.getById(id);
    if (!payment)
      throw Object.assign(new Error('Không tìm thấy payment'), { status: 404 });
    if (payment.status !== 'completed')
      throw Object.assign(new Error('Chỉ có thể hoàn tiền payment đã hoàn thành'), { status: 400 });

    const updated = await prisma.payment.update({
      where: { id },
      data:  { status: 'refunded', refundedAt: new Date() },
      include: INCLUDE_ALL,
    });

    if (payment.bookingId) {
      await prisma.hotelBooking.update({
        where: { id: payment.bookingId },
        data:  { paymentStatus: 'refunded' },
      });
    }
    if (payment.tourBookingId) {
      await prisma.tourBooking.update({
        where: { id: payment.tourBookingId },
        data:  { paymentStatus: 'refunded' },
      });
    }

    return updated;
  }

  async getAll(filters = {}, page = 1, limit = 10) {
    page  = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.max(1, parseInt(limit, 10) || 10);
    const where = {};
    if (filters.status)      where.status      = filters.status;
    if (filters.method)      where.method      = filters.method;
    if (filters.bookingType) where.bookingType = filters.bookingType;

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        include: INCLUDE_ALL,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { payments, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }
}

module.exports = new PaymentService();
