const express = require('express');
const router = express.Router();
const adminController = require('./adminController');
const auth = require('../../middleware/auth');
const { isAdmin } = require('../../middleware/authorizeRoles');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { updateRoleSchema, revenueQuerySchema, listQuerySchema } = require('./adminValidation');

// All admin routes require JWT auth + ADMIN role
router.use(auth, isAdmin);

router.get('/users', validate(listQuerySchema), asyncHandler(adminController.getUsers));
router.get('/bookings', validate(listQuerySchema), asyncHandler(adminController.getBookings));
router.get('/payments', validate(listQuerySchema), asyncHandler(adminController.getPayments));
router.get('/statistics', asyncHandler(adminController.getStatistics));
router.get('/revenue', validate(revenueQuerySchema), asyncHandler(adminController.getRevenue));
router.get('/audit-logs', validate(listQuerySchema), asyncHandler(adminController.getAuditLogs));
router.get('/reports/charts', asyncHandler(adminController.getChartData));
router.get('/reports/top-locations', asyncHandler(adminController.getTopLocations));
router.put('/users/:id/role', validate(updateRoleSchema), asyncHandler(adminController.updateUserRole));
router.delete('/users/:id', asyncHandler(adminController.softDeleteUser));

module.exports = router;
