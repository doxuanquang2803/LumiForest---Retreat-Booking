const prisma = require('../config/prismaClient');

class RoomImageService {
  async _syncRoomImages(tx, roomId) {
    const allImages = await tx.roomImage.findMany({
      where: { roomId },
      orderBy: { createdAt: 'asc' },
    });

    const thumbnailImage = allImages.find((img) => img.type === 'thumbnail');
    const galleryImages = allImages.filter((img) => img.type === 'gallery');

    const updateData = { gallery: galleryImages.map((img) => img.imageUrl) };
    if (thumbnailImage) updateData.thumbnail = thumbnailImage.imageUrl;

    await tx.room.update({ where: { id: roomId }, data: updateData });
  }

  async create(data) {
    const room = await prisma.room.findUnique({ where: { id: data.roomId } });
    if (!room) {
      const error = new Error('Không tìm thấy phòng tương ứng');
      error.status = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      if (data.type === 'thumbnail') {
        await tx.roomImage.updateMany({
          where: { roomId: data.roomId, type: 'thumbnail' },
          data: { type: 'gallery' },
        });
      }

      const newImage = await tx.roomImage.create({ data });
      await this._syncRoomImages(tx, data.roomId);
      return newImage;
    });
  }

  async getById(id) {
    return prisma.roomImage.findUnique({ where: { id } });
  }

  async delete(id) {
    const existing = await prisma.roomImage.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Không tìm thấy hình ảnh phòng');
      error.status = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.roomImage.delete({ where: { id } });
      await this._syncRoomImages(tx, existing.roomId);
      return deleted;
    });
  }
}

module.exports = new RoomImageService();
