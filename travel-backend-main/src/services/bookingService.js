const prisma = require('../config/prismaClient');

class BookingService {
  async _hasConflict(roomId, checkIn, checkOut, excludeId = null, tx = null) {
    const client = tx || prisma;
    const where = {
      roomId,
      status: { notIn: ['cancelled'] },
      checkIn: { lt: new Date(checkOut) },
      checkOut: { gt: new Date(checkIn) },
    };
    if (excludeId) where.id = { not: excludeId };
    return client.hotelBooking.findFirst({ where });
  }

  async create(data, userId) {
    return prisma.$transaction(async (tx) => {
      // Lock the room row to prevent concurrent booking race conditions
      await tx.$executeRaw`SELECT 1 FROM hotel_rooms WHERE id = ${data.roomId} FOR UPDATE`;

      const room = await tx.room.findFirst({ where: { id: data.roomId, status: 'available' } });
      if (!room) throw Object.assign(new Error('Phòng không tồn tại hoặc không khả dụng'), { status: 400 });

      const checkIn = new Date(data.checkIn);
      const checkOut = new Date(data.checkOut);
      if (checkOut <= checkIn) throw Object.assign(new Error('Ngày trả phòng phải sau ngày nhận phòng'), { status: 400 });

      const conflict = await this._hasConflict(data.roomId, checkIn, checkOut, null, tx);
      if (conflict) throw Object.assign(new Error('Phòng đã được đặt trong khoảng thời gian này'), { status: 409 });

      const nights = Math.ceil((checkOut - checkIn) / 86400000);

      const newBooking = await tx.hotelBooking.create({
        data: {
          userId: userId ? BigInt(userId) : null,
          roomId: data.roomId,
          fullName: data.fullName,
          email: data.email,
          phone: data.phone,
          checkIn,
          checkOut,
          guests: data.guests ?? 1,
          totalPrice: room.price * nights,
          notes: data.notes ?? null,
        },
        include: { room: { include: { hotel: true } } },
      });

      return newBooking;
    });
  }

  async getAll(filters = {}, page = 1, limit = 10) {
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.max(1, parseInt(limit, 10) || 10);
    const where = {};
    if (filters.status) where.status = filters.status;
    if (filters.paymentStatus) where.paymentStatus = filters.paymentStatus;
    if (filters.roomId) where.roomId = parseInt(filters.roomId, 10);

    const [total, bookings] = await Promise.all([
      prisma.hotelBooking.count({ where }),
      prisma.hotelBooking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { room: { include: { hotel: true } }, payments: true, user: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { bookings, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getMy(userId, filters = {}, page = 1, limit = 10) {
    page = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.max(1, parseInt(limit, 10) || 10);
    const where = { userId: BigInt(userId) };
    if (filters.status) where.status = filters.status;

    const [total, bookings] = await Promise.all([
      prisma.hotelBooking.count({ where }),
      prisma.hotelBooking.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: { room: { include: { hotel: true } }, payments: true, user: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    return { bookings, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id) {
    return prisma.hotelBooking.findUnique({
      where: { id },
      include: { room: { include: { hotel: true } }, payments: true, user: true },
    });
  }

  async cancel(id, userId, role) {
    const booking = await this.getById(id);
    if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { status: 404 });
    if (role !== 'admin' && booking.userId?.toString() !== userId?.toString())
      throw Object.assign(new Error('Không có quyền hủy booking này'), { status: 403 });
    if (['cancelled', 'checked_out'].includes(booking.status))
      throw Object.assign(new Error(`Không thể hủy booking ở trạng thái "${booking.status}"`), { status: 400 });

    return prisma.hotelBooking.update({
      where: { id },
      data: { status: 'cancelled' },
      include: { room: { include: { hotel: true } } },
    });
  }

  async checkIn(id) {
    const booking = await this.getById(id);
    if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { status: 404 });
    if (booking.status !== 'confirmed')
      throw Object.assign(new Error('Chỉ có thể check-in booking đã confirmed'), { status: 400 });

    return prisma.hotelBooking.update({
      where: { id },
      data: { status: 'checked_in' },
      include: { room: { include: { hotel: true } } },
    });
  }

  async checkOut(id) {
    const booking = await this.getById(id);
    if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { status: 404 });
    if (booking.status !== 'checked_in')
      throw Object.assign(new Error('Chỉ có thể check-out booking đang checked_in'), { status: 400 });

    return prisma.hotelBooking.update({
      where: { id },
      data: { status: 'checked_out' },
      include: { room: { include: { hotel: true } } },
    });
  }

  async updateStatus(id, status) {
    const booking = await this.getById(id);
    if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { status: 404 });
    return prisma.hotelBooking.update({
      where: { id },
      data: { status },
      include: { room: { include: { hotel: true } } },
    });
  }

  async delete(id) {
    const booking = await this.getById(id);
    if (!booking) throw Object.assign(new Error('Không tìm thấy booking'), { status: 404 });
    return prisma.hotelBooking.update({ where: { id }, data: { deletedAt: new Date() } });
  }
}

module.exports = new BookingService();
