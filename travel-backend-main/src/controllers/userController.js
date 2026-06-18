const supabase = require('../lib/supabase');
const bcrypt = require('bcryptjs');
const auditLogger = require('../utils/auditLogger');

const SAFE_FIELDS = 'id, name, email, role, status, created_at';

// GET /api/users/profile  (user tự xem)
exports.getMyProfile = async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select(SAFE_FIELDS)
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
  res.json({ success: true, user: data });
};

// PUT /api/users/profile  (user tự cập nhật)
exports.updateMyProfile = async (req, res) => {
  const { name } = req.body;

  if (!name || name.trim() === '') {
    return res.status(400).json({ success: false, message: 'Tên không được để trống.' });
  }

  const { data, error } = await supabase
    .from('users')
    .update({ name: name.trim() })
    .eq('id', req.user.id)
    .select(SAFE_FIELDS)
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, user: data });
};

// GET /api/users  (admin - danh sách tất cả user)
exports.getAllUsers = async (req, res) => {
  const page  = Math.max(1, parseInt(req.query.page)  || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  const { data, error, count } = await supabase
    .from('users')
    .select(SAFE_FIELDS, { count: 'exact' })
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) return res.status(500).json({ success: false, message: error.message });

  res.json({
    success: true,
    data,
    pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
  });
};

// GET /api/users/:id  (admin - xem chi tiết 1 user)
exports.getUserById = async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select(SAFE_FIELDS)
    .is('deleted_at', null)
    .eq('id', req.params.id)
    .single();

  if (error || !data) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
  res.json({ success: true, user: data });
};

// PUT /api/users/:id/status  (admin - kích hoạt / vô hiệu hóa)
exports.updateUserStatus = async (req, res) => {
  const { status } = req.body;
  const VALID_STATUSES = ['active', 'inactive', 'banned'];

  if (!VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Status không hợp lệ. Chỉ chấp nhận: ${VALID_STATUSES.join(', ')}.`,
    });
  }

  if (String(req.params.id) === String(req.user.id)) {
    return res.status(400).json({ success: false, message: 'Không thể thay đổi status của chính mình.' });
  }

  const { data, error } = await supabase
    .from('users')
    .update({ status })
    .is('deleted_at', null)
    .eq('id', req.params.id)
    .select(SAFE_FIELDS)
    .single();

  if (error || !data) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
  res.json({ success: true, user: data });
};

// DELETE /api/users/:id  (admin)
exports.deleteUser = async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    return res.status(400).json({ success: false, message: 'Không thể xóa tài khoản của chính mình.' });
  }

  const { error } = await supabase
    .from('users')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ success: false, message: error.message });

  // Log action
  if (req.user) {
    await auditLogger.log('DELETE', req.user.id, 'USER', req.params.id);
  }

  res.json({ success: true, message: 'Đã xóa người dùng.' });
};

// POST /api/users  (admin - tạo mới user)
exports.createUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin: name, email, password và role.' });
  }

  const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email đã được sử dụng.' });
  }

  const hashed = await bcrypt.hash(password, 10);

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password: hashed, role, status: 'active' }])
    .select(SAFE_FIELDS)
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  // Log action
  if (req.user) {
    await auditLogger.log('CREATE', req.user.id, 'USER', data.id, { name, email, role });
  }

  res.status(201).json({
    success: true,
    message: 'Tạo tài khoản thành công.',
    data
  });
};

// PUT /api/users/:id  (admin - cập nhật thông tin user)
exports.updateUser = async (req, res) => {
  const { name, email, password, role } = req.body;
  const updateData = {};

  if (name) updateData.name = name;
  if (email) updateData.email = email;
  if (role) updateData.role = role;
  if (password && password.trim() !== '') {
    updateData.password = await bcrypt.hash(password, 10);
  }

  const { data, error } = await supabase
    .from('users')
    .update(updateData)
    .is('deleted_at', null)
    .eq('id', req.params.id)
    .select(SAFE_FIELDS)
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  // Log action
  if (req.user) {
    await auditLogger.log('UPDATE', req.user.id, 'USER', req.params.id, { name, email, role });
  }

  res.json({
    success: true,
    message: 'Cập nhật thông tin thành công.',
    data
  });
};
