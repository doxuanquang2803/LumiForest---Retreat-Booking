const express = require('express');
const router = express.Router();
const voucherOrderController = require('../controllers/voucherOrderController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { isStaffOrAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');
const { checkVoucherOrderOwnership } = require('../middleware/checkOwnership');
const { createSchema, querySchema, redeemSchema } = require('../validations/voucherOrderValidation');

// Purchase, listing, customer specific, and redemption routes (ordered before /:id)
router.post('/', auth, validate(createSchema), asyncHandler(voucherOrderController.create));
router.get('/', auth, isStaffOrAdmin, validate(querySchema), asyncHandler(voucherOrderController.getAll));
router.get('/my', auth, validate(querySchema), asyncHandler(voucherOrderController.getMyOrders));
router.post('/redeem', auth, isStaffOrAdmin, validate(redeemSchema), asyncHandler(voucherOrderController.redeem));

// Order specific actions — ownership verified by middleware
router.get('/qr/:code', auth, asyncHandler(voucherOrderController.getQrCode));
router.get('/:id', auth, checkVoucherOrderOwnership, asyncHandler(voucherOrderController.getById));
router.put('/:id/cancel', auth, checkVoucherOrderOwnership, asyncHandler(voucherOrderController.cancel));
router.post('/:id/pay', auth, checkVoucherOrderOwnership, asyncHandler(voucherOrderController.pay));

module.exports = router;
