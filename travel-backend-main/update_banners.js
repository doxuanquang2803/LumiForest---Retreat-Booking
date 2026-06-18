require('dotenv').config();
const prisma = require('./src/config/prismaClient');

async function update() {
  try {
    const bannersSetting = await prisma.systemSetting.findUnique({ where: { key: 'banners' } });
    if (bannersSetting) {
      let banners;
      try {
        banners = JSON.parse(bannersSetting.value);
      } catch (e) {
        console.error('Failed to parse banners:', e);
        return;
      }
      
      console.log('Current banners:', JSON.stringify(banners));
      let updated = false;
      for (let b of banners) {
        if (b.sub === 'Hotels & Resorts' || b.sub === 'Khách sạn & Khu nghỉ dưỡng') {
          b.sub = 'Retreat & Booking';
          updated = true;
        }
      }
      if (updated) {
        await prisma.systemSetting.update({
          where: { key: 'banners' },
          data: { value: JSON.stringify(banners) }
        });
        console.log('Banners updated successfully.');
      } else {
        console.log('No banner needed updating.');
      }
    } else {
      console.log('No banners setting found.');
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}
update();
