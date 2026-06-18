const { z } = require('zod');

const createWishlistBody = z.object({
  itemId: z.preprocess(
    (val) => (typeof val === 'string' ? parseInt(val, 10) : val),
    z.number({ required_error: 'itemId không được để trống' })
      .int('itemId phải là số nguyên')
      .positive('itemId phải lớn hơn 0')
  ),
  itemType: z.enum(['HOTEL', 'TOUR', 'APARTMENT'], {
    errorMap: () => ({ message: 'itemType phải là HOTEL, TOUR hoặc APARTMENT' }),
  }),
});

module.exports = {
  createSchema: { body: createWishlistBody },
};
