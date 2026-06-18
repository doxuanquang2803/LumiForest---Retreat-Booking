const { z } = require('zod');

const createHotelBody = z.object({
  name: z.string({ required_error: 'Tên khách sạn không được để trống' }).min(3).max(150),
  thumbnail: z.string({ required_error: 'Ảnh thumbnail không được để trống' }).min(1),
});

const updateHotelBody = createHotelBody.partial();

async function test() {
  try {
    await updateHotelBody.parseAsync({ name: 'Hello' });
    console.log('Valid update with missing thumbnail!');
    
    // Test what happens if we pass undefined
    await updateHotelBody.parseAsync({ name: 'Hello', thumbnail: undefined });
    console.log('Valid update with undefined thumbnail!');

    // Test what happens if we pass null
    await updateHotelBody.parseAsync({ name: 'Hello', thumbnail: null });
  } catch (e) {
    console.error('Validation error:', JSON.stringify(e.issues || e.errors, null, 2));
  }
}

test();
