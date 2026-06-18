const prisma = require('../config/prismaClient');

// GET /api/blog/admin/comments  (staff/admin — all comments across all posts)
exports.getAllComments = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page,  10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 20));
  const skip  = (page - 1) * limit;
  const where = {};
  if (req.query.blogId) where.blogId = BigInt(req.query.blogId);
  if (req.query.search) {
    const s = req.query.search.trim();
    where.OR = [
      { authorName: { contains: s, mode: 'insensitive' } },
      { content:    { contains: s, mode: 'insensitive' } },
    ];
  }

  const [total, comments] = await Promise.all([
    prisma.blogComment.count({ where }),
    prisma.blogComment.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { blog: { select: { id: true, title: true } } },
    }),
  ]);

  res.json({
    success: true,
    data: comments,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
};

// GET /api/blog/:id/comments
exports.getComments = async (req, res) => {
  const blogId = BigInt(req.params.id);

  const comments = await prisma.blogComment.findMany({
    where: { blogId, parentId: null },
    orderBy: { createdAt: 'asc' },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  res.json({ success: true, data: comments, count: comments.reduce((n, c) => n + 1 + c.replies.length, 0) });
};

// POST /api/blog/:id/comments
exports.createComment = async (req, res) => {
  const blogId = BigInt(req.params.id);
  const { authorName, authorEmail, content, parentId } = req.body;

  if (!authorName || !authorName.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập họ tên' });
  }
  if (!authorEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(authorEmail)) {
    return res.status(400).json({ success: false, message: 'Email không hợp lệ' });
  }
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập nội dung bình luận' });
  }

  const blog = await prisma.blogs.findUnique({ where: { id: blogId } });
  if (!blog) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
  }

  const data = {
    blogId,
    authorName: authorName.trim(),
    authorEmail: authorEmail.trim().toLowerCase(),
    content: content.trim(),
  };

  if (parentId) {
    const parent = await prisma.blogComment.findUnique({ where: { id: BigInt(parentId) } });
    if (!parent || parent.blogId !== blogId) {
      return res.status(400).json({ success: false, message: 'Bình luận gốc không hợp lệ' });
    }
    data.parentId = BigInt(parentId);
  }

  const comment = await prisma.blogComment.create({ data });

  res.status(201).json({ success: true, message: 'Bình luận đã được gửi', data: comment });
};

// DELETE /api/blog/comments/:commentId  (staff/admin)
exports.deleteComment = async (req, res) => {
  const id = BigInt(req.params.commentId);

  const existing = await prisma.blogComment.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bình luận' });
  }

  await prisma.blogComment.deleteMany({ where: { parentId: id } });
  await prisma.blogComment.delete({ where: { id } });

  res.json({ success: true, message: 'Đã xóa bình luận' });
};
