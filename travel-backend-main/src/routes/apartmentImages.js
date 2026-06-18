const express = require('express');
const router = express.Router();
const apartmentImageController = require('../controllers/apartmentImageController');
const validate = require('../middleware/validate');
const { createSchema, updateSchema } = require('../validations/apartmentImageValidation');
const uploadSupabase = require('../middleware/uploadSupabase');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');

// Use uploadSupabase.single('image') before validation so fields are parsed
router.post('/', auth, isStaffOrAdmin, uploadSupabase.single('image'), validate(createSchema), asyncHandler(apartmentImageController.create));
router.put('/:id', auth, isStaffOrAdmin, uploadSupabase.single('image'), validate(updateSchema), asyncHandler(apartmentImageController.update));
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(apartmentImageController.delete));

module.exports = router;
