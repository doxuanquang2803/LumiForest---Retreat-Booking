const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const auth = require('../middleware/auth');
const { isStaffOrAdmin } = require('../middleware/authorizeRoles');
const uploadSupabase = require('../middleware/uploadSupabase');
const asyncHandler = require('../utils/asyncHandler');

// Public routes for website to read settings
router.get('/', asyncHandler(settingsController.getAll));
router.get('/:key', asyncHandler(settingsController.getByKey));

// Admin/Staff only routes for updating configurations
router.put('/', auth, isStaffOrAdmin, asyncHandler(settingsController.update));
router.post('/upload', auth, isStaffOrAdmin, uploadSupabase.single('image'), asyncHandler(settingsController.uploadImage));

module.exports = router;
