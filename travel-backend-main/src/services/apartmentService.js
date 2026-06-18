const prisma = require('../config/prismaClient');

/**
 * Service to handle all apartment database operations using Prisma
 */
class ApartmentService {
  /**
   * Get all apartments with pagination and optional filtering
   * @param {Object} filters - Filter options
   * @param {number} page - Current page
   * @param {number} limit - Items per page
   */
  async getAll(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where = { deletedAt: null };

    // Apply filters
    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.location) {
      where.location = { contains: filters.location, mode: 'insensitive' };
    }

    if (filters.bedrooms !== undefined) {
      where.bedrooms = filters.bedrooms;
    }

    if (filters.bathrooms !== undefined) {
      where.bathrooms = filters.bathrooms;
    }

    if (filters.maxGuests !== undefined) {
      where.maxGuests = { gte: filters.maxGuests };
    }

    // Price range filter
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.price = {};
      if (filters.minPrice !== undefined) {
        where.price.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.price.lte = filters.maxPrice;
      }
    }

    // Search query q
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { location: { contains: filters.q, mode: 'insensitive' } },
        { address: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    // Execute queries in parallel
    const [total, apartments] = await Promise.all([
      prisma.apartment.count({ where }),
      prisma.apartment.findMany({
        where,
        skip,
        take,
        include: {
          images: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      apartments,
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
   * Get an apartment by its ID
   * @param {number} id - Apartment ID
   */
  async getById(id) {
    return prisma.apartment.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });
  }

  /**
   * Create a new apartment
   * @param {Object} data - Apartment data
   */
  async create(data) {
    return prisma.apartment.create({
      data,
    });
  }

  /**
   * Update an existing apartment
   * @param {number} id - Apartment ID
   * @param {Object} data - Updated data fields
   */
  async update(id, data) {
    return prisma.apartment.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete an apartment by ID
   * @param {number} id - Apartment ID
   */
  async delete(id) {
    return prisma.apartment.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}

module.exports = new ApartmentService();
