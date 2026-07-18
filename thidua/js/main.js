import { STATE, sb } from './config.js';
import { api_checkSession, api_loadShopsAndLock, api_login, api_signup, api_logout, api_loadSaleHistory } from './api.js';

import { entryHTML } from './views/view-entry.js';
import { sellinHTML } from './views/view-sellin.js'; 
import { historyHTML } from './views/view-history.js'; 
import { targetHTML } from './views/view-target.js';
import { competitionHTML } from './views/view-competition.js';

window.STATE = STATE;
window.sb = sb; 

// ==========================================
// 1. CẤU HÌNH ROUTER
// ==========================================
const viewMap = {
    'sellout': entryHTML,
    'sellin': sellinHTML,
    'history': historyHTML, 
    'dashboard': targetHTML,
    'leaderboard': competitionHTML,
    'game01': '<div class="p-8 text-center text-gray-500 font-bold mt-10"><i class="fa-solid fa-gears text-4xl mb-4 text-gray-300"></i><br>Tính năng Game 01 đang được phát triển...</div>',
    'game02': '<div class="p-8 text-center text-gray-500 font-bold mt-10"><i class="fa-solid fa-gears text-4xl mb-4 text-gray-300"></i><br>Tính năng Game 02 đang được phát triển...</div>',
    'game03': '<div class="p-8 text-center text-gray-500 font-bold mt-10"><i class="fa-solid fa-gears text-4xl mb-4 text-gray-300"></i><br>Tính năng Game 03 đang được phát triển...</div>',
    'fund': '<div class="p-8 text-center text-gray-500 font-bold mt-10"><i class="fa-solid fa-gears text-4xl mb-4 text-gray-300"></i><br>Tính năng Quỹ đóng góp đang được phát triển...</div>',
    'reward': '<div class="p-8 text-center text-gray-500 font-bold mt-10"><i class="fa-solid fa-gears text-4xl mb-4 text-gray-300"></i><br>Tính năng Lịch sử thưởng đang được phát triển...</div>'
};

window.switchView = (viewId) => {
    const appContent = document.getElementById('app-content');
    if (viewMap[viewId]) {
        appContent.innerHTML = viewMap[viewId];
    }

    if (viewId === 'sellout' && window.STATE?.currentUser) {
        const saleNameEl = document.getElementById('display_sale_name');
        if (saleNameEl) {
            saleNameEl.innerText = window.STATE.currentUser.full_name || 'NVKD Thị Trường';
        }
        const dateInput = document.getElementById('so_daily_date');
        if (dateInput && !dateInput.value) { dateInput.value = new Date().toISOString().split('T')[0]; }
    }

    if (viewId === 'sellin') {
        const isAdmin = window.STATE?.currentUser?.role === 'Admin';
        document.getElementById('sellin_admin_panel')?.classList.toggle('hidden', !isAdmin);
        document.getElementById('sellin_access_denied')?.classList.toggle('hidden', isAdmin);
        
        if (isAdmin) {
            const dateInput = document.getElementById('sellin_date');
            if(dateInput && !dateInput.value) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
            if(typeof window.renderSellinTable === 'function') window.renderSellinTable();
        }
    }

    // Tự động load và lọc dữ liệu khi bấm vào tab Lịch Sử
    if (viewId === 'history' && typeof window.loadHistoryData === 'function') {
        window.updateHistoryFilters('init');
        window.loadHistoryData();
    }

    const allNavs = ['nav-dashboard', 'nav-sellout', 'nav-sellin', 'nav-history', 'nav-game01', 'nav-game02', 'nav-game03', 'nav-fund', 'nav-leaderboard', 'nav-reward'];
    allNavs.forEach(n => {
        const el = document.getElementById(n);
        if(el) {
            el.classList.remove('active');
            if(n === 'nav-dashboard') el.classList.remove('bg-[#F97316]', 'text-white');
        }
    });
    
    const targetNav = document.getElementById(`nav-${viewId}`);
    if (targetNav) {
        targetNav.classList.add('active');
        if(viewId === 'dashboard') targetNav.classList.add('bg-[#F97316]', 'text-white');
    }

    if (window.innerWidth < 768 && typeof window.toggleSidebar === 'function') window.toggleSidebar();
    
    if (viewId === 'dashboard' && typeof window.loadTargetDashboard === 'function') {
        window.updateTGTFilters('init');
        window.loadTargetDashboard('init');
    }
    if (viewId === 'leaderboard' && typeof window.loadCompetitionData === 'function') window.loadCompetitionData();
};

window.toggleSidebar = () => { 
    const sidebar = document.getElementById('sidebarMobile');
    if(sidebar) sidebar.classList.toggle('-translate-x-full'); 
};

// ==========================================
// 2. KHỞI TẠO VÀ XÁC THỰC
// ==========================================
async function init() {
    try {
        const profile = await api_checkSession();
        if (!profile) {
            document.getElementById('authContainer').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
            return;
        }

        STATE.currentUser = profile;
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('flex');
        
        if(document.getElementById('userDisplay')) document.getElementById('userDisplay').innerText = profile.full_name || "NVKD";
        if(document.getElementById('roleDisplay')) document.getElementById('roleDisplay').innerText = profile.role || "SALE";

        if (typeof api_loadShopsAndLock === 'function') {
            await api_loadShopsAndLock(profile);
        }
        
        window.switchView('sellout'); 

    } catch (err) { 
        console.error(err); 
        alert("Có lỗi khi tải ứng dụng. Vui lòng F5."); 
    }
}

document.getElementById('goSignup')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('loginFormSection').classList.add('hidden');
    document.getElementById('signupFormSection').classList.remove('hidden');
    document.getElementById('msg').innerText = ''; 
});

document.getElementById('goLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    document.getElementById('signupFormSection').classList.add('hidden');
    document.getElementById('loginFormSection').classList.remove('hidden');
    document.getElementById('msg').innerText = '';
});

if (document.getElementById('btnLogin')) {
    document.getElementById('btnLogin').onclick = async () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const msg = document.getElementById('msg');
        if (!email || !password) { msg.innerText = "Vui lòng nhập Email và Mật khẩu!"; return; }
        try {
            msg.className = "text-center text-xs font-bold mt-4 h-5 text-blue-500";
            msg.innerText = "Đang xử lý...";
            await api_login(email, password);
            msg.className = "text-center text-xs font-bold mt-4 h-5 text-green-500";
            msg.innerText = "Thành công! Đang tải dữ liệu...";
            await init(); 
        } catch (err) { 
            msg.className = "text-center text-xs font-bold mt-4 h-5 text-red-500";
            msg.innerText = "Đăng nhập thất bại: " + err.message; 
        }
    };
}

if (document.getElementById('btnSignup')) {
    document.getElementById('btnSignup').onclick = async () => {
        const name = document.getElementById('reg_name').value.trim();
        const email = document.getElementById('reg_email').value.trim();
        const password = document.getElementById('reg_pass').value.trim();
        const role = document.getElementById('reg_role').value;
        const msg = document.getElementById('msg');

        if (!name || !email || !password) { 
            msg.className = "text-center text-xs font-bold mt-4 h-5 text-red-500";
            msg.innerText = "Vui lòng nhập đầy đủ thông tin!"; 
            return; 
        }
        
        try {
            msg.className = "text-center text-xs font-bold mt-4 h-5 text-blue-500";
            msg.innerText = "Đang tạo tài khoản...";
            
            await api_signup(email, password, role, name);
            
            msg.className = "text-center text-xs font-bold mt-4 h-5 text-green-500";
            msg.innerText = "Đăng ký thành công! Đang tự động chuyển về Đăng nhập...";
            
            setTimeout(() => {
                document.getElementById('signupFormSection').classList.add('hidden');
                document.getElementById('loginFormSection').classList.remove('hidden');
                document.getElementById('email').value = email; 
                msg.innerText = "";
            }, 1500);

        } catch (err) { 
            msg.className = "text-center text-xs font-bold mt-4 h-5 text-red-500";
            msg.innerText = "Đăng ký thất bại: " + err.message; 
        }
    };
}

if(document.getElementById('btnLogout')) { document.getElementById('btnLogout').onclick = api_logout; }

// ==========================================
// 3. LOGIC NHẬP LIỆU SELL-OUT & CẢNH BÁO
// ==========================================
window.submitDailySO = async () => {
    const btn = document.getElementById('btnSubmitSO');
    const editId = document.getElementById('editReportId')?.value;
    
    if(btn) {
        btn.disabled = true; 
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG GỬI...';
    }
    
    const qty = parseInt(document.getElementById('sold_quantity').value) || 0;
    const currentSaleName = window.STATE?.currentUser?.full_name || '';

    const payload = {
        report_date: document.getElementById('so_daily_date').value,
        total_so: qty,
        sale_name: currentSaleName, 
        status: 'pending' 
    };

    try {
        if (editId) {
            const { error } = await window.sb.from('daily_so_reports').update(payload).eq('id', editId);
            if (error) throw error;
            alert("✅ Đã cập nhật thành công!");
            if(document.getElementById('editReportId')) document.getElementById('editReportId').value = ""; 
        } else {
            const { data: existing } = await window.sb.from('daily_so_reports')
                .select('*')
                .eq('report_date', payload.report_date)
                .eq('sale_name', currentSaleName)
                .maybeSingle();

            if (existing) {
                payload.total_so += (existing.total_so || 0); 
                const { error } = await window.sb.from('daily_so_reports').update(payload).eq('id', existing.id);
                if (error) throw error;
                alert("✅ Đã cộng dồn thành công vào báo cáo hôm nay!");
            } else {
                const { error } = await window.sb.from('daily_so_reports').insert([payload]);
                if (error) throw error;
                alert("✅ Ghi nhận kết quả Sell-Out thành công!");
            }
        }
        
        document.getElementById('sold_quantity').value = "0"; 
        if (document.getElementById('so_note')) document.getElementById('so_note').value = "";
        
        window.switchView('dashboard');

    } catch(err) { 
        alert("Lỗi: " + err.message); 
    } finally { 
        if(btn) {
            btn.disabled = false; 
            btn.innerHTML = '<i class="fa-solid fa-check"></i> XÁC NHẬN KẾT QUẢ';
        }
    }
};

window.showMissingReportsModal = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const expectedDates = [];
    
    for (let d = startOfMonth; d <= today; d.setDate(d.getDate() + 1)) {
        expectedDates.push(d.toISOString().split('T')[0]);
    }

    if (!window.STATE.globalAssignedShops) {
        alert("Chưa tải được danh sách NVKD!");
        return;
    }
    const allSales = [...new Set(window.STATE.globalAssignedShops.map(s => s.sale_name).filter(Boolean))];
    const submittedReports = window.STATE.rawHistorySO || [];

    let missingAlerts = "";
    let totalMissing = 0;

    allSales.forEach(sale => {
        const saleReports = submittedReports.filter(r => r.sale_name === sale);
        const submittedDates = saleReports.map(r => r.report_date);
        const missingDates = expectedDates.filter(date => !submittedDates.includes(date));

        if (missingDates.length > 0) {
            totalMissing++;
            const formattedDates = missingDates.map(d => {
                const parts = d.split('-');
                return `${parts[2]}/${parts[1]}`;
            }).join(', ');
            missingAlerts += `NVKD: [${sale}]\n🚨 Thiếu ${missingDates.length} ngày: ${formattedDates}\n\n`;
        }
    });

    const contentEl = document.getElementById('missingReportContent');
    if (contentEl) {
        if (totalMissing === 0) {
            contentEl.innerHTML = `<div class="text-green-600 font-black text-center p-4">✅ Toàn bộ NVKD đã nhập đủ số liệu S.O tháng này!</div>`;
        } else {
            contentEl.innerText = missingAlerts.trim();
        }
        const modal = document.getElementById('missingReportModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    } else {
        alert(missingAlerts || "Tất cả NVKD đã nhập đủ báo cáo!");
    }
};

window.closeMissingReportsModal = () => {
    const modal = document.getElementById('missingReportModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

window.copyMissingReports = () => {
    const content = document.getElementById('missingReportContent')?.innerText;
    if (content && content.includes('Thiếu')) {
        const header = "⚠️ CẢNH BÁO KỶ LUẬT NHẬP S.O ⚠️\n(Tính từ đầu tháng đến nay)\n\n";
        navigator.clipboard.writeText(header + content).then(() => {
            alert("✅ Đã copy danh sách NVKD nhập thiếu!\nBạn có thể dán (Paste) ngay vào Zalo Group.");
        }).catch(err => alert("Lỗi copy: " + err));
    } else {
        alert("Không có dữ liệu thiếu để copy!");
    }
};

// ==========================================
// 4. LOGIC QUẢN LÝ SELL-IN (ADMIN ONLY - DASHBOARD & MATRIX)
// ==========================================
const SELLIN_REGIONS = [
    { id: 1, dir_vi: "Khổng Văn Trọng", reg_vi: "Tây Bắc Bộ", target: 3110 },
    { id: 2, dir_vi: "Khuất Văn Đức", reg_vi: "Hà Nội", target: 4390 },
    { id: 3, dir_vi: "Trịnh Trần Cường", reg_vi: "Đông Bắc", target: 4240 },
    { id: 4, dir_vi: "Đỗ Tuấn Minh", reg_vi: "Hồng Hà", target: 2540 },
    { id: 5, dir_vi: "Nông Đức Long", reg_vi: "Bắc Trung Bộ", target: 3430 },
    { id: 6, dir_vi: "Bùi Minh Trung", reg_vi: "Trung Trung Bộ", target: 2200 },
    { id: 7, dir_vi: "Cấn Đình Nguyên", reg_vi: "Nam Trung Bộ", target: 2240 },
    { id: 8, dir_vi: "Lê Thế Duy", reg_vi: "Tây Nguyên", target: 2850 },
    { id: 9, dir_vi: "Nguyễn Văn Hùng", reg_vi: "Đông Nam", target: 3930 },
    { id: 10, dir_vi: "Nguyễn Thành Nam", reg_vi: "HCM", target: 5760 },
    { id: 11, dir_vi: "Trần Đức Cường", reg_vi: "Tây Nam", target: 2760 },
    { id: 12, dir_vi: "Bùi Trung Tuấn", reg_vi: "Sông Cửu Long", target: 2550 },
    { id: 13, dir_vi: "---", reg_vi: "Mua nhóm", target: 0 },
    { id: 14, dir_vi: "---", reg_vi: "Bán lẻ", target: 0 }
];

// Khởi tạo tab khi bấm vào menu Sellin
if (typeof window.switchView !== 'undefined') {
    const originalSwitchView = window.switchView;
    window.switchView = (viewId) => {
        originalSwitchView(viewId);
        if (viewId === 'sellin') {
            const isAdmin = window.STATE?.currentUser?.role === 'Admin';
            document.getElementById('sellin_admin_panel')?.classList.toggle('hidden', !isAdmin);
            document.getElementById('sellin_access_denied')?.classList.toggle('hidden', isAdmin);
            
            if (isAdmin) {
                const monthInput = document.getElementById('sellin_month');
                if(monthInput && !monthInput.value) {
                    const d = new Date();
                    monthInput.value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                }
                window.loadSellinData(); // Tải dữ liệu ngay khi vào
            }
        }
    };
}

// Chuyển đổi Tab Dashboard và Tab Matrix
window.toggleSellinView = (viewType) => {
    const dbView = document.getElementById('sellinView_dashboard');
    const mxView = document.getElementById('sellinView_matrix');
    const btnDb = document.getElementById('btnTab_sellinDashboard');
    const btnMx = document.getElementById('btnTab_sellinMatrix');

    if(viewType === 'dashboard') {
        dbView.classList.remove('hidden'); mxView.classList.add('hidden');
        btnDb.className = "px-6 py-2.5 rounded-lg font-black text-sm uppercase transition bg-white text-blue-600 shadow-sm";
        btnMx.className = "px-6 py-2.5 rounded-lg font-black text-sm uppercase transition text-slate-500 hover:text-slate-700";
    } else {
        dbView.classList.add('hidden'); mxView.classList.remove('hidden');
        btnMx.className = "px-6 py-2.5 rounded-lg font-black text-sm uppercase transition bg-white text-blue-600 shadow-sm";
        btnDb.className = "px-6 py-2.5 rounded-lg font-black text-sm uppercase transition text-slate-500 hover:text-slate-700";
    }
};

// 1. LẤY DỮ LIỆU TỪ SUPABASE THEO THÁNG (ĐÃ FIX SẠCH SẼ)
window.loadSellinData = async () => {
    try {
        let monthVal = document.getElementById('sellin_month')?.value;
        if (!monthVal) {
            const d = new Date();
            monthVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            const monthInput = document.getElementById('sellin_month');
            if (monthInput) monthInput.value = monthVal;
        }

        const [year, month] = monthVal.split('-');
        const daysInMonth = new Date(year, month, 0).getDate();
        const startDate = `${monthVal}-01`; 
        const endDate = `${monthVal}-${daysInMonth}`;

        const { data: records, error } = await window.sb.from('daily_sellin_reports')
            .select('*')
            .gte('report_date', startDate)
            .lte('report_date', endDate);

        if (error) {
            alert("Lỗi tải dữ liệu: " + error.message);
            return;
        }
        
        window.STATE.rawSellinData = records || [];
        window.renderSellinDashboard();
        window.renderSellinMatrix();
    } catch (err) {
        console.error("Lỗi tải Sell-in:", err);
        alert("Lỗi tải dữ liệu Sell-in: " + err.message);
    }
};

// 2. VẼ DASHBOARD & TÍNH TOÁN XẾP HẠNG
window.renderSellinDashboard = () => {
    const tbody = document.getElementById('sellin_dashboard_body');
    const tfoot = document.getElementById('sellin_dashboard_foot');
    if (!tbody) return;

    const rawData = window.STATE.rawSellinData || [];
    
    // Tổng hợp dữ liệu lũy kế cho từng khu vực
    let stats = SELLIN_REGIONS.map(reg => {
        // Lọc tất cả báo cáo của khu vực này trong tháng
        const regData = rawData.filter(r => r.region_id === reg.id);
        
        let sumPaid = 0;
        let sumShipped = 0;
        
        regData.forEach(d => {
            sumPaid += (parseInt(d.paid_day) || 0);
            sumShipped += (parseInt(d.shipped_day) || 0);
        });

        // Tính công thức
        let unShipped = sumPaid - sumShipped;
        let paidRate = reg.target > 0 ? (sumPaid / reg.target) * 100 : 0;
        let compRate = reg.target > 0 ? (sumShipped / reg.target) * 100 : 0; // Tỷ lệ hoàn thành Xuất Hàng
        
        return { 
            ...reg, 
            sumPaid, sumShipped, unShipped, paidRate, compRate 
        };
    });

    // Tạo bảng Xếp Hạng Dựa trên Tỷ Lệ Hoàn Thành Xuất Hàng (Chỉ xếp hạng 1-12)
    let rankData = [...stats].filter(s => s.id <= 12).sort((a, b) => b.compRate - a.compRate);

    let totalTarget = 0, totalPaid = 0, totalShipped = 0, totalUnshipped = 0;

    // Render HTML
    tbody.innerHTML = stats.map(s => {
        let isSpecial = s.id > 12; // Mua nhóm & Bán lẻ
        let rankStr = '-';
        let rankClass = 'text-slate-600';
        
        if (!isSpecial) {
            let rankIndex = rankData.findIndex(r => r.id === s.id);
            rankStr = rankIndex + 1;
            // Highlight Top 3 và Bottom
            if(rankStr <= 3) rankClass = 'text-red-600 font-black bg-red-50';
            else if(rankStr >= 10) rankClass = 'text-gray-400 font-bold bg-gray-50';
            else rankClass = 'text-indigo-600 font-black';
        }

        totalTarget += s.target;
        totalPaid += s.sumPaid;
        totalShipped += s.sumShipped;
        totalUnshipped += s.unShipped;

        return `
        <tr class="hover:bg-slate-50 transition border-b border-gray-100">
            <td class="p-4 border-r border-gray-100 text-gray-500">${s.id}</td>
            <td class="p-4 border-r border-gray-100 text-left font-black text-slate-800">${s.dir_vi}</td>
            <td class="p-4 border-r border-gray-100 text-left font-bold text-slate-600">${s.reg_vi}</td>
            <td class="p-4 border-r border-blue-100 bg-blue-50/30 text-slate-600 font-bold">${s.target > 0 ? s.target : '-'}</td>
            <td class="p-4 border-r border-gray-100 font-bold text-slate-700 text-lg">${s.sumPaid}</td>
            <td class="p-4 border-r border-yellow-200 font-black text-orange-600 text-lg bg-orange-50/30">${s.sumShipped}</td>
            <td class="p-4 border-r border-gray-100 font-bold ${s.unShipped > 0 ? 'text-red-500' : 'text-gray-400'}">${s.unShipped}</td>
            <td class="p-4 border-r border-gray-100 font-bold text-slate-600">${s.target > 0 ? s.paidRate.toFixed(1) + '%' : '-'}</td>
            <td class="p-4 border-r border-gray-100 font-black text-green-600 bg-green-50/30 text-lg">${s.target > 0 ? s.compRate.toFixed(1) + '%' : '-'}</td>
            <td class="p-4 text-xl ${rankClass}">${rankStr}</td>
        </tr>`;
    }).join('');

    // Render Footer
    let tPaidRate = totalTarget > 0 ? ((totalPaid / totalTarget) * 100).toFixed(1) + '%' : '0%';
    let tCompRate = totalTarget > 0 ? ((totalShipped / totalTarget) * 100).toFixed(1) + '%' : '0%';

    tfoot.innerHTML = `
        <tr>
            <td colspan="3" class="p-4 text-right uppercase border-r border-slate-700">TỔNG DOANH SỐ VIỆT NAM</td>
            <td class="p-4 border-r border-slate-700">${totalTarget}</td>
            <td class="p-4 border-r border-slate-700 text-lg">${totalPaid}</td>
            <td class="p-4 border-r border-slate-700 text-orange-400 text-xl">${totalShipped}</td>
            <td class="p-4 border-r border-slate-700 text-red-400">${totalUnshipped}</td>
            <td class="p-4 border-r border-slate-700">${tPaidRate}</td>
            <td class="p-4 border-r border-slate-700 text-green-400 text-xl">${tCompRate}</td>
            <td class="p-4"></td>
        </tr>
    `;
};

// 3. VẼ MA TRẬN NHẬP LIỆU
window.renderSellinMatrix = () => {
    const container = document.getElementById('sellin_matrix_container');
    const monthStr = document.getElementById('sellin_month')?.value;
    if(!container || !monthStr) return;

    const parts = monthStr.split('-');
    const year = parseInt(parts[0], 10);
    const monthNum = parseInt(parts[1], 10);
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    
    const rawData = window.STATE.rawSellinData || [];

    // Pivot Data: pivot[region_id][day] = { paid, shipped, id }
    const pivot = {};
    SELLIN_REGIONS.forEach(r => { pivot[r.id] = {}; });
    
    rawData.forEach(d => {
        const day = parseInt(d.report_date.split('-')[2], 10);
        pivot[d.region_id][day] = {
            id: d.id,
            paid: d.paid_day,
            shipped: d.shipped_day
        };
    });

    // Tạo Header 1 -> 31
    let theadHTML = `<tr>
        <th class="p-3 sticky left-0 bg-slate-100 z-20 min-w-[180px] border-b border-gray-200 shadow-[1px_0_0_0_#e2e8f0]">Giám Đốc / Khu Vực</th>`;
    for (let d = 1; d <= daysInMonth; d++) {
        theadHTML += `<th class="p-2 text-center min-w-[50px] border-b border-gray-200 text-xs">${d}</th>`;
    }
    theadHTML += `</tr>`;

    // Tạo Body
    let tbodyHTML = '';
    SELLIN_REGIONS.forEach(reg => {
        let isSpecial = reg.id > 12;
        let rowHTML = `<td class="p-3 sticky left-0 ${isSpecial ? 'bg-gray-50' : 'bg-white'} font-bold text-slate-800 z-10 shadow-[1px_0_0_0_#f1f5f9] text-xs">
            ${reg.dir_vi}<br><span class="text-[10px] text-gray-500 uppercase">${reg.reg_vi}</span>
        </td>`;
        
        for (let d = 1; d <= daysInMonth; d++) {
            const cell = pivot[reg.id][d];
            const fullDate = `${year}-${String(monthNum).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
            
            if (cell) {
                // Nếu có dữ liệu, hiển thị số Xuất Hàng to màu cam, tooltip là thanh toán
                rowHTML += `<td class="p-1 text-center border-x border-gray-100 cursor-pointer hover:bg-orange-100 transition relative group" onclick="window.openSellinModal(${reg.id}, '${fullDate}', ${cell.paid}, ${cell.shipped})">
                    <div class="font-black text-orange-600 text-sm">${cell.shipped}</div>
                    <div class="text-[9px] text-gray-400 font-bold">P:${cell.paid}</div>
                </td>`;
            } else {
                // Ô trống
                rowHTML += `<td class="p-2 text-center text-gray-200 border-x border-gray-50 cursor-pointer hover:bg-blue-50 hover:text-blue-500 font-bold transition" onclick="window.openSellinModal(${reg.id}, '${fullDate}', 0, 0)">-</td>`;
            }
        }
        tbodyHTML += `<tr class="hover:bg-slate-50 border-b border-gray-100">${rowHTML}</tr>`;
    });

    container.innerHTML = `
        <table class="w-full text-left border-collapse whitespace-nowrap">
            <thead class="bg-[#F8FAFC] font-black text-slate-500 text-[11px] uppercase">${theadHTML}</thead>
            <tbody class="divide-y divide-gray-100">${tbodyHTML}</tbody>
        </table>
    `;
};

// 4. LOGIC MODAL NHẬP LIỆU
window.openSellinModal = (regionId, dateStr, currentPaid, currentShipped) => {
    const reg = SELLIN_REGIONS.find(r => r.id === regionId);
    
    // Đổ dữ liệu vào Modal
    document.getElementById('modal_sellin_title').innerText = `${reg.reg_vi} - Ngày ${dateStr.split('-')[2]}/${dateStr.split('-')[1]}`;
    document.getElementById('modal_sellin_region').value = regionId;
    document.getElementById('modal_sellin_date').value = dateStr;
    
    document.getElementById('modal_val_paid').value = currentPaid > 0 ? currentPaid : '';
    document.getElementById('modal_val_shipped').value = currentShipped > 0 ? currentShipped : '';

    // Hiển thị Modal
    const modal = document.getElementById('modal_sellinInput');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
    
    // Focus vào ô xuất hàng
    setTimeout(() => document.getElementById('modal_val_shipped').focus(), 100);
};

window.closeSellinModal = () => {
    const modal = document.getElementById('modal_sellinInput');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.saveSellinInput = async () => {
    const btn = document.getElementById('btnSaveSellinModal');
    const regionId = document.getElementById('modal_sellin_region').value;
    const reportDate = document.getElementById('modal_sellin_date').value;
    const paidVal = parseInt(document.getElementById('modal_val_paid').value) || 0;
    const shippedVal = parseInt(document.getElementById('modal_val_shipped').value) || 0;

    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang lưu...';

    try {
        // Kiểm tra xem record ngày hôm đó đã có chưa
        const existing = window.STATE.rawSellinData.find(r => r.region_id == regionId && r.report_date === reportDate);
        
        if (paidVal === 0 && shippedVal === 0) {
            // Nếu xóa trắng = Delete
            if (existing) {
                const { error } = await window.sb.from('daily_sellin_reports').delete().eq('id', existing.id);
                if (error) throw error;
            }
        } else {
            // Upsert: Cập nhật hoặc Thêm mới
            if (existing) {
                const { error } = await window.sb.from('daily_sellin_reports').update({
                    paid_day: paidVal,
                    shipped_day: shippedVal
                }).eq('id', existing.id);
                if (error) throw error;
            } else {
                const { error } = await window.sb.from('daily_sellin_reports').insert([{
                    report_date: reportDate,
                    region_id: regionId,
                    paid_day: paidVal,
                    shipped_day: shippedVal
                }]);
                if (error) throw error;
            }
        }

        window.closeSellinModal();
        // Reload lại dữ liệu từ server để cập nhật cả Dashboard và Matrix
        await window.loadSellinData(); 

    } catch (err) {
        alert("Lỗi lưu số liệu: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> Lưu Số Liệu';
    }
};