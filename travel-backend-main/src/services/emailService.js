const nodemailer = require('nodemailer');
const path = require('path');
// Trigger nodemon restart after .env change

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  /**
   * Send voucher email to employee
   */
  async sendVoucherEmail({ employeeName, email, phone, address, voucherCode, redeemToken, qrCodePath, expiresAt, voucherTitle, resortName }) {
    const domain = process.env.DOMAIN || 'yourdomain.com';
    const protocol = process.env.NODE_ENV === 'production' ? 'https' : 'http';
    const redeemUrl = `${protocol}://${domain}/redeem/${voucherCode}?token=${redeemToken}`;
    
    const mailOptions = {
      from: `"Corporate Voucher System" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: `Your Corporate Voucher: ${voucherTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hello ${employeeName},</h2>
          <p>You have received a corporate voucher from your company.</p>
          <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">${voucherTitle}</h3>
            ${resortName ? `<p style="margin: 5px 0; color: #666;"><strong>Resort:</strong> ${resortName}</p>` : ''}
            <p><strong>Voucher Code:</strong> <span style="font-size: 18px; color: #007bff;">${voucherCode}</span></p>
            <p><strong>Expiry Date:</strong> ${new Date(expiresAt).toLocaleDateString('en-GB')}</p>
          </div>
          <p><strong>Your Registered Information:</strong></p>
          <ul>
            <li>Phone: ${phone}</li>
            <li>Address: ${address}</li>
          </ul>
          <p style="margin-top: 30px;">
            <a href="${redeemUrl}" style="padding: 12px 24px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Redeem Voucher Now
            </a>
          </p>
          <p>Or scan the attached QR code to redeem.</p>
          ${qrCodePath ? '<p><img src="cid:qrcode" alt="QR Code" width="200" style="border: 1px solid #ddd; padding: 10px; border-radius: 10px;"/></p>' : ''}
          <br>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666;">If you have any questions, please contact your HR department.</p>
        </div>
      `,
      attachments: []
    };

    if (qrCodePath) {
      const fullPath = path.join(process.cwd(), qrCodePath);
      mailOptions.attachments.push({
        filename: 'voucher-qr.png',
        path: fullPath,
        cid: 'qrcode' // inline embedding
      });
    }

    return this.transporter.sendMail(mailOptions);
  }

  /**
   * Send OTP Email
   */
  async sendOtpEmail(email, otp) {
    const mailOptions = {
      from: `"LumiForest" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Mã xác thực OTP đăng ký tài khoản',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #2ba5c9; text-align: center;">Mã Xác Thực OTP</h2>
          <p>Xin chào,</p>
          <p>Bạn đã yêu cầu đăng ký tài khoản tại LumiForest. Dưới đây là mã xác thực OTP của bạn:</p>
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; border-radius: 5px; margin: 20px 0;">
            <span style="font-size: 24px; font-weight: bold; letter-spacing: 5px; color: #333;">${otp}</span>
          </div>
          <p>Mã này sẽ hết hạn sau 5 phút. Vui lòng không chia sẻ mã này với bất kỳ ai.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.</p>
        </div>
      `
    };
    return this.transporter.sendMail(mailOptions);
  }

  /**
   * Send Invoice Email
   */
  async sendInvoiceEmail(email, bookingDetails, qrCodeBuffer) {
    const attachments = [];
    if (qrCodeBuffer) {
      attachments.push({
        filename: 'qrcode.png',
        content: qrCodeBuffer,
        cid: 'invoice-qrcode'
      });
    }

    const mailOptions = {
      from: `"LumiForest" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Hóa đơn thanh toán - LumiForest',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 5px;">
          <h2 style="color: #2ba5c9; text-align: center;">Hóa Đơn Thanh Toán</h2>
          <p>Xin chào,</p>
          <p>Cảm ơn bạn đã sử dụng dịch vụ của LumiForest. Dưới đây là chi tiết hóa đơn của bạn:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Mã giao dịch</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${bookingDetails.transactionId || 'N/A'}</td>
            </tr>
            <tr>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Dịch vụ</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${bookingDetails.itemName || 'Dịch vụ'}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Khách hàng</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${bookingDetails.customerName || 'N/A'}</td>
            </tr>
            <tr>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Số điện thoại</th>
              <td style="padding: 10px; border: 1px solid #ddd;">${bookingDetails.phone || 'N/A'}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Tổng tiền</th>
              <td style="padding: 10px; border: 1px solid #ddd; font-weight: bold; color: #d9534f;">${(bookingDetails.amount || 0).toLocaleString()} VNĐ</td>
            </tr>
            <tr>
              <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Trạng thái</th>
              <td style="padding: 10px; border: 1px solid #ddd; color: #5cb85c;">Đã thanh toán</td>
            </tr>
          </table>

          ${qrCodeBuffer ? `
          <div style="text-align: center; margin-top: 30px;">
            <p><strong>Mã QR của bạn:</strong></p>
            <img src="cid:invoice-qrcode" alt="QR Code" width="200" style="border: 1px solid #ddd; padding: 10px; border-radius: 10px;" />
          </div>
          ` : ''}
          
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
          <p style="font-size: 12px; color: #666; text-align: center;">Mọi thắc mắc xin vui lòng liên hệ hotline: 1900 xxxx.</p>
        </div>
      `,
      attachments
    };
    return this.transporter.sendMail(mailOptions);
  }
}

module.exports = new EmailService();
