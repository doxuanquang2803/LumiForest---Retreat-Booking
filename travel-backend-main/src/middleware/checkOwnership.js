const createOwnershipMiddleware = require('./createOwnershipMiddleware');
const prisma = require('../config/prismaClient');
const ROLES = require('../constants/roles');

// Helper to safely parse IDs
const parseIntId = (id) => {
  const parsed = parseInt(id, 10);
  return isNaN(parsed) ? null : parsed;
};

const parseBigIntId = (id) => {
  try {
    return BigInt(id);
  } catch {
    return null;
  }
};

const checkHotelBookingOwnership = createOwnershipMiddleware({
  findResource: async (id) => {
    const numericId = parseIntId(id);
    if (!numericId) return null;
    return await prisma.hotelBooking.findUnique({
      where: { id: numericId },
      include: { room: { include: { hotel: true } } }
    });
  },
  paramId: 'id', // Assuming the route has /:id
  ownerField: 'userId',
  attachAs: 'booking'
});

const checkTourBookingOwnership = createOwnershipMiddleware({
  findResource: async (id) => {
    const numericId = parseIntId(id);
    if (!numericId) return null;
    return await prisma.tourBooking.findUnique({
      where: { id: numericId },
      include: { tour: true }
    });
  },
  paramId: 'id',
  ownerField: 'userId',
  attachAs: 'tourBooking'
});

const checkVoucherOrderOwnership = createOwnershipMiddleware({
  findResource: async (id) => {
    const bigIntId = parseBigIntId(id);
    if (!bigIntId) return null;
    return await prisma.voucherOrder.findUnique({
      where: { id: bigIntId }
    });
  },
  paramId: 'id',
  ownerField: 'userId',
  attachAs: 'voucherOrder'
});

const checkWishlistOwnership = createOwnershipMiddleware({
  findResource: async (id) => {
    const bigIntId = parseBigIntId(id);
    if (!bigIntId) return null;
    return await prisma.wishlistItem.findUnique({
      where: { id: bigIntId }
    });
  },
  paramId: 'id',
  ownerField: 'userId',
  attachAs: 'wishlistItem',
  bypassRoles: [ROLES.ADMIN]
});

const checkNotificationOwnership = createOwnershipMiddleware({
  findResource: async (id) => {
    const bigIntId = parseBigIntId(id);
    if (!bigIntId) return null;
    return await prisma.notification.findUnique({
      where: { id: bigIntId }
    });
  },
  paramId: 'id',
  ownerField: 'userId',
  attachAs: 'notification'
});

const checkReviewOwnership = createOwnershipMiddleware({
  findResource: async (id) => {
    const bigIntId = parseBigIntId(id);
    if (!bigIntId) return null;
    return await prisma.review.findUnique({
      where: { id: bigIntId }
    });
  },
  paramId: 'id',
  ownerField: 'userId',
  attachAs: 'review'
});

const checkPaymentOwnership = createOwnershipMiddleware({
  findResource: async (id) => {
    const numericId = parseIntId(id);
    if (!numericId) return null;
    return await prisma.payment.findUnique({
      where: { id: numericId }
    });
  },
  paramId: 'id',
  ownerField: 'userId',
  attachAs: 'payment'
});

module.exports = {
  checkHotelBookingOwnership,
  checkTourBookingOwnership,
  checkVoucherOrderOwnership,
  checkWishlistOwnership,
  checkNotificationOwnership,
  checkReviewOwnership,
  checkPaymentOwnership
};
