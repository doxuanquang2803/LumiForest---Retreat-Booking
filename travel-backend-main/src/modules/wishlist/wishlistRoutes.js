const express = require('express');
const router = express.Router();
const wishlistController = require('./wishlistController');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { checkWishlistOwnership } = require('../../middleware/checkOwnership');
const { createSchema } = require('./wishlistValidation');

// All wishlist endpoints require JWT authentication
router.use(auth);

router.get('/', asyncHandler(wishlistController.getWishlist));
router.post('/', validate(createSchema), asyncHandler(wishlistController.addWishlistItem));
router.delete('/:id', checkWishlistOwnership, asyncHandler(wishlistController.deleteWishlistItem));

module.exports = router;
