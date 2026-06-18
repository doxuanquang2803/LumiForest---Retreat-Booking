const { z } = require('zod');

const createHotelBody = z.object({
  name: z.string({ required_error: 'Tên khách sạn không được để trống' })
    .min(3, 'Tên phải có ít nhất 3 ký tự')
    .max(150, 'Tên không được vượt quá 150 ký tự'),
  slug: z.string({ required_error: 'Slug không được để trống' })
    .min(3, 'Slug phải có ít nhất 3 ký tự')
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ được chứa chữ thường, số và dấu gạch ngang'),
  description: z.string({ required_error: 'Mô tả không được để trống' })
    .min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  location: z.string({ required_error: 'Khu vực không được để trống' }),
  address: z.string({ required_error: 'Địa chỉ không được để trống' }),
  starRating: z.number()
    .int('Số sao phải là số nguyên')
    .min(1, 'Số sao tối thiểu là 1')
    .max(5, 'Số sao tối đa là 5')
    .default(3),
  price: z.number({ required_error: 'Giá không được để trống' })
    .positive('Giá phải lớn hơn 0'),
  thumbnail: z.string({ required_error: 'Ảnh thumbnail không được để trống' })
    .min(1, 'Ảnh thumbnail không được để trống'),
  amenities: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  status: z.enum(['active', 'inactive']).default('active'),
});

const updateHotelBody = createHotelBody.partial();

const hotelQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 10),
  q: z.string().optional(),
  location: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  starRating: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  featured: z.string().optional().transform(val => val === 'true' ? true : val === 'false' ? false : undefined),
  status: z.enum(['active', 'inactive']).optional(),
});

module.exports = {
  createSchema: { body: createHotelBody },
  updateSchema: { body: updateHotelBody },
  querySchema: { query: hotelQuerySchema },
};
