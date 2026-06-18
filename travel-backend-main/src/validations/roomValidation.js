const { z } = require('zod');

const createRoomBody = z.object({
  hotelId: z.number({ required_error: 'ID khách sạn không được để trống' })
    .int('ID khách sạn phải là số nguyên')
    .positive('ID khách sạn phải lớn hơn 0'),
  name: z.string({ required_error: 'Tên phòng không được để trống' })
    .min(2, 'Tên phòng phải có ít nhất 2 ký tự')
    .max(100, 'Tên phòng không được vượt quá 100 ký tự'),
  type: z.string({ required_error: 'Loại phòng không được để trống' }),
  description: z.string({ required_error: 'Mô tả không được để trống' })
    .min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  price: z.number({ required_error: 'Giá không được để trống' })
    .positive('Giá phải lớn hơn 0'),
  maxGuests: z.number({ required_error: 'Số khách tối đa không được để trống' })
    .int('Số khách phải là số nguyên')
    .positive('Số khách phải lớn hơn 0'),
  beds: z.number().int().positive().default(1),
  bathrooms: z.number().int().positive().default(1),
  thumbnail: z.string({ required_error: 'Ảnh thumbnail không được để trống' }).min(1),
  amenities: z.array(z.string()).default([]),
  status: z.enum(['available', 'occupied', 'maintenance']).default('available'),
});

const updateRoomBody = createRoomBody.partial();

const updateStatusBody = z.object({
  status: z.enum(['available', 'occupied', 'maintenance'], {
    required_error: 'Trạng thái không được để trống',
    errorMap: () => ({ message: 'Trạng thái phải là available, occupied hoặc maintenance' }),
  }),
});

const roomQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 10),
  q: z.string().optional(),
  hotelId: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  type: z.string().optional(),
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxGuests: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
});

const hotelRoomQuerySchema = z.object({
  status: z.enum(['available', 'occupied', 'maintenance']).optional(),
  type: z.string().optional(),
});

module.exports = {
  createSchema: { body: createRoomBody },
  updateSchema: { body: updateRoomBody },
  updateStatusSchema: { body: updateStatusBody },
  querySchema: { query: roomQuerySchema },
  hotelRoomQuerySchema: { query: hotelRoomQuerySchema },
};
