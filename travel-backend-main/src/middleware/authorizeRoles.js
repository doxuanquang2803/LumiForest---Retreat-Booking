const ROLES = require('../constants/roles');
const { errorResponse } = require('../utils/response');

/**
 * Middleware factory for role-based access control.
 * Restricts access to users who have one of the required roles.
 * @param  {...string} allowedRoles 
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user must be populated by the previous auth middleware
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized: User not found in request');
    }

    if (!req.user.role) {
      return errorResponse(res, 403, 'Forbidden: User has no assigned role');
    }

    // Check if the user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return errorResponse(res, 403, 'Forbidden: You do not have permission to perform this action');
    }

    next();
  };
};

/**
 * Helper middleware specifically for ADMIN only routes
 */
const isAdmin = authorizeRoles(ROLES.ADMIN);

/**
 * Helper middleware specifically for STAFF or ADMIN routes
 */
const isStaffOrAdmin = authorizeRoles(ROLES.STAFF, ROLES.ADMIN);

module.exports = {
  authorizeRoles,
  isAdmin,
  isStaffOrAdmin,
};
