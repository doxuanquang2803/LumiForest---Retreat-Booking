const { z } = require('zod');

const notificationQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 10),
});

module.exports = {
  querySchema: { query: notificationQuerySchema },
};
