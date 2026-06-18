const express = require('express');
const router = express.Router();
const roomImageController = require('../controllers/roomImageController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const { createSchema } = require('../validations/roomImageValidation');
const uploadSupabase = require('../middleware/uploadSupabase');
const asyncHandler = require('../utils/asyncHandler');

router.post('/',      auth, isStaffOrAdmin, uploadSupabase.single('image'), validate(createSchema), asyncHandler(roomImageController.create));
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(roomImageController.delete));

module.exports = router;
