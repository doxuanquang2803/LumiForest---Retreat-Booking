require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  console.log("Sử dụng EMAIL_USER:", user);
  if (!user || !pass) {
    console.error("Thiếu EMAIL_USER hoặc EMAIL_PASS trong .env");
    return;
  }

  try {
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: user,
        pass: pass,
      },
    });

    const info = await transporter.sendMail({
      from: user,
      to: user, // gửi cho chính mình để test
      subject: "Test Email Config",
      text: "Nếu bạn nhận được email này, cấu hình đã đúng!"
    });

    console.log("Gửi email test thành công! ID:", info.messageId);
  } catch (error) {
    console.error("Lỗi khi gửi email:", error.message);
    if (error.response) {
      console.error("Phản hồi từ server:", error.response);
    }
  }
}

testEmail();
