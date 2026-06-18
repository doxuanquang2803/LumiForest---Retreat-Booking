const prisma = require('../config/prismaClient');

class HotelImageService {
  async _syncHotelImages(tx, hotelId) {
    const allImages = await tx.hotelImage.findMany({
      where: { hotelId },
      orderBy: { createdAt: 'asc' },
    });

    const thumbnailImage = allImages.find((img) => img.type === 'thumbnail');
    const galleryImages = allImages.filter((img) => img.type === 'gallery');

    const updateData = { gallery: galleryImages.map((img) => img.imageUrl) };
    if (thumbnailImage) updateData.thumbnail = thumbnailImage.imageUrl;

    await tx.hotel.update({ where: { id: hotelId }, data: updateData });
  }

  async create(data) {
    const hotel = await prisma.hotel.findFirst({ where: { id: data.hotelId, deletedAt: null } });
    if (!hotel) {
      const error = new Error('Không tìm thấy khách sạn tương ứng');
      error.status = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      if (data.type === 'thumbnail') {
        await tx.hotelImage.updateMany({
          where: { hotelId: data.hotelId, type: 'thumbnail' },
          data: { type: 'gallery' },
        });
      }

      const newImage = await tx.hotelImage.create({ data });
      await this._syncHotelImages(tx, data.hotelId);
      return newImage;
    });
  }

  async getById(id) {
    return prisma.hotelImage.findUnique({ where: { id } });
  }

  async delete(id) {
    const existing = await prisma.hotelImage.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Không tìm thấy hình ảnh khách sạn');
      error.status = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.hotelImage.delete({ where: { id } });
      await this._syncHotelImages(tx, existing.hotelId);
      return deleted;
    });
  }

  async setThumbnail(id) {
    const existing = await prisma.hotelImage.findUnique({ where: { id } });
    if (!existing) {
      const error = new Error('Không tìm thấy hình ảnh khách sạn');
      error.status = 404;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      await tx.hotelImage.updateMany({
        where: { hotelId: existing.hotelId, type: 'thumbnail', id: { not: id } },
        data: { type: 'gallery' },
      });

      const updated = await tx.hotelImage.update({
        where: { id },
        data: { type: 'thumbnail' },
      });

      await this._syncHotelImages(tx, existing.hotelId);
      return updated;
    });
  }
}

module.exports = new HotelImageService();
