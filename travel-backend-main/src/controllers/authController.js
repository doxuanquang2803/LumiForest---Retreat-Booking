const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { OAuth2Client } = require('google-auth-library');
const supabase = require('../lib/supabase');
const emailService = require('../services/emailService');

// In-memory OTP store (Key: email, Value: { otp, expiresAt })
const otpStore = new Map();

const generateAccessToken = (user) =>
  jwt.sign(
    { id: user.id.toString(), email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' }
  );

const generateRefreshToken = () => crypto.randomBytes(64).toString('hex');

// POST /api/auth/register/request-otp
exports.requestOtp = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp name, email và password.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password phải có ít nhất 6 ký tự.' });
  }

  const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email đã được đăng ký.' });
  }

  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiry

  otpStore.set(email, { otp, expiresAt });

  try {
    await emailService.sendOtpEmail(email, otp);
    res.status(200).json({ success: true, message: 'Mã OTP đã được gửi đến email của bạn.' });
  } catch (error) {
    console.error('Lỗi khi gửi email OTP:', error);
    res.status(500).json({ success: false, message: 'Không thể gửi email OTP, vui lòng thử lại sau.' });
  }
};

// POST /api/auth/register
exports.register = async (req, res) => {
  const { name, email, password, otp } = req.body;

  if (!name || !email || !password || !otp) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp đầy đủ thông tin và mã OTP.' });
  }

  // Verify OTP
  const storedOtpData = otpStore.get(email);
  if (!storedOtpData) {
    return res.status(400).json({ success: false, message: 'Không tìm thấy mã OTP cho email này hoặc mã đã hết hạn. Vui lòng yêu cầu lại.' });
  }

  if (Date.now() > storedOtpData.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, message: 'Mã OTP đã hết hạn. Vui lòng yêu cầu mã mới.' });
  }

  if (storedOtpData.otp !== otp) {
    return res.status(400).json({ success: false, message: 'Mã OTP không chính xác.' });
  }

  // OTP is valid, clear it
  otpStore.delete(email);

  const { data: existing } = await supabase.from('users').select('id').eq('email', email).single();
  if (existing) {
    return res.status(409).json({ success: false, message: 'Email đã được đăng ký.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const refreshToken = generateRefreshToken();

  const { data, error } = await supabase
    .from('users')
    .insert([{ name, email, password: hashed, refresh_token: refreshToken }])
    .select('id, name, email, role')
    .single();

  if (error) return res.status(500).json({ success: false, message: error.message });

  const accessToken = generateAccessToken(data);
  res.status(201).json({ 
    success: true, 
    accessToken, 
    refreshToken, 
    user: { ...data, id: data.id.toString() } 
  });
};

// POST /api/auth/login
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp email và password.' });
  }

  const { data: user } = await supabase.from('users').select('*').eq('email', email).single();
  if (!user) {
    return res.status(401).json({ success: false, message: 'Email hoặc password không đúng.' });
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(401).json({ success: false, message: 'Email hoặc password không đúng.' });
  }

  const refreshToken = generateRefreshToken();
  await supabase.from('users').update({ refresh_token: refreshToken }).eq('id', user.id);

  const accessToken = generateAccessToken(user);
  res.json({
    success: true,
    accessToken,
    refreshToken,
    user: { id: user.id.toString(), name: user.name, email: user.email, phone: user.phone, role: user.role },
  });
};

// POST /api/auth/logout
exports.logout = async (req, res) => {
  await supabase.from('users').update({ refresh_token: null }).eq('id', req.user.id);
  res.json({ success: true, message: 'Đăng xuất thành công.' });
};

// POST /api/auth/refresh-token
exports.refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp refreshToken.' });
  }

  const { data: user, error } = await supabase
    .from('users')
    .select('id, name, email, role, refresh_token')
    .eq('refresh_token', refreshToken)
    .single();

  if (error || !user) {
    return res.status(401).json({ success: false, message: 'Refresh token không hợp lệ hoặc đã hết hạn.' });
  }

  const newRefreshToken = generateRefreshToken();
  await supabase.from('users').update({ refresh_token: newRefreshToken }).eq('id', user.id);

  const accessToken = generateAccessToken(user);
  res.json({ success: true, accessToken, refreshToken: newRefreshToken });
};

// GET /api/auth/profile
exports.getProfile = async (req, res) => {
  const { data, error } = await supabase
    .from('users')
    .select('id, name, email, phone, role, created_at')
    .eq('id', req.user.id)
    .single();

  if (error) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });
  res.json({ success: true, user: { ...data, id: data.id.toString() } });
};

// PUT /api/auth/change-password
exports.changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp currentPassword và newPassword.' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự.' });
  }

  const { data: user } = await supabase.from('users').select('password').eq('id', req.user.id).single();
  if (!user) return res.status(404).json({ success: false, message: 'Không tìm thấy người dùng.' });

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) {
    return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng.' });
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  const { error } = await supabase.from('users').update({ password: hashed }).eq('id', req.user.id);

  if (error) return res.status(500).json({ success: false, message: error.message });
  res.json({ success: true, message: 'Đổi mật khẩu thành công.' });
};

// POST /api/auth/google
exports.googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) {
    return res.status(400).json({ success: false, message: 'Vui lòng cung cấp credential từ Google.' });
  }

  try {
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const { email, name } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Không thể lấy email từ Google.' });
    }

    // Kiểm tra xem user đã tồn tại chưa
    let { data: user } = await supabase.from('users').select('*').eq('email', email).single();

    if (!user) {
      // Đăng ký mới nếu chưa tồn tại
      const randomPassword = crypto.randomBytes(16).toString('hex');
      const hashedPassword = await bcrypt.hash(randomPassword, 10);
      
      const { data: newUser, error } = await supabase.from('users').insert([{
        name: name || 'Google User',
        email,
        password: hashedPassword,
        role: 'CUSTOMER'
      }]).select().single();

      if (error) {
        return res.status(500).json({ success: false, message: 'Lỗi khi tạo tài khoản từ Google: ' + error.message });
      }
      user = newUser;
    }

    // Đăng nhập thành công
    const refreshToken = generateRefreshToken();
    await supabase.from('users').update({ refresh_token: refreshToken }).eq('id', user.id);
    const accessToken = generateAccessToken(user);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: { id: user.id.toString(), name: user.name, email: user.email, phone: user.phone, role: user.role },
    });
  } catch (error) {
    console.error('Lỗi xác thực Google:', error);
    res.status(401).json({ success: false, message: 'Xác thực Google thất bại.' });
  }
};
