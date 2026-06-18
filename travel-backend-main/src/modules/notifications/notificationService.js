const prisma = require('../../config/prismaClient');

class NotificationService {
  /**
   * Create a notification
   */
  async createNotification(userId, title, message, type) {
    return prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type
      }
    });
  }

  /**
   * Get paginated notifications of current user, sorted newest first
   */
  async getAllNotifications(userId, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const take = limit;
    const where = { userId };

    const [totalItems, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        skip,
        take,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      notifications,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
      },
    };
  }

  /**
   * Mark a notification as read, enforcing ownership check in service layer
   */
  async markAsRead(id, userId) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      const error = new Error('Không tìm thấy thông báo');
      error.status = 404;
      throw error;
    }

    if (notification.userId.toString() !== userId.toString()) {
      const error = new Error('Bạn không có quyền thực hiện hành động này');
      error.status = 403;
      throw error;
    }

    return prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });
  }

  /**
   * Delete a notification, enforcing ownership check in service layer
   */
  async deleteNotification(id, userId) {
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      const error = new Error('Không tìm thấy thông báo');
      error.status = 404;
      throw error;
    }

    if (notification.userId.toString() !== userId.toString()) {
      const error = new Error('Bạn không có quyền thực hiện hành động này');
      error.status = 403;
      throw error;
    }

    return prisma.notification.delete({
      where: { id },
    });
  }
}

module.exports = new NotificationService();
