const prisma = require('../config/prismaClient');

/**
 * Service to handle all apartment image database operations using Prisma
 * Automatically syncs the Apartment's thumbnail and gallery fields
 */
class ApartmentImageService {
  /**
   * Helper to rebuild apartment's thumbnail and gallery from apartment_images table
   * @param {Object} tx - Prisma transaction client
   * @param {number} apartmentId - Apartment ID
   */
  async _syncApartmentImages(tx, apartmentId) {
    // Fetch all images for this apartment
    const allImages = await tx.apartmentImage.findMany({
      where: { apartmentId },
      orderBy: { createdAt: 'asc' },
    });

    // Get thumbnail and gallery images
    const thumbnailImage = allImages.find((img) => img.type === 'thumbnail');
    const galleryImages = allImages.filter((img) => img.type === 'gallery');

    const updateData = {
      gallery: galleryImages.map((img) => img.imageUrl),
    };

    // Only update thumbnail if there's one in the images table
    if (thumbnailImage) {
      updateData.thumbnail = thumbnailImage.imageUrl;
    }

    await tx.apartment.update({
      where: { id: apartmentId },
      data: updateData,
    });
  }

  /**
   * Create a new apartment image and sync with apartment thumbnail/gallery
   * @param {Object} data - Image payload containing apartmentId, imageUrl, type
   */
  async create(data) {
    // Check if the apartment exists
    const apartment = await prisma.apartment.findUnique({
      where: { id: data.apartmentId },
    });

    if (!apartment) {
      const error = new Error('Không tìm thấy căn hộ tương ứng');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      // If adding a new thumbnail, reset any existing thumbnail to gallery
      if (data.type === 'thumbnail') {
        await tx.apartmentImage.updateMany({
          where: { apartmentId: data.apartmentId, type: 'thumbnail' },
          data: { type: 'gallery' },
        });
      }

      const newImage = await tx.apartmentImage.create({
        data,
      });

      // Sync apartment's thumbnail and gallery
      await this._syncApartmentImages(tx, data.apartmentId);

      return newImage;
    });
  }

  /**
   * Get an apartment image by ID
   * @param {number} id - Image ID
   */
  async getById(id) {
    return prisma.apartmentImage.findUnique({
      where: { id },
    });
  }

  /**
   * Delete an apartment image by ID and sync apartment thumbnail/gallery
   * @param {number} id - Image ID
   */
  async delete(id) {
    // Check if the image exists
    const existing = await prisma.apartmentImage.findUnique({
      where: { id },
    });

    if (!existing) {
      const error = new Error('Không tìm thấy hình ảnh căn hộ');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      const deleted = await tx.apartmentImage.delete({
        where: { id },
      });

      // Sync apartment's thumbnail and gallery
      await this._syncApartmentImages(tx, existing.apartmentId);

      return deleted;
    });
  }

  /**
   * Update an existing apartment image and sync apartment thumbnail/gallery
   * @param {number} id - Image ID
   * @param {Object} data - Payload fields to update
   */
  async update(id, data) {
    const existing = await prisma.apartmentImage.findUnique({
      where: { id },
    });

    if (!existing) {
      const error = new Error('Không tìm thấy hình ảnh căn hộ để cập nhật');
      error.status = 404;
      error.errorCode = 'NOT_FOUND';
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      // If changing to thumbnail, reset any existing thumbnail to gallery
      if (data.type === 'thumbnail') {
        await tx.apartmentImage.updateMany({
          where: { apartmentId: existing.apartmentId, type: 'thumbnail', id: { not: id } },
          data: { type: 'gallery' },
        });
      }

      const updated = await tx.apartmentImage.update({
        where: { id },
        data,
      });

      // Sync apartment's thumbnail and gallery
      await this._syncApartmentImages(tx, existing.apartmentId);

      return updated;
    });
  }
}

module.exports = new ApartmentImageService();
