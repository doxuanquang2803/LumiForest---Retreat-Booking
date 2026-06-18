const prisma = require('../config/prismaClient');

/**
 * Service to handle resort voucher database operations using Prisma
 */
class VoucherService {
  /**
   * Helper to dynamically calculate and override voucher status on read
   * @param {Object} voucher - Voucher database record
   */
  _calculateDynamicStatus(voucher) {
    if (!voucher) return voucher;
    
    let status = voucher.status;
    const now = new Date();
    
    if (new Date(voucher.validUntil) < now) {
      status = 'EXPIRED';
    }
    
    return {
      ...voucher,
      status,
    };
  }

  /**
   * Get all vouchers with pagination, search, and filtering
   */
  async getAll(filters = {}, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where = { deletedAt: null };
    const now = new Date();

    // Status filter (taking dynamic status into account)
    if (filters.status) {
      if (filters.status === 'EXPIRED') {
        where.OR = [
          { status: 'EXPIRED' },
          { validUntil: { lt: now } }
        ];
      } else if (filters.status === 'SOLD_OUT') {
        where.status = 'SOLD_OUT';
      } else if (filters.status === 'ACTIVE') {
        where.status = 'ACTIVE';
        where.validUntil = { gte: now };
      } else {
        where.status = filters.status;
      }
    }

    // Search query q
    if (filters.q) {
      where.OR = [
        { title: { contains: filters.q, mode: 'insensitive' } },
        { description: { contains: filters.q, mode: 'insensitive' } },
        { resortName: { contains: filters.q, mode: 'insensitive' } },
      ];
    }

    // Resort Name filter
    if (filters.resortName) {
      where.resortName = { contains: filters.resortName, mode: 'insensitive' };
    }

    // Price range filter on salePrice
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      where.salePrice = {};
      if (filters.minPrice !== undefined) {
        where.salePrice.gte = filters.minPrice;
      }
      if (filters.maxPrice !== undefined) {
        where.salePrice.lte = filters.maxPrice;
      }
    }

    // Execute queries in parallel
    const [total, vouchers] = await Promise.all([
      prisma.voucher.count({ where }),
      prisma.voucher.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    // Apply dynamic status calculation
    const processedVouchers = vouchers.map(v => this._calculateDynamicStatus(v));

    return {
      vouchers: processedVouchers,
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
   * Get active vouchers
   */
  async getActive(page = 1, limit = 10) {
    return this.getAll({ status: 'ACTIVE' }, page, limit);
  }

  /**
   * Get expired vouchers
   */
  async getExpired(page = 1, limit = 10) {
    return this.getAll({ status: 'EXPIRED' }, page, limit);
  }

  /**
   * Get voucher by ID
   */
  async getById(id) {
    const voucher = await prisma.voucher.findUnique({
      where: { id: BigInt(id), deletedAt: null },
    });
    return this._calculateDynamicStatus(voucher);
  }

  /**
   * Create a new voucher
   */
  async create(data) {
    // If remainingQuantity is not specified, initialize it to quantity
    const quantity = data.quantity;
    const remainingQuantity = data.remainingQuantity !== undefined ? data.remainingQuantity : quantity;

    // Validate prices
    if (data.salePrice !== undefined && data.originalPrice !== undefined) {
      if (Number(data.salePrice) > Number(data.originalPrice)) {
        const error = new Error('Giá khuyến mãi không được lớn hơn giá gốc');
        error.status = 400;
        error.errorCode = 'VALIDATION_ERROR';
        throw error;
      }
    }

    // Determine initial status based on stock and date
    let status = data.status || 'ACTIVE';
    const now = new Date();
    if (new Date(data.validUntil) < now) {
      status = 'EXPIRED';
    }

    return prisma.voucher.create({
      data: {
        ...data,
        remainingQuantity,
        status,
      },
    });
  }

  /**
   * Update a voucher
   */
  async update(id, data) {
    const existing = await prisma.voucher.findUnique({
      where: { id: BigInt(id), deletedAt: null },
    });

    if (!existing) {
      const error = new Error('Không tìm thấy voucher');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    // Merge data to check validations
    const updatedQty = data.quantity !== undefined ? data.quantity : existing.quantity;
    const updatedRemaining = data.remainingQuantity !== undefined ? data.remainingQuantity : existing.remainingQuantity;
    const updatedValidUntil = data.validUntil !== undefined ? new Date(data.validUntil) : existing.validUntil;
    const updatedOriginalPrice = data.originalPrice !== undefined ? data.originalPrice : existing.originalPrice;
    const updatedSalePrice = data.salePrice !== undefined ? data.salePrice : existing.salePrice;

    if (Number(updatedSalePrice) > Number(updatedOriginalPrice)) {
      const error = new Error('Giá khuyến mãi không được lớn hơn giá gốc');
      error.status = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }

    // Enforce business rules
    if (updatedRemaining > updatedQty) {
      const error = new Error('Số lượng khả dụng không được vượt quá số lượng ban đầu');
      error.status = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }

    // Calculate database status update
    let status = data.status || existing.status;
    const now = new Date();
    if (updatedValidUntil < now) {
      status = 'EXPIRED';
    }

    const updated = await prisma.voucher.update({
      where: { id: BigInt(id) },
      data: {
        ...data,
        status,
      },
    });

    return this._calculateDynamicStatus(updated);
  }

  /**
   * Delete a voucher
   */
  async delete(id) {
    const existing = await prisma.voucher.findUnique({
      where: { id: BigInt(id), deletedAt: null },
    });

    if (!existing) {
      const error = new Error('Không tìm thấy voucher để xóa');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    await prisma.voucher.update({
      where: { id: BigInt(id) },
      data: { deletedAt: new Date() },
    });

    return true;
  }
}

module.exports = new VoucherService();
