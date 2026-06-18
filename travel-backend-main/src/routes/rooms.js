const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');
const { createSchema, updateSchema, updateStatusSchema, querySchema, hotelRoomQuerySchema } = require('../validations/roomValidation');

// Static sub-path routes before :id
router.get('/hotel/:hotelId', validate(hotelRoomQuerySchema), asyncHandler(roomController.getByHotelId));

// Base CRUD
router.get('/',     validate(querySchema), asyncHandler(roomController.getAll));
router.get('/:id',  asyncHandler(roomController.getById));
router.post('/',    auth, isStaffOrAdmin, validate(createSchema), asyncHandler(roomController.create));
router.put('/:id',  auth, isStaffOrAdmin, validate(updateSchema), asyncHandler(roomController.update));
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(roomController.delete));

// Sub-resource routes
router.get('/:id/availability', asyncHandler(roomController.getAvailability));
router.get('/:id/booked-dates', asyncHandler(roomController.getBookedDates));
router.put('/:id/status',       auth, isStaffOrAdmin, validate(updateStatusSchema), asyncHandler(roomController.updateStatus));

module.exports = router;
