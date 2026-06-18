const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');
const asyncHandler = require('../utils/asyncHandler');

router.post('/register/request-otp', authRateLimiter, asyncHandler(authController.requestOtp));
router.post('/register',        authRateLimiter, asyncHandler(authController.register));
router.post('/login',           authRateLimiter, asyncHandler(authController.login));
router.post('/logout',          authMiddleware, asyncHandler(authController.logout));
router.post('/refresh-token',   authRateLimiter, asyncHandler(authController.refreshToken));
router.get('/profile',          authMiddleware, asyncHandler(authController.getProfile));
router.put('/change-password',  authMiddleware, asyncHandler(authController.changePassword));
router.post('/google',          authRateLimiter, asyncHandler(authController.googleLogin));

module.exports = router;
