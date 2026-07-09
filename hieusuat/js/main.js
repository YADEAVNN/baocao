import { dictionary } from './i18n.js';
import { 
    api_checkSession, api_loadShopsAndLock, api_login, api_signup, api_logout, api_submitReport, api_getReportById, api_deleteReport, api_loadSaleHistory, api_approveReport, api_upsertTargets, api_getTargets, api_getActualPerformance, api_sendResetPasswordEmail, api_updatePassword 
} from './api.js';
import { STATE, sb } from './config.js';
import { switchView, toggleSidebar, ui_showMsg, ui_updateSVNOptions, ui_updateDVNOptions, ui_addSaleRow, calcAll, calcRow, exportHistoryExcel, updateChartFilters, ui_updateShopInfo, ui_renderModelOptionsAll, applyHistoryFilter, updateHistoryFilters } from './ui.js';
import { loadOverviewDashboard, loadTargetDashboard } from './charts.js';
import { parseNumber, fmn, calcKPI } from './utils.js';

window.STATE = STATE;
window.sb = sb; 
window.currentLeaderboardData = { rev: [], disc: [] };

window.refreshCRMCarList = () => {
    const crmSelect = document.getElementById('crm_model');
    if (crmSelect && window.STATE && window.STATE.currentAdminPrices && window.STATE.currentAdminPrices.length > 0) {
        const currentVal = crmSelect.value;
        crmSelect.innerHTML = '<option value="">-- Chọn xe --</option>' + window.STATE.currentAdminPrices.map(p => `<option value="${p.model}">${p.model}</option>`).join('');
        crmSelect.value = currentVal;
    }
};

async function init() {
    try {
        const profile = await api_checkSession();
        if (!profile || !profile.is_approved) {
            document.getElementById('authContainer').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
            const { data: { session } } = await sb.auth.getSession();
            if (session && !profile) ui_showMsg("Lỗi: Tài khoản của bạn không có Profile trong hệ thống.", "red");
            if (profile && !profile.is_approved) { ui_showMsg("Tài khoản của bạn đang chờ phê duyệt.", "red"); await api_logout(); }
            return;
        }

        STATE.currentUser = profile;
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('flex');
        document.body.style.fontFamily = "'Roboto', sans-serif";
        
        if(document.getElementById('userDisplay')) document.getElementById('userDisplay').innerText = profile.full_name || "User";
        if(document.getElementById('roleDisplay')) document.getElementById('roleDisplay').innerText = profile.role || "SALE";

        await api_loadShopsAndLock(profile);
        
        try {
            let month = new Date().toISOString().slice(0, 7);
            const parts = month.split('-');
            
            let { data } = await sb.from('monthly_product_prices')
                .select('*')
                .or(`report_month.eq.${month},report_month.eq.${parts[1]}/${parts[0]},report_month.eq.${parseInt(parts[1])}/${parts[0]}`);
            
            if (!data || data.length === 0) {
                const { data: fallbackData } = await sb.from('monthly_product_prices').select('*').order('created_at', { ascending: false });
                if (fallbackData && fallbackData.length > 0) {
                    const uniqueModels = [];
                    const map = new Map();
                    for (const item of fallbackData) {
                        if (!map.has(item.model)) { map.set(item.model, true); uniqueModels.push(item); }
                    }
                    data = uniqueModels; 
                }
            }

            if (data && data.length > 0) {
                STATE.currentAdminPrices = data;
                const container = document.getElementById('salesDetailContainer');
                if (container && container.innerHTML.trim() === '' && typeof window.addCustomSaleRow === 'function') {
                    window.addCustomSaleRow();
                }
                window.refreshCRMCarList();
            }
        } catch(e) { console.warn("Lỗi khi tải ngầm danh sách xe:", e); }

        if (!STATE.globalAssignedShops || STATE.globalAssignedShops.length === 0) { alert("CẢNH BÁO: Tài khoản chưa được gán Shop nào."); }

        const originalSwitchView = window.customSwitchView;
        if (originalSwitchView) {
            window.customSwitchView = (view) => {
                originalSwitchView(view);
                if (view === 'costs') window.refreshCRMCarList();
            };
        }

        switchView('sales'); 
        if(typeof window.loadLeaderboard === 'function') window.loadLeaderboard();

    } catch (err) { alert("Có lỗi khi tải ứng dụng. Vui lòng thử lại F5."); }
}

window.toggleSidebar = toggleSidebar;
window.switchView = switchView;
window.loadOverviewDashboard = loadOverviewDashboard;
window.loadTargetDashboard = loadTargetDashboard; 
window.addSaleRow = ui_addSaleRow;
window.calcAll = calcAll;
window.updateSVNOptions = ui_updateSVNOptions; 
window.updateDVNOptions = ui_updateDVNOptions; 
window.loadSaleHistory = api_loadSaleHistory;
window.ui_updateShopInfo = ui_updateShopInfo; 
window.applyHistoryFilter = applyHistoryFilter; 
window.exportHistoryExcel = exportHistoryExcel; 
window.updateHistoryFilters = updateHistoryFilters; 

if (document.getElementById('btnLogin')) {
    document.getElementById('btnLogin').onclick = async () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        if (!email || !password) { ui_showMsg("Vui lòng nhập Email và Mật khẩu!", "red"); return; }
        try {
            ui_showMsg("Đang xử lý...", "blue");
            await api_login(email, password);
            ui_showMsg("Thành công! Đang tải dữ liệu...", "green");
            await init(); 
        } catch (err) { ui_showMsg("Đăng nhập thất bại: " + err.message, "red"); }
    };
}

if(document.getElementById('btnSignup')) {
    document.getElementById('btnSignup').onclick = async () => {
        const e = document.getElementById('reg_email').value.trim();
        const p = document.getElementById('reg_pass').value.trim();
        const r = document.getElementById('reg_role').value;
        let n = document.getElementById('reg_name').value.trim(); 

        if (!e || !p || !n) { ui_showMsg("Vui lòng nhập đủ thông tin!", "red"); return; }

        if (r === 'Cửa hàng') {
            n = n.toUpperCase().replace(/\s+/g, '');
            if (!n.startsWith('DVN')) { ui_showMsg("Lỗi: Nhân viên Cửa hàng bắt buộc nhập mã DVN (Ví dụ: DVN590013) vào ô Họ Tên!", "red"); return; }
        }

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

sb.auth.onAuthStateChange(async (event, session) => {
    if (event === 'PASSWORD_RECOVERY') {
        document.getElementById('authContainer').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('hidden');
        
        ['loginFormSection', 'signupFormSection', 'forgotPasswordFormSection'].forEach(id => {
            const el = document.getElementById(id);
            if(el) el.classList.add('hidden');
        });
        const elUpdate = document.getElementById('updatePasswordFormSection');
        if(elUpdate) elUpdate.classList.remove('hidden');
        ui_showMsg("Vui lòng nhập mật khẩu mới.", "blue");
    }
});

if(document.getElementById('goForgotPassword')) {
    document.getElementById('goForgotPassword').onclick = (e) => {
        e.preventDefault();
        document.getElementById('loginFormSection').classList.add('hidden');
        document.getElementById('forgotPasswordFormSection').classList.remove('hidden');
        ui_showMsg("", "");
    };
}

if(document.getElementById('goLoginFromForgot')) {
    document.getElementById('goLoginFromForgot').onclick = (e) => {
        e.preventDefault();
        document.getElementById('forgotPasswordFormSection').classList.add('hidden');
        document.getElementById('loginFormSection').classList.remove('hidden');
        ui_showMsg("", "");
    };
}

if(document.getElementById('btnSendReset')) {
    document.getElementById('btnSendReset').onclick = async () => {
        const email = document.getElementById('forgot_email').value.trim();
        if (!email) { ui_showMsg("Vui lòng nhập Email!", "red"); return; }
        try {
            ui_showMsg("Đang gửi email...", "blue");
            await api_sendResetPasswordEmail(email);
            ui_showMsg("Đã gửi liên kết! Vui lòng kiểm tra hộp thư (cả mục Spam).", "green");
        } catch(err) { ui_showMsg("Lỗi: " + err.message, "red"); }
    };
}

if(document.getElementById('btnUpdatePassword')) {
    document.getElementById('btnUpdatePassword').onclick = async () => {
        const newPass = document.getElementById('new_password').value.trim();
        if (!newPass || newPass.length < 6) { ui_showMsg("Mật khẩu mới phải có ít nhất 6 ký tự!", "red"); return; }
        try {
            ui_showMsg("Đang cập nhật...", "blue");
            await api_updatePassword(newPass);
            ui_showMsg("Đổi mật khẩu thành công! Đang chuyển hướng...", "green");
            setTimeout(() => { window.location.reload(); }, 2000);
        } catch(err) { ui_showMsg("Lỗi: " + err.message, "red"); }
    };
}

window.formatCurrency = (input) => { let val = input.value.replace(/\D/g, ""); if (val === "") { input.value = ""; return; } input.value = new Intl.NumberFormat('vi-VN').format(parseInt(val)); if (input.closest('tr')) calcRow(input); };
window.fmn = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n));

window.submitDailySO = async () => {
    const btn = document.getElementById('btnSubmitSO');
    const editId = document.getElementById('editReportId').value;
    btn.disabled = true; document.getElementById('btnSubmitText').innerText = 'ĐANG GỬI...';
    
    const details = [];
    let missingModel = false;
    document.querySelectorAll('.sale-item-card').forEach(card => {
        const model = card.querySelector('.model-select').value;
        const qty = parseInt(card.querySelector('.qty-so-input').value) || 0;
        if(!model) missingModel = true;
        if(model) details.push({ model, qty_so: qty });
    });
    
    if (details.length > 0 && missingModel) {
        alert(window.t("Vui lòng chọn mẫu xe hoặc xóa dòng trống!"));
        btn.disabled = false; document.getElementById('btnSubmitText').innerText = editId ? 'LƯU THAY ĐỔI' : 'GỬI BÁO CÁO';
        return;
    }

    const payload = {
        report_date: document.getElementById('so_daily_date').value,
        shop_code: document.getElementById('select_shop_so').value,
        total_so: parseInt(document.getElementById('sold_quantity').value) || 0,
        traffic_natural: parseInt(document.getElementById('traffic_natural').value) || 0,
        traffic_leads: parseInt(document.getElementById('traffic_leads').value) || 0,
        models_detail: details,
        status: 'approved',
        sale_name: window.STATE?.currentUser?.full_name || ''
    };

    try {
        if (editId) {
            const { error } = await window.sb.from('daily_so_reports').update(payload).eq('id', editId);
            if (error) throw error;
            alert("✅ Đã cập nhật thành công!");
            cancelEdit();
        } else {
            const { data: existing } = await window.sb.from('daily_so_reports').select('*').eq('report_date', payload.report_date).eq('shop_code', payload.shop_code).maybeSingle();

            if (existing) {
                let mergedDetails = [];
                try { mergedDetails = typeof existing.models_detail === 'string' ? JSON.parse(existing.models_detail) : (existing.models_detail || []); } catch(e) {}
                
                payload.models_detail.forEach(newItem => {
                    let found = mergedDetails.find(x => x.model === newItem.model);
                    if(found) found.qty_so += newItem.qty_so;
                    else mergedDetails.push(newItem);
                });

                payload.models_detail = mergedDetails;
                payload.total_so += (existing.total_so || 0);
                payload.traffic_natural += (existing.traffic_natural || 0);
                payload.traffic_leads += (existing.traffic_leads || 0);

                const { error } = await window.sb.from('daily_so_reports').update(payload).eq('id', existing.id);
                if (error) throw error;
                alert("✅ Đã cộng dồn thành công vào báo cáo hôm nay!");
            } else {
                const { error } = await window.sb.from('daily_so_reports').insert([payload]);
                if (error) throw error;
                alert(window.t("msg_success_report") || "✅ Tạo báo cáo thành công!");
            }
            
            document.getElementById('traffic_natural').value = '';
            document.getElementById('traffic_leads').value = '';
            document.getElementById('salesDetailContainer').innerHTML = '';
            window.recalcSOTotal();
            if(typeof window.loadLeaderboard === 'function') window.loadLeaderboard();
        }
        window.customSwitchView('history');
        window.switchHistoryTab('so');
    } catch(err) { alert("Lỗi: " + err.message); } 
    finally { btn.disabled = false; document.getElementById('btnSubmitText').innerText = editId ? 'LƯU THAY ĐỔI' : 'GỬI BÁO CÁO'; }
};

window.editDailySO = async (id) => {
    try {
        const { data: r, error } = await window.sb.from('daily_so_reports').select('*').eq('id', id).single();
        if (error) throw error;
        if (!r) return;
        
        window.customSwitchView('sales');
        document.getElementById('editReportId').value = r.id;
        document.getElementById('editBanner').classList.remove('hidden');
        document.getElementById('btnCancelEdit').classList.remove('hidden');
        document.getElementById('entryTitle').innerText = "SỬA BÁO CÁO: " + r.report_date;
        document.getElementById('btnSubmitText').innerText = "Lưu Thay Đổi";
        
        document.getElementById('so_daily_date').value = r.report_date;
        document.getElementById('traffic_natural').value = r.traffic_natural || 0;
        document.getElementById('traffic_leads').value = r.traffic_leads || 0;
        document.getElementById('sold_quantity').value = r.total_so || 0;
        
        if (r.shop_code) {
            document.getElementById('hidden_shop_code').value = r.shop_code;
            const el = document.getElementById('select_shop_so');
            if(el) { el.value = r.shop_code; el.disabled = true; } 

            const shop = window.STATE.globalShopMap[r.shop_code];
            if (shop) {
                const updateTxt = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
                updateTxt('display_prov_svn', `${shop.province || ''} | ${shop.svn_code || ''}`);
            }
        }

        let month = r.report_date.slice(0, 7);
        const parts = month.split('-');
        const { data: prices } = await window.sb.from('monthly_product_prices')
            .select('*')
            .or(`report_month.eq.${month},report_month.eq.${parts[1]}/${parts[0]},report_month.eq.${parseInt(parts[1])}/${parts[0]}`);
        if (prices && prices.length > 0) {
            window.STATE.currentAdminPrices = prices;
        }
        
        const container = document.getElementById('salesDetailContainer');
        container.innerHTML = ''; 
        
        let details = r.models_detail || [];
        
        if (details.length === 0) {
           window.recalcSOTotal();
        } else {
           details.forEach(item => {
               const card = document.createElement('div');
               card.className = "sale-item-card bg-white border border-gray-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center gap-4 relative shadow-sm";
               
               let options = '<option value="" data-price="0">-- Chọn xe --</option>';
               if(window.STATE && window.STATE.currentAdminPrices && window.STATE.currentAdminPrices.length > 0) {
                   options += window.STATE.currentAdminPrices.map(p => {
                       const isSel = p.model === item.model ? 'selected' : '';
                       return `<option value="${p.model}" data-price="${p.selling_price}" ${isSel}>${p.model}</option>`
                   }).join('');
               } else {
                   options += `<option value="${item.model}" data-price="0" selected>${item.model}</option>`;
               }
               
               card.innerHTML = `
                    <div class="w-full md:flex-1">
                        <label class="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Mẫu xe</label>
                        <select class="model-select w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 focus:border-orange-500 outline-none truncate" onchange="window.updateCardRevenue(this)">${options}</select>
                    </div>
                    <div class="flex items-center justify-between gap-4 w-full md:w-auto">
                        <div class="w-24 shrink-0">
                            <label class="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Số lượng</label>
                            <input type="number" class="qty-so-input w-full text-center border border-gray-200 rounded-lg p-2.5 font-black text-slate-800 focus:border-orange-500 outline-none" value="${item.qty_so || 1}" min="1" oninput="window.updateCardRevenue(this)">
                        </div>
                        <div class="flex-1 text-right md:w-32">
                            <label class="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Tạm tính</label>
                            <span class="card-revenue-display text-base font-black text-[#F97316]">0đ</span>
                        </div>
                        <button type="button" onclick="this.closest('.sale-item-card').remove(); window.recalcSOTotal();" class="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition mt-4"><i class="fa-solid fa-trash-can text-lg"></i></button>
                    </div>
               `;
               container.appendChild(card);
           });
           document.querySelectorAll('.sale-item-card .model-select').forEach(sel => window.updateCardRevenue(sel));
        }
    } catch(err) { alert("Lỗi khi tải báo cáo: " + err.message); }
};

window.cancelEdit = () => {
    document.getElementById('editReportId').value = "";
    document.getElementById('editBanner').classList.add('hidden');
    document.getElementById('btnCancelEdit').classList.add('hidden');
    document.getElementById('entryTitle').innerText = window.t('title_so') || "1. Báo Cáo Ngày (S.O)";
    document.getElementById('btnSubmitText').innerText = "GỬI BÁO CÁO";
    
    document.getElementById('so_daily_date').value = new Date().toISOString().split('T')[0];
    document.getElementById('traffic_natural').value = '';
    document.getElementById('traffic_leads').value = '';
    document.getElementById('salesDetailContainer').innerHTML = '';
    
    const el = document.getElementById('select_shop_so');
    if(el) el.disabled = false;

    window.recalcSOTotal();
};

window.deleteDailySO = async (id) => {
    if(confirm("Bạn có chắc muốn xóa báo cáo S.O này?")) {
        try {
            const { error } = await window.sb.from('daily_so_reports').delete().eq('id', id);
            if (error) throw error;
            window.loadSaleHistory();
        } catch(err) { alert("Xóa lỗi: " + err.message); }
    }
};

window.addMediaLink = () => {
    const container = document.getElementById('media_link_container');
    const input = document.createElement('input');
    input.type = 'text';
    input.className = 'media-link-input form-input';
    input.placeholder = 'https://tiktok.com/...';
    container.appendChild(input);
};

window.submitMediaReport = async () => {
    const shopCode = document.getElementById('select_shop_media').value;
    const btn = document.getElementById('btnSubmitMedia');
    const editId = document.getElementById('editMediaId').value;
    btn.disabled = true; document.getElementById('btnSubmitMediaText').innerText = 'ĐANG GỬI...';

    const costStr = document.getElementById('media_cost').value.replace(/\D/g, "");

    const links = Array.from(document.querySelectorAll('.media-link-input'))
        .map(el => el.value.trim())
        .filter(v => v !== '')
        .join(', ');

    const payload = {
        report_date: document.getElementById('media_date').value,
        shop_code: shopCode,
        video_content: document.getElementById('media_content').value,
        tiktok_videos: parseInt(document.getElementById('media_tiktok').value) || 0,
        livestreams: parseFloat(document.getElementById('media_livestream').value) || 0,
        tiktok_views: parseInt(document.getElementById('media_views').value) || 0,
        marketing_cost: parseInt(costStr) || 0,
        media_link: links,
        offline_flyers: parseFloat(document.getElementById('media_flyer').value) || 0,
        notes: document.getElementById('media_notes').value,
        sale_name: window.STATE?.currentUser?.full_name || ''
    };
    try {
        if (editId) {
            const { error } = await window.sb.from('media_reports').update(payload).eq('id', editId);
            if (error) throw error;
            alert("✅ Đã cập nhật Truyền thông thành công!");
            window.cancelEditMedia();
        } else {
            const { error } = await window.sb.from('media_reports').insert([payload]);
            if (error) throw error;
            alert("✅ Lên báo cáo Truyền thông thành công!");
            window.cancelEditMedia();
        }
        window.customSwitchView('history');
        window.switchHistoryTab('media');
    } catch(err) { alert("Lỗi: " + err.message); } 
    finally { btn.disabled = false; document.getElementById('btnSubmitMediaText').innerText = editId ? 'LƯU THAY ĐỔI' : 'LƯU BÁO CÁO'; }
};

window.editMediaReport = async (id) => {
    try {
        const { data: r, error } = await window.sb.from('media_reports').select('*').eq('id', id).single();
        if (error) throw error;
        if (!r) return;
        
        window.customSwitchView('media');
        document.getElementById('editMediaId').value = r.id;
        document.getElementById('editMediaBanner').classList.remove('hidden');
        document.getElementById('btnCancelEditMedia').classList.remove('hidden');
        document.getElementById('btnSubmitMediaText').innerText = "LƯU THAY ĐỔI";
        
        document.getElementById('media_date').value = r.report_date;

        const el = document.getElementById('select_shop_media');
        if(el) { el.value = r.shop_code; el.disabled = true; } 

        document.getElementById('media_content').value = r.video_content || ''; 
        document.getElementById('media_tiktok').value = r.tiktok_videos || '';
        document.getElementById('media_views').value = r.tiktok_views || ''; 
        document.getElementById('media_cost').value = r.marketing_cost ? window.fmn(r.marketing_cost) : ''; 
        document.getElementById('media_livestream').value = r.livestreams || '';
        
        const container = document.getElementById('media_link_container');
        container.innerHTML = ''; 
        const linksArray = r.media_link ? r.media_link.split(',') : [''];
        
        if (linksArray.length === 0 || (linksArray.length === 1 && linksArray[0] === '')) {
            container.innerHTML = `<input type="text" class="media-link-input form-input" placeholder="https://tiktok.com/...">`;
        } else {
            linksArray.forEach((link) => {
                const input = document.createElement('input');
                input.type = 'text';
                input.className = 'media-link-input form-input';
                input.value = link.trim();
                container.appendChild(input);
            });
        }

        document.getElementById('media_flyer').value = r.offline_flyers || '';
        document.getElementById('media_notes').value = r.notes || '';
    } catch(err) { alert("Lỗi khi tải dữ liệu: " + err.message); }
};

window.cancelEditMedia = () => {
    document.getElementById('editMediaId').value = "";
    document.getElementById('editMediaBanner').classList.add('hidden');
    document.getElementById('btnCancelEditMedia').classList.add('hidden');
    document.getElementById('btnSubmitMediaText').innerText = "LƯU BÁO CÁO";
    
    document.getElementById('media_date').value = new Date().toISOString().split('T')[0];
    document.getElementById('media_content').value = ''; 
    document.getElementById('media_tiktok').value = '';
    document.getElementById('media_views').value = ''; 
    document.getElementById('media_cost').value = ''; 
    document.getElementById('media_livestream').value = '';
    
    document.getElementById('media_link_container').innerHTML = `<input type="text" class="media-link-input form-input" placeholder="https://tiktok.com/...">`;
    
    document.getElementById('media_flyer').value = '';
    document.getElementById('media_notes').value = '';

    const el = document.getElementById('select_shop_media');
    if(el) el.disabled = false;
};

window.submitCRM = async () => {
    const btn = document.getElementById('btnSubmitCRM');
    const editId = document.getElementById('editCRMId').value;
    btn.disabled = true; document.getElementById('btnSubmitCRMText').innerText = 'ĐANG LƯU...';
    
    const payload = {
        customer_name: document.getElementById('crm_name').value,
        phone: document.getElementById('crm_phone').value,
        address: document.getElementById('crm_address').value,
        model_interest: document.getElementById('crm_model').value,
        source: document.getElementById('crm_source').value,
        vin_plate: document.getElementById('crm_vin').value,
        status: document.getElementById('crm_status').value,
        notes: document.getElementById('crm_notes').value,
        shop_code: document.getElementById('select_shop_crm').value,
        sale_name: window.STATE?.currentUser?.full_name || ''
    };
    try {
        if(editId) {
            const { error } = await window.sb.from('crm_customers').update(payload).eq('id', editId);
            if (error) throw error;
            alert("✅ Đã cập nhật khách hàng thành công!");
            window.cancelEditCRM();
        } else {
            const { error } = await window.sb.from('crm_customers').insert([payload]);
            if (error) throw error;
            alert("✅ Đã lưu thông tin khách hàng!");
            document.querySelectorAll('#view-costs input[type="text"], #view-costs input[type="tel"], #view-costs textarea').forEach(el => el.value = ''); 
        }
        window.customSwitchView('history');
        window.switchHistoryTab('crm');
    } catch(err) { alert("Lỗi: " + err.message); } 
    finally { btn.disabled = false; document.getElementById('btnSubmitCRMText').innerText = editId ? 'LƯU THAY ĐỔI' : 'LƯU THÔNG TIN KHÁCH HÀNG'; }
};

window.editCRMReport = async (id) => {
    try {
        const { data: r, error } = await window.sb.from('crm_customers').select('*').eq('id', id).single();
        if (error) throw error;
        if (!r) return;
        
        window.customSwitchView('costs');
        document.getElementById('editCRMId').value = r.id;
        document.getElementById('editCRMBanner').classList.remove('hidden');
        document.getElementById('btnCancelEditCRM').classList.remove('hidden');
        document.getElementById('btnSubmitCRMText').innerText = "LƯU THAY ĐỔI";

        const el = document.getElementById('select_shop_crm');
        if(el) { el.value = r.shop_code; el.disabled = true; }
        
        document.getElementById('crm_name').value = r.customer_name || '';
        document.getElementById('crm_phone').value = r.phone || '';
        document.getElementById('crm_address').value = r.address || '';
        
        const crmModelSelect = document.getElementById('crm_model');
        if (crmModelSelect && r.model_interest) {
            let options = '<option value="">-- Chọn xe --</option>';
            if(window.STATE && window.STATE.currentAdminPrices) {
                options += window.STATE.currentAdminPrices.map(p => `<option value="${p.model}" ${p.model === r.model_interest ? 'selected' : ''}>${p.model}</option>`).join('');
            } else {
                options += `<option value="${r.model_interest}" selected>${r.model_interest}</option>`;
            }
            crmModelSelect.innerHTML = options;
        }

        document.getElementById('crm_source').value = r.source || 'TikTok';
        document.getElementById('crm_vin').value = r.vin_plate || '';
        document.getElementById('crm_status').value = r.status || 'Đang phân vân';
        document.getElementById('crm_notes').value = r.notes || '';
    } catch(err) { alert("Lỗi khi tải dữ liệu: " + err.message); }
};

window.cancelEditCRM = () => {
    document.getElementById('editCRMId').value = "";
    document.getElementById('editCRMBanner').classList.add('hidden');
    document.getElementById('btnCancelEditCRM').classList.add('hidden');
    document.getElementById('btnSubmitCRMText').innerText = "LƯU THÔNG TIN KHÁCH HÀNG";
    document.querySelectorAll('#view-costs input[type="text"], #view-costs input[type="tel"], #view-costs textarea').forEach(el => el.value = ''); 
    
    const el = document.getElementById('select_shop_crm');
    if(el) el.disabled = false;
    window.refreshCRMCarList();
};

window.addCustomSaleRow = () => {
    const container = document.getElementById('salesDetailContainer');
    if(!container) return;
    const card = document.createElement('div');
    card.className = "sale-item-card bg-white border border-gray-200 p-4 rounded-xl flex flex-col md:flex-row md:items-center gap-4 relative shadow-sm";
    
    let options = '<option value="" data-price="0">-- Chọn xe --</option>';
    if(window.STATE && window.STATE.currentAdminPrices && window.STATE.currentAdminPrices.length > 0) {
        options += window.STATE.currentAdminPrices.map(p => `<option value="${p.model}" data-price="${p.selling_price}">${p.model}</option>`).join('');
    }
    
    card.innerHTML = `
        <div class="w-full md:flex-1">
            <label class="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Mẫu xe</label>
            <select class="model-select w-full bg-gray-50 border border-gray-200 rounded-lg p-2.5 text-sm font-bold text-slate-700 focus:border-orange-500 outline-none truncate" onchange="window.updateCardRevenue(this)">${options}</select>
        </div>
        <div class="flex items-center justify-between gap-4 w-full md:w-auto">
            <div class="w-24 shrink-0">
                <label class="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Số lượng</label>
                <input type="number" class="qty-so-input w-full text-center border border-gray-200 rounded-lg p-2.5 font-black text-slate-800 focus:border-orange-500 outline-none" value="1" min="1" oninput="window.updateCardRevenue(this)">
            </div>
            <div class="flex-1 text-right md:w-32">
                <label class="text-[10px] text-gray-500 font-bold uppercase mb-1 block">Tạm tính</label>
                <span class="card-revenue-display text-base font-black text-[#F97316]">0đ</span>
            </div>
            <button type="button" onclick="this.closest('.sale-item-card').remove(); window.recalcSOTotal();" class="text-red-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition mt-4"><i class="fa-solid fa-trash-can text-lg"></i></button>
        </div>
    `;
    container.appendChild(card);
    window.recalcSOTotal();
};

window.updateCardRevenue = (el) => {
    const card = el.closest('.sale-item-card');
    const sel = card.querySelector('.model-select');
    const qty = parseInt(card.querySelector('.qty-so-input').value) || 0;
    const price = parseFloat(sel.options[sel.selectedIndex]?.getAttribute('data-price')) || 0;
    card.querySelector('.card-revenue-display').innerText = fmn(price * qty) + 'đ';
    window.recalcSOTotal();
};

window.recalcSOTotal = () => {
    let totalQty = 0, totalRev = 0;
    document.querySelectorAll('.sale-item-card').forEach(card => {
        const sel = card.querySelector('.model-select');
        const qty = parseInt(card.querySelector('.qty-so-input').value) || 0;
        const price = parseFloat(sel.options[sel.selectedIndex]?.getAttribute('data-price')) || 0;
        totalQty += qty; totalRev += (price * qty);
    });
    if(document.getElementById('sold_quantity')) document.getElementById('sold_quantity').value = totalQty;
    if(document.getElementById('total_so_revenue')) document.getElementById('total_so_revenue').innerText = fmn(totalRev) + 'đ';
};

window.generateCustomerQR = () => {
    const shopCode = document.getElementById('select_shop_crm').value;
    if (!shopCode) {
        alert("Vui lòng chọn cửa hàng trước!");
        return;
    }
    const shop = window.STATE.globalShopMap[shopCode];
    const shopName = shop ? shop.shop_name : shopCode;
    
    document.getElementById('qrShopName').innerText = shopName;
    
    const container = document.getElementById('qrcode_container');
    container.innerHTML = '';
    
    let currentPath = window.location.pathname;
    if (currentPath.endsWith('index.html')) currentPath = currentPath.replace('index.html', '');
    if (!currentPath.endsWith('/')) currentPath += '/';
    
    const url = window.location.origin + currentPath + 'khachhang.html?shop=' + shopCode;
    
    new QRCode(container, {
        text: url,
        width: 200,
        height: 200,
        colorDark : "#111827",
        colorLight : "#ffffff",
        correctLevel : QRCode.CorrectLevel.H
    });
    
    document.getElementById('qrGeneratorModal').classList.remove('hidden');
    document.getElementById('qrGeneratorModal').classList.add('flex');
};

window.closeQrGenerator = () => {
    document.getElementById('qrGeneratorModal').classList.add('hidden');
    document.getElementById('qrGeneratorModal').classList.remove('flex');
};

window.downloadCRMTemplate = () => {
    const data = [["Ngày (YYYY-MM-DD)", "Tên Khách Hàng*", "Số Điện Thoại", "Địa Chỉ", "Mẫu Xe Quan Tâm", "Nguồn Khách", "Số Khung/Biển Số", "Trạng Thái*", "Ghi Chú"]];
    const todayStr = new Date().toISOString().split('T')[0];
    data.push([todayStr, "Nguyễn Văn A", "0912345678", "Hóc Môn, TP.HCM", "VoltGuard P-L", "TikTok", "", "Đã chốt", "Khách hẹn cuối tuần ghé"]);
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Mau_Nhap_CRM");
    XLSX.writeFile(wb, "Template_Nhap_CRM.xlsx");
};

window.handleImportCRMExcel = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const btn = document.getElementById('btn_import_excel');
    if (btn) {
        btn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...`;
        btn.disabled = true;
    }

    const reader = new FileReader();
    reader.onload = async (e) => {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: 'yyyy-mm-dd' }); 

            if (jsonData.length <= 1) { alert("File Excel không có dữ liệu!"); return; }

            const shopCode = window.STATE?.assignedShopCodes[0] || ''; 
            const saleName = window.STATE?.currentUser?.full_name || '';

            if (!shopCode) { alert("Lỗi: Không tìm thấy mã Shop!"); return; }

            const { data: existingCustomers } = await window.sb.from('crm_customers').select('id, phone').eq('shop_code', shopCode);
            const phoneMap = {};
            if (existingCustomers) existingCustomers.forEach(c => { if (c.phone) phoneMap[c.phone] = c.id; });

            const inserts = [], updates = [];

            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i];
                if (!row || !row[1]) continue; 

                let phoneStr = row[2] ? String(row[2]).trim() : '';
                let rawStatus = row[7] ? String(row[7]).trim().toLowerCase() : '';
                let dbStatus = 'Đang phân vân';
                if (rawStatus.includes('mua xe') || rawStatus.includes('đã chốt') || rawStatus.includes('chốt') || rawStatus === 'mua') dbStatus = 'Đã mua xe';
                else if (rawStatus.includes('không mua') || rawStatus.includes('hủy') || rawStatus.includes('không')) dbStatus = 'Không mua';

                let dateVal = row[0] ? String(row[0]).trim() : new Date().toISOString().split('T')[0];
                if (dateVal.includes('/')) {
                    const p = dateVal.split('/');
                    if (p.length === 3 && p[2].length === 4) dateVal = `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
                }

                let record = {
                    created_at: dateVal + "T12:00:00Z", 
                    customer_name: String(row[1]).trim(), 
                    phone: phoneStr, 
                    address: row[3] ? String(row[3]).trim() : '',
                    model_interest: row[4] ? String(row[4]).trim() : '', 
                    source: row[5] ? String(row[5]).trim() : 'Khác',
                    vin_plate: row[6] ? String(row[6]).trim() : '', 
                    status: dbStatus, 
                    notes: row[8] ? String(row[8]).trim() : '',
                    shop_code: shopCode, 
                    sale_name: saleName
                };

                if (phoneStr && phoneMap[phoneStr]) { record.id = phoneMap[phoneStr]; updates.push(record); }
                else inserts.push(record);
            }

            if (inserts.length > 0) await window.sb.from('crm_customers').insert(inserts);
            if (updates.length > 0) await window.sb.from('crm_customers').upsert(updates);

            alert(`✅ Xử lý thành công! (Thêm mới: ${inserts.length}, Cập nhật: ${updates.length})`);
            if(typeof window.loadSaleHistory === 'function') await window.loadSaleHistory(); 

        } catch (err) { alert("Lỗi: " + err.message); } 
        finally { 
            event.target.value = ''; 
            if (btn) { btn.innerHTML = `<i class="fa-solid fa-upload"></i> Nhập Excel`; btn.disabled = false; }
        }
    };
    reader.readAsArrayBuffer(file);
};

window.currentLang = localStorage.getItem('yadea_lang') || 'vi';
window.t = (key) => {
    return (dictionary[window.currentLang] && dictionary[window.currentLang][key]) 
        ? dictionary[window.currentLang][key] 
        : key; 
};

window.updateLanguage = (lang) => {
    window.currentLang = lang;
    localStorage.setItem('yadea_lang', lang);
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dictionary[lang] && dictionary[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') { el.placeholder = dictionary[lang][key]; } 
            else { el.innerText = dictionary[lang][key]; }
        }
    });
};

window.toggleLanguage = () => {
    const newLang = window.currentLang === 'vi' ? 'zh' : 'vi';
    window.updateLanguage(newLang);
};
setTimeout(() => { window.updateLanguage(window.currentLang); }, 100);

// ==========================================
// LOGIC BẢNG XẾP HẠNG (LEADERBOARD) - BỘ LỌC TỔNG (GLOBAL FILTER)
// ==========================================
window.applyGlobalLeaderboardFilter = () => {
    const filterValue = document.getElementById('ld_global_filter')?.value || 'top';
    
    ['rev', 'disc'].forEach(type => {
        const container = document.getElementById(`ld_${type}_content`);
        if (!container || !window.currentLeaderboardData || !window.currentLeaderboardData[type]) return;

        const fullData = window.currentLeaderboardData[type];
        let displayData = [];
        
        if (filterValue === 'top') {
            displayData = fullData.slice(0, 10);
        } else if (filterValue === 'bottom') {
            displayData = fullData.slice(-10).reverse(); 
        } else {
            displayData = fullData; 
        }

        container.innerHTML = displayData.map(shop => {
            const rankDisplay = fullData.findIndex(x => x.code === shop.code) + 1;
            
            let crown = `<span class="text-xs font-bold text-gray-400">HẠNG ${rankDisplay}</span>`;
            if (filterValue === 'bottom' || rankDisplay > 3) {
                 crown = `<span class="text-xs font-bold text-gray-400">HẠNG ${rankDisplay}</span>`;
                 if (filterValue === 'bottom') {
                     crown = `⚠️ <span class="text-rose-500 font-black tracking-widest">HẠNG ${rankDisplay}</span>`;
                 }
            }
            
            if (rankDisplay === 1) crown = `👑 <span class="text-yellow-500 font-black tracking-widest">TOP 1</span>`;
            else if (rankDisplay === 2) crown = `🥈 <span class="text-slate-400 font-black tracking-widest">TOP 2</span>`;
            else if (rankDisplay === 3) crown = `🥉 <span class="text-amber-700 font-black tracking-widest">TOP 3</span>`;

            return `
            <div class="flex items-center justify-between p-3.5 bg-gray-50 rounded-xl border border-gray-100 hover:shadow-sm transition">
                <div class="flex items-center gap-4 w-full">
                    <div class="w-[70px] shrink-0 text-center">${crown}</div>
                    <div class="flex flex-col overflow-hidden w-full">
                        <span class="text-sm font-bold text-slate-700 truncate">${shop.name}</span>
                        <span class="text-[10px] text-gray-500 font-mono mt-0.5">${shop.code}</span>
                    </div>
                </div>
            </div>`;
        }).join('');
    });
};

window.loadLeaderboard = async () => {
    if (!window.STATE || !window.STATE.assignedShopCodes || window.STATE.assignedShopCodes.length === 0) return;
    
    const monthInput = document.getElementById('ld_filter_month');
    if (monthInput && !monthInput.value) {
        monthInput.value = new Date().toISOString().slice(0, 7);
    }
    const month = monthInput.value;
    const y = parseInt(month.split('-')[0]); const m = parseInt(month.split('-')[1]);
    const startOfMonth = `${month}-01`;
    const endOfMonth = `${month}-${new Date(y, m, 0).getDate().toString().padStart(2, '0')}`;

    try {
        const { data: prices } = await window.sb.from('monthly_product_prices').select('model, selling_price');
        const priceMap = {};
        if (prices) prices.forEach(p => priceMap[p.model] = p.selling_price || 0);

        const [soRes, allShopsRes] = await Promise.all([
            window.sb.from('daily_so_reports').select('shop_code, report_date, total_so, models_detail').gte('report_date', startOfMonth).lte('report_date', endOfMonth),
            window.sb.from('master_shop_list').select('shop_code, shop_name')
        ]);

        const allShops = allShopsRes.data || [];
        const shopStats = {};

        allShops.forEach(s => {
            shopStats[s.shop_code] = {
                name: s.shop_name,
                code: s.shop_code,
                total_revenue: 0,
                reportedDays: new Set()
            };
        });

        if (soRes.data) {
            soRes.data.forEach(r => {
                if (shopStats[r.shop_code]) {
                    shopStats[r.shop_code].reportedDays.add(r.report_date);
                    let details = [];
                    try { details = typeof r.models_detail === 'string' ? JSON.parse(r.models_detail) : (r.models_detail || []); } catch(e) {}
                    
                    details.forEach(d => {
                        const price = priceMap[d.model] || 0;
                        shopStats[r.shop_code].total_revenue += (d.qty_so || 0) * price;
                    });
                }
            });
        }

        const listShops = Object.values(shopStats);
        
        window.currentLeaderboardData.rev = [...listShops].sort((a, b) => b.total_revenue - a.total_revenue);
        window.currentLeaderboardData.disc = [...listShops].sort((a, b) => b.reportedDays.size - a.reportedDays.size);

        // Render List based on Global Filter
        window.applyGlobalLeaderboardFilter();

        // --- CẬP NHẬT GIAO DIỆN AVATAR VÀ THẺ VIP ---
        if (window.STATE && window.STATE.assignedShopCodes && window.STATE.assignedShopCodes.length > 0) {
            const myCode = window.STATE.assignedShopCodes[0];
            const myRevRank = window.currentLeaderboardData.rev.findIndex(x => x.code === myCode) + 1;
            const myDiscRank = window.currentLeaderboardData.disc.findIndex(x => x.code === myCode) + 1;

            const primaryRank = myRevRank > 0 ? myRevRank : (myDiscRank > 0 ? myDiscRank : 0);
            
            const avatarLetter = document.getElementById('avatarLetter');
            const avatarCrown = document.getElementById('avatarCrown');
            const avatarGlowRing = document.getElementById('avatarGlowRing');
            const avatarGlow = document.getElementById('avatarGlow');
            const badgeContainer = document.getElementById('premiumBadgesContainer');
            const userDisplay = document.getElementById('userDisplay');

            if (userDisplay) {
                userDisplay.innerText = window.STATE?.currentUser?.full_name || myCode;
            }

            if (avatarLetter) {
                if (primaryRank > 0) {
                    avatarLetter.innerText = primaryRank;
                } else {
                    avatarLetter.innerText = (STATE.currentUser?.full_name || "U").charAt(0).toUpperCase();
                }

                avatarLetter.className = 'w-14 h-14 rounded-full flex items-center justify-center font-black text-2xl shadow-inner border-2 border-slate-500 relative z-10 transition-colors duration-500';
                if (avatarCrown) avatarCrown.classList.add('hidden');
                if (avatarGlowRing) avatarGlowRing.className = 'hidden';
                if (avatarGlow) avatarGlow.className = "absolute inset-0 rounded-full blur-md opacity-0 transition-opacity duration-500";

                if (primaryRank === 1) {
                    if (avatarCrown) { avatarCrown.innerHTML = '<i class="fa-solid fa-crown text-yellow-400"></i>'; avatarCrown.classList.remove('hidden'); }
                    avatarLetter.classList.add('bg-gradient-to-br', 'from-yellow-300', 'to-yellow-600', 'text-yellow-900', 'border-yellow-200');
                    avatarLetter.classList.remove('border-slate-500');
                    if (avatarGlowRing) { avatarGlowRing.className = 'spin-ring'; avatarGlowRing.style.setProperty('--glow-color', '#facc15'); }
                    if (avatarGlow) avatarGlow.className = "absolute inset-0 rounded-full blur-xl opacity-100 bg-yellow-500 animate-pulse";
                } else if (primaryRank === 2) {
                    if (avatarCrown) { avatarCrown.innerHTML = '<i class="fa-solid fa-crown text-slate-300"></i>'; avatarCrown.classList.remove('hidden'); }
                    avatarLetter.classList.add('bg-gradient-to-br', 'from-slate-300', 'to-slate-500', 'text-slate-900', 'border-slate-200');
                    avatarLetter.classList.remove('border-slate-500');
                    if (avatarGlowRing) { avatarGlowRing.className = 'spin-ring'; avatarGlowRing.style.setProperty('--glow-color', '#cbd5e1'); }
                } else if (primaryRank === 3) {
                    if (avatarCrown) { avatarCrown.innerHTML = '<i class="fa-solid fa-crown text-orange-500"></i>'; avatarCrown.classList.remove('hidden'); }
                    avatarLetter.classList.add('bg-gradient-to-br', 'from-orange-400', 'to-orange-700', 'text-orange-50', 'border-orange-400');
                    avatarLetter.classList.remove('border-slate-500');
                    if (avatarGlowRing) { avatarGlowRing.className = 'spin-ring'; avatarGlowRing.style.setProperty('--glow-color', '#f97316'); }
                } else {
                    avatarLetter.classList.add('bg-slate-700', 'text-white');
                }
            }

            if(badgeContainer) {
                let html = '';
                const getBadgeHTML = (type, rank) => {
                    let colors = ''; let title = type === 'rev' ? 'DOANH THU' : 'KỶ LUẬT';
                    let icon = 'fa-medal';
                    if (rank === 1) colors = 'from-yellow-400 via-yellow-500 to-yellow-600 text-yellow-900 border-yellow-300 shadow-[0_0_15px_rgba(234,179,8,0.3)]';
                    else if (rank === 2) colors = 'from-slate-300 via-slate-400 to-slate-500 text-slate-900 border-slate-300 shadow-[0_0_10px_rgba(148,163,184,0.3)]';
                    else if (rank === 3) colors = 'from-orange-500 via-orange-600 to-orange-700 text-white border-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.3)]';
                    else return '';

                    return `
                    <div class="premium-badge flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r ${colors} border rounded-lg w-fit">
                        <i class="fa-solid ${icon} text-[12px]"></i>
                        <span class="text-[11px] font-black uppercase tracking-wider">TOP ${rank} ${title}</span>
                    </div>`;
                };

                if (myRevRank >= 1 && myRevRank <= 3) html += getBadgeHTML('rev', myRevRank);
                if (myDiscRank >= 1 && myDiscRank <= 3) html += getBadgeHTML('disc', myDiscRank);
                badgeContainer.innerHTML = html;
            }
        }
    } catch (err) { console.error("Lỗi dựng bảng xếp hạng: ", err); }
};