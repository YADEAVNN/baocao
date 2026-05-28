import { CONFIG } from '../config.js';

// Khởi tạo thực thể Supabase toàn cục kết nối DB
export const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);