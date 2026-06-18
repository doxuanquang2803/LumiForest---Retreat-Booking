const { z } = require('zod');

const createTourImageBody = z.object({
  tourId: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ required_error: 'ID tour không được để trống' })
      .int('ID tour phải là số nguyên')
      .positive('ID tour phải lớn hơn 0')
  ),
  imageUrl: z.string().optional(), // Optional in raw body since it can be populated from req.file
  type: z.enum(['thumbnail', 'gallery'], {
    errorMap: () => ({ message: 'Loại ảnh phải là "thumbnail" hoặc "gallery"' }),
  }).default('gallery'),
});

const updateTourImageBody = createTourImageBody.partial();

module.exports = {
  createSchema: { body: createTourImageBody },
  updateSchema: { body: updateTourImageBody },
};
