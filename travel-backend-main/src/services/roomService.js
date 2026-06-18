const prisma = require('../config/prismaClient');

class RoomService {
  async getAll(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null };

    if (filters.hotelId !== undefined) where.hotelId = filters.hotelId;
    if (filters.type) where.type = { contains: filters.type, mode: 'insensitive' };
    if (filters.status) where.status = filters.status;
    if (filters.maxGuests !== undefined) where.maxGuests = { gte: filters.maxGuests };

    if (filters.checkIn && filters.checkOut) {
      const checkInDate = new Date(filters.checkIn);
      const checkOutDate = new Date(filters.checkOut);
      if (!isNaN(checkInDate.getTime()) && !isNaN(checkOutDate.getTime()) && checkOutDate > checkInDate) {
        const conflictingBookings = await prisma.hotelBooking.findMany({
          where: {
            status: { notIn: ['cancelled'] },
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
          select: { roomId: true },
        });
        const bookedRoomIds = conflictingBookings.map(function (b) { return b.roomId; });
        if (bookedRoomIds.length > 0) {
          where.id = { notIn: bookedRoomIds };
        }
      }
    }

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { type: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const [total, rooms] = await Promise.all([
      prisma.room.count({ where }),
      prisma.room.findMany({
        where,
        skip,
        take: limit,
        include: { images: true, hotel: { select: { id: true, name: true, location: true, starRating: true } } },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      rooms,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    };
  }

  async getById(id) {
    return prisma.room.findFirst({
      where: { id, deletedAt: null },
      include: { images: true, hotel: { select: { id: true, name: true, location: true, address: true, starRating: true } } },
    });
  }

  async getByHotelId(hotelId, filters = {}) {
    const where = { hotelId, deletedAt: null };
    if (filters.status) where.status = filters.status;
    if (filters.type) where.type = { contains: filters.type, mode: 'insensitive' };

    return prisma.room.findMany({
      where,
      include: { images: true },
      orderBy: { price: 'asc' },
    });
  }

  async create(data) {
    return prisma.room.create({
      data,
      include: { images: true },
    });
  }

  async update(id, data) {
    return prisma.room.update({
      where: { id },
      data,
      include: { images: true },
    });
  }

  async delete(id) {
    return prisma.room.update({ where: { id }, data: { deletedAt: new Date() } });
  }

  async updateStatus(id, status) {
    return prisma.room.update({ where: { id }, data: { status } });
  }
}

module.exports = new RoomService();
