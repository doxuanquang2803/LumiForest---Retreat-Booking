const prisma = require('../config/prismaClient');

class TourBookingService {
  /**
   * Create a new tour booking
   */
  async create(data) {
    const { tourId, userId, fullName, email, phone, bookingDate, guests } = data;

    return prisma.$transaction(async (tx) => {
      // 1. Lock the tour row to prevent concurrent race conditions
      await tx.$executeRaw`SELECT 1 FROM tours WHERE id = ${tourId} FOR UPDATE`;

      // 2. Check if the tour exists and is active inside transaction
      const tour = await tx.tour.findFirst({
        where: {
          id: tourId,
          deletedAt: null,
        },
      });

      if (!tour) {
        const error = new Error('Không tìm thấy tour du lịch hoặc tour đã dừng hoạt động');
        error.status = 404;
        error.errorCode = 'NOT_FOUND';
        throw error;
      }

      if (tour.status !== 'active') {
        const error = new Error('Tour du lịch hiện tại không nhận đặt chỗ');
        error.status = 400;
        error.errorCode = 'VALIDATION_ERROR';
        throw error;
      }

      // 3. Check capacity on this specific date inside transaction
      const parsedDate = new Date(bookingDate);
      const existingBookings = await tx.tourBooking.aggregate({
        where: {
          tourId,
          bookingDate: parsedDate,
          status: { in: ['pending', 'confirmed'] },
        },
        _sum: {
          guests: true,
        },
      });

      const bookedGuests = existingBookings._sum.guests || 0;
      if (bookedGuests + guests > tour.maxGuests) {
        const remaining = tour.maxGuests - bookedGuests;
        const error = new Error(
          `Tour này không đủ chỗ vào ngày ${bookingDate}. Số chỗ còn lại: ${remaining >= 0 ? remaining : 0}`
        );
        error.status = 400;
        error.errorCode = 'VALIDATION_ERROR';
        throw error;
      }

      // 4. Calculate total price
      const totalPrice = tour.price * guests;

      // 5. Create booking
      const newBooking = await tx.tourBooking.create({
        data: {
          tourId,
          userId: userId ? BigInt(userId) : null,
          fullName,
          email,
          phone,
          bookingDate: parsedDate,
          guests,
          totalPrice,
          status: 'pending',
        },
        include: {
          tour: true,
        },
      });

      // 6. Increment tour bookingCount
      await tx.tour.update({
        where: { id: tourId },
        data: {
          bookingCount: {
            increment: 1,
          },
        },
      });

      return newBooking;
    });
  }

  /**
   * Get all tour bookings (Admin)
   */
  async getAll(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    const [total, bookings] = await Promise.all([
      prisma.tourBooking.count(),
      prisma.tourBooking.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          tour: true,
          user: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      bookings,
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
   * Get bookings for a specific user
   */
  async getByUserId(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where = { userId: BigInt(userId) };

    const [total, bookings] = await Promise.all([
      prisma.tourBooking.count({ where }),
      prisma.tourBooking.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          tour: true,
          user: true,
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      bookings,
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
   * Get specific booking by ID
   */
  async getById(id) {
    return prisma.tourBooking.findUnique({
      where: { id },
      include: {
        tour: true,
        user: true,
      },
    });
  }

  /**
   * Cancel a booking
   */
  async cancel(id) {
    const booking = await prisma.tourBooking.findUnique({
      where: { id },
    });

    if (!booking) {
      const error = new Error('Không tìm thấy đơn đặt tour');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    if (booking.status === 'cancelled') {
      const error = new Error('Đơn đặt tour này đã bị hủy từ trước');
      error.status = 400;
      error.errorCode = 'VALIDATION_ERROR';
      throw error;
    }

    const updatedBooking = await prisma.$transaction(async (tx) => {
      const updated = await tx.tourBooking.update({
        where: { id },
        data: {
          status: 'cancelled',
        },
        include: {
          tour: true,
        },
      });

      // Decrement tour bookingCount if it was previously incremented
      await tx.tour.update({
        where: { id: booking.tourId },
        data: {
          bookingCount: {
            decrement: 1,
          },
        },
      });

      return updated;
    });

    return updatedBooking;
  }
}

module.exports = new TourBookingService();
