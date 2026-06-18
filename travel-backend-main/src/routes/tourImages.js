const express = require('express');
const router = express.Router();
const tourImageController = require('../controllers/tourImageController');
const validate = require('../middleware/validate');
const { createSchema, updateSchema } = require('../validations/tourImageValidation');
const uploadSupabase = require('../middleware/uploadSupabase');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');

// Use uploadSupabase.single('image') to parse file into memory buffer
router.post('/', auth, isStaffOrAdmin, uploadSupabase.single('image'), validate(createSchema), asyncHandler(tourImageController.create));
router.put('/:id', auth, isStaffOrAdmin, uploadSupabase.single('image'), validate(updateSchema), asyncHandler(tourImageController.update));
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(tourImageController.delete));

module.exports = router;
