// Usage: authorize('admin') or authorize('admin', 'staff')
module.exports = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Bạn không có quyền thực hiện hành động này.' });
  }
  next();
};
