const { errorResponse } = require('../utils/response');
const ROLES = require('../constants/roles');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Generic factory for creating ownership validation middlewares.
 * 
 * @param {Object} options
 * @param {Function} options.findResource - Callback to fetch the resource (e.g. `(id) => prisma.model.findUnique({ where: { id } })`). Should return null if not found.
 * @param {string} options.paramId - The name of the request parameter containing the resource ID (e.g., 'id', 'bookingId').
 * @param {string} options.ownerField - The field on the resource that stores the owner's user ID (e.g., 'userId', 'user_id').
 * @param {string} options.attachAs - The key to attach the fetched resource on the `req` object (e.g., 'booking').
 * @param {boolean} [options.checkSoftDelete=true] - Whether to enforce a 404 if the resource has a `deletedAt` / `deleted_at` field that is not null.
 * @param {Array<string>} [options.bypassRoles] - Roles that bypass ownership checks. Default: `[ROLES.ADMIN, ROLES.STAFF]`.
 * 
 * @returns {Function} Express middleware
 */
const createOwnershipMiddleware = ({
  findResource,
  paramId = 'id',
  ownerField = 'userId',
  attachAs = 'resource',
  checkSoftDelete = true,
  bypassRoles = [ROLES.ADMIN, ROLES.STAFF],
}) => {
  return asyncHandler(async (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 401, 'Unauthorized');
    }

    const resourceId = req.params[paramId];
    if (!resourceId) {
      return errorResponse(res, 400, `Missing parameter: ${paramId}`);
    }

    // Try to parse ID (works for both Int and BigInt usually, depending on DB schema)
    // Note: Prisma string/int parsing depends on your ID type. We'll pass it raw or as Number/BigInt in the findResource callback.
    const resource = await findResource(resourceId, req);

    // Security Rule: Return 404 instead of 403 if resource doesn't exist to prevent enumeration
    if (!resource) {
      return errorResponse(res, 404, 'Resource not found');
    }

    if (checkSoftDelete && (resource.deletedAt || resource.deleted_at)) {
      return errorResponse(res, 404, 'Resource not found');
    }

    // Allow bypass roles to skip ownership validation
    if (bypassRoles.includes(req.user.role)) {
      req[attachAs] = resource;
      return next();
    }

    // Ownership check for Customers
    const resourceOwnerId = resource[ownerField];
    
    // Convert both to string for safe comparison, especially if using BigInt
    if (!resourceOwnerId || resourceOwnerId.toString() !== req.user.id.toString()) {
      // Security Rule: Still return 404 to avoid revealing that the resource belongs to someone else
      return errorResponse(res, 404, 'Resource not found');
    }

    req[attachAs] = resource;
    next();
  });
};

module.exports = createOwnershipMiddleware;
