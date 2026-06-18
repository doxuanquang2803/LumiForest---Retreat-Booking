const { z } = require('zod');

const updateRoleBody = z.object({
  role: z.enum(['user', 'admin'], {
    errorMap: () => ({ message: 'Role phải là user hoặc admin' }),
  }),
});

const revenueQuery = z.object({
  day: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  month: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
  year: z.string().optional().transform(val => val ? parseInt(val, 10) : undefined),
});

const listQuery = z.object({
  page: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 1),
  limit: z.string().optional().transform(val => val ? Math.max(1, parseInt(val, 10)) : 10),
});

module.exports = {
  updateRoleSchema: { body: updateRoleBody },
  revenueQuerySchema: { query: revenueQuery },
  listQuerySchema: { query: listQuery },
};
