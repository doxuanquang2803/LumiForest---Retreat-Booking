const express = require('express');
const router = express.Router();
const voucherController = require('../controllers/voucherController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');
const { createSchema, updateSchema, querySchema } = require('../validations/voucherValidation');
const uploadSupabase = require('../middleware/uploadSupabase');

// Base routes (Note: /active and /expired must be declared BEFORE /:id)
router.get('/', validate(querySchema), asyncHandler(voucherController.getAll));
router.get('/active', validate(querySchema), asyncHandler(voucherController.getActive));
router.get('/expired', validate(querySchema), asyncHandler(voucherController.getExpired));
router.get('/:id', asyncHandler(voucherController.getById));

router.post('/', auth, isStaffOrAdmin, validate(createSchema), asyncHandler(voucherController.create));
router.put('/:id', auth, isStaffOrAdmin, validate(updateSchema), asyncHandler(voucherController.update));
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(voucherController.delete));

router.post('/:id/image', auth, isStaffOrAdmin, uploadSupabase.single('image'), asyncHandler(voucherController.uploadImage));
router.delete('/:id/image', auth, isStaffOrAdmin, asyncHandler(voucherController.deleteImage));

module.exports = router;
