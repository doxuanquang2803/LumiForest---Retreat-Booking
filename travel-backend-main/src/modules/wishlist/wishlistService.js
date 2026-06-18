const prisma = require('../../config/prismaClient');

class WishlistService {
  /**
   * Get wishlist of current user, sorted newest first
   */
  async getWishlist(userId) {
    return prisma.wishlistItem.findMany({
      where: { userId },
      select: {
        id: true,
        itemId: true,
        itemType: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /**
   * Add an item to the wishlist
   */
  async addWishlistItem(userId, itemId, itemType) {
    // Check if duplicate entry exists
    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_itemId_itemType: {
          userId,
          itemId,
          itemType,
        },
      },
    });

    if (existing) {
      const error = new Error('Mục này đã tồn tại trong danh sách yêu thích');
      error.status = 400;
      throw error;
    }

    return prisma.wishlistItem.create({
      data: {
        userId,
        itemId,
        itemType,
      },
      select: {
        id: true,
        itemId: true,
        itemType: true,
        createdAt: true,
      },
    });
  }

  /**
   * Delete a wishlist item, enforcing ownership check
   */
  async deleteById(id) {
    return prisma.wishlistItem.delete({ where: { id } });
  }

  async deleteWishlistItem(id, userId) {
    const item = await prisma.wishlistItem.findUnique({
      where: { id },
    });

    if (!item) {
      const error = new Error('Không tìm thấy mục trong danh sách yêu thích');
      error.status = 404;
      throw error;
    }

    if (item.userId.toString() !== userId.toString()) {
      const error = new Error('Bạn không có quyền thực hiện hành động này');
      error.status = 403;
      throw error;
    }

    return prisma.wishlistItem.delete({
      where: { id },
    });
  }
}

module.exports = new WishlistService();
