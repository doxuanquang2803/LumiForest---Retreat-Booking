const path = require('path');
const prisma = require('../config/prismaClient');
const sanitizeHtml = require('../utils/sanitizeHtml');
const { uploadToSupabase } = require('../lib/supabaseStorage');

// GET /api/blogs — public, paginated list
exports.getAll = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.max(1, Math.min(100, parseInt(req.query.limit, 10) || 10));
  const skip = (page - 1) * limit;

  const where = { published: true, deleted_at: null };

  const [totalItems, posts] = await Promise.all([
    prisma.blogs.count({ where }),
    prisma.blogs.findMany({
      where,
      skip,
      take: limit,
      orderBy: { published_at: 'desc' },
    }),
  ]);

  const totalPages = Math.ceil(totalItems / limit);

  res.json({
    success: true,
    data: posts,
    pagination: { page, limit, totalItems, totalPages },
  });
};

// GET /api/blogs/:id — public, single post by ID or slug
exports.getById = async (req, res) => {
  const { id } = req.params;

  // Try to find by numeric id first, then by slug
  let post;
  const numericId = parseInt(id, 10);
  if (!isNaN(numericId)) {
    post = await prisma.blogs.findUnique({ where: { id: BigInt(numericId) } });
  }
  if (!post) {
    post = await prisma.blogs.findUnique({ where: { slug: id } });
  }

  if (!post) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
  }

  // Increment views
  await prisma.blogs.update({
    where: { id: post.id },
    data: { views: (post.views || 0) + 1 },
  });

  res.json({ success: true, data: post });
};

// POST /api/blogs — STAFF/ADMIN only
exports.create = async (req, res) => {
  const { title, slug, summary, content, author, category, tags, image, published } = req.body;

  if (!title || !slug || !category) {
    return res.status(400).json({ success: false, message: 'title, slug và category là bắt buộc' });
  }

  const post = await prisma.blogs.create({
    data: {
      title: sanitizeHtml(title),
      slug,
      summary: summary ? sanitizeHtml(summary) : null,
      content: content ? sanitizeHtml(content) : null,
      author: author || 'Admin',
      category,
      tags: tags || [],
      image: image || null,
      published: published || false,
      published_at: published ? new Date() : null,
    },
  });

  res.status(201).json({ success: true, message: 'Tạo bài viết thành công', data: post });
};

// PUT /api/blogs/:id — STAFF/ADMIN only
exports.update = async (req, res) => {
  const id = BigInt(req.params.id);

  const existing = await prisma.blogs.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
  }

  const { title, slug, summary, content, author, category, tags, image, published } = req.body;

  const updateData = {};
  if (title !== undefined) updateData.title = sanitizeHtml(title);
  if (slug !== undefined) updateData.slug = slug;
  if (summary !== undefined) updateData.summary = sanitizeHtml(summary);
  if (content !== undefined) updateData.content = sanitizeHtml(content);
  if (author !== undefined) updateData.author = author;
  if (category !== undefined) updateData.category = category;
  if (tags !== undefined) updateData.tags = tags;
  if (image !== undefined) updateData.image = image;
  if (published !== undefined) {
    updateData.published = published;
    if (published && !existing.published_at) {
      updateData.published_at = new Date();
    }
  }

  const post = await prisma.blogs.update({
    where: { id },
    data: updateData,
  });

  res.json({ success: true, message: 'Cập nhật bài viết thành công', data: post });
};

// DELETE /api/blogs/:id — ADMIN only
exports.delete = async (req, res) => {
  const id = BigInt(req.params.id);

  const existing = await prisma.blogs.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy bài viết' });
  }

  await prisma.blogs.update({ where: { id }, data: { deleted_at: new Date() } });
  res.json({ success: true, message: 'Đã xóa bài viết' });
};

// POST /api/blogs/upload-image — STAFF/ADMIN only
exports.uploadImage = async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'Vui lòng chọn một ảnh hợp lệ' });
  }

  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const fileName = uniqueSuffix + path.extname(req.file.originalname);

  const publicUrl = await uploadToSupabase(
    req.file.buffer,
    fileName,
    req.file.mimetype,
    'tour-images',   // reuse existing bucket
    'blogs'
  );

  res.status(200).json({
    success: true,
    message: 'Tải ảnh lên thành công',
    url: publicUrl,
  });
};
