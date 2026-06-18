const { z } = require('zod');

const createReviewBody = z.object({
  targetId: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ required_error: 'targetId không được để trống' })
      .int('targetId phải là số nguyên')
      .positive('targetId phải lớn hơn 0')
  ),
  targetType: z.enum(['HOTEL', 'TOUR', 'APARTMENT'], {
    errorMap: () => ({ message: 'targetType phải là HOTEL, TOUR hoặc APARTMENT' }),
  }),
  rating: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ required_error: 'rating không được để trống' })
      .int('rating phải là số nguyên')
      .min(1, 'rating tối thiểu là 1')
      .max(5, 'rating tối đa là 5')
  ),
  comment: z.string().optional(),
});

const updateReviewBody = z.object({
  rating: z.preprocess(
    (val) => (val === undefined ? undefined : typeof val === 'string' ? parseInt(val, 10) : val),
    z.number().int().min(1).max(5).optional()
  ),
  comment: z.string().optional(),
});

const reportReviewBody = z.object({
  reason: z.string({ required_error: 'Lý do báo cáo không được để trống' })
    .trim()
    .min(1, 'Lý do báo cáo không được để trống'),
});

const reviewQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 10),
});

module.exports = {
  createSchema: { body: createReviewBody },
  updateSchema: { body: updateReviewBody },
  reportSchema: { body: reportReviewBody },
  querySchema: { query: reviewQuerySchema },
};
