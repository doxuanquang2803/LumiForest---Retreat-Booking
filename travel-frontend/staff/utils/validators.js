export const Validators = {
  isRequired: (value) => value !== null && value !== undefined && value.toString().trim() !== '',
  isEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
  isPhone: (phone) => /^\+?[\d\s-]{10,}$/.test(phone),
  isImage: (file) => file && file.type.startsWith('image/'),
  maxFileSize: (file, mb) => file && file.size <= mb * 1024 * 1024
};
