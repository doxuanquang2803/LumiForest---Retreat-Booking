const cron = require('node-cron');
const prisma = require('./config/prismaClient');

function initCronJobs() {
  // Run every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[CRON] Chạy tiến trình cập nhật voucher hết hạn...');
    try {
      const now = new Date();
      
      const result = await prisma.$executeRaw`
        UPDATE corporate_vouchers
        SET status = 'EXPIRED'
        WHERE status IN ('UNASSIGNED', 'ASSIGNED')
          AND expires_at < ${now}
      `;
      
      if (result > 0) {
        console.log(`[CRON] Đã cập nhật ${result} voucher thành EXPIRED.`);
      }
    } catch (error) {
      console.error('[CRON] Lỗi khi cập nhật voucher hết hạn:', error);
    }
  });

  // Run every minute to clean up expired pending orders (10 mins)
  cron.schedule('* * * * *', async () => {
    try {
      const tenMinsAgo = new Date(Date.now() - 10 * 60 * 1000);
      
      const deletedOrders = await prisma.voucherOrder.deleteMany({
        where: {
          status: 'PENDING_PAYMENT',
          createdAt: { lt: tenMinsAgo }
        }
      });
      
      const deletedBatches = await prisma.corporatePurchaseBatch.deleteMany({
        where: {
          paymentStatus: 'PENDING',
          createdAt: { lt: tenMinsAgo }
        }
      });
      
      if (deletedOrders.count > 0 || deletedBatches.count > 0) {
        console.log(`[CRON] Đã dọn dẹp ${deletedOrders.count} VoucherOrder và ${deletedBatches.count} CorporateBatch chờ thanh toán quá 10 phút.`);
      }
    } catch (error) {
      console.error('[CRON] Lỗi khi dọn dẹp đơn chờ thanh toán:', error);
    }
  });

  console.log('[CRON] Đã khởi tạo các tiến trình nền.');
}

module.exports = initCronJobs;
