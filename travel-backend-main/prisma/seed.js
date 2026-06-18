

const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

// Create the pg connection pool & adapter (required for adapter-pg in this setup)
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const toursData = [
  {
    title: 'Phú Quốc 4N3Đ',
    slug: 'phu-quoc-4n3d',
    description: 'Khám phá đảo ngọc Phú Quốc với bãi biển trong xanh, lặn ngắm san hô và ẩm thực hải sản tươi ngon.',
    location: 'Phú Quốc, Kiên Giang',
    price: 5990000,
    duration: '4 ngày 3 đêm',
    maxGuests: 20,
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    gallery: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800', 'https://images.unsplash.com/photo-1506929562872-bb421503ef21?w=800'],
    rating: 4.8,
    bookingCount: 150,
    status: 'active',
  },
  {
    title: 'Đà Nẵng - Hội An 3N2Đ',
    slug: 'da-nang-hoi-an-3n2d',
    description: 'Hành trình di sản Đà Nẵng, Ngũ Hành Sơn, Bà Nà Hills và phố cổ Hội An lung linh đèn lồng.',
    location: 'Đà Nẵng - Quảng Nam',
    price: 3290000,
    duration: '3 ngày 2 đêm',
    maxGuests: 15,
    thumbnail: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800',
    gallery: ['https://images.unsplash.com/photo-1528127269322-539801943592?w=800'],
    rating: 4.6,
    bookingCount: 85,
    status: 'active',
  },
  {
    title: 'Tour Sapa Cát Cát - Fansipan',
    slug: 'tour-sapa-cat-cat-fansipan',
    description: 'Chinh phục đỉnh Fansipan - nóc nhà Đông Dương, check-in bản Cát Cát, thung lũng Mường Hoa thơ mộng.',
    location: 'Sapa, Lào Cai',
    price: 2850000,
    duration: '2 ngày 1 đêm',
    maxGuests: 25,
    thumbnail: 'https://images.unsplash.com/photo-1508873696983-2df519f0397e?w=800',
    gallery: [],
    rating: 4.7,
    bookingCount: 120,
    status: 'active',
  },
  {
    title: 'Hà Giang Vòng Cung Đông Bắc',
    slug: 'ha-giang-vong-cung-dong-bac',
    description: 'Khám phá Cao nguyên đá Đồng Văn, đèo Mã Pí Lèng hùng vĩ, sông Nho Quế xanh biếc và cột cờ Lũng Cú.',
    location: 'Hà Giang',
    price: 4350000,
    duration: '4 ngày 3 đêm',
    maxGuests: 12,
    thumbnail: 'https://images.unsplash.com/photo-1605538032432-a9f0c8d9baac?w=800',
    gallery: ['https://images.unsplash.com/photo-1596394516093-501ba68a0ba6?w=800', 'https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800'],
    rating: 4.9,
    bookingCount: 210,
    status: 'active',
  },
  {
    title: 'Vịnh Hạ Long Du Thuyền 5 Sao',
    slug: 'vinh-ha-long-du-thuyen-5-sao',
    description: 'Trải nghiệm nghỉ dưỡng đẳng cấp trên du thuyền vịnh Hạ Long, chèo thuyền kayak, thăm hang Sửng Sốt.',
    location: 'Hạ Long, Quảng Ninh',
    price: 6500000,
    duration: '2 ngày 1 đêm',
    maxGuests: 30,
    thumbnail: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?w=800',
    gallery: ['https://images.unsplash.com/photo-1552083375-1447ce886485?w=800'],
    rating: 4.5,
    bookingCount: 65,
    status: 'active',
  },
];

async function main() {
  console.log('Bắt đầu dọn dẹp bảng tours...');
  await prisma.tourImage.deleteMany();
  await prisma.tour.deleteMany();
  console.log('Đã dọn dẹp xong.');

  console.log('Bắt đầu nạp dữ liệu mẫu cho tours...');
  for (const tour of toursData) {
    const created = await prisma.tour.create({
      data: tour,
    });
    console.log(`Đã tạo tour: ${created.title} (ID: ${created.id})`);

    // Create tour images in the TourImage table
    const tourImages = [
      { tourId: created.id, imageUrl: created.thumbnail, type: 'thumbnail' },
      ...created.gallery.map((url) => ({ tourId: created.id, imageUrl: url, type: 'gallery' })),
    ];
    if (tourImages.length > 0) {
      await prisma.tourImage.createMany({ data: tourImages });
      console.log(`     └─ Đã tạo ${tourImages.length} ảnh cho tour`);
    }
  }
  console.log('Hoàn thành nạp dữ liệu mẫu!');
}

main()
  .catch((e) => {
    console.error('Lỗi khi nạp dữ liệu mẫu:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
