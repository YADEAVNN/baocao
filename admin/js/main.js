import { $, toggleModal } from './core/utils.js';
import { sb } from './core/supabase.js';

// Import Modules
import * as Dashboard from './modules/dashboard.js';
import * as Analytics from './modules/analytics.js';
import * as Map3D from './modules/map3d.js';
import * as Admin from './modules/admin.js';

// Initialize Global State
window.globalAdminShopMap = {}; 

async function init() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { $('loginSection').classList.remove('hidden'); return; }
    
    const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    if (!profile || (profile.role !== 'Admin' && profile.role !== 'Giám Đốc')) { 
        await sb.auth.signOut(); $('loginSection').classList.remove('hidden'); return;
    }
    
    $('sidebarName').innerText = profile.full_name || "Admin";
    $('loginSection').classList.add('hidden'); 
    $('mainApp').classList.remove('hidden');
    
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    $('f_month').value = currentMonth; 
    $('ana_month').value = currentMonth;
    
    await loadAllShops(); 
    
    // Init Modules
    Dashboard.initDashFilters();
    Dashboard.loadDashboard();
    Admin.initAdminEvents();
    
    // Setup Sidebar Toggle for Mobile
    $('sidebar').classList.add('-translate-x-full'); // Default hide on mobile load
}

async function loadAllShops() { 
    const { data } = await sb.from('master_shop_list').select('*');
    if(data) { data.forEach(s => { window.globalAdminShopMap[s.shop_code] = s; }); } 
}

// --- GLOBAL EVENT BINDING ---
window.toggleSidebar = () => {
    const sb = document.getElementById('sidebar');
    if (sb.classList.contains('-translate-x-full')) {
        sb.classList.remove('-translate-x-full');
    } else {
        sb.classList.add('-translate-x-full');
    }
}

window.switchTab = (tab) => { 
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('active')); 
    
    ['view-dashboard','view-users','view-master','view-pricing', 'view-analytics-full', 'view-heatmap'].forEach(id => {
        if($(id)) $(id).classList.add('hidden');
    });

    if($(`tab-${tab}`)) $(`tab-${tab}`).classList.add('active'); 
    if($(`view-${tab}`)) $(`view-${tab}`).classList.remove('hidden'); 
    
    if(window.innerWidth < 768) { window.toggleSidebar(); }

    if(tab === 'pricing') Admin.loadPriceHistory();
    if(tab === 'users') Admin.loadUsers(); 
    if(tab === 'master') Admin.loadMasterData();
    if(tab === 'analytics-full') Analytics.initFilterChain();
    if(tab === 'heatmap') Map3D.loadHeatmap(); 
}

window.toggleModal = toggleModal;
window.switchSubTab = Analytics.switchSubTab;

// Bind Dashboard Functions
window.loadDashboard = Dashboard.loadDashboard;
window.updateDashChain = Dashboard.updateDashChain;
window.resetDashFilters = Dashboard.resetDashFilters;
window.filterDashboardData = Dashboard.filterDashboardData;
window.toggleLossFilter = Dashboard.toggleLossFilter;
window.sortPendingByProfit = Dashboard.sortPendingByProfit;
window.deleteReport = Dashboard.deleteReport;
window.openDetailModal = Dashboard.openDetailModal;
window.approve = Dashboard.approve;

// Bind Analytics Functions
window.loadAnalyticsFull = Analytics.loadAnalyticsFull;
window.updateFilterChain = Analytics.updateFilterChain;
window.resetFilters = Analytics.resetFilters;
window.exportAnalyticsExcel = Analytics.exportAnalyticsExcel;

// Bind Admin Functions (Users, Shop, Price, Export)
window.loadUsers = Admin.loadUsers;
window.openUserEdit = Admin.openUserEdit;
window.submitUserEdit = Admin.submitUserEdit;
window.toggleApprove = Admin.toggleApprove;
window.deleteUser = Admin.deleteUser;
window.openShopEdit = Admin.openShopEdit;
window.submitShopEdit = Admin.submitShopEdit;
window.deleteShop = Admin.deleteShop;
window.loadPriceHistory = Admin.loadPriceHistory;
window.openPriceEdit = Admin.openPriceEdit;
window.submitPriceEdit = Admin.submitPriceEdit;
window.deletePrice = Admin.deletePrice;

// [NEW] Bind Export Functions
window.exportMasterData = Admin.exportMasterData;
window.exportPriceData = Admin.exportPriceData;

// Auth Actions
$('btnLogin').onclick = async () => { 
    const { error } = await sb.auth.signInWithPassword({ email: $('adm_email').value, password: $('adm_pass').value });
    if(error) $('loginMsg').innerText = error.message; else init(); 
};
$('btnLogout').onclick = async () => { await sb.auth.signOut(); location.reload(); };

// Start App
init();