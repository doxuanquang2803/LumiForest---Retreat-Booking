const { z } = require('zod');

const createBookingBody = z.object({
  roomId:   z.number({ required_error: 'roomId không được để trống' }).int().positive(),
  fullName: z.string({ required_error: 'Họ tên không được để trống' }).min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email:    z.string({ required_error: 'Email không được để trống' }).email('Email không hợp lệ'),
  phone:    z.string({ required_error: 'Số điện thoại không được để trống' }).min(9, 'Số điện thoại không hợp lệ'),
  checkIn:  z.string({ required_error: 'Ngày nhận phòng không được để trống' }).refine(v => !isNaN(Date.parse(v)), 'checkIn không hợp lệ'),
  checkOut: z.string({ required_error: 'Ngày trả phòng không được để trống' }).refine(v => !isNaN(Date.parse(v)), 'checkOut không hợp lệ'),
  guests:   z.number().int().min(1).default(1),
  notes:    z.string().optional(),
});

const updateStatusBody = z.object({
  status: z.enum(['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out'], {
    required_error: 'Status không được để trống',
  }),
});

const querySchema = z.object({
  page:          z.string().optional().transform(v => v ? Math.max(1, parseInt(v, 10)) : 1),
  limit:         z.string().optional().transform(v => v ? Math.max(1, parseInt(v, 10)) : 10),
  status:        z.enum(['pending', 'confirmed', 'cancelled', 'checked_in', 'checked_out']).optional(),
  paymentStatus: z.enum(['unpaid', 'paid', 'refunded']).optional(),
  roomId:        z.string().optional(),
});

module.exports = {
  createSchema:       { body: createBookingBody },
  updateStatusSchema: { body: updateStatusBody },
  querySchema:        { query: querySchema },
};
