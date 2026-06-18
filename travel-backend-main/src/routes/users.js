const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');

// User tự quản lý profile
router.get('/profile',      auth, asyncHandler(userController.getMyProfile));
router.put('/profile',      auth, asyncHandler(userController.updateMyProfile));

// Admin quản lý users
router.get('/',             auth, isAdmin, asyncHandler(userController.getAllUsers));
router.post('/',            auth, isAdmin, asyncHandler(userController.createUser));
router.get('/:id',          auth, isAdmin, asyncHandler(userController.getUserById));
router.put('/:id',          auth, isAdmin, asyncHandler(userController.updateUser));
router.put('/:id/status',   auth, isAdmin, asyncHandler(userController.updateUserStatus));
router.delete('/:id',       auth, isAdmin, asyncHandler(userController.deleteUser));

module.exports = router;
