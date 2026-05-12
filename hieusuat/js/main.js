import { 
    api_checkSession, api_loadShopsAndLock, api_login, api_signup, api_logout, api_loadMonthlyModels, api_submitReport, api_getReportById, api_deleteReport, api_loadSaleHistory, api_approveReport, api_upsertTargets, api_getTargets, api_getActualPerformance, api_sendResetPasswordEmail, api_updatePassword 
} from './api.js';
import { STATE, sb } from './config.js';
import { switchView, switchChartTab, toggleSidebar, ui_showMsg, ui_updateSVNOptions, ui_updateDVNOptions, ui_addSaleRow, calcAll, calcRow, exportHistoryExcel, updateChartFilters, ui_updateShopInfo, ui_renderModelOptionsAll, applyHistoryFilter, updateHistoryFilters } from './ui.js';
import { loadOverviewDashboard, loadTargetDashboard } from './charts.js';
import { parseNumber, fmn, calcKPI } from './utils.js';

window.STATE = STATE;
window.sb = sb; 

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
        if(document.getElementById('avatarLetter')) document.getElementById('avatarLetter').innerText = (profile.full_name || "U").charAt(0).toUpperCase();

        await api_loadShopsAndLock(profile);
        
        if (!STATE.globalAssignedShops || STATE.globalAssignedShops.length === 0) {
            alert("CẢNH BÁO: Tài khoản chưa được gán Shop nào.");
        }

        switchView('sales'); 

    } catch (err) {
        console.error("Lỗi khởi tạo:", err);
        alert("Có lỗi khi tải ứng dụng. Vui lòng thử lại F5.");
    }
}

// BINDING
window.toggleSidebar = toggleSidebar;
window.switchView = switchView;
window.loadOverviewDashboard = loadOverviewDashboard;
window.loadTargetDashboard = loadTargetDashboard; 
window.loadMonthlyModels = api_loadMonthlyModels;
window.addSaleRow = ui_addSaleRow;
window.calcAll = calcAll;
window.updateSVNOptions = ui_updateSVNOptions; 
window.updateDVNOptions = ui_updateDVNOptions; 
window.loadSaleHistory = api_loadSaleHistory;
window.ui_updateShopInfo = ui_updateShopInfo; 
window.applyHistoryFilter = applyHistoryFilter; 
window.exportHistoryExcel = exportHistoryExcel; 
window.updateHistoryFilters = updateHistoryFilters; 

// AUTH
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

        if (!e || !p || !n) { 
            ui_showMsg("Vui lòng nhập đủ thông tin!", "red"); 
            return; 
        }

        if (r === 'Cửa hàng') {
            n = n.toUpperCase().replace(/\s+/g, '');
            if (!n.startsWith('DVN')) {
                ui_showMsg("Lỗi: Nhân viên Cửa hàng bắt buộc nhập mã DVN (Ví dụ: DVN590013) vào ô Họ Tên!", "red");
                return;
            }
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
        } catch (err) { 
            ui_showMsg(err.message, "red"); 
        }
    };
}

if(document.getElementById('goSignup')) { document.getElementById('goSignup').onclick = (e) => { e.preventDefault(); document.getElementById('loginFormSection').classList.add('hidden'); document.getElementById('signupFormSection').classList.remove('hidden'); ui_showMsg("", ""); }; }
if(document.getElementById('goLogin')) { document.getElementById('goLogin').onclick = (e) => { e.preventDefault(); document.getElementById('signupFormSection').classList.add('hidden'); document.getElementById('loginFormSection').classList.remove('hidden'); ui_showMsg("", ""); }; }
if(document.getElementById('btnLogout')) { document.getElementById('btnLogout').onclick = api_logout; }

// --- LOGIC QUÊN MẬT KHẨU ---
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
        } catch(err) {
            ui_showMsg("Lỗi: " + err.message, "red");
        }
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
            setTimeout(() => {
                window.location.reload(); 
            }, 2000);
        } catch(err) {
            ui_showMsg("Lỗi: " + err.message, "red");
        }
    };
}

window.formatCurrency = (input) => { let val = input.value.replace(/\D/g, ""); if (val === "") { input.value = ""; return; } input.value = new Intl.NumberFormat('vi-VN').format(parseInt(val)); if (input.closest('tr')) calcRow(input); };
window.formatInput = window.formatCurrency; 

// ==========================================
// CÁC HÀM XỬ LÝ LƯU / CHỐT S.O
// ==========================================
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
        alert("Vui lòng chọn mẫu xe hoặc xóa dòng trống!");
        btn.disabled = false; document.getElementById('btnSubmitText').innerText = editId ? 'LƯU THAY ĐỔI' : 'GỬI BÁO CÁO';
        return;
    }

    const payload = {
        report_date: document.getElementById('so_daily_date').value,
        shop_code: document.getElementById('hidden_shop_code').value,
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
            const { data: existing } = await window.sb.from('daily_so_reports')
                .select('*')
                .eq('report_date', payload.report_date)
                .eq('shop_code', payload.shop_code)
                .maybeSingle();

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
                alert("✅ Tạo báo cáo thành công!");
            }
            
            document.getElementById('traffic_natural').value = '';
            document.getElementById('traffic_leads').value = '';
            document.getElementById('salesDetailContainer').innerHTML = '';
            window.recalcSOTotal();
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
        document.getElementById('entryTitle').innerText = "Sửa Báo Cáo: " + r.report_date;
        document.getElementById('btnSubmitText').innerText = "Lưu Thay Đổi";
        
        document.getElementById('so_daily_date').value = r.report_date;
        document.getElementById('traffic_natural').value = r.traffic_natural || 0;
        document.getElementById('traffic_leads').value = r.traffic_leads || 0;
        document.getElementById('sold_quantity').value = r.total_so || 0;
        
        if (r.shop_code) {
            document.getElementById('hidden_shop_code').value = r.shop_code;
            const shop = window.STATE.globalShopMap[r.shop_code];
            if (shop) {
                const updateTxt = (id, val) => { if(document.getElementById(id)) document.getElementById(id).innerText = val; };
                updateTxt('display_prov_svn', `${shop.province || ''} | ${shop.svn_code || ''}`);
                updateTxt('display_shop_name', `${shop.shop_code} - ${shop.shop_name || ''}`);
            }
        }
        
        const container = document.getElementById('salesDetailContainer');
        container.innerHTML = ''; 
        
        let details = r.models_detail || [];
        
        if (details.length === 0) {
           window.recalcSOTotal();
        } else {
           details.forEach(item => {
               const card = document.createElement('div');
               card.className = "sale-item-card bg-white border border-gray-100 p-3 rounded-xl flex items-center gap-4";
               
               let options = '<option value="" data-price="0">-- Chọn xe --</option>';
               if(window.STATE && window.STATE.currentAdminPrices) {
                   options += window.STATE.currentAdminPrices.map(p => {
                       const isSel = p.model === item.model ? 'selected' : '';
                       return `<option value="${p.model}" data-price="${p.selling_price}" ${isSel}>${p.model}</option>`
                   }).join('');
               } else {
                   options += `<option value="${item.model}" data-price="0" selected>${item.model}</option>`;
               }
               
               card.innerHTML = `
                   <div class="flex-1"><select class="model-select w-full bg-gray-50 border rounded-lg p-2 text-sm font-bold" onchange="window.updateCardRevenue(this)">${options}</select></div>
                   <div class="w-20"><input type="number" class="qty-so-input w-full text-center border rounded-lg p-2 font-black" value="${item.qty_so || 1}" min="1" oninput="window.updateCardRevenue(this)"></div>
                   <div class="flex-1 text-right"><span class="card-revenue-display text-base font-black text-orange-600">0đ</span></div>
                   <button type="button" onclick="this.closest('.sale-item-card').remove(); window.recalcSOTotal();" class="text-red-400 p-2"><i class="fa-solid fa-trash-can"></i></button>
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
    document.getElementById('entryTitle').innerText = "1. Báo Cáo Ngày (S.O)";
    document.getElementById('btnSubmitText').innerText = "GỬI BÁO CÁO";
    
    document.getElementById('so_daily_date').value = new Date().toISOString().split('T')[0];
    document.getElementById('traffic_natural').value = '';
    document.getElementById('traffic_leads').value = '';
    document.getElementById('salesDetailContainer').innerHTML = '';
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

// ==========================================
// LOGIC BÁO CÁO TRUYỀN THÔNG
// ==========================================
window.submitMediaReport = async () => {
    const shopCode = document.getElementById('hidden_shop_code').value;
    const btn = document.getElementById('btnSubmitMedia');
    const editId = document.getElementById('editMediaId').value;
    btn.disabled = true; document.getElementById('btnSubmitMediaText').innerText = 'ĐANG GỬI...';

    const payload = {
        report_date: document.getElementById('media_date').value,
        shop_code: shopCode,
        tiktok_videos: parseInt(document.getElementById('media_tiktok').value) || 0,
        livestreams: parseFloat(document.getElementById('media_livestream').value) || 0,
        media_link: document.getElementById('media_link').value,
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
            document.getElementById('media_tiktok').value = '';
            document.getElementById('media_livestream').value = '';
            document.getElementById('media_link').value = '';
            document.getElementById('media_flyer').value = '';
            document.getElementById('media_notes').value = '';
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
        document.getElementById('media_tiktok').value = r.tiktok_videos || '';
        document.getElementById('media_livestream').value = r.livestreams || '';
        document.getElementById('media_link').value = r.media_link || '';
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
    document.getElementById('media_tiktok').value = '';
    document.getElementById('media_livestream').value = '';
    document.getElementById('media_link').value = '';
    document.getElementById('media_flyer').value = '';
    document.getElementById('media_notes').value = '';
};

// ==========================================
// LOGIC KHÁCH HÀNG CRM
// ==========================================
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
        shop_code: document.getElementById('hidden_shop_code').value,
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
            document.querySelectorAll('#view-costs input, #view-costs textarea, #view-costs select').forEach(el => el.value = ''); 
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
        
        document.getElementById('crm_name').value = r.customer_name || '';
        document.getElementById('crm_phone').value = r.phone || '';
        document.getElementById('crm_address').value = r.address || '';
        
        const crmModelSelect = document.getElementById('crm_model');
        if (crmModelSelect && r.model_interest) {
            let options = '<option value="">-- Nhấn nút Tải DS Xe --</option>';
            if(window.STATE && window.STATE.currentAdminPrices) {
                options = window.STATE.currentAdminPrices.map(p => `<option value="${p.model}" ${p.model === r.model_interest ? 'selected' : ''}>${p.model}</option>`).join('');
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
    document.querySelectorAll('#view-costs input, #view-costs textarea').forEach(el => el.value = ''); 
};

window.loadCRMModels = async () => {
    try {
        let month = new Date().toISOString().slice(0, 7); 
        const parts = month.split('-');
        
        const { data, error } = await window.sb.from('monthly_product_prices')
            .select('*')
            .or(`report_month.eq.${month},report_month.eq.${parts[1]}/${parts[0]},report_month.eq.${parseInt(parts[1])}/${parts[0]}`);
        
        if (error || !data || data.length === 0) {
            alert("Chưa có bảng giá Admin cập nhật cho tháng này!");
        } else {
            window.STATE.currentAdminPrices = data; 
            const crmSelect = document.getElementById('crm_model');
            if (crmSelect) {
                let options = '<option value="">-- Chọn xe --</option>';
                options += data.map(p => `<option value="${p.model}">${p.model}</option>`).join('');
                crmSelect.innerHTML = options;
            }
            alert(`✅ Đã tải thành công ${data.length} mẫu xe vào danh sách!`);
        }
    } catch (err) {
        alert("Lỗi tải xe: " + err.message);
    }
};

window.addCustomSaleRow = () => {
    const container = document.getElementById('salesDetailContainer');
    if(!container) return;
    const card = document.createElement('div');
    card.className = "sale-item-card bg-white border border-gray-100 p-3 rounded-xl flex items-center gap-4";
    
    let options = '<option value="" data-price="0">-- Chọn xe --</option>';
    if(window.STATE && window.STATE.currentAdminPrices) {
        options += window.STATE.currentAdminPrices.map(p => `<option value="${p.model}" data-price="${p.selling_price}">${p.model}</option>`).join('');
    }
    
    card.innerHTML = `
        <div class="flex-1"><select class="model-select w-full bg-gray-50 border rounded-lg p-2 text-sm font-bold" onchange="window.updateCardRevenue(this)">${options}</select></div>
        <div class="w-20"><input type="number" class="qty-so-input w-full text-center border rounded-lg p-2 font-black" value="1" min="1" oninput="window.updateCardRevenue(this)"></div>
        <div class="flex-1 text-right"><span class="card-revenue-display text-base font-black text-orange-600">0đ</span></div>
        <button type="button" onclick="this.closest('.sale-item-card').remove(); window.recalcSOTotal();" class="text-red-400 p-2"><i class="fa-solid fa-trash-can"></i></button>
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

// ==========================================
// TÍNH NĂNG NHẬP EXCEL CRM 
// ==========================================
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

        } catch (err) { 
            alert("Lỗi: " + err.message); 
        } finally { 
            event.target.value = ''; 
            if (btn) {
                btn.innerHTML = `<i class="fa-solid fa-upload"></i> Nhập Excel`; 
                btn.disabled = false; 
            }
        }
    };
    reader.readAsArrayBuffer(file);
};