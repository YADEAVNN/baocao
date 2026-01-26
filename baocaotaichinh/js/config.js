// js/config.js
export const SUPABASE_URL = "https://esbukwnoaimkapinaevt.supabase.co";
export const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVzYnVrd25vYWlta2FwaW5hZXZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgyMDUzMTMsImV4cCI6MjA4Mzc4MTMxM30.QrRHVA6q-dz114CjkK64FP2ANLSwNnu6IaKC3dlBCWg";

export const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// State Management (Thay thế cho các biến toàn cục rải rác)
export const STATE = {
    currentUser: null,
    globalShopMap: {},
    globalAssignedShops: [], // Danh sách shop được phân quyền
    assignedShopCodes: [],
    currentAdminPrices: [],  // Bảng giá admin tháng hiện tại
    cachedDirectorData: [],  // Dữ liệu báo cáo để xuất Excel
    chartInstances: {},      // Lưu các biểu đồ để destroy khi vẽ lại
    submittedShops: new Set() // 🔥 MỚI: Lưu danh sách shop đã nộp báo cáo tháng này
};
