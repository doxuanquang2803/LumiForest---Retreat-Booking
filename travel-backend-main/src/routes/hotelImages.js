const express = require('express');
const router = express.Router();
const hotelImageController = require('../controllers/hotelImageController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const { createSchema } = require('../validations/hotelImageValidation');
const uploadSupabase = require('../middleware/uploadSupabase');
const asyncHandler = require('../utils/asyncHandler');

router.post('/',                auth, isStaffOrAdmin, uploadSupabase.single('image'), validate(createSchema), asyncHandler(hotelImageController.create));
router.delete('/:id',           auth, isStaffOrAdmin, asyncHandler(hotelImageController.delete));
router.put('/:id/thumbnail',    auth, isStaffOrAdmin, asyncHandler(hotelImageController.setThumbnail));

module.exports = router;
