import { sb, STATE } from './config.js';
import { ui_showMsg, ui_renderModelOptionsAll, ui_addSaleRow, ui_updateShopInfo, ui_updateSVNOptions, ui_updateDVNOptions, updateChartFilters, ui_renderHistorySO, ui_renderHistoryMedia, ui_renderHistoryCRM } from './ui.js';
import { loadOverviewDashboard } from './charts.js';

// --- AUTH & INIT ---
export async function api_login(email, password) {
    const { error } = await sb.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return true;
}

export async function api_signup(email, password, role, name) {
    const { error } = await sb.auth.signUp({ email, password, options: { data: { role, full_name: name } } });
    if (error) throw error;
    return true;
}

export async function api_logout() {
    try { await sb.auth.signOut(); } catch (err) { console.error("Lỗi khi đăng xuất:", err); } 
    finally {
        localStorage.clear(); sessionStorage.clear();
        const mainApp = document.getElementById('mainApp');
        const authContainer = document.getElementById('authContainer');
        if (mainApp) mainApp.classList.add('hidden');
        if (authContainer) authContainer.classList.remove('hidden');
        const loginForm = document.getElementById('loginFormSection');
        const signupForm = document.getElementById('signupFormSection');
        const forgotForm = document.getElementById('forgotPasswordFormSection');
        const updateForm = document.getElementById('updatePasswordFormSection');
        if (loginForm) loginForm.classList.remove('hidden');
        if (signupForm) signupForm.classList.add('hidden');
        if (forgotForm) forgotForm.classList.add('hidden');
        if (updateForm) updateForm.classList.add('hidden');
        if (typeof STATE !== 'undefined') STATE.currentUser = null;
        ui_showMsg("", "");
    }
}

export async function api_checkSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    const { data: profile, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    if (error) console.error("Lỗi profile:", error);
    return profile;
}

export async function api_checkSubmittedShops(monthStr) {
    if (!monthStr) return;
    const { data } = await sb.from('financial_reports').select('shop_code').eq('report_month', monthStr + '-01');
    if (data) {
        STATE.submittedShops = new Set(data.map(r => r.shop_code));
        if(typeof updateChartFilters === 'function') updateChartFilters('refresh'); 
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

    if (profile.role === 'Admin') myShops = allShops; 
    else if (profile.role === 'Giám Đốc') myShops = allShops.filter(s => s.director_name && s.director_name.trim().toLowerCase() === myName);
    else if (profile.role === 'Cửa hàng') myShops = allShops.filter(s => s.shop_code && s.shop_code.trim().toLowerCase() === myName);
    else myShops = allShops.filter(s => s.sale_name && s.sale_name.trim().toLowerCase() === myName);

    STATE.globalAssignedShops = myShops;
    STATE.assignedShopCodes = myShops.map(s => s.shop_code);

    const provinces = [...new Set(myShops.map(s => s.province).filter(n => n))].sort();
    const provinceSelect = document.getElementById('f_province');
    if (provinceSelect) provinceSelect.innerHTML = `<option value="">-- Chọn Tỉnh (${provinces.length}) --</option>` + provinces.map(p => `<option value="${p}">${p}</option>`).join('');

    if (myShops.length === 1) {
        const s = myShops[0];
        const elProv = document.getElementById('f_province'), elSVN = document.getElementById('f_svn'), elShop = document.getElementById('shop_code');
        if(elProv) { elProv.value = s.province; ui_updateSVNOptions(); }
        if(elSVN) { elSVN.value = s.svn_code; ui_updateDVNOptions(); }
        if(elShop) { elShop.value = s.shop_code; ui_updateShopInfo(); }
        [elProv, elSVN, elShop].forEach(el => { if(el) el.disabled = true; });
    }
}

export async function api_loadMonthlyModels() {
    let month = new Date().toISOString().slice(0, 7);
    const soDateEl = document.getElementById('so_daily_date');
    if (soDateEl && soDateEl.value) month = soDateEl.value.slice(0, 7); 

    const parts = month.split('-');
    const { data, error } = await sb.from('monthly_product_prices')
        .select('*')
        .or(`report_month.eq.${month},report_month.eq.${parts[1]}/${parts[0]},report_month.eq.${parseInt(parts[1])}/${parts[0]}`);
    
    if (error || !data || data.length === 0) {
        alert(`Chưa có bảng giá Admin!`); STATE.currentAdminPrices = [];
    } else {
        STATE.currentAdminPrices = data;
        if (window.addCustomSaleRow) {
            const container = document.getElementById('salesDetailContainer');
            if (container) container.innerHTML = '';
            window.addCustomSaleRow();
        } else if (typeof ui_renderModelOptionsAll === 'function') ui_renderModelOptionsAll();
        alert(`Đã tải thành công ${data.length} mẫu xe!`);
    }
}

export async function api_loadSaleHistory() {
    if (STATE.assignedShopCodes.length === 0) return;
    
    const { data: soReports } = await sb.from('daily_so_reports').select('*').in('shop_code', STATE.assignedShopCodes).order('report_date', { ascending: false });
    const { data: mediaReports } = await sb.from('media_reports').select('*').in('shop_code', STATE.assignedShopCodes).order('report_date', { ascending: false });
    const { data: crmData } = await sb.from('crm_customers').select('*').in('shop_code', STATE.assignedShopCodes).order('created_at', { ascending: false });

    ui_renderHistorySO(soReports);
    ui_renderHistoryMedia(mediaReports);
    ui_renderHistoryCRM(crmData);
}

export async function api_submitReport(payload, editId) {
    if (editId) return await sb.from('daily_so_reports').update(payload).eq('id', editId); 
    return await sb.from('daily_so_reports').insert([payload]);
}

export async function api_deleteReport(id) {
    const { error } = await sb.from('daily_so_reports').delete().eq('id', id);
    if(error) throw error;
}

export async function api_getReportById(id) {
    return await sb.from('daily_so_reports').select('*').eq('id', id).single();
}

export async function api_approveReport(id) {
    const { error } = await sb.from('daily_so_reports').update({ status: 'approved' }).eq('id', id);
    if (error) throw error; return true;
}

export async function api_upsertTargets(payloads) {
    const { data, error } = await sb.from('kpi_targets').upsert(payloads, { onConflict: 'target_month, scope, reference_code' });
    if (error) throw error; return data;
}

export async function api_getTargets(month, scope, references) {
    const { data, error } = await sb.from('kpi_targets').select('*').eq('target_month', month).eq('scope', scope).in('reference_code', references);
    if (error) return []; return data;
}

export async function api_getActualPerformance(month, shopCodes) {
    const { data, error } = await sb.from('financial_reports').select('shop_code, sold_quantity, sales_detail_json').eq('report_month', month + '-01').in('shop_code', shopCodes).eq('status', 'approved'); 
    if (error) return []; return data;
}

// --- QUÊN MẬT KHẨU ---
export async function api_sendResetPasswordEmail(email) {
    const redirectUrl = window.location.origin + window.location.pathname;
    const { data, error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: redirectUrl,
    });
    if (error) throw error;
    return data;
}

export async function api_updatePassword(newPassword) {
    const { data, error } = await sb.auth.updateUser({
        password: newPassword
    });
    if (error) throw error;
    return data;
}