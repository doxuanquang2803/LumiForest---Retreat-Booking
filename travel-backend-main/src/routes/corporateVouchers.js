const express = require('express');
const router = express.Router();
const multer = require('multer');
const corporateVoucherController = require('../controllers/corporateVoucherController');
const protect = require('../middleware/auth');
const { authorizeRoles: restrictTo } = require('../middleware/authorizeRoles');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// Protect all corporate voucher routes
router.use(protect);

// Pool stats
router.get('/pool', restrictTo('COMPANY_ADMIN', 'ADMIN', 'STAFF'), corporateVoucherController.getPoolStats);

// Purchase
router.post('/purchase', restrictTo('COMPANY_ADMIN', 'ADMIN', 'STAFF', 'USER'), upload.single('excel'), corporateVoucherController.purchase);

// Assign (Upload Excel)
router.post('/assign', restrictTo('COMPANY_ADMIN', 'ADMIN', 'STAFF'), upload.single('excel'), corporateVoucherController.assign);

// Redeem (Any authenticated user)
router.post('/redeem', corporateVoucherController.redeem);

// Admin / Staff actions on specific vouchers
router.post('/:id/resend-email', restrictTo('ADMIN', 'STAFF'), corporateVoucherController.resendEmail);
router.put('/:id/cancel', restrictTo('ADMIN', 'STAFF'), corporateVoucherController.cancel);

module.exports = router;
