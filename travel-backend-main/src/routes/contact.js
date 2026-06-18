const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const auth = require('../middleware/auth');
const { isStaffOrAdmin, isAdmin } = require('../middleware/authorizeRoles');
const asyncHandler = require('../utils/asyncHandler');

// Public — anyone can submit a contact message
router.post('/', asyncHandler(contactController.send));

// Staff/Admin — view contacts with pagination/search
router.get('/', auth, isStaffOrAdmin, asyncHandler(contactController.getAll));
router.get('/:id', auth, isStaffOrAdmin, asyncHandler(contactController.getById));

// Admin only — delete contact
router.delete('/:id', auth, isStaffOrAdmin, asyncHandler(contactController.delete));

module.exports = router;
