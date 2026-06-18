const prisma = require('../config/prismaClient');

/**
 * Service to handle all tour image database operations using Prisma
 * Automatically syncs the Tour's thumbnail and gallery fields
 */
class TourImageService {
  /**
   * Helper to rebuild tour's thumbnail and gallery from tour_images table
   * @param {Object} tx - Prisma transaction client
   * @param {number} tourId - Tour ID
   */
  async _syncTourImages(tx, tourId) {
    // Fetch all images for this tour
    const allImages = await tx.tourImage.findMany({
      where: { tourId },
      orderBy: { createdAt: 'asc' },
    });

    // Get thumbnail (use the latest "thumbnail" type, or keep existing)
    const thumbnailImage = allImages.find((img) => img.type === 'thumbnail');
    const galleryImages = allImages.filter((img) => img.type === 'gallery');

    const updateData = {
      gallery: galleryImages.map((img) => img.imageUrl),
    };

    // Only update thumbnail if there's one in the images table
    if (thumbnailImage) {
      updateData.thumbnail = thumbnailImage.imageUrl;
    }

    await tx.tour.update({
      where: { id: tourId },
      data: updateData,
    });
  }

  /**
   * Create a new tour image and sync with tour thumbnail/gallery
   * @param {Object} data - Image payload containing tourId, imageUrl, type
   */
  async create(data) {
    // Check if the tour exists
    const tour = await prisma.tour.findUnique({
      where: { id: data.tourId },
    });

    if (!tour) {
      const error = new Error('Không tìm thấy tour du lịch tương ứng');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      // If adding a new thumbnail, reset any existing thumbnail to gallery
      if (data.type === 'thumbnail') {
        await tx.tourImage.updateMany({
          where: { tourId: data.tourId, type: 'thumbnail' },
          data: { type: 'gallery' },
        });
      }

      const newImage = await tx.tourImage.create({
        data,
      });

      // Sync tour's thumbnail and gallery
      await this._syncTourImages(tx, data.tourId);

      return newImage;
    });
  }

  /**
   * Get a tour image by ID
   * @param {number} id - Image ID
   */
  async getById(id) {
    return prisma.tourImage.findUnique({
      where: { id },
    });
  }

  /**
   * Delete a tour image by ID and sync tour thumbnail/gallery
   * @param {number} id - Image ID
   */
  async delete(id) {
    const existing = await prisma.tourImage.findUnique({
      where: { id },
    });

    if (!existing) {
      const error = new Error('Không tìm thấy hình ảnh tour');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.tourImage.delete({
        where: { id },
      });

      // Sync tour's thumbnail and gallery
      await this._syncTourImages(tx, existing.tourId);

      return deleted;
    });
  }

  /**
   * Update an existing tour image and sync tour thumbnail/gallery
   * @param {number} id - Image ID
   * @param {Object} data - Payload fields to update
   */
  async update(id, data) {
    const existing = await prisma.tourImage.findUnique({
      where: { id },
    });

    if (!existing) {
      const error = new Error('Không tìm thấy hình ảnh tour để cập nhật');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      // If changing to thumbnail, reset any existing thumbnail to gallery
      if (data.type === 'thumbnail') {
        await tx.tourImage.updateMany({
          where: { tourId: existing.tourId, type: 'thumbnail', id: { not: id } },
          data: { type: 'gallery' },
        });
      }

      const updated = await tx.tourImage.update({
        where: { id },
        data,
      });

      // Sync tour's thumbnail and gallery
      await this._syncTourImages(tx, existing.tourId);

      return updated;
    });
  }
}

module.exports = new TourImageService();
