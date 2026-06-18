const express = require('express');
const router = express.Router();
const hotelBookingController = require('../controllers/hotelBookingController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { isStaffOrAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');
const { checkHotelBookingOwnership } = require('../middleware/checkOwnership');
const { createSchema, updateStatusSchema, querySchema } = require('../validations/bookingValidation');

router.get('/my', auth, validate(querySchema), asyncHandler(hotelBookingController.getMy));

router.post('/', auth, validate(createSchema), asyncHandler(hotelBookingController.create));
router.get('/:id', auth, checkHotelBookingOwnership, asyncHandler(hotelBookingController.getById));
router.get('/:id/qr', auth, checkHotelBookingOwnership, asyncHandler(hotelBookingController.getQrCode));
router.put('/:id/cancel', auth, checkHotelBookingOwnership, asyncHandler(hotelBookingController.cancel));

router.get('/', auth, isStaffOrAdmin, validate(querySchema), asyncHandler(hotelBookingController.getAll));
router.put('/:id/status', auth, isStaffOrAdmin, validate(updateStatusSchema), asyncHandler(hotelBookingController.updateStatus));
router.put('/:id/check-in', auth, isStaffOrAdmin, asyncHandler(hotelBookingController.checkIn));
router.put('/:id/check-out', auth, isStaffOrAdmin, asyncHandler(hotelBookingController.checkOut));
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(hotelBookingController.delete));

module.exports = router;
