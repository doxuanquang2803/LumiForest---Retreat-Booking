const express = require('express');
const router = express.Router();
const notificationController = require('./notificationController');
const auth = require('../../middleware/auth');
const validate = require('../../middleware/validate');
const asyncHandler = require('../../utils/asyncHandler');
const { checkNotificationOwnership } = require('../../middleware/checkOwnership');
const { querySchema } = require('./notificationValidation');

// All notification routes require JWT authentication
router.use(auth);

router.get('/', validate(querySchema), asyncHandler(notificationController.getAllNotifications));
router.put('/:id/read', checkNotificationOwnership, asyncHandler(notificationController.markAsRead));
router.delete('/:id', checkNotificationOwnership, asyncHandler(notificationController.deleteNotification));

module.exports = router;

