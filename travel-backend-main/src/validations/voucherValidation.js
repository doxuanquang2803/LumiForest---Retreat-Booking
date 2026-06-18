const { z } = require('zod');

const voucherBaseObject = z.object({
  title: z.string({ required_error: 'Tiêu đề không được để trống' })
    .min(3, 'Tiêu đề phải có ít nhất 3 ký tự')
    .max(100, 'Tiêu đề không được vượt quá 100 ký tự'),
  description: z.string({ required_error: 'Mô tả không được để trống' })
    .min(10, 'Mô tả phải có ít nhất 10 ký tự'),
  resortName: z.string({ required_error: 'Tên resort không được để trống' })
    .min(1, 'Tên resort không được để trống'),
  originalPrice: z.number({ required_error: 'Giá gốc không được để trống' })
    .positive('Giá gốc phải lớn hơn 0'),
  salePrice: z.number({ required_error: 'Giá bán không được để trống' })
    .positive('Giá bán phải lớn hơn 0'),
  image: z.string().url('Đường dẫn ảnh không hợp lệ').optional().nullable(),
  validUntil: z.preprocess((val) => val ? new Date(val) : undefined, z.date({ required_error: 'Thời hạn sử dụng không được để trống' })),
  quantity: z.number()
    .int('Số lượng phải là số nguyên')
    .positive('Số lượng phải lớn hơn 0')
    .optional(),
  remainingQuantity: z.number()
    .int('Số lượng còn lại phải là số nguyên')
    .nonnegative('Số lượng còn lại không được là số âm')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD_OUT', 'EXPIRED']).default('ACTIVE').optional(),
});

const createVoucherBody = voucherBaseObject.refine((data) => data.salePrice <= data.originalPrice, {
  message: 'Giá khuyến mãi không được lớn hơn giá gốc',
  path: ['salePrice'],
}).refine((data) => {
  if (data.remainingQuantity !== undefined && data.quantity !== undefined) {
    return data.remainingQuantity <= data.quantity;
  }
  return true;
}, {
  message: 'Số lượng khả dụng không được vượt quá số lượng ban đầu',
  path: ['remainingQuantity'],
});

const updateVoucherBody = voucherBaseObject.partial().refine((data) => {
  if (data.salePrice !== undefined && data.originalPrice !== undefined) {
    return data.salePrice <= data.originalPrice;
  }
  return true;
}, {
  message: 'Giá khuyến mãi không được lớn hơn giá gốc',
  path: ['salePrice'],
}).refine((data) => {
  if (data.remainingQuantity !== undefined && data.quantity !== undefined) {
    return data.remainingQuantity <= data.quantity;
  }
  return true;
}, {
  message: 'Số lượng khả dụng không được vượt quá số lượng ban đầu',
  path: ['remainingQuantity'],
});

const voucherQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 10),
  q: z.string().optional(),
  minPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  maxPrice: z.string().optional().transform(val => val ? parseFloat(val) : undefined),
  resortName: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SOLD_OUT', 'EXPIRED']).optional(),
});

module.exports = {
  createSchema: { body: createVoucherBody },
  updateSchema: { body: updateVoucherBody },
  querySchema: { query: voucherQuerySchema },
};
