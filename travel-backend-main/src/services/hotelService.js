const prisma = require('../config/prismaClient');

class HotelService {
  async getAll(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null };

    if (filters.status) where.status = filters.status;
    if (filters.location) where.location = { contains: filters.location, mode: 'insensitive' };
    if (filters.starRating !== undefined) where.starRating = filters.starRating;
    if (filters.featured !== undefined) where.featured = filters.featured;

    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) where.price.gte = filters.minPrice;
      if (filters.maxPrice !== undefined) where.price.lte = filters.maxPrice;
    }

    if (filters.q) {
      where.OR = [
        { name: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { location: { contains: filters.q, mode: 'insensitive' } },
        { address: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    const [total, hotels] = await Promise.all([
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where,
        skip,
        take: limit,
        include: { images: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      hotels,
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
    return prisma.hotel.findFirst({
      where: { id, deletedAt: null },
      include: { images: true },
    });
  }

  async getFeatured(limit = 8) {
    return prisma.hotel.findMany({
      where: { featured: true, status: 'active', deletedAt: null },
      include: { images: true },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async getPopular(limit = 10) {
    return prisma.hotel.findMany({
      where: { status: 'active', deletedAt: null },
      include: { images: true },
      orderBy: { bookingCount: 'desc' },
      take: limit,
    });
  }

  async getRecommendations(id, limit = 6) {
    const hotel = await this.getById(id);
    if (!hotel) return [];

    return prisma.hotel.findMany({
      where: {
        id: { not: id },
        deletedAt: null,
        status: 'active',
        OR: [
          { location: hotel.location },
          { starRating: hotel.starRating },
        ],
      },
      include: { images: true },
      orderBy: { rating: 'desc' },
      take: limit,
    });
  }

  async create(data) {
    return prisma.hotel.create({ data });
  }

  async update(id, data) {
    return prisma.hotel.update({ where: { id }, data });
  }

  async delete(id) {
    return prisma.hotel.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

module.exports = new HotelService();
