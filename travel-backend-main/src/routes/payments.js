const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const validate = require('../middleware/validate');
const asyncHandler = require('../utils/asyncHandler');
const { checkPaymentOwnership } = require('../middleware/checkOwnership');
const { createSchema, callbackSchema, querySchema } = require('../validations/paymentValidation');

// Static routes trước :id
router.get('/my',       auth, asyncHandler(paymentController.getMy));
router.get('/history',  auth, isStaffOrAdmin, validate(querySchema), asyncHandler(paymentController.getAll));

// Actions
router.post('/create',   auth, validate(createSchema), asyncHandler(paymentController.create));
router.post('/callback', validate(callbackSchema), asyncHandler(paymentController.callback));

// By ID — ownership verified by middleware
router.get('/:id',        auth, checkPaymentOwnership, asyncHandler(paymentController.getById));
router.put('/:id/refund', auth, isAdmin, asyncHandler(paymentController.refund));

module.exports = router;
