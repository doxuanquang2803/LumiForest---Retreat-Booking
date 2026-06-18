const express = require('express');
const router = express.Router();
const apartmentController = require('../controllers/apartmentController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');
const { createSchema, updateSchema, querySchema } = require('../validations/apartmentValidation');

// Dynamic search and filtering endpoints (defined before :id to prevent parameter clash)
router.get('/search', validate(querySchema), asyncHandler(apartmentController.search));
router.get('/filter', validate(querySchema), asyncHandler(apartmentController.filter));

// Base CRUD endpoints
router.get('/', validate(querySchema), asyncHandler(apartmentController.getAll));
router.get('/:id', asyncHandler(apartmentController.getById));
router.get('/:id/booked-dates', asyncHandler(apartmentController.getBookedDates));
router.post('/', auth, isStaffOrAdmin, validate(createSchema), asyncHandler(apartmentController.create));
router.put('/:id', auth, isStaffOrAdmin, validate(updateSchema), asyncHandler(apartmentController.update));
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(apartmentController.delete));

module.exports = router;
