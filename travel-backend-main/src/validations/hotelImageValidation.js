const { z } = require('zod');

const createHotelImageBody = z.object({
  hotelId: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ required_error: 'ID khách sạn không được để trống' })
      .int('ID khách sạn phải là số nguyên')
      .positive('ID khách sạn phải lớn hơn 0')
  ),
  imageUrl: z.string().optional(),
  type: z.enum(['thumbnail', 'gallery'], {
    errorMap: () => ({ message: 'Loại ảnh phải là "thumbnail" hoặc "gallery"' }),
  }).default('gallery'),
});

const updateHotelImageBody = createHotelImageBody.partial();

module.exports = {
  createSchema: { body: createHotelImageBody },
  updateSchema: { body: updateHotelImageBody },
};
