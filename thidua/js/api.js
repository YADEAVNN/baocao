import { sb, STATE } from './config.js';

// --- PHẦN 1: TÀI KHOẢN (AUTH) ---
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

export async function api_logout() {
    try { 
        await sb.auth.signOut(); 
    } catch (err) { 
        console.error("Lỗi khi đăng xuất:", err); 
    } finally {
        localStorage.clear(); 
        sessionStorage.clear();
        
        // Reset giao diện về màn hình đăng nhập
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
        
        const msg = document.getElementById('msg');
        if (msg) { msg.innerText = ''; msg.className = ''; }
    }
}

export async function api_checkSession() {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) return null;
    const { data: profile, error } = await sb.from('profiles').select('*').eq('id', session.user.id).single();
    if (error) console.error("Lỗi profile:", error);
    return profile;
}

// --- PHẦN 2: TẢI DỮ LIỆU ĐẠI LÝ (SHOPS) ---
export async function api_loadShopsAndLock(profile) {
    const { data: allShops } = await sb.from('master_shop_list').select('*');
    if (!allShops) return;

    allShops.forEach(s => STATE.globalShopMap[s.shop_code] = s);

    let myShops = [];
    const myName = profile.full_name ? profile.full_name.trim().toLowerCase() : "";
    const myRole = profile.role ? profile.role.trim().toLowerCase() : "";

    // Phân quyền tải dữ liệu: Admin nhìn hết, GĐ nhìn vùng, Sale nhìn đại lý
    if (myRole === 'admin') {
        myShops = allShops;
    } else if (myRole.includes('giám đốc')) {
        myShops = allShops.filter(s => {
            const dirName = s.director_name ? s.director_name.trim().toLowerCase() : "";
            const dirName2 = s.gd_mien ? s.gd_mien.trim().toLowerCase() : "";
            const dirName3 = s.regional_director ? s.regional_director.trim().toLowerCase() : "";
            return dirName === myName || dirName2 === myName || dirName3 === myName;
        });
    } else if (myRole.includes('cửa hàng')) {
        myShops = allShops.filter(s => s.shop_code && s.shop_code.trim().toLowerCase() === myName);
    } else {
        // NVKD: Kiểm tra dựa trên cột tên Sale quản lý
        myShops = allShops.filter(s => s.sale_name && s.sale_name.trim().toLowerCase() === myName);
    }

    STATE.globalAssignedShops = myShops;
    STATE.assignedShopCodes = myShops.map(s => s.shop_code);
}

// --- PHẦN 3: TẢI LỊCH SỬ THI ĐUA (S.O) ---
export async function api_loadSaleHistory() {
    if (!STATE.assignedShopCodes || STATE.assignedShopCodes.length === 0) return;
    
    // Chỉ tải dữ liệu bảng daily_so_reports phục vụ thi đua S.O
    const { data: soReports } = await sb.from('daily_so_reports')
        .select('*')
        .in('shop_code', STATE.assignedShopCodes)
        .order('report_date', { ascending: false });

    STATE.rawHistorySO = soReports || [];
    
    // Đẩy dữ liệu ra bảng hiển thị nếu hàm render tồn tại
    if (typeof window.applyHistoryFilter === 'function') {
        window.applyHistoryFilter();
    }
}

// --- PHẦN 4: KHÔI PHỤC MẬT KHẨU ---
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