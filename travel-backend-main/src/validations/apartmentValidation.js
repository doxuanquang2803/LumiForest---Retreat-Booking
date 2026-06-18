const { z } = require('zod');

const createApartmentBody = z.object({
  title: z.string({ required_error: 'Tiêu đề không được để trống' })
    .min(3, 'Tiêu đề phải có ít nhất 3 ký tự')
    .max(100, 'Tiêu đề không được vượt quá 100 ký tự'),
  description: z.string({ required_error: 'Mô tả không được để trống' })
    .min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  location: z.string({ required_error: 'Khu vực không được để trống' }),
  address: z.string({ required_error: 'Địa chỉ không được để trống' }),
  price: z.number({ required_error: 'Giá không được để trống' })
    .positive('Giá phải lớn hơn 0'),
  maxGuests: z.number({ required_error: 'Số lượng khách tối đa không được để trống' })
    .int('Số khách phải là số nguyên')
    .positive('Số khách phải lớn hơn 0'),
  bedrooms: z.number({ required_error: 'Số phòng ngủ không được để trống' })
    .int('Số phòng ngủ phải là số nguyên')
    .nonnegative('Số phòng ngủ không được là số âm'),
  bathrooms: z.number({ required_error: 'Số phòng tắm không được để trống' })
    .int('Số phòng tắm phải là số nguyên')
    .nonnegative('Số phòng tắm không được là số âm'),
  thumbnail: z.string({ required_error: 'Ảnh thu nhỏ không được để trống' })
    .min(1, 'Ảnh thu nhỏ không được để trống'),
  status: z.enum(['available', 'rented', 'maintenance']).default('available').optional(),
});

const updateApartmentBody = createApartmentBody.partial();

const apartmentQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 10),
  q: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  location: z.string().optional(),
  bedrooms: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  bathrooms: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  maxGuests: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  status: z.enum(['available', 'rented', 'maintenance']).optional(),
});

module.exports = {
  createSchema: { body: createApartmentBody },
  updateSchema: { body: updateApartmentBody },
  querySchema: { query: apartmentQuerySchema },
};
