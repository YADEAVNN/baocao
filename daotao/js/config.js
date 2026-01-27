// js/config.js

// 1. Cấu hình Firebase
export const firebaseConfig = {
    apiKey: "AIzaSyCJj_0-dVddgNBwPsm662guADskM5N9Q6I",
    authDomain: "e-learning-8d182.firebaseapp.com",
    projectId: "e-learning-8d182",
    storageBucket: "e-learning-8d182.firebasestorage.app",
    messagingSenderId: "1008025386680",
    appId: "1:1008025386680:web:5c91aa14e056e4578b7e4d",
    measurementId: "G-L6P2B51170"
};

// 2. Cấu hình Màu sắc & Danh mục bài học
export const categoryConfig = {
    'product': { label: 'Kiến thức Sản phẩm', color: 'bg-blue-50 text-blue-700 border-blue-200' },
    'skill':   { label: 'Kỹ năng Bán hàng',   color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'culture': { label: 'Văn hóa & Quy định', color: 'bg-purple-50 text-purple-700 border-purple-200' },
    'video':   { label: 'Video Đào tạo',      color: 'bg-red-50 text-red-700 border-red-200' },
    'default': { label: 'Khác',               color: 'bg-gray-50 text-gray-600 border-gray-200' }
};

// 3. Danh sách Giải thưởng Vòng quay may mắn
// Bạn có thể thêm/bớt giải thưởng tại đây mà không ảnh hưởng logic quay
export const prizes = [
    { label: "Voucher\n500K", icon: "fa-ticket", chance: 10, color: "#ffffff", text: "#ef4444" },
    { label: "Pin Sạc\nDự Phòng", icon: "fa-battery-full", chance: 25, color: "#ef4444", text: "#ffffff" },
    { label: "Mũ\nBảo Hiểm", icon: "fa-helmet-safety", chance: 25, color: "#ffffff", text: "#ef4444" },
    { label: "Xe Điện\nYADEA i8", icon: "fa-motorcycle", chance: 10, color: "#ef4444", text: "#ffffff" },
    { label: "Quạt\nCầm Tay", icon: "fa-fan", chance: 25, color: "#ffffff", text: "#ef4444" },
    { label: "Voucher\nDu Lịch", icon: "fa-plane", chance: 5, color: "#ef4444", text: "#ffffff" }
];

// 4. Danh sách các ID View (để quản lý chuyển trang)
export const listViews = ['heroSection', 'listView', 'detailView', 'resultView', 'luckyWheelView', 'quizSectionContainer', 'myGiftsView'];