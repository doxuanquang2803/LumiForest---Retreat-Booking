const { z } = require('zod');

const schema = z.object({
  thumbnail: z.string().min(1),
});

try {
  schema.parse({});
} catch (e) {
  console.log(e.issues);
}
