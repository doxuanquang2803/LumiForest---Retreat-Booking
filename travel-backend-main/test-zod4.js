const { z } = require('zod');
const createHotelBody = z.object({
  name: z.string({ required_error: 'Tên khách sạn không được để trống' }).min(3).max(150),
  thumbnail: z.string({ required_error: 'Ảnh thumbnail không được để trống' }).min(1),
});
const updateHotelBody = createHotelBody.partial();
try {
  updateHotelBody.parse({});
  console.log('Update parse empty OK');
} catch (e) {
  console.log('Update error:', e.issues);
}
