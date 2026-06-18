const express = require('express');
const router = express.Router();
const tourBookingController = require('../controllers/tourBookingController');
const auth = require('../middleware/auth');
const { isStaffOrAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');
const { checkTourBookingOwnership } = require('../middleware/checkOwnership');

// Specific sub-paths first to avoid clash with /:id
router.get('/my', auth, asyncHandler(tourBookingController.getMyBookings));

// Base endpoints
router.post('/', auth, asyncHandler(tourBookingController.create));
router.get('/:id', auth, checkTourBookingOwnership, asyncHandler(tourBookingController.getById));
router.get('/:id/qr', auth, checkTourBookingOwnership, asyncHandler(tourBookingController.getQrCode));
router.put('/:id/cancel', auth, checkTourBookingOwnership, asyncHandler(tourBookingController.cancel));

// Admin/Staff-only endpoint
router.get('/', auth, isStaffOrAdmin, asyncHandler(tourBookingController.getAll));

module.exports = router;
