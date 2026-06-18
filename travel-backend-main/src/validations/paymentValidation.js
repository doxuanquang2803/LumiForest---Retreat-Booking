const { z } = require('zod');

const createSchema = z.object({
  bookingType:        z.enum(['HOTEL', 'TOUR', 'APARTMENT', 'VOUCHER', 'CORPORATE_BATCH']).default('HOTEL'),
  bookingId:          z.preprocess(val => typeof val === 'string' ? parseInt(val, 10) : val, z.number().int().positive().optional()),
  tourBookingId:      z.preprocess(val => typeof val === 'string' ? parseInt(val, 10) : val, z.number().int().positive().optional()),
  apartmentBookingId: z.preprocess(val => typeof val === 'string' ? parseInt(val, 10) : val, z.number().int().positive().optional()),
  voucherOrderId:     z.preprocess(val => typeof val === 'string' ? parseInt(val, 10) : val, z.number().int().positive().optional()),
  corporateBatchId:   z.preprocess(val => typeof val === 'string' ? parseInt(val, 10) : val, z.number().int().positive().optional()),
  amount:             z.preprocess(val => typeof val === 'string' ? parseFloat(val) : val, z.number().positive().optional()),
  method:             z.enum(['cash', 'bank_transfer', 'card', 'momo', 'vnpay']).default('bank_transfer'),
  transactionId:      z.string().optional(),
  notes:              z.string().optional(),
});

const callbackSchema = z.object({
  transactionId: z.string({ required_error: 'transactionId không được để trống' }),
  status:        z.enum(['completed', 'failed'], { required_error: 'status không được để trống' }),
});

const querySchema = z.object({
  page:        z.string().optional().transform(v => v ? Math.max(1, parseInt(v, 10)) : 1),
  limit:       z.string().optional().transform(v => v ? Math.max(1, parseInt(v, 10)) : 10),
  status:      z.enum(['pending', 'completed', 'failed', 'refunded']).optional(),
  method:      z.enum(['cash', 'bank_transfer', 'card', 'momo', 'vnpay']).optional(),
  bookingType: z.enum(['HOTEL', 'TOUR', 'APARTMENT', 'VOUCHER', 'CORPORATE_BATCH']).optional(),
});

module.exports = {
  createSchema:   { body: createSchema },
  callbackSchema: { body: callbackSchema },
  querySchema:    { query: querySchema },
};
