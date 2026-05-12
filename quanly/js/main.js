import { $, toggleModal } from './core/utils.js';
import { sb } from './core/supabase.js';

// Import các Modules chức năng
import * as Dashboard from './modules/dashboard.js';
import * as Analytics from './modules/analytics.js';
import * as Admin from './modules/admin.js';

// Khởi tạo bản đồ cửa hàng toàn cục cho Admin portal
window.globalAdminShopMap = {}; 

async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { 
        $('loginSection').classList.remove('hidden'); 
        return; 
    }
    
    let profile = null;

    // Lấy thông tin user
    if (session.user.email === 'vuhuythanh271092@gmail.com') {
        profile = { full_name: 'A Thành (Admin)', role: 'Admin' };
    } else {
        const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
        if (!error) profile = data;
    }
    
    // NẾU KHÔNG CÓ PROFILE HOẶC ROLE KHÔNG PHẢI LÀ 'Admin' THÌ ĐÁ RA NGOÀI NGAY LẬP TỨC
    if (!profile || profile.role !== 'Admin') { 
        await sb.auth.signOut(); 
        alert("⛔ TRUY CẬP BỊ TỪ CHỐI!\nCổng này chỉ dành riêng cho quyền Admin quản trị cấp cao. Tài khoản Sale/Giám đốc vui lòng đăng nhập ở hệ thống khác.");
        $('loginSection').classList.remove('hidden'); 
        if($('loginMsg')) $('loginMsg').innerText = "Tài khoản không có quyền truy cập!";
        return;
    }
    
    // Hiển thị thông tin người dùng lên Sidebar
    if ($('sidebarName')) $('sidebarName').innerText = profile.full_name || "Admin";
    $('loginSection').classList.add('hidden'); 
    $('mainApp').classList.remove('hidden');
    
    // Tải dữ liệu danh mục cửa hàng ngay từ đầu để phục vụ bộ lọc
    await loadAllShops(); 
    
    // Khởi tạo các trạng thái mặc định cho Dashboard
    Dashboard.initDateFilters(); 
    Dashboard.loadDashboardSO(); 
    Admin.initAdminEvents();
    
    // Mặc định ngày cho báo cáo tiến độ là hôm nay
    const today = new Date().toISOString().split('T')[0];
    if($('pacing_date')) $('pacing_date').value = today;

    // Ẩn sidebar trên mobile sau khi load
    if (window.innerWidth < 768) {
        $('sidebar').classList.add('-translate-x-full');
    }
}

// Hàm tải toàn bộ danh sách shop vào bộ nhớ đệm
async function loadAllShops() { 
    const { data } = await sb.from('master_shop_list').select('*');
    if(data) { 
        data.forEach(s => { 
            window.globalAdminShopMap[s.shop_code] = s; 
        }); 
    } 
}

window.toggleSidebar = () => {
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl.classList.contains('-translate-x-full')) {
        sidebarEl.classList.remove('-translate-x-full');
    } else {
        sidebarEl.classList.add('-translate-x-full');
    }
}

// Logic chuyển đổi giữa các Tab chức năng
window.switchTab = (tab) => { 
    // Reset trạng thái menu
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active')); 
    
    // Ẩn tất cả các view hiện có
    const views = ['view-dashboard','view-users','view-master','view-pricing', 'view-analytics-full', 'view-targets', 'view-pacing'];
    views.forEach(id => {
        if($(id)) $(id).classList.add('hidden');
    });

    // Kích hoạt tab và view tương ứng
    if($(`tab-${tab}`)) $(`tab-${tab}`).classList.add('active'); 
    if($(`view-${tab}`)) $(`view-${tab}`).classList.remove('hidden'); 
    
    if(window.innerWidth < 768) { window.toggleSidebar(); }

    // Gọi hàm load dữ liệu đặc thù cho từng tab
    if(tab === 'dashboard') Dashboard.loadDashboardSO();
    if(tab === 'pacing') Dashboard.loadPacingReport();
    if(tab === 'pricing') Admin.loadPriceHistory();
    if(tab === 'users') Admin.loadUsers(); 
    if(tab === 'master') Admin.loadMasterData();
    if(tab === 'analytics-full') {
        Analytics.initFilterChain();
        // Tự động gán tháng hiện tại cho tab Tiến độ nếu chưa có
        if (!$('ana_month').value) {
            const d = new Date();
            $('ana_month').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
    }
    if(tab === 'targets') {
        Admin.loadTargets().then(() => Admin.initTargetFilters());
    }
}

// --- ĐĂNG KÝ CÁC HÀM TOÀN CỤC CHO GIAO DIỆN (BINDING) ---

window.toggleModal = toggleModal;

window.loadDashboardSO = Dashboard.loadDashboardSO;
window.openDetailModal = Dashboard.openDetailModal;
window.loadPacingReport = Dashboard.loadPacingReport;
window.exportPacingExcel = Dashboard.exportPacingExcel;
window.updateDashboardFilterChain = Dashboard.updateDashboardFilterChain;
window.resetDashboardFilters = Dashboard.resetDashboardFilters;
window.exportDashboardExcel = Dashboard.exportDashboardExcel;

window.loadAnalyticsFull = Analytics.loadAnalyticsFull;
window.updateFilterChain = Analytics.updateFilterChain;
window.resetFilters = Analytics.resetFilters;
window.exportAnalyticsExcel = Analytics.exportAnalyticsExcel;

window.loadUsers = Admin.loadUsers;
window.openUserEdit = Admin.openUserEdit;
window.submitUserEdit = Admin.submitUserEdit;
window.toggleApprove = Admin.toggleApprove;
window.deleteUser = Admin.deleteUser;
window.resetUserPassword = Admin.resetUserPassword; // <--- KHAI BÁO HÀM ĐỔI MẬT KHẨU

window.loadMasterData = Admin.loadMasterData;
window.openShopEdit = Admin.openShopEdit;
window.submitShopEdit = Admin.submitShopEdit;
window.deleteShop = Admin.deleteShop;
window.loadPriceHistory = Admin.loadPriceHistory;
window.openPriceEdit = Admin.openPriceEdit;
window.submitPriceEdit = Admin.submitPriceEdit;
window.deletePrice = Admin.deletePrice;
window.exportMasterData = Admin.exportMasterData;
window.exportPriceData = Admin.exportPriceData;

window.loadTargets = Admin.loadTargets;
window.updateTargetFilterChain = Admin.updateTargetFilterChain;
window.resetTargetFilters = Admin.resetTargetFilters;
window.saveAllTargets = Admin.saveAllTargets;
window.updateLocalTarget = Admin.updateLocalTarget;

// Xử lý sự kiện Đăng nhập/Đăng xuất
if ($('btnLogin')) {
    $('btnLogin').onclick = async () => { 
        $('loginMsg').innerText = "Đang kiểm tra...";
        const { error } = await sb.auth.signInWithPassword({ 
            email: $('adm_email').value, 
            password: $('adm_pass').value 
        });
        if(error) {
            $('loginMsg').innerText = "Sai thông tin đăng nhập!"; 
        } else {
            init(); 
        }
    };
}

if ($('btnLogout')) {
    $('btnLogout').onclick = async () => { 
        await sb.auth.signOut(); 
        location.reload(); 
    };
}

// Chạy khởi tạo hệ thống
init();