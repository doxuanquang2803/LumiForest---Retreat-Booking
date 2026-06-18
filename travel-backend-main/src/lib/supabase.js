const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn('Cảnh báo: SUPABASE_URL hoặc SUPABASE_SERVICE_KEY chưa được cấu hình trong .env');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

module.exports = supabase;
