const prisma = require('../../config/prismaClient');

class AdminService {
  /**
   * Helper to construct UTC date bounds for query filtering
   */
  buildDateFilter(day, month, year) {
    if (!year) return null;
    
    let startDate;
    let endDate;

    if (day && month) {
      startDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999));
    } else if (month) {
      startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
    } else {
      startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
    }

    return { gte: startDate, lte: endDate };
  }

  /**
   * List active users (deletedAt IS NULL), paginated
   */
  async getUsers(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where = { deletedAt: null };

    const [totalItems, users] = await Promise.all([
      prisma.users.count({ where }),
      prisma.users.findMany({
        where,
        skip,
        take,
        orderBy: { created_at: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          created_at: true,
        },
      }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Update user role
   */
  async updateUserRole(id, role) {
    const user = await prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      const error = new Error('Không tìm thấy người dùng');
      error.status = 404;
      throw error;
    }

    return prisma.users.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
      },
    });
  }

  /**
   * Soft delete a user
   */
  async softDeleteUser(id) {
    const user = await prisma.users.findFirst({
      where: { id, deletedAt: null },
    });

    if (!user) {
      const error = new Error('Không tìm thấy người dùng');
      error.status = 404;
      throw error;
    }

    return prisma.users.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  /**
   * List all bookings (HotelBooking + Tour Booking combined, excluding soft-deleted users)
   */
  async getBookings(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    let hotelBookings = [];
    let tourBookings = [];

    // Safely query hotel bookings
    if (prisma.hotelBooking) {
      hotelBookings = await prisma.hotelBooking.findMany({
        where: {
          OR: [
            { userId: null },
            { user: { deletedAt: null } },
          ],
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Safely query tour bookings
    if (prisma.tourBooking) {
      tourBookings = await prisma.tourBooking.findMany({
        where: {
          OR: [
            { userId: null },
            { user: { deletedAt: null } },
          ],
        },
        include: {
          user: {
            select: { name: true, email: true },
          },
          tour: {
            select: { title: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Combine and sort by newest first
    const combinedBookings = [
      ...hotelBookings.map((b) => ({
        id: b.id,
        bookingType: 'HOTEL',
        fullName: b.fullName,
        email: b.email,
        phone: b.phone,
        totalPrice: b.totalPrice,
        status: b.status,
        createdAt: b.createdAt,
        details: { roomId: b.roomId },
        users: b.user,
      })),
      ...tourBookings.map((b) => ({
        id: b.id,
        bookingType: 'TOUR',
        fullName: b.fullName,
        email: b.email,
        phone: b.phone,
        totalPrice: b.totalPrice,
        status: b.status,
        createdAt: b.createdAt,
        details: { tourId: b.tourId, tourTitle: b.tour?.title },
        users: b.user,
      })),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const paginated = combinedBookings.slice(skip, skip + take);

    return {
      bookings: paginated,
      pagination: {
        page,
        limit,
        totalItems: combinedBookings.length,
        totalPages: Math.ceil(combinedBookings.length / limit),
      },
    };
  }

  /**
   * List payments, excluding soft-deleted users
   */
  async getPayments(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    if (!prisma.payment) {
      return { payments: [], pagination: { page, limit, totalItems: 0, totalPages: 0 } };
    }

    const where = {
      OR: [
        { userId: null },
        { user: { deletedAt: null } },
      ],
    };

    const [totalItems, paymentsList] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { name: true, email: true },
          },
        },
      }),
    ]);

    return {
      payments: paymentsList,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Calculate revenue with optional date bounds
   */
  async calculateRevenue(day, month, year) {
    const dateRange = this.buildDateFilter(day, month, year);

    let hotelRevenue = 0;
    let tourRevenue = 0;
    let voucherRevenue = 0;

    // 1. Hotel Revenue from payments
    if (prisma.payment) {
      const paymentWhere = {
        status: { in: ['paid', 'success', 'completed'] },
        OR: [
          { userId: null },
          { user: { deletedAt: null } },
        ],
      };
      if (dateRange) {
        paymentWhere.paidAt = dateRange;
      }

      const sumRes = await prisma.payment.aggregate({
        where: paymentWhere,
        _sum: { amount: true },
      });
      hotelRevenue = sumRes._sum.amount || 0;
    }

    // 2. Tour Revenue from tourBookings
    if (prisma.tourBooking) {
      const tourWhere = {
        status: { in: ['paid', 'confirmed', 'completed'] },
        OR: [
          { userId: null },
          { user: { deletedAt: null } },
        ],
      };
      if (dateRange) {
        tourWhere.createdAt = dateRange;
      }

      const sumRes = await prisma.tourBooking.aggregate({
        where: tourWhere,
        _sum: { totalPrice: true },
      });
      tourRevenue = sumRes._sum.totalPrice || 0;
    }

    // 3. Voucher Revenue from voucherOrder
    if (prisma.voucherOrder) {
      const voucherWhere = {
        status: 'PAID',
        OR: [
          { userId: null },
          { user: { deletedAt: null } },
        ],
      };
      if (dateRange) {
        voucherWhere.createdAt = dateRange;
      }

      const sumRes = await prisma.voucherOrder.aggregate({
        where: voucherWhere,
        _sum: { totalPrice: true },
      });
      voucherRevenue = sumRes._sum.totalPrice ? parseFloat(sumRes._sum.totalPrice.toString()) : 0;
    }

    const totalRevenue = hotelRevenue + tourRevenue + voucherRevenue;

    return {
      hotelRevenue,
      tourRevenue,
      voucherRevenue,
      totalRevenue,
    };
  }

  /**
   * Get general stats
   */
  async getStatistics() {
    const activeUsersCount = await prisma.users.count({
      where: { deletedAt: null },
    });

    let totalBookingsCount = 0;
    if (prisma.hotelBooking) {
      totalBookingsCount += await prisma.hotelBooking.count({
        where: {
          OR: [
            { userId: null },
            { user: { deletedAt: null } },
          ],
        },
      });
    }
    if (prisma.tourBooking) {
      totalBookingsCount += await prisma.tourBooking.count({
        where: {
          OR: [
            { userId: null },
            { user: { deletedAt: null } },
          ],
        },
      });
    }

    let totalPaymentsCount = 0;
    if (prisma.payment) {
      totalPaymentsCount += await prisma.payment.count({
        where: {
          OR: [
            { userId: null },
            { user: { deletedAt: null } },
          ],
        },
      });
    }

    let totalReviewsCount = 0;
    if (prisma.review) {
      totalReviewsCount = await prisma.review.count();
    }

    let totalContactsCount = 0;
    if (prisma.contacts) {
      totalContactsCount = await prisma.contacts.count();
    }

    const revenueData = await this.calculateRevenue();

    return {
      totalUsers: activeUsersCount,
      totalBookings: totalBookingsCount,
      totalPayments: totalPaymentsCount,
      totalRevenue: revenueData.totalRevenue,
      totalReviews: totalReviewsCount,
      totalContacts: totalContactsCount,
    };
  }

  /**
   * Get audit logs, paginated
   */
  async getAuditLogs(page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;

    const [totalItems, logs] = await Promise.all([
      prisma.auditLog.count(),
      prisma.auditLog.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages: Math.ceil(totalItems / limit),
      },
    };
  }

  /**
   * Get revenue data grouped by month (or day if month is provided)
   */
  async getRevenueChartData(year, month, type) {
    const targetYear = parseInt(year) || new Date().getFullYear();
    let startDate, endDate;
    let isDaily = false;
    let dataPoints = 12;

    if (month && month !== 'all' && month !== '') {
      const targetMonth = parseInt(month); // 1-12
      startDate = new Date(Date.UTC(targetYear, targetMonth - 1, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(targetYear, targetMonth, 0, 23, 59, 59, 999));
      dataPoints = new Date(targetYear, targetMonth, 0).getDate();
      isDaily = true;
    } else {
      startDate = new Date(Date.UTC(targetYear, 0, 1, 0, 0, 0, 0));
      endDate = new Date(Date.UTC(targetYear, 11, 31, 23, 59, 59, 999));
    }

    const chartData = Array(dataPoints).fill(0);

    if (prisma.payment) {
      const whereClause = {
        status: { in: ['paid', 'success', 'completed'] },
        OR: [
          { userId: null },
          { user: { deletedAt: null } },
        ],
        paidAt: {
          gte: startDate,
          lte: endDate
        }
      };

      if (type && type !== 'all' && type !== '') {
        whereClause.bookingType = type;
      }

      const payments = await prisma.payment.findMany({
        where: whereClause,
        select: {
          amount: true,
          paidAt: true
        }
      });

      payments.forEach(p => {
        if (p.paidAt) {
          if (isDaily) {
            const day = new Date(p.paidAt).getDate(); // 1 to 31
            chartData[day - 1] += parseFloat(p.amount || 0);
          } else {
            const m = new Date(p.paidAt).getMonth(); // 0-11
            chartData[m] += parseFloat(p.amount || 0);
          }
        }
      });
    }

    return {
      year: targetYear,
      month: isDaily ? parseInt(month) : 'all',
      isDaily: isDaily,
      chartData: chartData
    };
  }

  /**
   * Get top locations and top hotels based on bookings
   */
  async getTopLocations() {
    const locationCounts = {};
    const hotelCounts = {};

    if (prisma.hotelBooking) {
      const hotelBookings = await prisma.hotelBooking.findMany({
        where: {
          status: { notIn: ['cancelled', 'failed'] }
        },
        include: {
          room: {
            include: {
              hotel: {
                select: { name: true, location: true }
              }
            }
          }
        }
      });

      hotelBookings.forEach(b => {
        if (b.room && b.room.hotel) {
          const loc = b.room.hotel.location;
          if (loc) {
            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
          }
          const hName = b.room.hotel.name;
          if (hName) {
            hotelCounts[hName] = (hotelCounts[hName] || 0) + 1;
          }
        }
      });
    }

    if (prisma.tourBooking) {
      const tourBookings = await prisma.tourBooking.findMany({
        where: {
          status: { notIn: ['cancelled', 'failed'] }
        },
        include: {
          tour: {
            select: { location: true }
          }
        }
      });

      tourBookings.forEach(b => {
        if (b.tour && b.tour.location) {
          const loc = b.tour.location;
          if (loc) {
            locationCounts[loc] = (locationCounts[loc] || 0) + 1;
          }
        }
      });
    }

    const topLocations = Object.keys(locationCounts).map(loc => ({
      name: loc,
      bookings: locationCounts[loc]
    })).sort((a, b) => b.bookings - a.bookings).slice(0, 10);

    const topHotels = Object.keys(hotelCounts).map(name => ({
      name: name,
      bookings: hotelCounts[name]
    })).sort((a, b) => b.bookings - a.bookings).slice(0, 10);

    return { topLocations, topHotels };
  }
}

module.exports = new AdminService();
