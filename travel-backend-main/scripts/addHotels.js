const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const newHotels = [
  {
    name: 'Fusion Maia Đà Nẵng',
    slug: 'fusion-maia-da-nang',
    description: 'Resort 5 sao all-spa nằm dọc bãi biển Non Nước. Tất cả villa đều có hồ bơi riêng, thiết kế hiện đại hòa quyện với thiên nhiên. Điểm nổi bật là dịch vụ spa miễn phí không giới hạn cho khách lưu trú.',
    location: 'Đà Nẵng',
    address: 'Võ Nguyên Giáp, Mỹ An, Ngũ Hành Sơn, Đà Nẵng',
    starRating: 5,
    price: 5200000,
    thumbnail: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800',
    gallery: ['https://images.unsplash.com/photo-1540541338287-41700207dee6?w=800'],
    amenities: ['Villa hồ bơi riêng', 'Spa miễn phí', 'Bãi biển riêng', 'Nhà hàng', 'Yoga', 'WiFi miễn phí'],
    rating: 4.8,
    reviewCount: 178,
    bookingCount: 340,
    featured: true,
    status: 'active',
  },
  {
    name: 'Mövenpick Resort Cam Ranh',
    slug: 'movenpick-resort-cam-ranh',
    description: 'Resort 5 sao tọa lạc trên bán đảo Cam Ranh với bãi biển cát trắng nguyên sơ. Kiến trúc Địa Trung Hải sang trọng, hồ bơi vô cực nhìn ra Biển Đông và ẩm thực quốc tế đẳng cấp.',
    location: 'Cam Ranh, Khánh Hòa',
    address: 'Bắc Bán đảo Cam Ranh, Khánh Hòa',
    starRating: 5,
    price: 3900000,
    thumbnail: 'https://images.unsplash.com/photo-1439130490301-25e322d88054?w=800',
    gallery: ['https://images.unsplash.com/photo-1445019980597-93fa8acb246c?w=800'],
    amenities: ['Hồ bơi vô cực', 'Bãi biển riêng', 'Spa', 'Nhà hàng', 'Bar', 'Gym', 'WiFi miễn phí'],
    rating: 4.7,
    reviewCount: 203,
    bookingCount: 420,
    featured: false,
    status: 'active',
  }
];

async function main() {
  for (const data of newHotels) {
    const hotel = await prisma.hotel.create({ data });
    await prisma.hotelImage.createMany({
      data: [
        { hotelId: hotel.id, imageUrl: hotel.thumbnail, type: 'thumbnail' },
        ...hotel.gallery.map(url => ({ hotelId: hotel.id, imageUrl: url, type: 'gallery' }))
      ]
    });
    console.log('✔ Đã thêm:', hotel.name, '(ID:', hotel.id + ')');
  }
  console.log('✅ Xong!');
}

main()
  .catch(e => { console.error('❌ Lỗi:', e.message); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); await pool.end(); });
