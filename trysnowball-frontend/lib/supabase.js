import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_KEY;

console.log('🟠 REACT_APP_SUPABASE_URL:', supabaseUrl);
console.log('🟠 REACT_APP_SUPABASE_KEY:', supabaseKey);

export const supabase = createClient(supabaseUrl, supabaseKey);

console.log('🟢 supabase client:', supabase);