const prisma = require('../config/prismaClient');

const auditLogger = {
  log: async (action, adminId, targetType, targetId, details = {}) => {
    try {
      await prisma.auditLog.create({
        data: {
          actorId: BigInt(adminId),
          action,
          targetResource: targetType,
          targetId: targetId ? targetId.toString() : null,
          details,
        },
      });
    } catch (err) {
      console.error('[AUDIT ERROR] Failed to save audit log:', err);
    }
  },
};

module.exports = auditLogger;
