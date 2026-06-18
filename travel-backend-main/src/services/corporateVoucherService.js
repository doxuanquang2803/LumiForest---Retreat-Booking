const prisma = require('../config/prismaClient');
const xlsx = require('xlsx');
const qrcode = require('qrcode');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const emailService = require('./emailService');

class CorporateVoucherService {
  /**
   * Helper to generate a secure random code
   */
  generateRandomCode(prefix = 'CORP', length = 8) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = prefix + '-';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Helper to generate a secure redeem token
   */
  generateRedeemToken() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * Ensure upload directory exists
   */
  ensureUploadDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  /**
   * Remove unused QR image files from local storage
   */
  cleanupQrCode(qrCodePath) {
    if (!qrCodePath) return;
    const fullPath = path.join(process.cwd(), qrCodePath);
    if (fs.existsSync(fullPath)) {
      try {
        fs.unlinkSync(fullPath);
      } catch (err) {
        console.error('Lỗi khi xóa file QR:', err);
      }
    }
  }

  /**
   * Purchase a batch of vouchers
   */
  async purchaseBatch(companyId, voucherId, totalQuantity, employeeData) {
    const voucher = await prisma.voucher.findUnique({
      where: { id: BigInt(voucherId) }
    });
    if (!voucher) throw new Error('Không tìm thấy voucher tương ứng');

    const expiresAt = voucher.validUntil;
    const totalPrice = Number(voucher.salePrice) * totalQuantity;

    const batch = await prisma.corporatePurchaseBatch.create({
      data: {
        companyId: BigInt(companyId),
        voucherId: BigInt(voucherId),
        totalQuantity,
        totalPrice,
        paymentStatus: 'PENDING',
        employeeData: employeeData || null,
        expiresAt,
        createdBy: BigInt(companyId),
      },
    });

    return batch;
  }

  /**
   * Called by paymentService after payment is successful
   */
  async processBatchFulfillment(batchId) {
    const batch = await prisma.corporatePurchaseBatch.findUnique({
      where: { id: BigInt(batchId) }
    });
    if (!batch) throw new Error('Không tìm thấy lô doanh nghiệp');
    if (batch.paymentStatus === 'PAID') return batch; // Idempotent

    const employeeData = batch.employeeData || [];

    const result = await prisma.$transaction(async (tx) => {
      // 1. Update batch to PAID
      const updatedBatch = await tx.corporatePurchaseBatch.update({
        where: { id: batch.id },
        data: { paymentStatus: 'PAID' }
      });

      // 2. Decrease physical Voucher inventory
      if (batch.voucherId) {
        const v = await tx.voucher.findUnique({ where: { id: batch.voucherId } });
        if (!v || v.remainingQuantity < batch.totalQuantity) {
          throw new Error('Số lượng voucher không đủ để cấp phát');
        }
        await tx.voucher.update({
          where: { id: batch.voucherId },
          data: { remainingQuantity: { decrement: batch.totalQuantity } }
        });
      }

      // 3. Create CorporateVouchers
      const vouchers = [];
      for (let i = 0; i < batch.totalQuantity; i++) {
        const emp = employeeData[i];
        vouchers.push({
          batchId: batch.id,
          code: this.generateRandomCode('VCH'),
          redeemToken: this.generateRedeemToken(),
          companyId: batch.companyId,
          expiresAt: batch.expiresAt,
          status: emp ? 'ASSIGNED' : 'UNASSIGNED',
          assignedEmployeeName: emp ? emp.fullName : null,
          assignedEmployeeEmail: emp ? emp.email : null,
          assignedEmployeePhone: emp ? emp.phone : null,
          assignedEmployeeAddress: emp ? emp.address : null,
          assignedAt: emp ? new Date() : null,
        });
      }

      await tx.corporateVoucher.createMany({
        data: vouchers,
      });

      return updatedBatch;
    });

    // Send emails asynchronously outside transaction
    const assignedVouchers = await prisma.corporateVoucher.findMany({
      where: { batchId: batch.id, status: 'ASSIGNED' },
      include: {
        batch: {
          include: {
            voucherRef: true
          }
        }
      }
    });
    if (assignedVouchers.length > 0) {
      // Background execution
      (async () => {
        try {
          const emailPromises = assignedVouchers.map(async (v) => {
            const qrFilename = `${v.code}.png`;
            const qrRelativePath = `uploads/qrcodes/${qrFilename}`;
            const qrFullPath = path.join(process.cwd(), qrRelativePath);
            const voucherTitle = v.batch?.voucherRef?.title || 'Voucher Doanh Nghiệp';
            const resortName = v.batch?.voucherRef?.resortName || '';

            // Create QR
            const redeemUrl = `${process.env.DOMAIN || 'http://localhost:3000'}/redeem/${v.code}?token=${v.redeemToken}`;
            await qrcode.toFile(qrFullPath, redeemUrl, { color: { dark: '#000', light: '#FFF' } });

            // Send Email
            await emailService.sendVoucherEmail({
              employeeName: v.assignedEmployeeName,
              email: v.assignedEmployeeEmail,
              phone: v.assignedEmployeePhone,
              address: v.assignedEmployeeAddress,
              voucherCode: v.code,
              redeemToken: v.redeemToken,
              qrCodePath: qrRelativePath,
              expiresAt: v.expiresAt,
              voucherTitle,
              resortName
            });

            // Mark as sent
            await prisma.corporateVoucher.update({
              where: { id: v.id },
              data: { emailSent: true, emailSentAt: new Date(), qrCodePath: qrRelativePath },
            });
          });
          await Promise.allSettled(emailPromises);
        } catch (err) {
          console.error('Error sending corporate emails:', err);
        }
      })();
    }

    return result;
  }

  /**
   * Get Pool Stats for a company
   */
  async getPoolStats(companyId) {
    const stats = await prisma.corporateVoucher.groupBy({
      by: ['status'],
      where: { companyId },
      _count: {
        id: true,
      },
    });

    let total = 0;
    const result = {
      UNASSIGNED: 0,
      ASSIGNED: 0,
      REDEEMED: 0,
      EXPIRED: 0,
      CANCELLED: 0,
    };

    stats.forEach(stat => {
      result[stat.status] = stat._count.id;
      total += stat._count.id;
    });

    return {
      totalPurchased: total,
      ...result,
    };
  }

  /**
   * Parse and validate Excel file strictly
   */
  async validateAndParseExcel(buffer, availableQuantity) {
    const workbook = xlsx.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Parse to JSON
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: '' });
    
    const requiredColumns = ['Full Name', 'Email', 'Phone Number', 'Address'];
    if (rows.length === 0) {
      return { success: false, errors: ['Tệp Excel trống'] };
    }

    // Check columns
    const firstRow = rows[0];
    const missingColumns = requiredColumns.filter(col => !(col in firstRow));
    if (missingColumns.length > 0) {
      return { 
        success: false, 
        errors: [`Sai cấu trúc cột. Thiếu các cột: ${missingColumns.join(', ')}`] 
      };
    }

    const errors = [];
    const validData = [];
    const emailSet = new Set();
    const phoneSet = new Set();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{9,15}$/;

    // Filter out completely empty rows first
    let dataRows = rows.filter(row => {
      const fn = (row['Full Name'] || '').toString().trim();
      const em = (row['Email'] || '').toString().trim();
      const ph = (row['Phone Number'] || '').toString().trim();
      const ad = (row['Address'] || '').toString().trim();
      return fn || em || ph || ad;
    });

    // If more employees than available vouchers, only take the first N employees
    if (dataRows.length > availableQuantity) {
      dataRows = dataRows.slice(0, availableQuantity);
    }

    dataRows.forEach((row, index) => {
      const rowNum = index + 2; // +1 for 0-index, +1 for header
      
      const fullName = (row['Full Name'] || '').toString().trim();
      const email = (row['Email'] || '').toString().trim().toLowerCase();
      const phone = (row['Phone Number'] || '').toString().trim();
      const address = (row['Address'] || '').toString().trim();

      if (!fullName) errors.push(`Dòng ${rowNum}: Thiếu Full Name`);
      if (!email) errors.push(`Dòng ${rowNum}: Thiếu Email`);
      else if (!emailRegex.test(email)) errors.push(`Dòng ${rowNum}: Email không hợp lệ`);
      else if (emailSet.has(email)) errors.push(`Dòng ${rowNum}: Email trùng lặp trong tệp`);
      
      if (!phone) errors.push(`Dòng ${rowNum}: Thiếu Phone Number`);
      else if (!phoneRegex.test(phone)) errors.push(`Dòng ${rowNum}: Số điện thoại không hợp lệ`);
      else if (phoneSet.has(phone)) errors.push(`Dòng ${rowNum}: Số điện thoại trùng lặp trong tệp`);
      
      if (!address) errors.push(`Dòng ${rowNum}: Thiếu Address`);

      if (email) emailSet.add(email);
      if (phone) phoneSet.add(phone);

      validData.push({ fullName, email, phone, address });
    });

    if (errors.length > 0) {
      return { success: false, errors };
    }

    return { success: true, data: validData };
  }

  /**
   * Assign vouchers, generate QR, and send emails
   */
  async assignVouchers(batchId, employeeList, assignerId, companyId) {
    const uploadDir = path.join(process.cwd(), 'uploads', 'qrcodes');
    this.ensureUploadDir(uploadDir);

    const assignmentResults = await prisma.$transaction(async (tx) => {
      // 1. Lock UNASSIGNED vouchers for this batch
      const unassignedVouchers = await tx.$queryRaw`
        SELECT id, code, redeem_token as "redeemToken", expires_at as "expiresAt"
        FROM corporate_vouchers
        WHERE batch_id = ${batchId} AND status = 'UNASSIGNED'
        LIMIT ${employeeList.length}
        FOR UPDATE SKIP LOCKED
      `;

      if (unassignedVouchers.length < employeeList.length) {
        throw new Error('Không đủ số lượng voucher khả dụng trong batch để cấp phát.');
      }

      const assignedRecords = [];

      for (let i = 0; i < employeeList.length; i++) {
        const emp = employeeList[i];
        const v = unassignedVouchers[i];

        // Ensure no duplicate email within the same batch (already handled by unique constraint, but good to catch)
        const existing = await tx.corporateVoucher.findUnique({
          where: {
            batchId_assignedEmployeeEmail: {
              batchId,
              assignedEmployeeEmail: emp.email
            }
          }
        });
        
        if (existing) {
          throw new Error(`Nhân viên ${emp.email} đã được cấp voucher trong batch này.`);
        }

        // Generate QR code
        const qrContent = `${process.env.DOMAIN || 'http://localhost:5000'}/redeem/${v.code}?token=${v.redeemToken}`;
        const qrFilename = `${v.code}.png`;
        const qrRelativePath = `uploads/qrcodes/${qrFilename}`;
        const qrFullPath = path.join(uploadDir, qrFilename);

        await qrcode.toFile(qrFullPath, qrContent, {
          color: { dark: '#000', light: '#FFF' }
        });

        const updated = await tx.corporateVoucher.update({
          where: { id: v.id },
          data: {
            status: 'ASSIGNED',
            assignedEmployeeName: emp.fullName,
            assignedEmployeeEmail: emp.email,
            assignedEmployeePhone: emp.phone,
            assignedEmployeeAddress: emp.address,
            assignedAt: new Date(),
            assignedBy: assignerId,
            qrCodePath: qrRelativePath
          }
        });

        assignedRecords.push({ ...updated, employee: emp });
      }

      return assignedRecords;
    });

    // 2. Dispatch emails asynchronously using Promise.allSettled
    const emailPromises = assignmentResults.map(async (record) => {
      try {
        await emailService.sendVoucherEmail({
          employeeName: record.assignedEmployeeName,
          email: record.assignedEmployeeEmail,
          phone: record.assignedEmployeePhone,
          address: record.assignedEmployeeAddress,
          voucherCode: record.code,
          redeemToken: record.redeemToken,
          qrCodePath: record.qrCodePath,
          expiresAt: record.expiresAt
        });

        // Update email status
        await prisma.corporateVoucher.update({
          where: { id: record.id },
          data: { emailSent: true, emailSentAt: new Date() }
        });
      } catch (error) {
        console.error(`Gửi email thất bại cho ${record.assignedEmployeeEmail}:`, error);
        // Leave emailSent = false
      }
    });

    // Don't await email sending strictly to respond faster, or await it if we want to ensure it finishes.
    // For background dispatch, just fire and forget, or wait for them.
    await Promise.allSettled(emailPromises);

    return assignmentResults.length;
  }

  /**
   * Redeem a voucher
   */
  async redeemVoucher(voucherCode, redeemToken, userEmail, userId = null) {
    return prisma.$transaction(async (tx) => {
      // Lock the specific voucher row
      const rows = await tx.$queryRaw`
        SELECT id, status, assigned_employee_email as "assignedEmployeeEmail"
        FROM corporate_vouchers
        WHERE code = ${voucherCode} AND redeem_token = ${redeemToken}
        FOR UPDATE
      `;

      if (rows.length === 0) {
        throw new Error('Mã voucher hoặc token không hợp lệ.');
      }

      const voucher = rows[0];

      // Validate ownership
      if (voucher.assignedEmployeeEmail !== userEmail) {
        throw new Error('Voucher này không thuộc sở hữu của bạn.');
      }

      // Validate status
      if (voucher.status === 'REDEEMED') throw new Error('Voucher này đã được sử dụng.');
      if (voucher.status === 'EXPIRED') throw new Error('Voucher này đã hết hạn.');
      if (voucher.status === 'CANCELLED') throw new Error('Voucher này đã bị hủy.');
      if (voucher.status !== 'ASSIGNED') throw new Error('Voucher này chưa được cấp phát hợp lệ.');

      // Proceed to redeem
      const redeemed = await tx.corporateVoucher.update({
        where: { id: voucher.id },
        data: {
          status: 'REDEEMED',
          redeemedAt: new Date(),
          redeemedBy: userId,
          redeemedEmail: userEmail
        }
      });

      return redeemed;
    });
  }

  /**
   * Resend voucher email manually
   */
  async resendEmail(voucherId) {
    const voucher = await prisma.corporateVoucher.findUnique({
      where: { id: voucherId }
    });

    if (!voucher) throw new Error('Không tìm thấy voucher.');
    if (voucher.status !== 'ASSIGNED') throw new Error('Chỉ có thể gửi lại email cho voucher đã được cấp phát.');
    if (!voucher.assignedEmployeeEmail) throw new Error('Voucher này chưa được gán email.');

    await emailService.sendVoucherEmail({
      employeeName: voucher.assignedEmployeeName,
      email: voucher.assignedEmployeeEmail,
      phone: voucher.assignedEmployeePhone,
      address: voucher.assignedEmployeeAddress,
      voucherCode: voucher.code,
      redeemToken: voucher.redeemToken,
      qrCodePath: voucher.qrCodePath,
      expiresAt: voucher.expiresAt
    });

    const updated = await prisma.corporateVoucher.update({
      where: { id: voucher.id },
      data: { emailSent: true, emailSentAt: new Date() }
    });

    return updated;
  }

  /**
   * Cancel a corporate voucher and cleanup QR Code
   */
  async cancelVoucher(voucherId, adminId) {
    const voucher = await prisma.corporateVoucher.findUnique({
      where: { id: voucherId }
    });

    if (!voucher) throw new Error('Không tìm thấy voucher.');
    if (voucher.status === 'REDEEMED') throw new Error('Không thể hủy voucher đã được sử dụng.');

    const updated = await prisma.corporateVoucher.update({
      where: { id: voucherId },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledBy: adminId ? BigInt(adminId) : null
      }
    });

    // Cleanup unused QR Code
    if (voucher.qrCodePath) {
      this.cleanupQrCode(voucher.qrCodePath);
    }

    return updated;
  }
}

module.exports = new CorporateVoucherService();
