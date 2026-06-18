const prisma = require('../config/prismaClient');
const sanitizeHtml = require('../utils/sanitizeHtml');

// POST /api/contacts — public, anyone can submit
exports.send = async (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ success: false, message: 'Vui lòng điền tên, email và nội dung' });
  }

  const contact = await prisma.contacts.create({
    data: {
      name: sanitizeHtml(name),
      email,
      subject: subject ? sanitizeHtml(subject) : null,
      message: sanitizeHtml(message),
    },
  });

  res.status(201).json({ success: true, message: 'Đã nhận tin nhắn, chúng tôi sẽ phản hồi sớm nhất', data: contact });
};

// GET /api/contacts — STAFF/ADMIN only, with pagination and search
exports.getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const search = req.query.search || '';
  const skip = (page - 1) * limit;

  const where = search
    ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
          { subject: { contains: search, mode: 'insensitive' } },
        ],
      }
    : {};

  const [totalItems, contacts] = await Promise.all([
    prisma.contacts.count({ where }),
    prisma.contacts.findMany({
      where,
      skip,
      take: limit,
      orderBy: { created_at: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  res.json({
    success: true,
    data: contacts,
    pagination: { page, limit, totalItems, totalPages },
  });
};

// GET /api/contacts/:id — STAFF/ADMIN only
exports.getById = async (req, res) => {
  const id = BigInt(req.params.id);

  const contact = await prisma.contacts.findUnique({ where: { id } });
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn liên hệ' });
  }

  res.json({ success: true, data: contact });
};

// DELETE /api/contacts/:id — ADMIN only
exports.delete = async (req, res) => {
  const id = BigInt(req.params.id);

  const contact = await prisma.contacts.findUnique({ where: { id } });
  if (!contact) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy tin nhắn liên hệ' });
  }

  await prisma.contacts.delete({ where: { id } });
  res.json({ success: true, message: 'Đã xóa tin nhắn liên hệ' });
};
