const prisma = require('../config/prismaClient');

class TourService {
  /**
   * Get all active tours with pagination
   */
  async getAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where = { deletedAt: null };

    const [total, tours] = await Promise.all([
      prisma.tour.count({ where }),
      prisma.tour.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          images: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tours,
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

  /**
   * Get active tour by ID
   */
  async getById(id) {
    return prisma.tour.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include: {
        images: true,
      },
    });
  }

  /**
   * Get tour by Slug
   */
  async getBySlug(slug, includeDeleted = false) {
    const where = { slug };
    if (!includeDeleted) {
      where.deletedAt = null;
    }
    return prisma.tour.findFirst({
      where,
      include: {
        images: true,
      },
    });
  }

  /**
   * Create a new tour
   */
  async create(data) {
    return prisma.tour.create({
      data,
    });
  }

  /**
   * Update an existing tour
   */
  async update(id, data) {
    return prisma.tour.update({
      where: { id },
      data,
    });
  }

  /**
   * Soft delete a tour
   */
  async softDelete(id) {
    return prisma.tour.update({
      where: { id },
      data: {
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Search active tours by title or location keyword
   */
  async search(keyword = '', page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;
    
    const where = {
      deletedAt: null,
    };

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { location: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, tours] = await Promise.all([
      prisma.tour.count({ where }),
      prisma.tour.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          images: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tours,
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

  /**
   * Filter active tours with options and sorting
   */
  async filter(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where = { deletedAt: null };

    // Apply filters
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    if (filters.duration) {
      where.duration = { contains: filters.duration, mode: 'insensitive' };
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.rating !== undefined) {
      where.rating = { gte: filters.rating };
    }

    // Determine sorting order
    let orderBy = { createdAt: 'desc' }; // default
    if (filters.sortBy) {
      switch (filters.sortBy) {
        case 'price_asc':
          orderBy = { price: 'asc' };
          break;
        case 'price_desc':
          orderBy = { price: 'desc' };
          break;
        case 'newest':
          orderBy = { createdAt: 'desc' };
          break;
        case 'popular':
          orderBy = [
            { bookingCount: 'desc' },
            { rating: 'desc' },
          ];
          break;
      }
    }

    const [total, tours] = await Promise.all([
      prisma.tour.count({ where }),
      prisma.tour.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          images: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      tours,
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

  /**
   * Get popular tours (limit 10, sorted by bookingCount desc, rating desc)
   */
  async getPopular(limit = 10) {
    return prisma.tour.findMany({
      where: {
        deletedAt: null,
      },
      take: limit,
      orderBy: [
        { bookingCount: 'desc' },
        { rating: 'desc' },
      ],
      include: {
        images: true,
      },
    });
  }
}

module.exports = new TourService();
