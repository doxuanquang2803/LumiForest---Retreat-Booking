const express = require('express');
const router = express.Router();
const hotelController = require('../controllers/hotelController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');
const { createSchema, updateSchema, querySchema } = require('../validations/hotelValidation');

// Static routes before :id
router.get('/search',   validate(querySchema), asyncHandler(hotelController.search));
router.get('/filter',   validate(querySchema), asyncHandler(hotelController.filter));
router.get('/featured', asyncHandler(hotelController.getFeatured));
router.get('/popular',  asyncHandler(hotelController.getPopular));

// Base CRUD
router.get('/',     validate(querySchema), asyncHandler(hotelController.getAll));
router.get('/:id',  asyncHandler(hotelController.getById));
router.post('/',    auth, isStaffOrAdmin, validate(createSchema), asyncHandler(hotelController.create));
router.put('/:id',  auth, isStaffOrAdmin, validate(updateSchema), asyncHandler(hotelController.update));
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(hotelController.delete));

// Recommendations
router.get('/:id/recommendations', asyncHandler(hotelController.getRecommendations));

module.exports = router;
