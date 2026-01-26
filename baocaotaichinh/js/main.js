// js/main.js
import { 
    api_checkSession, 
    api_loadShopsAndLock, 
    api_login, 
    api_signup, 
    api_logout, 
    api_loadMonthlyModels, 
    api_submitReport, 
    api_getReportById, 
    api_deleteReport, 
    api_loadSaleHistory, 
    api_approveReport,
    api_upsertTargets,
    api_getTargets,
    api_getActualPerformance,
    api_checkSubmittedShops // Import hàm kiểm tra tick xanh
} from './api.js';

import { STATE } from './config.js';

import { 
    switchView, 
    switchChartTab, 
    toggleSidebar, 
    ui_showMsg, 
    ui_updateSVNOptions, 
    ui_updateDVNOptions, 
    ui_addSaleRow, 
    calcAll, 
    calcRow, 
    exportDirectorExcel, 
    updateChartFilters,
    ui_updateShopInfo,
    ui_renderModelOptionsAll
} from './ui.js';

// Import các hàm biểu đồ (Bao gồm loadTargetDashboard)
import { loadCharts, loadOverviewDashboard, loadTargetDashboard } from './charts.js';
import { parseNumber, fmn, calcKPI } from './utils.js';
import { sb } from './config.js'; 

// --- INIT APP ---
async function init() {
    try {
        const profile = await api_checkSession();
        
        if (!profile || !profile.is_approved) {
            document.getElementById('authContainer').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
            
            if (profile && !profile.is_approved) {
                alert("Tài khoản của bạn đang chờ phê duyệt.");
                await api_logout();
            }
            return;
        }

        STATE.currentUser = profile;
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('flex');
        
        document.body.style.fontFamily = "'Roboto', sans-serif";
        
        if(document.getElementById('userDisplay')) document.getElementById('userDisplay').innerText = profile.full_name || "User";
        if(document.getElementById('roleDisplay')) document.getElementById('roleDisplay').innerText = profile.role || "SALE";
        if(document.getElementById('avatarLetter')) document.getElementById('avatarLetter').innerText = (profile.full_name || "U").charAt(0).toUpperCase();
        if(document.getElementById('overview_role_badge')) document.getElementById('overview_role_badge').innerText = profile.role || "MEMBER";

        const now = new Date();
        const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
        if(document.getElementById('report_month')) document.getElementById('report_month').value = currentMonthStr;

        // 🔥 GỌI HÀM CHECK SUBMITTED NGAY KHI INIT ĐỂ HIỂN THỊ TICK XANH
        await api_checkSubmittedShops(currentMonthStr);

        await api_loadShopsAndLock(profile);
        
        if (!STATE.globalAssignedShops || STATE.globalAssignedShops.length === 0) {
            const name = profile.full_name || "User";
            alert("CẢNH BÁO: Tài khoản " + name + " chưa được gán Shop nào.\n" + 
                  "Vui lòng liên hệ Admin để cấu hình trong Master Data.");
        }

        switchView('charts');

    } catch (err) {
        console.error("Lỗi khởi tạo:", err);
        alert("Có lỗi khi tải ứng dụng. Vui lòng thử lại F5.");
    }
}

// --- GLOBAL BINDING ---
window.toggleSidebar = toggleSidebar;
window.switchView = switchView;
window.switchChartTab = switchChartTab;
window.exportDirectorExcel = exportDirectorExcel;
window.loadCharts = loadCharts;
window.loadTargetDashboard = loadTargetDashboard; 
window.loadMonthlyModels = api_loadMonthlyModels;
window.addSaleRow = ui_addSaleRow;
window.calcAll = calcAll;
window.updateSVNOptions = ui_updateSVNOptions; 
window.updateDVNOptions = ui_updateDVNOptions; 
window.loadSaleHistory = api_loadSaleHistory;
window.ui_updateShopInfo = ui_updateShopInfo; 

window.onModelChange = (selectEl) => {
    const opt = selectEl.options[selectEl.selectedIndex];
    const row = selectEl.closest('tr');
    const priceSI = parseNumber(opt.getAttribute('data-si'));
    const priceSO = parseNumber(opt.getAttribute('data-so'));
    if (priceSI > 0) row.querySelector('.si-input').value = fmn(priceSI);
    if (priceSO > 0) row.querySelector('.so-input').value = fmn(priceSO);
    calcRow(selectEl);
};

// --- AUTH HANDLERS ---
const btnLogin = document.getElementById('btnLogin');
if (btnLogin) {
    btnLogin.onclick = async () => {
        const emailEl = document.getElementById('email');
        const passEl = document.getElementById('password');
        if (!emailEl || !passEl) return;
        const email = emailEl.value.trim();
        const password = passEl.value.trim();
        if (!email || !password) { ui_showMsg("Vui lòng nhập Email và Mật khẩu!", "red"); return; }
        try {
            ui_showMsg("Đang xử lý...", "blue");
            await api_login(email, password);
            window.location.reload();
        } catch (err) { ui_showMsg("Đăng nhập thất bại: " + err.message, "red"); }
    };
}

const btnSignup = document.getElementById('btnSignup');
if (btnSignup) {
    btnSignup.onclick = async () => {
        const e = document.getElementById('reg_email').value;
        const p = document.getElementById('reg_pass').value;
        const r = document.getElementById('reg_role').value;
        const n = document.getElementById('reg_name').value;
        if (!e || !p || !n) { ui_showMsg("Vui lòng nhập đủ thông tin!", "red"); return; }
        try {
            ui_showMsg("Đang đăng ký...", "blue");
            await api_signup(e, p, r, n);
            ui_showMsg("Đăng ký thành công! Vui lòng chờ duyệt.", "green");
            setTimeout(() => {
                 document.getElementById('signupFormSection').classList.add('hidden'); 
                 document.getElementById('loginFormSection').classList.remove('hidden');
                 ui_showMsg("", "");
            }, 2000);
        } catch (err) { ui_showMsg(err.message, "red"); }
    };
}

if(document.getElementById('goSignup')) { document.getElementById('goSignup').onclick = (e) => { e.preventDefault(); document.getElementById('loginFormSection').classList.add('hidden'); document.getElementById('signupFormSection').classList.remove('hidden'); ui_showMsg("", ""); }; }
if(document.getElementById('goLogin')) { document.getElementById('goLogin').onclick = (e) => { e.preventDefault(); document.getElementById('signupFormSection').classList.add('hidden'); document.getElementById('loginFormSection').classList.remove('hidden'); ui_showMsg("", ""); }; }
if(document.getElementById('btnLogout')) { document.getElementById('btnLogout').onclick = api_logout; }

// --- FINANCE FORM ---
const financeForm = document.getElementById('financeForm');
if (financeForm) {
    financeForm.onsubmit = async (e) => {
        e.preventDefault();
        const shopCode = document.getElementById('shop_code').value;
        if (!shopCode) {
            document.getElementById('formMsg').innerText = "Vui lòng chọn Shop trước khi gửi!";
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

        const currentMonth = document.getElementById('report_month').value + "-01";
        const payload = {
            report_month: currentMonth,
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
            
            // 🔥 UPDATE LẠI TICK XANH SAU KHI NỘP THÀNH CÔNG
            await api_checkSubmittedShops(document.getElementById('report_month').value);

            window.resetEntryForm();
            setTimeout(() => { 
                document.getElementById('btnSubmit').disabled = false; 
                document.getElementById('formMsg').innerText = "";
                switchView('history'); 
                api_loadSaleHistory();
            }, 1000);
        }
    };
}

window.formatCurrency = (input) => {
    let val = input.value.replace(/\D/g, "");
    if (val === "") { input.value = ""; return; }
    input.value = new Intl.NumberFormat('vi-VN').format(parseInt(val));
    if (input.closest('tr')) calcRow(input);
};
window.formatInput = window.formatCurrency; 

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
        ui_updateShopInfo(); 
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
    if (confirm("Xóa báo cáo này?")) { await api_deleteReport(id); api_loadSaleHistory(); }
};

window.resetEntryForm = () => {
    document.getElementById('financeForm').reset();
    document.getElementById('salesDetailBody').innerHTML = "";
    STATE.currentAdminPrices = [];
    document.getElementById('editReportId').value = "";
    document.getElementById('editBanner').classList.add('hidden');
    document.getElementById('btnCancelEdit').classList.add('hidden');
    document.getElementById('entryTitle').innerText = "3. Báo Cáo Nhập - Xuất";
    document.getElementById('btnSubmitText').innerText = "GỬI BÁO CÁO";
    const now = new Date();
    document.getElementById('report_month').value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    document.getElementById('shop_info_display').classList.add('hidden');
    if(STATE.globalAssignedShops && STATE.globalAssignedShops.length > 1) { document.getElementById('f_province').value = ""; ui_updateSVNOptions(); }
};

window.viewReportDetail = async (id) => {
    const { data: r } = await api_getReportById(id);
    if (!r) return;
    const k = calcKPI(r);
    const grossProfit = k.rev - k.cogs;
    const operatingExp = k.op + k.log + k.mkt + k.other;
    const setText = (elemId, val) => { if(document.getElementById(elemId)) document.getElementById(elemId).innerText = fmn(val); };
    const shopInfo = STATE.globalShopMap[r.shop_code];
    document.getElementById('modal_shop_name').innerText = `${r.shop_code} - ${shopInfo?.shop_name || 'N/A'}`;
    setText('modal_rev', k.rev); setText('modal_cogs', k.cogs); setText('modal_gross', grossProfit);
    document.getElementById('modal_gross').className = `text-2xl font-black ${grossProfit >= 0 ? 'text-green-600' : 'text-red-600'}`;
    setText('modal_op', k.op); setText('modal_log', k.log); setText('modal_mkt', k.mkt); setText('modal_other', k.other); setText('modal_total_exp', operatingExp);
    setText('modal_net', k.net);
    document.getElementById('modal_net').className = `text-3xl font-black ${k.net >= 0 ? 'text-green-400' : 'text-red-400'}`;
    const btnApprove = document.getElementById('btnModalApprove');
    if (r.status === 'submitted' && (STATE.currentUser.role === 'Giám Đốc' || STATE.currentUser.role === 'Admin')) {
        btnApprove.classList.remove('hidden');
        btnApprove.onclick = () => { window.closePnlModal(); window.approveReport(id); };
    } else { btnApprove.classList.add('hidden'); }
    document.getElementById('pnlDetailModal').classList.remove('hidden');
};
window.closePnlModal = () => { document.getElementById('pnlDetailModal').classList.add('hidden'); };
window.approveReport = async (id) => {
    if (confirm("Xác nhận DUYỆT báo cáo này?")) {
        try { ui_showMsg("Đang duyệt...", "blue"); await api_approveReport(id); ui_showMsg("Đã duyệt!", "green"); await api_loadSaleHistory(); loadOverviewDashboard(); } 
        catch (err) { alert("Lỗi: " + err.message); ui_showMsg("Lỗi khi duyệt", "red"); }
    }
};

// --- LOGIC TARGET & ALLOCATION CHECK ---
let cachedTargetData = { items: [], targets: {}, actuals: {}, scope: '' };

window.loadTargetView = async () => {
    const month = document.getElementById('target_month_picker').value;
    if (!month) return;
    
    ui_showMsg("Đang tải dữ liệu Target...", "blue");
    const tbody = document.getElementById('targetTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="p-4 text-center text-xs italic text-gray-400">Đang tải...</td></tr>';
    document.getElementById('targetEmptyState').classList.add('hidden');

    try {
        const userRole = STATE.currentUser.role;
        const shops = STATE.globalAssignedShops || [];
        const viewMode = document.getElementById('target_view_mode')?.value || 'BY_SALE';
        
        let scope = ''; 
        let listItems = []; 
        let allocatedMap = {}; 

        const colHeader4 = document.querySelector('#view-targets thead th:last-child');

        if ((userRole === 'Giám Đốc' || userRole === 'Admin') && viewMode === 'BY_SALE') {
            scope = 'SALE_AGENT'; 
            document.getElementById('target_table_title').innerText = "Kiểm Soát Phân Bổ (Giám Đốc -> Sale -> Shop)";
            if(colHeader4) colHeader4.innerText = "Trạng Thái Phân Bổ (Allocation)";

            const sales = [...new Set(shops.map(s => s.sale_name).filter(n => n))].sort();
            listItems = sales.map(name => ({ code: name, name: name, type: 'Sale', province: '', svn: '' }));
            
            const allShopCodes = shops.map(s => s.shop_code);
            const shopTargets = await api_getTargets(month, 'SHOP', allShopCodes);
            
            sales.forEach(saleName => {
                const saleShopCodes = shops.filter(s => s.sale_name === saleName).map(s => s.shop_code);
                const relevantTargets = shopTargets.filter(t => saleShopCodes.includes(t.reference_code));
                
                const sumSi = relevantTargets.reduce((sum, t) => sum + (t.target_si || 0), 0);
                const sumSo = relevantTargets.reduce((sum, t) => sum + (t.target_so || 0), 0);
                allocatedMap[saleName] = { si: sumSi, so: sumSo };
            });

        } else {
            scope = 'SHOP'; 
            document.getElementById('target_table_title').innerText = "Danh sách Cửa Hàng (Shop)";
            if(colHeader4) colHeader4.innerText = "Tiến Độ Thực Tế (Actual)";

            listItems = shops.map(s => ({ 
                code: s.shop_code, 
                name: `${s.shop_code} - ${s.shop_name}`, 
                type: 'Shop', 
                province: s.province, 
                svn: s.svn_code 
            }));
        }

        const refCodes = listItems.map(i => i.code);
        const allRelatedShopCodes = shops.map(s => s.shop_code);
        
        const [existingTargets, actualReports] = await Promise.all([
            api_getTargets(month, scope, refCodes), 
            api_getActualPerformance(month, allRelatedShopCodes)
        ]);

        cachedTargetData.scope = scope; 
        cachedTargetData.items = listItems; 
        cachedTargetData.targets = {};
        cachedTargetData.allocated = allocatedMap; 

        existingTargets.forEach(t => cachedTargetData.targets[t.reference_code] = t);
        
        cachedTargetData.actuals = {}; 
        actualReports.forEach(r => {
            let si = 0; 
            try { const details = typeof r.sales_detail_json === 'string' ? JSON.parse(r.sales_detail_json) : r.sales_detail_json || []; details.forEach(d => si += (d.qty_si || 0)); } catch(e) {}
            cachedTargetData.actuals[r.shop_code] = { si: si, so: r.sold_quantity || 0 };
        });

        populateTargetFilters(listItems); 
        applyTargetFilters(); 
        ui_showMsg("", ""); 

    } catch (err) { 
        console.error(err); 
        tbody.innerHTML = `<tr><td colspan="4" class="p-4 text-center text-red-500 font-bold">Lỗi tải dữ liệu: ${err.message}</td></tr>`; 
    }
};

function populateTargetFilters(items) {
    if (cachedTargetData.scope === 'SALE_AGENT') {
        document.getElementById('filter_target_province').disabled = true;
        document.getElementById('filter_target_svn').disabled = true;
    } else {
        document.getElementById('filter_target_province').disabled = false;
        document.getElementById('filter_target_svn').disabled = false;
        const provinces = [...new Set(items.map(i => i.province).filter(n => n))].sort();
        const svns = [...new Set(items.map(i => i.svn).filter(n => n))].sort();
        document.getElementById('filter_target_province').innerHTML = `<option value="">-- Tất cả Tỉnh (${provinces.length}) --</option>` + provinces.map(p => `<option value="${p}">${p}</option>`).join('');
        document.getElementById('filter_target_svn').innerHTML = `<option value="">-- Tất cả SVN (${svns.length}) --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join('');
    }
}

window.applyTargetFilters = () => {
    const fProv = document.getElementById('filter_target_province').value;
    const fSvn = document.getElementById('filter_target_svn').value;
    const fSearch = document.getElementById('filter_target_search').value.toLowerCase();
    const fStatus = document.getElementById('filter_target_status').value; 
    const tbody = document.getElementById('targetTableBody');
    const shops = STATE.globalAssignedShops || [];
    
    const filteredItems = cachedTargetData.items.filter(item => {
        if (cachedTargetData.scope === 'SHOP') { 
            if (fProv && item.province !== fProv) return false; 
            if (fSvn && item.svn !== fSvn) return false; 
        }
        if (fSearch && !item.name.toLowerCase().includes(fSearch)) return false;
        if (fStatus) {
            const t = cachedTargetData.targets[item.code] || { target_si: 0, target_so: 0 };
            const hasInput = (t.target_si > 0 || t.target_so > 0);
            if (fStatus === 'done' && !hasInput) return false;
            if (fStatus === 'pending' && hasInput) return false;
        }
        return true;
    });

    document.getElementById('target_count_display').innerText = filteredItems.length;
    if (filteredItems.length === 0) { tbody.innerHTML = ''; document.getElementById('targetEmptyState').classList.remove('hidden'); return; }
    document.getElementById('targetEmptyState').classList.add('hidden');
    
    tbody.innerHTML = filteredItems.map(item => {
        const t = cachedTargetData.targets[item.code] || { target_si: 0, target_so: 0 };
        let allocationInfoHTML = ""; 

        if (cachedTargetData.scope === 'SHOP') {
            let actSi = 0, actSo = 0;
            if (cachedTargetData.actuals[item.code]) { actSi = cachedTargetData.actuals[item.code].si; actSo = cachedTargetData.actuals[item.code].so; }
            const pctSi = t.target_si > 0 ? Math.min(Math.round((actSi/t.target_si)*100), 100) : 0;
            const pctSo = t.target_so > 0 ? Math.min(Math.round((actSo/t.target_so)*100), 100) : 0;
            
            allocationInfoHTML = `
                <div class="flex items-center gap-2 text-[10px] font-bold text-orange-600"><span class="w-6">S.I</span><div class="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden"><div class="bg-orange-500 h-1.5 rounded-full" style="width: ${pctSi}%"></div></div><span class="w-16 text-right">${fmn(actSi)}/${fmn(t.target_si)}</span></div>
                <div class="flex items-center gap-2 text-[10px] font-bold text-blue-600"><span class="w-6">S.O</span><div class="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden"><div class="bg-blue-600 h-1.5 rounded-full" style="width: ${pctSo}%"></div></div><span class="w-16 text-right">${fmn(actSo)}/${fmn(t.target_so)}</span></div>
            `;
        } else {
            const alloc = cachedTargetData.allocated[item.code] || { si: 0, so: 0 };
            const diffSi = t.target_si - alloc.si;
            let siStatusHtml = t.target_si === 0 ? `<span class="text-gray-400">Chưa đặt chỉ tiêu</span>` : (diffSi > 0 ? `<span class="text-red-600 font-black animate-pulse">⚠️ Thiếu ${fmn(diffSi)} xe</span> <span class="text-gray-400 font-normal">(${fmn(alloc.si)}/${fmn(t.target_si)})</span>` : `<span class="text-green-600 font-black">✅ Đã đủ (${fmn(alloc.si)})</span>`);
            const diffSo = t.target_so - alloc.so;
            let soStatusHtml = t.target_so === 0 ? `<span class="text-gray-400">Chưa đặt chỉ tiêu</span>` : (diffSo > 0 ? `<span class="text-red-600 font-black animate-pulse">⚠️ Thiếu ${fmn(diffSo)} xe</span> <span class="text-gray-400 font-normal">(${fmn(alloc.so)}/${fmn(t.target_so)})</span>` : `<span class="text-blue-600 font-black">✅ Đã đủ (${fmn(alloc.so)})</span>`);

            allocationInfoHTML = `
                <div class="space-y-1.5">
                    <div class="flex justify-between items-center text-xs border-b border-gray-100 pb-1"><span class="font-bold text-orange-600 w-8">S.I:</span><div class="text-right flex-1">${siStatusHtml}</div></div>
                    <div class="flex justify-between items-center text-xs"><span class="font-bold text-blue-600 w-8">S.O:</span><div class="text-right flex-1">${soStatusHtml}</div></div>
                </div>
            `;
        }

        return `
            <tr class="hover:bg-gray-50 border-b group ${t.target_si === 0 && t.target_so === 0 ? 'bg-red-50/30' : ''}" data-code="${item.code}">
                <td class="p-4"><div class="font-bold text-slate-700">${item.name}</div><div class="flex items-center gap-2 mt-1"><span class="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded font-bold uppercase">${item.type}</span>${item.province ? `<span class="text-[9px] border border-blue-100 text-blue-500 px-1.5 py-0.5 rounded font-bold">${item.province}</span>` : ''}</div></td>
                <td class="p-4 bg-orange-50/30 border-l border-orange-100"><input type="number" class="inp-target-si w-full bg-white border border-orange-200 rounded p-2 text-center font-bold text-orange-700 outline-none focus:ring-2 focus:ring-orange-200" value="${t.target_si}" placeholder="0"></td>
                <td class="p-4 bg-blue-50/30 border-l border-blue-100"><input type="number" class="inp-target-so w-full bg-white border border-blue-200 rounded p-2 text-center font-bold text-blue-700 outline-none focus:ring-2 focus:ring-blue-200" value="${t.target_so}" placeholder="0"></td>
                <td class="p-4 align-middle bg-white border-l border-gray-100">${allocationInfoHTML}</td>
            </tr>`;
    }).join('');
};

window.saveTargets = async () => {
    const month = document.getElementById('target_month_picker').value;
    const btn = document.getElementById('btnSaveTargets');
    const oldText = btn.innerHTML;
    if (!month) return alert("Vui lòng chọn tháng!");
    try {
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang lưu...`; btn.disabled = true;
        const userRole = STATE.currentUser.role;
        let scope = '';
        const viewMode = document.getElementById('target_view_mode')?.value;
        if ((userRole === 'Giám Đốc' || userRole === 'Admin') && viewMode === 'BY_SALE') { scope = 'SALE_AGENT'; } else { scope = 'SHOP'; }
        const payloads = [];
        document.querySelectorAll('#targetTableBody tr').forEach(tr => {
            const code = tr.getAttribute('data-code');
            const si = parseInt(tr.querySelector('.inp-target-si').value) || 0;
            const so = parseInt(tr.querySelector('.inp-target-so').value) || 0;
            if (code) { payloads.push({ target_month: month, scope: scope, reference_code: code, target_si: si, target_so: so, updated_by: STATE.currentUser.full_name }); }
        });
        if (payloads.length > 0) { await api_upsertTargets(payloads); ui_showMsg("Đã lưu Target thành công!", "green"); loadTargetView(); }
    } catch (err) { alert("Lỗi lưu target: " + err.message); } finally { btn.innerHTML = oldText; btn.disabled = false; }
};

// Chạy Init
init();
