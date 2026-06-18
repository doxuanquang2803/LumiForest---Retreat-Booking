const { z } = require('zod');

const createRoomImageBody = z.object({
  roomId: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ required_error: 'ID phòng không được để trống' })
      .int('ID phòng phải là số nguyên')
      .positive('ID phòng phải lớn hơn 0')
  ),
  imageUrl: z.string().optional(),
  type: z.enum(['thumbnail', 'gallery'], {
    errorMap: () => ({ message: 'Loại ảnh phải là "thumbnail" hoặc "gallery"' }),
  }).default('gallery'),
});

module.exports = {
  createSchema: { body: createRoomImageBody },
};
