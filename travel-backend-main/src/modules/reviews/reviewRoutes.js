const express = require('express');
const router = express.Router();
const reviewController = require('./reviewController');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { checkReviewOwnership } = require('../../middleware/checkOwnership');
const { createSchema, updateSchema, reportSchema, querySchema } = require('./reviewValidation');

const { isStaffOrAdmin } = require('../../middleware/authorizeRoles');

// Public endpoints to read reviews (with pagination validations)
router.get('/hotel/:hotelId', validate(querySchema), asyncHandler(reviewController.getReviewsByHotel));
router.get('/apartment/:apartmentId', validate(querySchema), asyncHandler(reviewController.getReviewsByApartment));
router.get('/tour/:tourId', validate(querySchema), asyncHandler(reviewController.getReviewsByTour));

// Authenticated endpoints
router.post('/', auth, validate(createSchema), asyncHandler(reviewController.createReview));
router.get('/', auth, isStaffOrAdmin, asyncHandler(reviewController.getAllReviews));
router.put('/:id', auth, checkReviewOwnership, validate(updateSchema), asyncHandler(reviewController.updateReview));
router.delete('/:id', auth, checkReviewOwnership, asyncHandler(reviewController.deleteReview));
router.put('/:id/report', auth, validate(reportSchema), asyncHandler(reviewController.reportReview));

module.exports = router;
