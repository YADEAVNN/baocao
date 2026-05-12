import { CONFIG } from '../config.js';

// Khởi tạo Supabase client
export const sb = window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);