const { PrismaClient } = require('@prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ─── HOTELS DATA ──────────────────────────────────────────────────────────────

const hotelsData = [
  {
    name: 'Vinpearl Resort & Spa Phú Quốc',
    slug: 'vinpearl-resort-spa-phu-quoc',
    description:
      'Khu nghỉ dưỡng đẳng cấp 5 sao nằm trên bãi biển Bãi Dài nguyên sơ, sở hữu hồ bơi vô cực, spa quốc tế và hệ thống nhà hàng ẩm thực đa quốc gia. Không gian xanh mướt với thiên nhiên nhiệt đới bao quanh.',
    location: 'Phú Quốc, Kiên Giang',
    address: 'Bãi Dài, Gành Dầu, Phú Quốc, Kiên Giang',
    starRating: 5,
    price: 3500000,
    thumbnail: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=800',
      'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800',
    ],
    amenities: ['Hồ bơi vô cực', 'Spa 5 sao', 'Nhà hàng', 'Bãi biển riêng', 'Gym', 'WiFi miễn phí', 'Dịch vụ phòng 24h'],
    rating: 4.9,
    reviewCount: 320,
    bookingCount: 850,
    featured: true,
    status: 'active',
  },
  {
    name: 'InterContinental Đà Nẵng Sun Peninsula',
    slug: 'intercontinental-da-nang-sun-peninsula',
    description:
      'Tọa lạc trên bán đảo Sơn Trà, khách sạn 5 sao mang phong cách kiến trúc Đông Dương kết hợp hiện đại. Nhìn ra vịnh Đà Nẵng tuyệt đẹp với hệ thống villa riêng biệt và nhà hàng La Maison 1888 lừng danh.',
    location: 'Đà Nẵng',
    address: 'Bãi Bắc, Sơn Trà, Đà Nẵng',
    starRating: 5,
    price: 4200000,
    thumbnail: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800',
      'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800',
    ],
    amenities: ['Villa riêng', 'Hồ bơi', 'Spa', 'Nhà hàng La Maison 1888', 'Bãi biển riêng', 'Tennis', 'WiFi miễn phí'],
    rating: 4.8,
    reviewCount: 215,
    bookingCount: 620,
    featured: true,
    status: 'active',
  },
  {
    name: 'Lotte Hotel Hà Nội',
    slug: 'lotte-hotel-ha-noi',
    description:
      'Khách sạn 5 sao quốc tế nằm tại trung tâm thủ đô Hà Nội, cao 65 tầng với tầm nhìn panorama toàn thành phố. Tiện nghi sang trọng, hồ bơi trên tầng cao và hệ thống ẩm thực phong phú.',
    location: 'Hà Nội',
    address: '54 Liễu Giai, Ba Đình, Hà Nội',
    starRating: 5,
    price: 2800000,
    thumbnail: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1568084680786-a84f91d1153c?w=800',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
    ],
    amenities: ['Hồ bơi tầng cao', 'Spa', 'Gym', 'Nhà hàng', 'Bar Sky', 'Phòng họp', 'WiFi miễn phí', 'Đưa đón sân bay'],
    rating: 4.7,
    reviewCount: 180,
    bookingCount: 410,
    featured: true,
    status: 'active',
  },
  {
    name: 'Novotel Nha Trang',
    slug: 'novotel-nha-trang',
    description:
      'Khách sạn 4 sao quốc tế ngay trung tâm Nha Trang, cách bãi biển 50m. Phòng nghỉ hiện đại với ban công nhìn ra biển, hồ bơi ngoài trời và nhà hàng hải sản nổi tiếng.',
    location: 'Nha Trang, Khánh Hòa',
    address: '50 Trần Phú, Lộc Thọ, Nha Trang, Khánh Hòa',
    starRating: 4,
    price: 1600000,
    thumbnail: 'https://images.unsplash.com/photo-1455587734955-081b22074882?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800',
      'https://images.unsplash.com/photo-1522798514-97ceb8c4f1c8?w=800',
    ],
    amenities: ['Hồ bơi ngoài trời', 'Nhà hàng hải sản', 'Bar', 'Gym', 'WiFi miễn phí', 'Gần bãi biển'],
    rating: 4.5,
    reviewCount: 290,
    bookingCount: 530,
    featured: false,
    status: 'active',
  },
  {
    name: 'Mường Thanh Grand Sapa',
    slug: 'muong-thanh-grand-sapa',
    description:
      'Khách sạn 4 sao nằm ngay trung tâm thị trấn Sapa, tầm nhìn ra thung lũng Mường Hoa và đỉnh Fansipan hùng vĩ. Kiến trúc mang đậm bản sắc văn hóa vùng núi Tây Bắc.',
    location: 'Sapa, Lào Cai',
    address: 'Đường Fansipan, Thị trấn Sapa, Lào Cai',
    starRating: 4,
    price: 1200000,
    thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
    gallery: [
      'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
    ],
    amenities: ['Hồ bơi trong nhà', 'Spa', 'Nhà hàng', 'Bar', 'WiFi miễn phí', 'Bãi đỗ xe'],
    rating: 4.4,
    reviewCount: 145,
    bookingCount: 280,
    featured: false,
    status: 'active',
  },
];

// ─── ROOMS DATA (gắn theo index khách sạn) ───────────────────────────────────

const roomsPerHotel = [
  // Hotel 0 – Vinpearl Phú Quốc
  [
    {
      name: 'Phòng Deluxe Garden View',
      type: 'Deluxe',
      description: 'Phòng rộng 45m², ban công nhìn ra vườn nhiệt đới. Thiết kế sang trọng với nội thất gỗ teak, bồn tắm riêng và tiện nghi cao cấp.',
      price: 3500000,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      thumbnail: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      gallery: ['https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800'],
      amenities: ['Điều hòa', 'TV 55"', 'Minibar', 'Bồn tắm', 'Ban công', 'WiFi'],
      status: 'available',
    },
    {
      name: 'Phòng Deluxe Ocean View',
      type: 'Deluxe',
      description: 'Phòng 50m² với tầm nhìn trực diện ra Biển Đông. Nội thất hiện đại, giường King size, phòng tắm đứng và bồn tắm.',
      price: 4200000,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      thumbnail: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800',
      gallery: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'],
      amenities: ['Điều hòa', 'TV 65"', 'Minibar', 'Bồn tắm', 'Ban công biển', 'WiFi', 'Dép & Áo choàng tắm'],
      status: 'available',
    },
    {
      name: 'Suite Gia đình Hướng biển',
      type: 'Suite',
      description: 'Suite 90m² lý tưởng cho gia đình, gồm 2 phòng ngủ, phòng khách riêng và ban công lớn nhìn thẳng ra biển.',
      price: 8500000,
      maxGuests: 4,
      beds: 2,
      bathrooms: 2,
      thumbnail: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
      gallery: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'],
      amenities: ['Điều hòa', 'TV 75"', 'Minibar', 'Bồn tắm jacuzzi', 'Ban công biển lớn', 'WiFi', 'Butler service'],
      status: 'available',
    },
  ],
  // Hotel 1 – InterContinental Đà Nẵng
  [
    {
      name: 'Phòng Classic Pool View',
      type: 'Classic',
      description: 'Phòng 40m² view hồ bơi, thiết kế theo phong cách Indochine. Giường Queen size, vòi sen mưa và amenities cao cấp.',
      price: 3800000,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      thumbnail: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      gallery: ['https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800'],
      amenities: ['Điều hòa', 'TV', 'Minibar', 'Vòi sen mưa', 'WiFi'],
      status: 'available',
    },
    {
      name: 'Villa Hướng biển',
      type: 'Villa',
      description: 'Villa riêng 120m² với hồ bơi tràn bờ, sân hiên nhìn ra vịnh Đà Nẵng. Không gian sang trọng và riêng tư tuyệt đối.',
      price: 12000000,
      maxGuests: 3,
      beds: 1,
      bathrooms: 2,
      thumbnail: 'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800',
      gallery: ['https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800'],
      amenities: ['Hồ bơi riêng', 'Điều hòa', 'TV 65"', 'Minibar', 'Bồn tắm ngoài trời', 'Butler service', 'WiFi'],
      status: 'available',
    },
  ],
  // Hotel 2 – Lotte Hà Nội
  [
    {
      name: 'Phòng Superior City View',
      type: 'Superior',
      description: 'Phòng 38m² nhìn ra thành phố Hà Nội từ tầng cao. Thiết kế hiện đại, giường King size và tiện nghi đầy đủ.',
      price: 2500000,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      thumbnail: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      gallery: [],
      amenities: ['Điều hòa', 'TV', 'Minibar', 'WiFi', 'Két an toàn'],
      status: 'available',
    },
    {
      name: 'Phòng Deluxe',
      type: 'Deluxe',
      description: 'Phòng 45m² với nội thất cao cấp, khu vực làm việc rộng rãi và view thành phố từ tầng cao. Phù hợp khách công tác.',
      price: 3200000,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      thumbnail: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800',
      gallery: ['https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800'],
      amenities: ['Điều hòa', 'TV 55"', 'Minibar', 'Bàn làm việc', 'WiFi tốc độ cao', 'Két an toàn'],
      status: 'available',
    },
    {
      name: 'Executive Suite',
      type: 'Suite',
      description: 'Suite 75m² tầng Executive với phòng khách riêng, tủ quần áo walk-in và quyền sử dụng Executive Lounge.',
      price: 6500000,
      maxGuests: 2,
      beds: 1,
      bathrooms: 2,
      thumbnail: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800',
      gallery: ['https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=800'],
      amenities: ['Executive Lounge', 'Điều hòa', 'TV 65"', 'Minibar', 'Bồn tắm', 'WiFi', 'Butler service'],
      status: 'occupied',
    },
  ],
  // Hotel 3 – Novotel Nha Trang
  [
    {
      name: 'Phòng Standard',
      type: 'Standard',
      description: 'Phòng tiêu chuẩn 30m², cửa sổ nhìn ra thành phố, tiện nghi đầy đủ và thoải mái.',
      price: 1200000,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      thumbnail: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      gallery: [],
      amenities: ['Điều hòa', 'TV', 'WiFi', 'Minibar'],
      status: 'available',
    },
    {
      name: 'Phòng Deluxe Sea View',
      type: 'Deluxe',
      description: 'Phòng 38m² với ban công nhìn thẳng ra bãi biển Nha Trang. Giường King size, vòi sen và bồn tắm.',
      price: 2200000,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      thumbnail: 'https://images.unsplash.com/photo-1615460549969-36fa19521a4f?w=800',
      gallery: ['https://images.unsplash.com/photo-1582719508461-905c673771fd?w=800'],
      amenities: ['Điều hòa', 'TV 50"', 'Minibar', 'Bồn tắm', 'Ban công biển', 'WiFi'],
      status: 'available',
    },
  ],
  // Hotel 4 – Mường Thanh Sapa
  [
    {
      name: 'Phòng Standard Valley View',
      type: 'Standard',
      description: 'Phòng 32m² nhìn ra thung lũng Mường Hoa, trang trí mang phong cách dân tộc Tây Bắc, ấm cúng và gần gũi thiên nhiên.',
      price: 900000,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      thumbnail: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800',
      gallery: [],
      amenities: ['Điều hòa', 'TV', 'WiFi', 'Minibar'],
      status: 'available',
    },
    {
      name: 'Phòng Deluxe Fansipan View',
      type: 'Deluxe',
      description: 'Phòng 42m² với ban công rộng nhìn thẳng vào đỉnh Fansipan. Thiết kế gỗ ấm áp, giường King size.',
      price: 1500000,
      maxGuests: 2,
      beds: 1,
      bathrooms: 1,
      thumbnail: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800',
      gallery: ['https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800'],
      amenities: ['Điều hòa', 'TV', 'Minibar', 'Ban công núi', 'WiFi'],
      status: 'maintenance',
    },
  ],
];

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('\n🧹 Dọn dẹp dữ liệu cũ...');
  await prisma.hotelImage.deleteMany();
  await prisma.roomImage.deleteMany();
  await prisma.room.deleteMany();
  await prisma.hotel.deleteMany();
  console.log('✅ Đã xóa sạch dữ liệu cũ.\n');

  console.log('🏨 Tạo dữ liệu khách sạn...');

  for (let i = 0; i < hotelsData.length; i++) {
    const hotelData = hotelsData[i];

    // Tạo hotel
    const hotel = await prisma.hotel.create({ data: hotelData });
    console.log(`  ✔ Khách sạn: ${hotel.name} (ID: ${hotel.id})`);

    // Tạo hotel images
    const hotelImages = [
      { hotelId: hotel.id, imageUrl: hotel.thumbnail, type: 'thumbnail' },
      ...hotel.gallery.map((url) => ({ hotelId: hotel.id, imageUrl: url, type: 'gallery' })),
    ];
    await prisma.hotelImage.createMany({ data: hotelImages });
    console.log(`     └─ ${hotelImages.length} hotel image(s)`);

    // Tạo rooms
    const rooms = roomsPerHotel[i];
    for (const roomData of rooms) {
      const room = await prisma.room.create({
        data: { ...roomData, hotelId: hotel.id },
      });

      // Tạo room images
      const roomImages = [
        { roomId: room.id, imageUrl: room.thumbnail, type: 'thumbnail' },
        ...room.gallery.map((url) => ({ roomId: room.id, imageUrl: url, type: 'gallery' })),
      ];
      await prisma.roomImage.createMany({ data: roomImages });
      console.log(`     └─ Phòng: ${room.name} (ID: ${room.id}) — ${roomImages.length} image(s)`);
    }
  }

  console.log('\n🎉 Hoàn thành seed dữ liệu!');
  console.log(`   Hotels: ${hotelsData.length}`);
  console.log(`   Rooms : ${roomsPerHotel.flat().length}`);
}

main()
  .catch((e) => {
    console.error('❌ Lỗi seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
