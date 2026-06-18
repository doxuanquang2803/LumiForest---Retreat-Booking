const { z } = require('zod');

const createOrderBody = z.object({
  voucherId: z.union([z.number(), z.string()], { required_error: 'ID voucher không được để trống' })
    .transform(val => typeof val === 'string' ? parseInt(val, 10) : val),
  userId: z.union([z.number(), z.string()]).optional().nullable()
    .transform(val => {
      if (val === undefined || val === null) return null;
      return BigInt(val);
    }),
  fullName: z.string({ required_error: 'Họ tên không được để trống' })
    .min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  email: z.string({ required_error: 'Email không được để trống' })
    .email('Email không đúng định dạng'),
  phone: z.string({ required_error: 'Số điện thoại không được để trống' })
    .min(10, 'Số điện thoại phải có ít nhất 10 số'),
  quantity: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ required_error: 'Số lượng mua không được để trống' })
      .int('Số lượng phải là số nguyên')
      .positive('Số lượng phải lớn hơn 0')
  ),
});

const queryOrderSchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 10),
  email: z.string().optional(),
  phone: z.string().optional(),
  userId: z.string().optional().transform(val => val ? BigInt(val) : undefined),
  status: z.enum(['PENDING_PAYMENT', 'PAID', 'CANCELLED', 'USED', 'EXPIRED']).optional(),
});

const redeemOrderBody = z.object({
  voucherCode: z.string({ required_error: 'Mã voucher không được để trống' })
    .min(1, 'Mã voucher không được để trống'),
});

module.exports = {
  createSchema: { body: createOrderBody },
  querySchema: { query: queryOrderSchema },
  redeemSchema: { body: redeemOrderBody },
};
