// 1. IMPORT CẤU HÌNH & GIAO DIỆN
import { STATE, sb } from './config.js';
import { api_checkSession, api_loadShopsAndLock, api_login, api_signup, api_logout } from './api.js';

// Giao diện S.O
import { entryHTML } from './views/view-entry.js';
import { historyHTML } from './views/view-history.js'; 

// Giao diện S.I (Dành cho Sale)
import { entrySiHTML } from './views/view-entry-si.js';
import { historySiHTML } from './views/view-history-si.js';

// Giao diện Admin & Thi Đua
import { sellinHTML } from './views/view-sellin.js'; 
import { competitionHTML } from './views/view-competition.js';

import './sellout.js';
import './sellin.js';
import './sale-si.js'; // <-- ĐÃ FIX: Import file logic S.I

window.STATE = STATE;
window.sb = sb; 

// ==========================================
// HÀM CHUYỂN TAB S.O (MÀU CAM)
// ==========================================
window.switchSelloutTab = (tab) => {
    const btnEntry = document.getElementById('tab-btn-entry');
    const btnHistory = document.getElementById('tab-btn-history');
    const contentEntry = document.getElementById('tab-content-entry');
    const contentHistory = document.getElementById('tab-content-history');

    if (!btnEntry || !contentEntry) return;

    if (tab === 'entry') {
        contentEntry.classList.remove('hidden'); contentHistory.classList.add('hidden');
        btnEntry.className = "flex-1 py-3.5 text-sm font-black text-orange-600 border-b-[3px] border-orange-600 bg-orange-50/50 transition-all flex items-center justify-center gap-2";
        btnHistory.className = "flex-1 py-3.5 text-sm font-bold text-gray-400 hover:text-orange-500 hover:bg-gray-50 border-b-[3px] border-transparent transition-all flex items-center justify-center gap-2";
    } else {
        contentEntry.classList.add('hidden'); contentHistory.classList.remove('hidden');
        btnHistory.className = "flex-1 py-3.5 text-sm font-black text-orange-600 border-b-[3px] border-orange-600 bg-orange-50/50 transition-all flex items-center justify-center gap-2";
        btnEntry.className = "flex-1 py-3.5 text-sm font-bold text-gray-400 hover:text-orange-500 hover:bg-gray-50 border-b-[3px] border-transparent transition-all flex items-center justify-center gap-2";
        if (typeof window.loadHistoryData === 'function') window.loadHistoryData();
    }
};

// ==========================================
// HÀM CHUYỂN TAB S.I SALE (MÀU XANH)
// ==========================================
window.switchSaleSiTab = (tab) => {
    const btnEntrySI = document.getElementById('tab-btn-entry-sale-si');
    const btnHistorySI = document.getElementById('tab-btn-history-sale-si');
    const contentEntrySI = document.getElementById('tab-content-entry-sale-si');
    const contentHistorySI = document.getElementById('tab-content-history-sale-si');

    if (!btnEntrySI || !contentEntrySI) return;

    if (tab === 'entry') {
        contentEntrySI.classList.remove('hidden'); contentHistorySI.classList.add('hidden');
        btnEntrySI.className = "flex-1 py-3.5 text-sm font-black text-blue-600 border-b-[3px] border-blue-600 bg-blue-50/50 transition-all flex items-center justify-center gap-2";
        btnHistorySI.className = "flex-1 py-3.5 text-sm font-bold text-gray-400 hover:text-blue-500 hover:bg-gray-50 border-b-[3px] border-transparent transition-all flex items-center justify-center gap-2";
    } else {
        contentEntrySI.classList.add('hidden'); contentHistorySI.classList.remove('hidden');
        btnHistorySI.className = "flex-1 py-3.5 text-sm font-black text-blue-600 border-b-[3px] border-blue-600 bg-blue-50/50 transition-all flex items-center justify-center gap-2";
        btnEntrySI.className = "flex-1 py-3.5 text-sm font-bold text-gray-400 hover:text-blue-500 hover:bg-gray-50 border-b-[3px] border-transparent transition-all flex items-center justify-center gap-2";
        if (typeof window.loadHistorySIData === 'function') window.loadHistorySIData();
    }
};

// ==========================================
// 3. CẤU HÌNH ROUTER (CHUYỂN TRANG)
// ==========================================
const viewMap = {
    'sellout': `
        <div class="w-full bg-white border-b border-gray-200 sticky top-0 z-[45] shadow-sm">
            <div class="flex max-w-5xl mx-auto">
                <button onclick="window.switchSelloutTab('entry')" id="tab-btn-entry" class="flex-1 py-3.5 text-sm font-black text-orange-600 border-b-[3px] border-orange-600 bg-orange-50/50 transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-pen-to-square"></i> NHẬP LIỆU SELLOUT
                </button>
                <button onclick="window.switchSelloutTab('history')" id="tab-btn-history" class="flex-1 py-3.5 text-sm font-bold text-gray-400 hover:text-orange-500 hover:bg-gray-50 border-b-[3px] border-transparent transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-table-cells"></i> MA TRẬN LỊCH SỬ S.O
                </button>
            </div>
        </div>
        <div id="tab-content-entry" class="block w-full h-full pb-10">${entryHTML}</div>
        <div id="tab-content-history" class="hidden w-full h-full pb-10">${historyHTML}</div>
    `,
    'sale_si': `
        <div class="w-full bg-white border-b border-gray-200 sticky top-0 z-[45] shadow-sm">
            <div class="flex max-w-5xl mx-auto">
                <button onclick="window.switchSaleSiTab('entry')" id="tab-btn-entry-sale-si" class="flex-1 py-3.5 text-sm font-black text-blue-600 border-b-[3px] border-blue-600 bg-blue-50/50 transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-box-open"></i> NHẬP LIỆU SELLIN
                </button>
                <button onclick="window.switchSaleSiTab('history')" id="tab-btn-history-sale-si" class="flex-1 py-3.5 text-sm font-bold text-gray-400 hover:text-blue-500 hover:bg-gray-50 border-b-[3px] border-transparent transition-all flex items-center justify-center gap-2">
                    <i class="fa-solid fa-table-cells"></i> MA TRẬN LỊCH SỬ S.I
                </button>
            </div>
        </div>
        <div id="tab-content-entry-sale-si" class="block w-full h-full pb-10">${entrySiHTML}</div>
        <div id="tab-content-history-sale-si" class="hidden w-full h-full pb-10">${historySiHTML}</div>
    `,
    'sellin': sellinHTML, 
    'leaderboard': competitionHTML,
    'game01': '<div class="p-8 text-center text-gray-500 font-bold mt-10">Tính năng Game đang phát triển...</div>',
    'game02': '<div class="p-8 text-center text-gray-500 font-bold mt-10">Tính năng Game đang phát triển...</div>',
    'game03': '<div class="p-8 text-center text-gray-500 font-bold mt-10">Tính năng Game đang phát triển...</div>',
    'fund': '<div class="p-8 text-center text-gray-500 font-bold mt-10">Tính năng Quỹ đang phát triển...</div>',
    'reward': '<div class="p-8 text-center text-gray-500 font-bold mt-10">Lịch sử thưởng đang phát triển...</div>'
};

window.switchView = (viewId) => {
    const appContent = document.getElementById('app-content');
    
    if (viewMap[viewId]) { appContent.innerHTML = viewMap[viewId]; } 
    else { appContent.innerHTML = ''; }

    if (viewId === 'dashboard' && typeof window.renderDashboardView === 'function') {
        window.renderDashboardView();
    }

    // Khởi tạo tab S.O
    if (viewId === 'sellout' && window.STATE?.currentUser) {
        if(document.getElementById('tab-btn-entry')) window.switchSelloutTab('entry');
        const saleNameEl = document.getElementById('display_sale_name');
        if (saleNameEl) saleNameEl.innerText = window.STATE.currentUser.full_name || 'NVKD Thị Trường';
        const dateInput = document.getElementById('so_daily_date');
        if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];

        setTimeout(() => {
            const histMonthInput = document.querySelector('#tab-content-history input[type="month"]');
            if (histMonthInput && !histMonthInput.value) {
                const d = new Date();
                histMonthInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            }
            if (typeof window.loadHistoryData === 'function') {
                window.updateHistoryFilters('init'); window.loadHistoryData();
            }
        }, 50);
    }

    // Khởi tạo tab S.I Sale
    if (viewId === 'sale_si' && window.STATE?.currentUser) {
        if(document.getElementById('tab-btn-entry-sale-si')) window.switchSaleSiTab('entry');
        const saleNameEl = document.getElementById('display_sale_name_si');
        if (saleNameEl) saleNameEl.innerText = window.STATE.currentUser.full_name || 'NVKD Thị Trường';
        const dateInput = document.getElementById('si_daily_date');
        if (dateInput && !dateInput.value) dateInput.value = new Date().toISOString().split('T')[0];

        setTimeout(() => {
            const histMonthInput = document.getElementById('filter_month_si');
            if (histMonthInput && !histMonthInput.value) {
                const d = new Date();
                histMonthInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            }
            
            // --- ĐÃ FIX: Mồi dữ liệu và bộ lọc khi mở tab ---
            if (typeof window.updateHistorySIFilters === 'function') window.updateHistorySIFilters('init');
            if (typeof window.loadHistorySIData === 'function') window.loadHistorySIData();
        }, 50);
    }

    // Khởi tạo S.I Admin
    if (viewId === 'sellin' && typeof window.renderSellInView === 'function') {
        window.renderSellInView();
    }

    // Highlight Menu Trái
    const allNavs = ['nav-dashboard', 'nav-sellout', 'nav-sale_si', 'nav-sellin', 'nav-game01', 'nav-game02', 'nav-game03', 'nav-fund', 'nav-leaderboard', 'nav-reward'];
    allNavs.forEach(n => {
        const el = document.getElementById(n);
        if(el) {
            el.classList.remove('active');
            if(n === 'nav-dashboard') el.classList.remove('bg-[#F97316]', 'text-white');
        }
    });
    
    const targetNav = document.getElementById(`nav-${viewId}`);
    if (targetNav) {
        targetNav.classList.add('active');
        if(viewId === 'dashboard') targetNav.classList.add('bg-[#F97316]', 'text-white');
    }

    if (window.innerWidth < 768 && typeof window.toggleSidebar === 'function') window.toggleSidebar();
    if (viewId === 'leaderboard' && typeof window.loadCompetitionData === 'function') window.loadCompetitionData();
};

window.toggleSidebar = () => { 
    const sidebar = document.getElementById('sidebarMobile');
    if(sidebar) sidebar.classList.toggle('-translate-x-full'); 
};

// ==========================================
// 4. KHỞI TẠO VÀ XÁC THỰC (AUTH)
// ==========================================
async function init() {
    try {
        const profile = await api_checkSession();
        if (!profile) {
            document.getElementById('authContainer').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
            return;
        }

        STATE.currentUser = profile;
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('flex');
        
        if(document.getElementById('userDisplay')) document.getElementById('userDisplay').innerText = profile.full_name || "NVKD";
        if(document.getElementById('roleDisplay')) document.getElementById('roleDisplay').innerText = profile.role || "SALE";

        if (typeof api_loadShopsAndLock === 'function') await api_loadShopsAndLock(profile);
        window.switchView('dashboard'); 

    } catch (err) { 
        alert("Có lỗi khi tải ứng dụng. Vui lòng F5."); 
    }
}

document.getElementById('goSignup')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginFormSection').classList.add('hidden');
    document.getElementById('signupFormSection').classList.remove('hidden');
});

document.getElementById('goLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupFormSection').classList.add('hidden');
    document.getElementById('loginFormSection').classList.remove('hidden');
});

if (document.getElementById('btnLogin')) {
    document.getElementById('btnLogin').onclick = async () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const msg = document.getElementById('msg');
        if (!email || !password) { msg.innerText = "Nhập Email và Mật khẩu!"; return; }
        try {
            msg.innerText = "Đang xử lý...";
            await api_login(email, password);
            msg.innerText = "Thành công! Đang tải dữ liệu...";
            await init(); 
        } catch (err) { msg.innerText = "Đăng nhập thất bại: " + err.message; }
    };
}

if (document.getElementById('btnSignup')) {
    document.getElementById('btnSignup').onclick = async () => {
        const name = document.getElementById('reg_name').value.trim();
        const email = document.getElementById('reg_email').value.trim();
        const password = document.getElementById('reg_pass').value.trim();
        const role = document.getElementById('reg_role').value;
        const msg = document.getElementById('msg');

        if (!name || !email || !password) { msg.innerText = "Nhập đầy đủ thông tin!"; return; }
        try {
            msg.innerText = "Đang tạo tài khoản...";
            await api_signup(email, password, role, name);
            msg.innerText = "Đăng ký thành công! Chuyển về Đăng nhập...";
            setTimeout(() => {
                document.getElementById('signupFormSection').classList.add('hidden');
                document.getElementById('loginFormSection').classList.remove('hidden');
                document.getElementById('email').value = email; 
            }, 1500);
        } catch (err) { msg.innerText = "Đăng ký thất bại: " + err.message; }
    };
}

if(document.getElementById('btnLogout')) document.getElementById('btnLogout').onclick = api_logout;