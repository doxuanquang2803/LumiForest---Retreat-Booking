const express = require('express');
const router = express.Router();
const tourController = require('../controllers/tourController');
const validate = require('../middleware/validate');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');
const { querySchema } = require('../validations/tourValidation');
const upload = require('../middleware/upload');

// Specific endpoints first to avoid matching with /:id
router.get('/search', validate(querySchema), asyncHandler(tourController.search));
router.get('/filter', validate(querySchema), asyncHandler(tourController.filter));
router.get('/popular', asyncHandler(tourController.popular));

// Base CRUD endpoints
router.get('/', validate(querySchema), asyncHandler(tourController.getAll));
router.get('/:id', asyncHandler(tourController.getById));

// Handle physical upload with multer. Zod validations are handled inside the controller to clean up uploaded files on error.
router.post('/', auth, isStaffOrAdmin, upload.single('thumbnail'), asyncHandler(tourController.create));
router.put('/:id', auth, isStaffOrAdmin, upload.single('thumbnail'), asyncHandler(tourController.update));
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(tourController.delete));

module.exports = router;
