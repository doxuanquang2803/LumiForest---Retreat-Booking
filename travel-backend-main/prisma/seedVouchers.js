const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const vouchersData = [
  {
    title: 'Vinpearl Resort 2 ngày 1 đêm',
    description: 'Voucher nghỉ dưỡng cao cấp tại Vinpearl Resort & Spa Phú Quốc, bao gồm bữa sáng và sử dụng hồ bơi vô cực.',
    resortName: 'Vinpearl Resort & Spa Phú Quốc',
    originalPrice: 4500000,
    salePrice: 3200000,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600',
    validUntil: new Date('2026-12-31T23:59:59Z'),
    quantity: 50,
    remainingQuantity: 50,
    status: 'ACTIVE',
  },
  {
    title: 'InterContinental Đà Nẵng Cuối Tuần',
    description: 'Voucher 2 ngày 1 đêm phòng Deluxe Ocean View tại InterContinental Đà Nẵng, kèm bữa sáng cho 2 người.',
    resortName: 'InterContinental Đà Nẵng Sun Peninsula',
    originalPrice: 6800000,
    salePrice: 4900000,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600',
    validUntil: new Date('2026-10-31T23:59:59Z'),
    quantity: 30,
    remainingQuantity: 30,
    status: 'ACTIVE',
  },
  {
    title: 'Amanoi Resort Ninh Thuận - Gói Spa',
    description: 'Trải nghiệm liệu pháp spa 3 giờ độc quyền tại Amanoi Resort, sử dụng bể bơi vô cực nhìn ra vịnh Vĩnh Hy.',
    resortName: 'Amanoi Resort Ninh Thuận',
    originalPrice: 3200000,
    salePrice: 2100000,
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?w=600',
    validUntil: new Date('2026-09-30T23:59:59Z'),
    quantity: 20,
    remainingQuantity: 20,
    status: 'ACTIVE',
  },
  {
    title: 'Six Senses Côn Đảo - Bữa Tối Lãng Mạn',
    description: 'Bữa tối set menu 5 món tại nhà hàng Six Senses Côn Đảo cho 2 người, view biển tuyệt đẹp.',
    resortName: 'Six Senses Côn Đảo',
    originalPrice: 2800000,
    salePrice: 1950000,
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600',
    validUntil: new Date('2026-11-30T23:59:59Z'),
    quantity: 40,
    remainingQuantity: 40,
    status: 'ACTIVE',
  },
  {
    title: 'Mia Resort Nha Trang - Gói Gia Đình',
    description: 'Gói nghỉ dưỡng gia đình 3 ngày 2 đêm tại Mia Resort Nha Trang, phòng Suite hướng biển.',
    resortName: 'Mia Resort Nha Trang',
    originalPrice: 8500000,
    salePrice: 5800000,
    image: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600',
    validUntil: new Date('2026-08-31T23:59:59Z'),
    quantity: 15,
    remainingQuantity: 15,
    status: 'ACTIVE',
  },
  {
    title: 'Fusion Maia Đà Nẵng - All-Spa Inclusive',
    description: 'Gói All-Spa-Inclusive tại Fusion Maia: dịch vụ spa không giới hạn trong ngày, bao gồm bữa sáng và ăn trưa.',
    resortName: 'Fusion Maia Đà Nẵng',
    originalPrice: 5200000,
    salePrice: 3600000,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=600',
    validUntil: new Date('2026-12-15T23:59:59Z'),
    quantity: 25,
    remainingQuantity: 25,
    status: 'ACTIVE',
  },
];

async function main() {
  console.log('Bắt đầu seed dữ liệu voucher...');

  for (const v of vouchersData) {
    const created = await prisma.voucher.create({ data: v });
    console.log(`✓ Đã tạo: ${created.title} (ID: ${created.id})`);
  }

  console.log(`\nHoàn thành! Đã tạo ${vouchersData.length} voucher.`);
}

main()
  .catch((e) => {
    console.error('Lỗi khi seed voucher:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
