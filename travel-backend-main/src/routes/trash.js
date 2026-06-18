const express = require('express');
const router = express.Router();
const prisma = require('../config/prismaClient');
const supabase = require('../lib/supabase');
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/authorizeRoles');
const auditLogger = require('../utils/auditLogger');
const { serializeBigInt } = require('../utils/bigintSerializer');

// All trash routes require Auth + ADMIN role
router.use(auth, isAdmin);

// GET /api/trash/all
router.get('/all', async (req, res) => {
  try {
    const [tours, hotels, rooms, apartments, vouchers] = await Promise.all([
      prisma.tour.findMany({ where: { deletedAt: { not: null } } }),
      prisma.hotel.findMany({ where: { deletedAt: { not: null } } }),
      prisma.room.findMany({ where: { deletedAt: { not: null } } }),
      prisma.apartment.findMany({ where: { deletedAt: { not: null } } }),
      prisma.voucher.findMany({ where: { deletedAt: { not: null } } })
    ]);

    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, name, email, deleted_at')
      .not('deleted_at', 'is', null);

    if (usersError) throw new Error(usersError.message);

    const mapItem = (type, list, nameField) => list.map(item => ({
      id: item.id,
      type,
      name: item[nameField] || 'Unknown',
      deletedAt: item.deletedAt || item.deleted_at,
    }));

    const allItems = [
      ...mapItem('tour', tours, 'title'),
      ...mapItem('hotel', hotels, 'name'),
      ...mapItem('room', rooms, 'name'),
      ...mapItem('apartment', apartments, 'title'),
      ...mapItem('voucher', vouchers, 'title'),
      ...mapItem('user', usersData, 'name')
    ];

    // Sort by deletedAt descending
    allItems.sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt));

    res.json(serializeBigInt({ success: true, data: allItems }));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/trash/:type/:id/restore
router.post('/:type/:id/restore', async (req, res) => {
  try {
    const { type, id } = req.params;
    
    if (type === 'user') {
      const { error } = await supabase
        .from('users')
        .update({ deleted_at: null })
        .eq('id', id);
      if (error) throw new Error(error.message);
    } else {
      const itemId = parseInt(id, 10);
      let result;
      if (type === 'tour') {
        result = await prisma.tour.update({ where: { id: itemId }, data: { deletedAt: null } });
      } else if (type === 'hotel') {
        result = await prisma.hotel.update({ where: { id: itemId }, data: { deletedAt: null } });
      } else if (type === 'room') {
        result = await prisma.room.update({ where: { id: itemId }, data: { deletedAt: null } });
      } else if (type === 'apartment') {
        result = await prisma.apartment.update({ where: { id: itemId }, data: { deletedAt: null } });
      } else if (type === 'voucher') {
        // Voucher ID is BigInt
        result = await prisma.voucher.update({ where: { id: BigInt(id) }, data: { deletedAt: null } });
      } else {
        return res.status(400).json({ success: false, message: 'Loại dữ liệu không hợp lệ.' });
      }
    }

    // Log action
    if (req.user) {
      await auditLogger.log('RESTORE', req.user.id, type.toUpperCase(), id);
    }

    res.json({ success: true, message: 'Đã khôi phục dữ liệu thành công.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Khôi phục thất bại: ' + error.message });
  }
});

module.exports = router;
