// js/api.js
import { sb, STATE } from './config.js';
import { ui_showMsg, ui_renderModelOptionsAll, ui_addSaleRow, ui_updateShopInfo, ui_renderHistoryTable, ui_updateSVNOptions, ui_updateDVNOptions, updateChartFilters } from './ui.js';
import { loadOverviewDashboard } from './charts.js';

// --- AUTH & INIT ---
export async function api_login(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return true;
}

export async function api_signup(email, password, role, name) {
    const { error } = await sb.auth.signUp({ 
        email, 
        password, 
        options: { data: { role, full_name: name } } 
    });
    if (error) throw error;
    return true;
}

// 🔥 HÀM ĐĂNG XUẤT ĐÃ SỬA LỖI (FIXED)
export async function api_logout() {
    try {
        await sb.auth.signOut();
    } catch (err) {
        console.error("Lỗi khi đăng xuất (Supabase):", err);
    } finally {
        console.log("Đang xóa session và reload...");
        localStorage.clear();
        sessionStorage.clear();
        const mainApp = document.getElementById('mainApp');
        const authContainer = document.getElementById('authContainer');
        if (mainApp) mainApp.classList.add('hidden');
        if (authContainer) authContainer.classList.remove('hidden');
        window.location.reload();
    }
}

export async function api_checkSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    
    const { data: profile } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    return profile;
}

// --- 🔥 MỚI: KIỂM TRA SHOP ĐÃ NỘP BÁO CÁO CHƯA ---
export async function api_checkSubmittedShops(monthStr) {
    if (!monthStr) return;
    // Tìm tất cả báo cáo trong tháng này (bất kể trạng thái submitted hay approved)
    const { data, error } = await sb.from('financial_reports')
        .select('shop_code')
        .eq('report_month', monthStr + '-01');
    
    if (data) {
        STATE.submittedShops = new Set(data.map(r => r.shop_code));
        // Cập nhật lại giao diện dropdown sau khi có dữ liệu mới
        // Lưu ý: updateChartFilters cần được export từ ui.js hoặc gắn vào window nếu import vòng
        if(typeof updateChartFilters === 'function') {
             updateChartFilters('refresh'); 
        }
        ui_updateDVNOptions();
    }
}

// --- DATA LOADING ---
export async function api_loadShopsAndLock(profile) {
    const { data: allShops } = await sb.from('master_shop_list').select('*');
    if (!allShops) return;

    allShops.forEach(s => STATE.globalShopMap[s.shop_code] = s);

    let myShops = [];
    const myName = profile.full_name ? profile.full_name.trim().toLowerCase() : "";

    if (profile.role === 'Admin') { 
        myShops = allShops; 
    } else if (profile.role === 'Giám Đốc') { 
        myShops = allShops.filter(s => s.director_name && s.director_name.trim().toLowerCase() === myName);
    } else { 
        myShops = allShops.filter(s => s.sale_name && s.sale_name.trim().toLowerCase() === myName);
    }

    STATE.globalAssignedShops = myShops;
    STATE.assignedShopCodes = myShops.map(s => s.shop_code);

    const provinces = [...new Set(myShops.map(s => s.province).filter(n => n))].sort();
    const provinceSelect = document.getElementById('f_province');
    if (provinceSelect) {
        provinceSelect.innerHTML = `<option value="">-- Chọn Tỉnh (${provinces.length}) --</option>` + provinces.map(p => `<option value="${p}">${p}</option>`).join('');
    }

    if (myShops.length === 1) {
        const s = myShops[0];
        const elProv = document.getElementById('f_province');
        const elSVN = document.getElementById('f_svn');
        const elShop = document.getElementById('shop_code');

        if(elProv) { elProv.value = s.province; ui_updateSVNOptions(); }
        if(elSVN) { elSVN.value = s.svn_code; ui_updateDVNOptions(); }
        if(elShop) { elShop.value = s.shop_code; ui_updateShopInfo(); }
        
        [elProv, elSVN, elShop].forEach(el => { if(el) el.disabled = true; });
    }
}

export async function api_loadMonthlyModels() {
    const month = document.getElementById('report_month').value;
    if (!month) { alert("Vui lòng chọn Tháng Báo Cáo trước!"); return; }

    const { data, error } = await sb.from('monthly_product_prices').select('*').eq('report_month', month);
    
    if (error || !data || data.length === 0) {
        alert(`Chưa có bảng giá Admin tháng ${month}!`);
        STATE.currentAdminPrices = [];
    } else {
        STATE.currentAdminPrices = data;
        const tbody = document.getElementById('salesDetailBody');
        if (tbody && tbody.children.length === 0) ui_addSaleRow();
        alert(`Đã tải ${data.length} model xe cho tháng ${month}.`);
    }
    ui_renderModelOptionsAll();
}

export async function api_loadSaleHistory() {
    if (STATE.assignedShopCodes.length === 0) return;
    
    const { data: reports } = await sb.from('financial_reports')
        .select('*')
        .in('shop_code', STATE.assignedShopCodes)
        .order('created_at', { ascending: false });
    
    ui_renderHistoryTable(reports);
}

// --- REPORT ACTIONS ---
export async function api_submitReport(payload, editId) {
    let res;
    if (editId) {
        res = await sb.from('financial_reports').update(payload).eq('report_id', editId);
    } else {
        res = await sb.from('financial_reports').insert([payload]);
    }
    return res;
}

export async function api_deleteReport(id) {
    const { error } = await sb.from('financial_reports').delete().eq('report_id', id);
    if(error) throw error;
}

export async function api_getReportById(id) {
    return await sb.from('financial_reports').select('*').eq('report_id', id).single();
}

export async function api_approveReport(id) {
    const { error } = await sb.from('financial_reports')
        .update({ status: 'approved' })
        .eq('report_id', id);
    
    if (error) throw error;
    return true;
}

// --- TARGET API ---
export async function api_upsertTargets(payloads) {
    const { data, error } = await sb.from('kpi_targets')
        .upsert(payloads, { onConflict: 'target_month, scope, reference_code' });
    if (error) throw error;
    return data;
}

export async function api_getTargets(month, scope, references) {
    const { data, error } = await sb.from('kpi_targets')
        .select('*')
        .eq('target_month', month)
        .eq('scope', scope)
        .in('reference_code', references);
    if (error) return [];
    return data;
}

export async function api_getActualPerformance(month, shopCodes) {
    const { data, error } = await sb.from('financial_reports')
        .select('shop_code, sold_quantity, sales_detail_json')
        .eq('report_month', month + '-01')
        .in('shop_code', shopCodes)
        .eq('status', 'approved'); 
    if (error) return [];
    return data;
}
