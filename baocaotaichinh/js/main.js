// js/main.js
import { api_checkSession, api_loadShopsAndLock, api_login, api_signup, api_logout, api_loadMonthlyModels, api_submitReport, api_getReportById, api_deleteReport, api_loadSaleHistory, api_approveReport } from './api.js';
import { STATE } from './config.js';
import { switchView, switchChartTab, toggleSidebar, ui_showMsg, ui_updateSVNOptions, ui_updateDVNOptions, ui_addSaleRow, calcAll, calcRow, exportDirectorExcel, updateChartFilters } from './ui.js';
import { loadCharts, loadOverviewDashboard } from './charts.js';
import { parseNumber, fmn, calcKPI } from './utils.js'; // Import thêm calcKPI

// --- INIT APP ---
async function init() {
    const profile = await api_checkSession();
    if (!profile || !profile.is_approved) {
        document.getElementById('authContainer').classList.remove('hidden');
        if (profile) { alert("Tài khoản chưa được duyệt!"); await api_logout(); }
        return;
    }

    STATE.currentUser = profile;
    document.getElementById('authContainer').classList.add('hidden');
    document.getElementById('mainApp').classList.remove('hidden');
    document.getElementById('mainApp').classList.add('flex');
    
    document.getElementById('userDisplay').innerText = profile.full_name || "User";
    document.getElementById('roleDisplay').innerText = profile.role || "SALE";
    document.getElementById('avatarLetter').innerText = (profile.full_name || "U").charAt(0).toUpperCase();
    document.getElementById('overview_role_badge').innerText = profile.role || "MEMBER";

    const now = new Date();
    document.getElementById('report_month').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;

    await api_loadShopsAndLock(profile);
    
    if (!STATE.globalAssignedShops || STATE.globalAssignedShops.length === 0) {
        alert(`⚠️ CẢNH BÁO: Không tìm thấy Shop nào được gán cho tài khoản "${profile.full_name}".\nVui lòng kiểm tra lại tên trong mục "Master Data" của Admin.`);
    }

    switchView('charts');
}

// --- GLOBAL BINDING ---
window.toggleSidebar = toggleSidebar;
window.switchView = switchView;
window.switchChartTab = switchChartTab;
window.exportDirectorExcel = exportDirectorExcel;
window.loadCharts = loadCharts;
window.loadMonthlyModels = api_loadMonthlyModels;
window.addSaleRow = ui_addSaleRow;
window.calcAll = calcAll;
window.updateSVNOptions = ui_updateSVNOptions; 
window.updateDVNOptions = ui_updateDVNOptions; 
window.loadSaleHistory = api_loadSaleHistory;

// 🔥 XEM CHI TIẾT BÁO CÁO (POPUP MODAL) 🔥
window.viewReportDetail = async (id) => {
    // 1. Lấy dữ liệu báo cáo
    const { data: r } = await api_getReportById(id);
    if (!r) return;
    
    // 2. Tính toán lại KPI
    const k = calcKPI(r);
    const grossProfit = k.rev - k.cogs;
    const operatingExp = k.op + k.log + k.mkt + k.other;

    // 3. Điền số liệu vào Modal
    const setText = (elemId, val) => document.getElementById(elemId).innerText = fmn(val);
    
    document.getElementById('modal_shop_name').innerText = `${r.shop_code} - ${STATE.globalShopMap[r.shop_code]?.shop_name || 'N/A'}`;
    setText('modal_rev', k.rev);
    setText('modal_cogs', k.cogs);
    
    setText('modal_gross', grossProfit);
    document.getElementById('modal_gross').className = `text-2xl font-black ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`;

    setText('modal_op', k.op);
    setText('modal_log', k.log);
    setText('modal_mkt', k.mkt);
    setText('modal_other', k.other);
    setText('modal_total_exp', operatingExp);

    setText('modal_net', k.net);
    document.getElementById('modal_net').className = `text-3xl font-black ${k.net >= 0 ? 'text-green-400' : 'text-red-400'}`;

    // 4. Xử lý nút Duyệt trong Modal
    const btnApprove = document.getElementById('btnModalApprove');
    // Chỉ hiện nút Duyệt nếu status là 'submitted' và user là Giám đốc/Admin
    if (r.status === 'submitted' && (STATE.currentUser.role === 'Giám Đốc' || STATE.currentUser.role === 'Admin')) {
        btnApprove.classList.remove('hidden');
        btnApprove.onclick = () => {
            window.closePnlModal();
            window.approveReport(id); // Gọi lại hàm duyệt có sẵn
        };
    } else {
        btnApprove.classList.add('hidden');
    }

    // 5. Hiện Modal
    document.getElementById('pnlDetailModal').classList.remove('hidden');
};

window.closePnlModal = () => {
    document.getElementById('pnlDetailModal').classList.add('hidden');
};

// Hàm Duyệt Báo Cáo (Giữ nguyên)
window.approveReport = async (id) => {
    if (confirm("Xác nhận DUYỆT báo cáo này?\nSau khi duyệt, nhân viên Sale sẽ không thể chỉnh sửa được nữa.")) {
        try {
            ui_showMsg("Đang duyệt...", "blue");
            await api_approveReport(id);
            ui_showMsg("Đã duyệt thành công!", "green");
            await api_loadSaleHistory();
            loadOverviewDashboard(); 
        } catch (err) {
            alert("Lỗi: " + err.message);
            ui_showMsg("Lỗi khi duyệt", "red");
        }
    }
};

window.updateChartFilters = (level) => {
    const selSale = document.getElementById('chart_sale').value;
    const selSVN = document.getElementById('chart_svn').value;
    let filtered = STATE.globalAssignedShops || [];

    if (selSale) filtered = filtered.filter(s => s.sale_name === selSale);
    
    if (level === 'sale') {
        const svns = [...new Set(filtered.map(s => s.svn_code).filter(n => n))].sort();
        document.getElementById('chart_svn').innerHTML = `<option value="">-- Tất cả SVN --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join('');
        document.getElementById('chart_svn').value = "";
    }

    if (document.getElementById('chart_svn').value) filtered = filtered.filter(s => s.svn_code === document.getElementById('chart_svn').value);
    
    const dvns = filtered.sort((a,b) => a.shop_code.localeCompare(b.shop_code));
    
    const reportedShops = new Set();
    if (STATE.cachedDirectorData && STATE.cachedDirectorData.length > 0) {
        STATE.cachedDirectorData.forEach(r => reportedShops.add(r.shop_code));
    }

    document.getElementById('chart_dvn').innerHTML = `<option value="">-- Chọn Shop để xem chi tiết --</option>` + 
        dvns.map(s => {
            const isReported = reportedShops.has(s.shop_code);
            const icon = isReported ? "✅ " : "⚪ "; 
            const style = isReported ? "font-weight:bold; color:green;" : "color:gray;";
            return `<option value="${s.shop_code}" style="${style}">${icon}${s.shop_code} - ${s.shop_name}</option>`;
        }).join('');
};

const originalLoadCharts = window.loadCharts; 

window.ui_updateShopInfo = () => {
    const shopCode = document.getElementById('shop_code').value;
    const disp = document.getElementById('shop_info_display');
    
    if (!shopCode) { 
        disp.classList.add('hidden'); 
        return; 
    }
    
    const shopData = STATE.globalShopMap[shopCode];
    if (shopData) {
        disp.classList.remove('hidden');
        const shopType = shopData.shop_type || "Chuẩn"; 
        
        disp.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <div class="font-black text-sm uppercase text-green-800">${shopData.shop_name}</div>
                    <div class="text-[10px] text-green-600 font-bold mt-1"><i class="fa-solid fa-user-tie"></i> GD: ${shopData.director_name || '---'}</div>
                </div>
                <div class="flex flex-col items-end gap-1">
                    <span class="px-2 py-1 bg-orange-100 text-orange-700 rounded text-[10px] font-bold border border-orange-200 shadow-sm">
                        <i class="fa-solid fa-layer-group"></i> ${shopType}
                    </span>
                </div>
            </div>
        `;
    }
};
if(document.getElementById('shop_code')) {
    document.getElementById('shop_code').onchange = window.ui_updateShopInfo;
}

// Helpers
window.formatCurrency = (input) => {
    let val = input.value.replace(/\D/g, "");
    if (val === "") { input.value = ""; return; }
    input.value = new Intl.NumberFormat('vi-VN').format(parseInt(val));
    if (input.closest('tr')) calcRow(input);
};
window.formatInput = window.formatCurrency; 

window.onModelChange = (selectEl) => {
    const opt = selectEl.options[selectEl.selectedIndex];
    const row = selectEl.closest('tr');
    if (opt.value) {
        row.querySelector('.si-input').value = fmn(opt.getAttribute('data-si'));
        const soInput = row.querySelector('.so-input');
        if (parseNumber(soInput.value) == 0) soInput.value = fmn(opt.getAttribute('data-so'));
    }
    calcRow(selectEl);
};

window.editReport = async (id) => {
    const { data: r } = await api_getReportById(id);
    if (!r) return;
    
    switchView('sales');
    document.getElementById('editReportId').value = r.report_id;
    document.getElementById('editBanner').classList.remove('hidden');
    document.getElementById('btnCancelEdit').classList.remove('hidden');
    document.getElementById('entryTitle').innerText = "Cập Nhật Báo Cáo";
    document.getElementById('btnSubmitText').innerText = "Lưu Thay Đổi";
    
    const shop = STATE.globalShopMap[r.shop_code];
    if (shop) {
        document.getElementById('f_province').value = shop.province;
        ui_updateSVNOptions();
        document.getElementById('f_svn').value = shop.svn_code;
        ui_updateDVNOptions();
        document.getElementById('shop_code').value = r.shop_code;
        window.ui_updateShopInfo();
    }
    if (r.report_month) document.getElementById('report_month').value = r.report_month.slice(0, 7);
    
    const setVal = (key, val) => { if (document.getElementById(key)) document.getElementById(key).value = fmn(val || 0); };
    const fields = ['opening_stock', 'sold_quantity', 'actual_revenue', 'cost_goods', 'revenue_support', 'cost_op_depreciation_build', 'cost_op_depreciation_equip', 'cost_op_rent', 'cost_op_salary', 'cost_op_utility', 'cost_op_maintain', 'cost_op_interest', 'cost_log_commission', 'cost_log_kpi_bonus', 'cost_log_discount', 'cost_log_shipping', 'cost_log_pdi', 'cost_log_warranty', 'cost_log_warehouse_labor', 'cost_log_display_storage', 'cost_log_plate_support', 'cost_log_maintenance_free', 'cost_log_cskh', 'cost_op_ads_social', 'cost_op_offline_print', 'cost_op_promotion_gift', 'cost_op_event_store', 'cost_mkt_livestream', 'cost_mkt_kol_koc', 'cost_mkt_pr_branding', 'cost_mkt_roadshow', 'cost_mkt_testdrive', 'cost_mkt_school', 'cost_mkt_mobile_sales', 'cost_mkt_square', 'cost_mkt_opening', 'cost_mkt_other', 'cost_other_general'];
    fields.forEach(f => setVal(f, r[f]));

    await api_loadMonthlyModels();
    document.getElementById('salesDetailBody').innerHTML = "";
    let details = [];
    try { details = typeof r.sales_detail_json === 'string' ? JSON.parse(r.sales_detail_json) : r.sales_detail_json || []; } catch (e) { }
    if (details.length) details.forEach(item => ui_addSaleRow(item));
    
    calcAll();
};

window.deleteReport = async (id) => {
    if (confirm("Xóa báo cáo này?")) {
        await api_deleteReport(id);
        api_loadSaleHistory();
    }
};

window.resetEntryForm = () => {
    document.getElementById('financeForm').reset();
    document.getElementById('salesDetailBody').innerHTML = "";
    STATE.currentAdminPrices = [];
    document.getElementById('editReportId').value = "";
    document.getElementById('editBanner').classList.add('hidden');
    document.getElementById('btnCancelEdit').classList.add('hidden');
    document.getElementById('entryTitle').innerText = "1. Báo Cáo Nhập - Xuất";
    document.getElementById('btnSubmitText').innerText = "GỬI BÁO CÁO";
    const now = new Date();
    document.getElementById('report_month').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    document.getElementById('shop_info_display').classList.add('hidden');
    if(STATE.globalAssignedShops && STATE.globalAssignedShops.length > 1) {
         document.getElementById('f_province').value = "";
         ui_updateSVNOptions();
    }
};

document.getElementById('btnLogin').onclick = async () => {
    const e = document.getElementById('email').value, p = document.getElementById('password').value;
    try {
        ui_showMsg("Đang xử lý...", "blue");
        await api_login(e, p);
        location.reload();
    } catch (err) { ui_showMsg(err.message, "red"); }
};

document.getElementById('btnSignup').onclick = async () => {
    const e = document.getElementById('reg_email').value, p = document.getElementById('reg_pass').value, r = document.getElementById('reg_role').value, n = document.getElementById('reg_name').value;
    try {
        ui_showMsg("Đang đăng ký...", "blue");
        await api_signup(e, p, r, n);
        ui_showMsg("Thành công! Chờ duyệt.", "green");
    } catch (err) { ui_showMsg(err.message, "red"); }
};

document.getElementById('goSignup').onclick = (e) => { e.preventDefault(); document.getElementById('loginFormSection').classList.add('hidden'); document.getElementById('signupFormSection').classList.remove('hidden'); };
document.getElementById('goLogin').onclick = (e) => { e.preventDefault(); document.getElementById('signupFormSection').classList.add('hidden'); document.getElementById('loginFormSection').classList.remove('hidden'); };

document.getElementById('financeForm').onsubmit = async (e) => {
    e.preventDefault();
    const shopCode = document.getElementById('shop_code').value;
    if (!shopCode) {
        document.getElementById('formMsg').innerText = "⚠️ Vui lòng chọn Shop trước khi gửi!";
        document.getElementById('formMsg').className = "mt-4 text-center font-bold text-xs text-red-600 animate-bounce";
        return;
    }
    document.getElementById('btnSubmit').disabled = true;
    document.getElementById('formMsg').innerText = "Đang gửi...";
    
    const val = id => parseNumber(document.getElementById(id).value);
    const detailRows = [];
    document.querySelectorAll('#salesDetailBody tr').forEach(tr => {
        detailRows.push({
            model: tr.querySelector('.model-select').value,
            qty_si: parseNumber(tr.querySelector('.qty-si-input').value),
            qty_so: parseNumber(tr.querySelector('.qty-so-input').value),
            si: parseNumber(tr.querySelector('.si-input').value),
            so: parseNumber(tr.querySelector('.so-input').value)
        });
    });

    const payload = {
        report_month: document.getElementById('report_month').value + "-01",
        shop_code: shopCode,
        sales_detail_json: detailRows,
        status: 'submitted',
        ...['opening_stock', 'sold_quantity', 'actual_revenue', 'revenue_support', 'cost_goods', 'cost_op_depreciation_build', 'cost_op_depreciation_equip', 'cost_op_rent', 'cost_op_salary', 'cost_op_utility', 'cost_op_maintain', 'cost_op_interest', 'cost_log_commission', 'cost_log_kpi_bonus', 'cost_log_discount', 'cost_log_shipping', 'cost_log_pdi', 'cost_log_warranty', 'cost_log_warehouse_labor', 'cost_log_display_storage', 'cost_log_plate_support', 'cost_log_maintenance_free', 'cost_log_cskh', 'cost_op_ads_social', 'cost_op_offline_print', 'cost_op_promotion_gift', 'cost_op_event_store', 'cost_mkt_livestream', 'cost_mkt_kol_koc', 'cost_mkt_pr_branding', 'cost_mkt_roadshow', 'cost_mkt_testdrive', 'cost_mkt_school', 'cost_mkt_mobile_sales', 'cost_mkt_square', 'cost_mkt_opening', 'cost_mkt_other', 'cost_other_general'].reduce((acc, curr) => ({ ...acc, [curr]: val(curr) }), {})
    };

    const editId = document.getElementById('editReportId').value;
    const { error } = await api_submitReport(payload, editId);

    if (error) {
        document.getElementById('formMsg').innerText = "Lỗi: " + error.message;
        document.getElementById('btnSubmit').disabled = false;
    } else {
        document.getElementById('formMsg').innerText = "Thành công!";
        window.resetEntryForm();
        setTimeout(() => { 
            document.getElementById('btnSubmit').disabled = false; 
            document.getElementById('formMsg').innerText = "";
            switchView('history'); 
            api_loadSaleHistory();
        }, 1000);
    }
};

document.getElementById('btnLogout').onclick = api_logout;

init();