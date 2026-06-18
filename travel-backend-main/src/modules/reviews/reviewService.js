const prisma = require('../../config/prismaClient');

class ReviewService {
  /**
   * Kiểm tra user đã đặt VÀ sử dụng dịch vụ cho target này chưa.
   * Ném lỗi 403 nếu chưa đủ điều kiện.
   *
   * - HOTEL:     có HotelBooking (room.hotelId = targetId), status 'checked_out'
   * - TOUR:      có TourBooking (tourId = targetId), status 'confirmed', đã qua ngày đi
   * - APARTMENT: có bookings (type apartment, item_id = targetId) khớp email,
   *              status 'confirmed', đã qua ngày trả phòng
   */
  async assertCanReview(user, targetType, targetId) {
    const now = new Date();
    const targetIdNum = Number(targetId);
    const userId = BigInt(user.id);
    let used = null;

    if (targetType === 'HOTEL') {
      used = await prisma.hotelBooking.findFirst({
        where: {
          userId,
          status: 'checked_out',
          room: { hotelId: targetIdNum },
        },
        select: { id: true },
      });
    } else if (targetType === 'TOUR') {
      used = await prisma.tourBooking.findFirst({
        where: {
          userId,
          tourId: targetIdNum,
          status: 'confirmed',
          bookingDate: { lt: now },
        },
        select: { id: true },
      });
    } else if (targetType === 'APARTMENT') {
      used = await prisma.bookings.findFirst({
        where: {
          email: user.email,
          booking_type: 'apartment',
          item_id: BigInt(targetIdNum),
          status: 'confirmed',
          checkout: { lt: now },
        },
        select: { id: true },
      });
    }

    if (!used) {
      const error = new Error('Bạn chỉ có thể đánh giá sau khi đã đặt và sử dụng dịch vụ này');
      error.status = 403;
      throw error;
    }
  }

  /**
   * Tính lại rating trung bình + số lượt và ghi về bảng gốc (Hotel/Tour/Apartment).
   * Chạy trong transaction nếu được truyền vào, ngược lại dùng prisma mặc định.
   */
  async recomputeRating(targetType, targetId, tx = prisma) {
    const targetIdNum = Number(targetId);
    const stats = await tx.review.aggregate({
      where: { targetType, targetId },
      _avg: { rating: true },
      _count: { _all: true },
    });

    const averageRating = stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0.0;
    const reviewCount = stats._count._all;

    if (targetType === 'HOTEL') {
      await tx.hotel.update({
        where: { id: targetIdNum },
        data: { rating: averageRating, reviewCount },
      });
    } else if (targetType === 'TOUR') {
      await tx.tour.update({
        where: { id: targetIdNum },
        data: { rating: averageRating, reviewCount },
      });
    } else if (targetType === 'APARTMENT') {
      await tx.apartment.update({
        where: { id: targetIdNum },
        data: { rating: averageRating, reviewCount },
      });
    }

    return { averageRating, reviewCount };
  }

  /**
   * Create a new review (chỉ khi đã sử dụng dịch vụ).
   */
  async createReview(user, targetId, targetType, rating, comment) {
    await this.assertCanReview(user, targetType, targetId);

    const userId = BigInt(user.id);

    // Check if user already reviewed this target
    const existing = await prisma.review.findUnique({
      where: {
        userId_targetId_targetType: {
          userId,
          targetId,
          targetType,
        },
      },
    });

    if (existing) {
      const error = new Error('Bạn đã đánh giá mục này rồi');
      error.status = 400;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const review = await tx.review.create({
        data: {
          userId,
          targetId,
          targetType,
          rating,
          comment,
        },
      });
      await this.recomputeRating(targetType, targetId, tx);
      return review;
    });
  }

  /**
   * Get reviews by target (HOTEL/TOUR/APARTMENT) with pagination and aggregates
   */
  async getReviewsByTarget(targetType, targetId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where = { targetType, targetId };

    // Use Prisma aggregate for average rating and count for total items
    const [totalItems, reviews, stats] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.review.aggregate({
        where,
        _avg: {
          rating: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);
    const averageRating = stats._avg.rating ? parseFloat(stats._avg.rating.toFixed(1)) : 0.0;

    return {
      reviews,
      stats: {
        averageRating,
        totalReviews: totalItems,
      },
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  /**
   * Update review, enforcing ownership check in service layer
   */
  async updateReview(id, userId, data) {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      const error = new Error('Không tìm thấy đánh giá');
      error.status = 404;
      throw error;
    }

    if (review.userId !== BigInt(userId)) {
      const error = new Error('Bạn không có quyền thực hiện hành động này');
      error.status = 403;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const updated = await tx.review.update({
        where: { id },
        data: {
          rating: data.rating !== undefined ? data.rating : undefined,
          comment: data.comment !== undefined ? data.comment : undefined,
        },
      });
      await this.recomputeRating(review.targetType, review.targetId, tx);
      return updated;
    });
  }

  /**
   * Delete review, enforcing ownership check in service layer
   */
  async deleteReview(id, userId, role) {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      const error = new Error('Không tìm thấy đánh giá');
      error.status = 404;
      throw error;
    }

    if (review.userId !== BigInt(userId) && role !== 'ADMIN' && role !== 'STAFF') {
      const error = new Error('Bạn không có quyền thực hiện hành động này');
      error.status = 403;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.review.delete({
        where: { id },
      });
      await this.recomputeRating(review.targetType, review.targetId, tx);
      return deleted;
    });
  }

  /**
   * Report a review
   */
  async reportReview(id, reportReason) {
    const review = await prisma.review.findUnique({
      where: { id },
    });

    if (!review) {
      const error = new Error('Không tìm thấy đánh giá');
      error.status = 404;
      throw error;
    }

    return prisma.review.update({
      where: { id },
      data: {
        isReported: true,
        reportReason,
      },
    });
  }

  /**
   * List all reviews (Staff/Admin view)
   */
  async getAllReviews(filters = {}, page = 1, limit = 10) {
    page  = Math.max(1, parseInt(page, 10) || 1);
    limit = Math.max(1, parseInt(limit, 10) || 10);
    const skip = (page - 1) * limit;
    const take = limit;
    const where = {};

    if (filters.rating) {
      where.rating = parseInt(filters.rating, 10);
    }
    if (filters.targetType) {
      where.targetType = filters.targetType;
    }

    const [total, reviews] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

module.exports = new ReviewService();
