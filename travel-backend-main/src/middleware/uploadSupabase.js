const multer = require('multer');

// Memory storage for Supabase upload (keeps file in RAM buffer)
const memoryStorage = multer.memoryStorage();

// File filter to allow only images
const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error('Định dạng file không hợp lệ. Chỉ chấp nhận ảnh (jpeg, jpg, png, gif, webp)');
    error.status = 400;
    cb(error, false);
  }
};

const uploadSupabase = multer({
  storage: memoryStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
});

module.exports = uploadSupabase;
