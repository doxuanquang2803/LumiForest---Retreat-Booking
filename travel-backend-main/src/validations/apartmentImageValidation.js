const { z } = require('zod');

const createApartmentImageBody = z.object({
  apartmentId: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ required_error: 'ID căn hộ không được để trống' })
      .int('ID căn hộ phải là số nguyên')
      .positive('ID căn hộ phải lớn hơn 0')
  ),
  imageUrl: z.string().optional(), // Optional in raw body since it can be populated from req.file
  type: z.enum(['thumbnail', 'gallery'], {
    errorMap: () => ({ message: 'Loại ảnh phải là "thumbnail" hoặc "gallery"' }),
  }).default('gallery'),
});

const updateApartmentImageBody = createApartmentImageBody.partial();

module.exports = {
  createSchema: { body: createApartmentImageBody },
  updateSchema: { body: updateApartmentImageBody },
};
