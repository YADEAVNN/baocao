import { $, toggleModal } from './core/utils.js';
import { sb } from './core/supabase.js';

// Import các Modules chiến thuật
import * as Dashboard from './modules/dashboard.js';
import * as Analytics from './modules/analytics.js';
import * as Admin from './modules/admin.js';

// THÊM IMPORT CHO MODULE MỚI
import * as DailyInput from './modules/dailyInput.js';

window.globalAdminShopMap = {}; 
window.currentUserProfile = null; 

async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { 
        $('loginSection').classList.remove('hidden'); 
        return; 
    }
    
    let profile = null;

    if (session.user.email === 'vuhuythanh271092@gmail.com') {
        profile = { full_name: 'A Thành (Admin)', role: 'Admin', is_approved: true };
    } else {
        const { data, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
        if (!error) profile = data;
    }
    
    if (!profile || !profile.is_approved) { 
        await sb.auth.signOut(); 
        alert("⛔ TÀI KHOẢN CHƯA ĐƯỢC PHÊ DUYỆT HOẶC ĐANG BỊ KHÓA!\nVui lòng liên hệ bộ phận Admin Tổng để xử lý kích hoạt.");
        $('loginSection').classList.remove('hidden'); 
        if($('loginMsg')) $('loginMsg').innerText = "Truy cập bị từ chối!";
        return;
    }
    
    window.currentUserProfile = profile;
    if ($('sidebarName')) $('sidebarName').innerText = profile.full_name || "Quản trị viên";
    $('loginSection').classList.add('hidden'); 
    $('mainApp').classList.remove('hidden');
    
    await loadAllShops(); 
    setupViewRestrictionsByRole(profile.role);
    
    Dashboard.initDateFilters(); 
    Dashboard.loadDashboardSO(); 
    Admin.initAdminEvents();
    
    const today = new Date().toISOString().split('T')[0];
    if($('pacing_date')) $('pacing_date').value = today;
    if($('di_date')) $('di_date').value = today; 

    if (window.innerWidth < 768) {
        $('sidebar').classList.add('-translate-x-full');
    }
}

function setupViewRestrictionsByRole(role) {
    const adminConfigurationTabs = ['tab-users', 'tab-targets', 'tab-pricing', 'tab-master'];
    if (role === 'Admin') {
        adminConfigurationTabs.forEach(id => { if($(id)) $(id).classList.remove('hidden'); });
    } else {
        adminConfigurationTabs.forEach(id => { if($(id)) $(id).classList.add('hidden'); });
    }
}

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
    sidebarEl.classList.toggle('-translate-x-full');
}

window.switchTab = (tab) => { 
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active')); 
    
    const views = ['view-dashboard','view-users','view-master','view-pricing', 'view-analytics-full', 'view-targets', 'view-pacing', 'view-daily-input'];
    views.forEach(id => {
        if($(id)) $(id).classList.add('hidden');
    });

    if($(`tab-${tab}`)) $(`tab-${tab}`).classList.add('active'); 
    if($(`view-${tab}`)) $(`view-${tab}`).classList.remove('hidden'); 
    
    if(window.innerWidth < 768) { window.toggleSidebar(); }

    if(tab === 'dashboard') Dashboard.loadDashboardSO();
    if(tab === 'daily-input') DailyInput.loadDailyInputData(); 
    if(tab === 'pacing') Dashboard.loadPacingReport();
    if(tab === 'pricing') Admin.loadPriceHistory();
    if(tab === 'users') Admin.loadUsers(); 
    if(tab === 'master') Admin.loadMasterData();
    if(tab === 'analytics-full') {
        Analytics.initFilterChain();
        if (!$('ana_month').value) {
            const d = new Date();
            $('ana_month').value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        }
    }
    if(tab === 'targets') {
        Admin.loadTargets().then(() => Admin.initTargetFilters());
    }
}

// --- BINDING WINDOW SYSTEM ---
window.toggleModal = toggleModal;
window.loadDashboardSO = Dashboard.loadDashboardSO;
window.openDetailModal = Dashboard.openDetailModal;
window.loadPacingReport = Dashboard.loadPacingReport;
window.exportPacingExcel = Dashboard.exportPacingExcel;
window.updateDashboardFilterChain = Dashboard.updateDashboardFilterChain;
window.resetDashboardFilters = Dashboard.resetDashboardFilters;
window.exportDashboardExcel = Dashboard.exportDashboardExcel;

window.updatePacingFilterChain = Dashboard.updatePacingFilterChain;
window.resetPacingFilters = Dashboard.resetPacingFilters;
window.renderPacingTableFiltered = Dashboard.renderPacingTableFiltered;

window.loadAnalyticsFull = Analytics.loadAnalyticsFull;
window.updateFilterChain = Analytics.updateFilterChain;
window.resetFilters = Analytics.resetFilters;
window.exportAnalyticsExcel = Analytics.exportAnalyticsExcel;

// KẾT NỐI HÀM CẢNH BÁO ZALO MỚI VÀO WINDOW
window.showMissingReports = Analytics.showMissingReports;
window.copyMissingReports = Analytics.copyMissingReports;

window.loadUsers = Admin.loadUsers;
window.openUserEdit = Admin.openUserEdit;
window.submitUserEdit = Admin.submitUserEdit;
window.toggleApprove = Admin.toggleApprove;
window.deleteUser = Admin.deleteUser;
window.resetUserPassword = Admin.resetUserPassword;
window.renderUserTableFiltered = Admin.renderUserTableFiltered;

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
window.exportTargetExcel = Admin.exportTargetExcel; // GẮN KẾT NỐI EXCEL TARGET VÀO WINDOW

window.loadDailyInputData = DailyInput.loadDailyInputData;
window.renderDailyInputTableFiltered = DailyInput.renderDailyInputTableFiltered;
window.exportDailyInputExcel = DailyInput.exportDailyInputExcel; 

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

init();