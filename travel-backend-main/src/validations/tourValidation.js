const { z } = require('zod');

const createTourBody = z.object({
  title: z.string({ required_error: 'Tiêu đề không được để trống' })
    .min(3, 'Tiêu đề phải có ít nhất 3 ký tự')
    .max(100, 'Tiêu đề không được vượt quá 100 ký tự'),
  slug: z.string().optional(),
  description: z.string({ required_error: 'Mô tả không được để trống' })
    .min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  location: z.string({ required_error: 'Địa điểm không được để trống' }),
  price: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number({ required_error: 'Giá không được để trống' })
      .positive('Giá phải lớn hơn 0')
  ),
  duration: z.string({ required_error: 'Thời lượng không được để trống' }),
  maxGuests: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ required_error: 'Số lượng khách tối đa không được để trống' })
      .int('Số lượng khách tối đa phải là số nguyên')
      .positive('Số lượng khách tối đa phải lớn hơn 0')
  ),
  thumbnail: z.string().optional(), // imageUrl path populated from req.file or explicitly provided
  gallery: z.preprocess(
    (val) => {
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val);
          return Array.isArray(parsed) ? parsed : [val];
        } catch {
          return [val];
        }
      }
      return val;
    },
    z.array(z.string()).default([])
  ).optional(),
  rating: z.preprocess(
    (val) => (typeof val === 'string' ? parseFloat(val) : val),
    z.number().min(0, 'Đánh giá tối thiểu là 0').max(5, 'Đánh giá tối đa là 5').default(0.0)
  ).optional(),
  bookingCount: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().nonnegative('Số lượng đặt chỗ không được âm').default(0)
  ).optional(),
  status: z.enum(['active', 'inactive']).default('active').optional(),
});

const updateTourBody = createTourBody.partial();

const tourQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 10),
  keyword: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  location: z.string().optional(),
  duration: z.string().optional(),
  rating: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  sortBy: z.enum(['price_asc', 'price_desc', 'newest', 'popular']).optional(),
});

module.exports = {
  createSchema: { body: createTourBody },
  updateSchema: { body: updateTourBody },
  querySchema: { query: tourQuerySchema },
};
