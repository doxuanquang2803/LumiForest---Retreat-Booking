const { z } = require('zod');

const createTourBookingBody = z.object({
  tourId: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ required_error: 'ID tour không được để trống' })
      .int('ID tour phải là số nguyên')
      .positive('ID tour phải lớn hơn 0')
  ),
  fullName: z.string({ required_error: 'Họ tên không được để trống' })
    .trim()
    .min(1, 'Họ tên không được để trống'),
  email: z.string({ required_error: 'Email không được để trống' })
    .email('Định dạng email không hợp lệ'),
  phone: z.string({ required_error: 'Số điện thoại không được để trống' })
    .trim()
    .min(1, 'Số điện thoại không được để trống'),
  bookingDate: z.string({ required_error: 'Ngày đặt tour không được để trống' })
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Ngày đặt tour không hợp lệ (định dạng YYYY-MM-DD hoặc ISO)',
    }),
  guests: z.preprocess(
    (val) => (val === undefined ? 1 : typeof val === 'string' ? parseInt(val, 10) : val),
    z.number()
      .int('Số khách phải là số nguyên')
      .positive('Số khách phải lớn hơn 0')
      .default(1)
  ),
  userId: z.preprocess(
    (val) => (val === undefined || val === null || val === '' ? null : typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().positive().nullable().optional()
  ),
});

module.exports = {
  createSchema: { body: createTourBookingBody },
};
