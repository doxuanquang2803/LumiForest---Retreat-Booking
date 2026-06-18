const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const blogCommentController = require('../controllers/blogCommentController');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const uploadSupabase = require('../middleware/uploadSupabase');
const asyncHandler = require('../utils/asyncHandler');

// Admin — must be before /:id to avoid param collision
router.get('/admin/comments', auth, isStaffOrAdmin, asyncHandler(blogCommentController.getAllComments));
router.delete('/comments/:commentId', auth, isStaffOrAdmin, asyncHandler(blogCommentController.deleteComment));

// Public — read
router.get('/',     asyncHandler(blogController.getAll));
router.get('/:id',  asyncHandler(blogController.getById));

// Comments — public read & submit
router.get('/:id/comments',  asyncHandler(blogCommentController.getComments));
router.post('/:id/comments', asyncHandler(blogCommentController.createComment));

// Staff/Admin — create and update
router.post('/upload-image', auth, isStaffOrAdmin, uploadSupabase.single('image'), asyncHandler(blogController.uploadImage));
router.post('/',    auth, isStaffOrAdmin, asyncHandler(blogController.create));
router.put('/:id',  auth, isStaffOrAdmin, asyncHandler(blogController.update));

// Admin only — delete
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(blogController.delete));

module.exports = router;
