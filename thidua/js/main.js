import { STATE, sb } from './config.js';
import { api_checkSession, api_loadShopsAndLock, api_login, api_signup, api_logout, api_loadSaleHistory } from './api.js';

import { entryHTML } from './views/view-entry.js';
import { historyHTML } from './views/view-history.js';
import { targetHTML } from './views/view-target.js';
import { competitionHTML } from './views/view-competition.js';

window.STATE = STATE;
window.sb = sb; 

// ==========================================
// GIAO DIỆN TĨNH CHO SELL-IN
// ==========================================
const sellinHTML = `
<div class="p-4 md:p-6 fade-in w-full mx-auto max-w-[1400px]">
    <div id="sellin_access_denied" class="hidden text-center mt-32">
        <div class="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <i class="fa-solid fa-lock text-4xl"></i>
        </div>
        <h2 class="text-2xl font-black text-slate-800 uppercase tracking-tight">Khu vực bảo mật</h2>
        <p class="text-sm font-bold text-gray-500 mt-2">Chỉ Quản trị viên (Admin) mới có quyền truy cập và nhập số liệu Sell-in.</p>
    </div>

    <div id="sellin_admin_panel" class="hidden">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 class="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">CẬP NHẬT TIẾN ĐỘ SELL-IN</h1>
                <p class="text-sm font-bold text-blue-600 mt-1 uppercase">Báo cáo xuất hàng hằng ngày (12 Khu vực)</p>
            </div>
            <div class="flex flex-wrap items-center gap-3 w-full md:w-auto bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                <input type="date" id="sellin_date" onchange="window.renderSellinTable()" class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 font-black text-slate-800 outline-none focus:border-blue-500 cursor-pointer">
                
                <input type="file" id="import_excel_file" accept=".xlsx, .xls" class="hidden" onchange="window.handleImportExcel(event)">
                <button onclick="document.getElementById('import_excel_file').click()" class="bg-orange-500 text-white px-5 py-2.5 rounded-xl font-black text-sm uppercase shadow-md hover:bg-orange-600 transition flex items-center gap-2">
                    <i class="fa-solid fa-file-import"></i> Nhập File
                </button>

                <button onclick="window.exportSellinExcel()" class="bg-green-600 text-white px-5 py-2.5 rounded-xl font-black text-sm uppercase shadow-md hover:bg-green-700 transition flex items-center gap-2">
                    <i class="fa-solid fa-file-excel"></i> Xuất Mẫu
                </button>
                <button onclick="window.saveSellinData()" id="btnSaveSellin" class="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-black text-sm uppercase shadow-md hover:bg-blue-700 transition flex items-center gap-2">
                    <i class="fa-solid fa-floppy-disk"></i> Lưu Số Liệu
                </button>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-center border-collapse">
                    <thead>
                        <tr class="bg-blue-50 border-b border-blue-100 text-[11px] font-black text-slate-600 uppercase">
                            <th rowspan="2" class="border-r border-blue-100 p-2 w-12">STT</th>
                            <th rowspan="2" class="border-r border-blue-100 p-2 w-40">GĐ Khu Vực</th>
                            <th rowspan="2" class="border-r border-blue-100 p-2 w-32">Khu Vực</th>
                            <th rowspan="2" class="border-r border-blue-200 p-2 w-24 bg-blue-100/50">Target Tháng</th>
                            <th colspan="2" class="border-r border-blue-100 p-2 bg-orange-50 text-orange-700 border-b border-b-orange-200">
                                Dữ liệu ngày: <span id="display_sellin_date" class="text-orange-600">...</span>
                            </th>
                            <th rowspan="2" class="border-r border-blue-100 p-2 w-24 bg-gray-50">Đã thanh toán<br>(Lũy kế)</th>
                            <th rowspan="2" class="border-r border-blue-100 p-2 w-24 bg-yellow-50 text-yellow-700">Tổng xuất thực tế</th>
                            <th rowspan="2" class="border-r border-blue-100 p-2 w-24 bg-red-50 text-red-600">Số lượng<br>chưa xuất</th>
                            <th rowspan="2" class="border-r border-blue-100 p-2 w-24">Tỷ lệ đơn hàng<br>thanh toán</th>
                            <th rowspan="2" class="border-r border-blue-100 p-2 w-24">Tỷ lệ hoàn thành</th>
                            <th rowspan="2" class="p-2 w-20 bg-indigo-50 text-indigo-600">Xếp Hạng</th>
                        </tr>
                        <tr class="bg-orange-50/50 text-[10px] font-black text-slate-600 uppercase">
                            <th class="border-r border-orange-100 p-2 w-24">Đã thanh toán</th>
                            <th class="border-r border-blue-100 p-2 w-24">Đã xuất</th>
                        </tr>
                    </thead>
                    <tbody id="sellin_table_body" class="divide-y divide-gray-100 text-sm font-bold text-slate-800">
                    </tbody>
                    <tfoot id="sellin_table_foot" class="bg-green-100/50 font-black text-green-800 text-sm">
                    </tfoot>
                </table>
            </div>
        </div>
    </div>
</div>
`;

// Cấu hình Router 
const viewMap = {
    'sellout': entryHTML,
    'sellin': sellinHTML, 
    'dashboard': targetHTML,
    'leaderboard': competitionHTML,
    'game01': '<div class="p-8 text-center text-gray-500 font-bold mt-10"><i class="fa-solid fa-gears text-4xl mb-4 text-gray-300"></i><br>Tính năng Game 01 đang được phát triển...</div>',
    'game02': '<div class="p-8 text-center text-gray-500 font-bold mt-10"><i class="fa-solid fa-gears text-4xl mb-4 text-gray-300"></i><br>Tính năng Game 02 đang được phát triển...</div>',
    'game03': '<div class="p-8 text-center text-gray-500 font-bold mt-10"><i class="fa-solid fa-gears text-4xl mb-4 text-gray-300"></i><br>Tính năng Game 03 đang được phát triển...</div>',
    'fund': '<div class="p-8 text-center text-gray-500 font-bold mt-10"><i class="fa-solid fa-gears text-4xl mb-4 text-gray-300"></i><br>Tính năng Quỹ đóng góp đang được phát triển...</div>',
    'reward': '<div class="p-8 text-center text-gray-500 font-bold mt-10"><i class="fa-solid fa-gears text-4xl mb-4 text-gray-300"></i><br>Tính năng Lịch sử thưởng đang được phát triển...</div>'
};

// ==========================================
// 1. HÀM ĐIỀU HƯỚNG (ROUTER)
// ==========================================
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
        document.getElementById('sellin_admin_panel').classList.toggle('hidden', !isAdmin);
        document.getElementById('sellin_access_denied').classList.toggle('hidden', isAdmin);
        
        if (isAdmin) {
            const dateInput = document.getElementById('sellin_date');
            if(dateInput && !dateInput.value) {
                dateInput.value = new Date().toISOString().split('T')[0];
            }
            window.renderSellinTable(); // Gọi hàm lấy dữ liệu
        }
    }

    const allNavs = ['nav-dashboard', 'nav-sellout', 'nav-sellin', 'nav-game01', 'nav-game02', 'nav-game03', 'nav-fund', 'nav-leaderboard', 'nav-reward'];
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
// 2. LOGIC NHẬP LIỆU SELL-OUT
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

// ==========================================
// 3. LOGIC QUẢN LÝ SELL-IN (ADMIN ONLY)
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
    { id: 13, dir_vi: "", reg_vi: "Mua nhóm", target: 0 },
    { id: 14, dir_vi: "", reg_vi: "Bán lẻ", target: 0 }
];

window.renderSellinTable = async () => {
    const tbody = document.getElementById('sellin_table_body');
    const tfoot = document.getElementById('sellin_table_foot');
    const dateInput = document.getElementById('sellin_date');
    if (!tbody || !dateInput) return;

    const dateStr = dateInput.value;
    const parts = dateStr.split('-');
    if(parts.length === 3) {
        document.getElementById('display_sellin_date').innerText = `${parts[2]}/${parts[1]}`;
    }

    // 1. Dựng giao diện bảng gốc
    tbody.innerHTML = SELLIN_REGIONS.map((r) => {
        let isSpecial = r.id > 12;
        return `
        <tr class="hover:bg-slate-50 transition border-b border-gray-100">
            <td class="p-3 border-r border-gray-100 text-gray-500">${r.id}</td>
            <td class="p-3 border-r border-gray-100 text-left font-black text-slate-700">${r.dir_vi}</td>
            <td class="p-3 border-r border-gray-100 text-left">${r.reg_vi}</td>
            <td class="p-3 border-r border-blue-100 bg-blue-50/30 text-slate-500">${r.target || ''}</td>
            
            <td class="p-2 border-r border-gray-100">
                <input type="number" id="sellin_paid_${r.id}" oninput="window.calculateSellinLive()" class="w-16 text-center bg-white border border-gray-300 rounded p-1.5 outline-none focus:border-orange-500 text-orange-600 font-bold" value="">
            </td>
            <td class="p-2 border-r border-blue-100">
                <input type="number" id="sellin_shipped_${r.id}" oninput="window.calculateSellinLive()" class="w-16 text-center bg-white border border-gray-300 rounded p-1.5 outline-none focus:border-orange-500 text-orange-600 font-bold" value="">
            </td>

            <td id="td_paid_total_${r.id}" class="p-3 border-r border-gray-100 font-bold"></td>
            <td id="td_shipped_total_${r.id}" class="p-3 border-r border-gray-100 text-yellow-600 font-bold"></td>
            <td id="td_unshipped_${r.id}" class="p-3 border-r border-gray-100 text-red-500 font-bold"></td>
            <td id="td_paid_rate_${r.id}" class="p-3 border-r border-gray-100"></td>
            <td id="td_comp_rate_${r.id}" class="p-3 border-r border-gray-100"></td>
            <td id="td_rank_${r.id}" class="p-3 ${isSpecial ? 'bg-gray-50 text-gray-300' : ''}"></td>
        </tr>`;
    }).join('');

    tfoot.innerHTML = `
        <tr>
            <td colspan="3" class="p-4 text-right uppercase border-r border-green-200">Tổng doanh số tại Việt Nam</td>
            <td id="foot_sum_target" class="p-4 border-r border-green-200">0</td>
            <td id="foot_sum_paid_day" class="p-4 border-r border-green-200 text-orange-600">-</td>
            <td id="foot_sum_shipped_day" class="p-4 border-r border-green-200 text-orange-600">-</td>
            <td id="foot_sum_paid_total" class="p-4 border-r border-green-200">0</td>
            <td id="foot_sum_shipped_total" class="p-4 border-r border-green-200">0</td>
            <td id="foot_sum_unshipped" class="p-4 border-r border-green-200">0</td>
            <td id="foot_paid_rate" class="p-4 border-r border-green-200">0%</td>
            <td id="foot_comp_rate" class="p-4 border-r border-green-200">0%</td>
            <td class="p-4 bg-green-200/50"></td>
        </tr>
    `;

    // 2. Tự động kéo dữ liệu từ DB (Nếu đã tạo bảng)
    try {
        const { data } = await window.sb.from('daily_sellin_reports').select('*').eq('report_date', dateStr);
        if (data && data.length > 0) {
            data.forEach(row => {
                const pInput = document.getElementById(`sellin_paid_${row.region_id}`);
                const sInput = document.getElementById(`sellin_shipped_${row.region_id}`);
                if (pInput) pInput.value = row.paid_day || '';
                if (sInput) sInput.value = row.shipped_day || '';
            });
        }
    } catch(err) {
        console.warn("Chưa cấu hình bảng daily_sellin_reports trên Supabase.");
    }

    // 3. Chạy tính toán để phủ số liệu lên view
    window.calculateSellinLive();
};

window.calculateSellinLive = () => {
    let sumTarget = 0, sumPaidDay = 0, sumShippedDay = 0, sumPaidTotal = 0, sumShippedTotal = 0, sumUnshipped = 0;
    
    let stats = SELLIN_REGIONS.map(reg => {
        let paidInput = parseInt(document.getElementById(`sellin_paid_${reg.id}`)?.value) || 0;
        let shippedInput = parseInt(document.getElementById(`sellin_shipped_${reg.id}`)?.value) || 0;
        
        let prevPaid = Math.floor(reg.target * 0.2); 
        let prevShipped = Math.floor(reg.target * 0.15);
        
        let totalPaid = prevPaid + paidInput;
        let totalShipped = prevShipped + shippedInput;
        let compRate = reg.target > 0 ? (totalShipped / reg.target) * 100 : 0;
        
        return { id: reg.id, target: reg.target, paidInput, shippedInput, totalPaid, totalShipped, compRate };
    });
    
    let rankData = [...stats].filter(s => s.id <= 12).sort((a, b) => b.compRate - a.compRate);
    
    stats.forEach(s => {
        let unShipped = s.totalPaid - s.totalShipped;
        let paidRateStr = s.target > 0 ? ((s.totalPaid / s.target) * 100).toFixed(1) + '%' : '-';
        let compRateStr = s.target > 0 ? s.compRate.toFixed(1) + '%' : '-';
        
        let rankStr = '-';
        if (s.id <= 12) {
            let rankIndex = rankData.findIndex(r => r.id === s.id);
            rankStr = rankIndex + 1;
        }

        document.getElementById(`td_paid_total_${s.id}`).innerText = s.totalPaid || '';
        document.getElementById(`td_shipped_total_${s.id}`).innerText = s.totalShipped || '';
        document.getElementById(`td_unshipped_${s.id}`).innerText = unShipped || '';
        document.getElementById(`td_paid_rate_${s.id}`).innerText = paidRateStr;
        document.getElementById(`td_comp_rate_${s.id}`).innerText = compRateStr;
        
        let rankEl = document.getElementById(`td_rank_${s.id}`);
        if (rankEl && s.id <= 12) {
            rankEl.innerText = rankStr;
            rankEl.className = `p-3 ${rankStr <= 3 ? 'text-red-500 bg-red-50 font-black' : (rankStr >= 10 ? 'bg-gray-100 text-gray-400 font-bold' : 'text-slate-600 font-bold')}`;
        }

        sumTarget += s.target;
        sumPaidDay += s.paidInput;
        sumShippedDay += s.shippedInput;
        sumPaidTotal += s.totalPaid;
        sumShippedTotal += s.totalShipped;
        sumUnshipped += unShipped;
    });
    
    document.getElementById('foot_sum_target').innerText = sumTarget;
    document.getElementById('foot_sum_paid_day').innerText = sumPaidDay || '-';
    document.getElementById('foot_sum_shipped_day').innerText = sumShippedDay || '-';
    document.getElementById('foot_sum_paid_total').innerText = sumPaidTotal;
    document.getElementById('foot_sum_shipped_total').innerText = sumShippedTotal;
    document.getElementById('foot_sum_unshipped').innerText = sumUnshipped;
    
    let tPaidRate = sumTarget > 0 ? ((sumPaidTotal / sumTarget) * 100).toFixed(1) + '%' : '0%';
    let tCompRate = sumTarget > 0 ? ((sumShippedTotal / sumTarget) * 100).toFixed(1) + '%' : '0%';
    
    document.getElementById('foot_paid_rate').innerText = tPaidRate;
    document.getElementById('foot_comp_rate').innerText = tCompRate;
};

// ==========================================
// ĐỌC VÀ NHẬP FILE EXCEL TỰ ĐỘNG
// ==========================================
window.handleImportExcel = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, {type: 'array'});
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, {header: 1});

        jsonData.forEach(row => {
            const id = parseInt(row[0]);
            if (id >= 1 && id <= 14) {
                // Nhận diện dữ liệu ở cột E(Index 4) và F(Index 5)
                const paid = parseInt(row[4]) || 0; 
                const shipped = parseInt(row[5]) || 0; 
                
                const paidInput = document.getElementById(`sellin_paid_${id}`);
                const shippedInput = document.getElementById(`sellin_shipped_${id}`);
                
                if(paidInput) paidInput.value = paid > 0 ? paid : '';
                if(shippedInput) shippedInput.value = shipped > 0 ? shipped : '';
            }
        });
        
        window.calculateSellinLive();
        alert("✅ Nạp số liệu từ file Excel hoàn tất!");
        event.target.value = ""; 
    };
    reader.readAsArrayBuffer(file);
};

// ==========================================
// LƯU DỮ LIỆU LÊN SUPABASE
// ==========================================
window.saveSellinData = async () => {
    const btn = document.getElementById('btnSaveSellin');
    const dateInput = document.getElementById('sellin_date');
    if (!dateInput || !dateInput.value) return alert("Vui lòng chọn ngày báo cáo!");
    
    btn.disabled = true;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG LƯU...';

    const reportDate = dateInput.value;
    const payloads = [];

    SELLIN_REGIONS.forEach((r) => {
        let paidInput = parseInt(document.getElementById(`sellin_paid_${r.id}`)?.value) || 0;
        let shippedInput = parseInt(document.getElementById(`sellin_shipped_${r.id}`)?.value) || 0;
        
        if (paidInput > 0 || shippedInput > 0) {
            payloads.push({
                report_date: reportDate,
                region_id: r.id,
                paid_day: paidInput,
                shipped_day: shippedInput
            });
        }
    });

    try {
        // Ghi đè số liệu cùng ngày
        await window.sb.from('daily_sellin_reports').delete().eq('report_date', reportDate);
        
        if (payloads.length > 0) {
            const { error } = await window.sb.from('daily_sellin_reports').insert(payloads);
            if (error) throw error;
        }
        
        alert("✅ Đã lưu số liệu Sell-in thành công lên cơ sở dữ liệu!");
    } catch(err) {
        alert("Lỗi khi lưu dữ liệu (Bạn đã tạo bảng daily_sellin_reports trên Supabase chưa?): " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> LƯU SỐ LIỆU';
    }
};

window.exportSellinExcel = () => {
    const dateInput = document.getElementById('sellin_date');
    if (!dateInput || !dateInput.value) return alert("Vui lòng chọn ngày!");
    
    const parts = dateInput.value.split('-');
    const m = parts[1];
    const d = parts[2];
    
    const wsData = [
        [`Báo cáo xuất hàng tháng ${m}`],
        [
            "STT", "GĐ Khu vực", "Khu vực", `Target Tháng ${m}`,
            `Ngày ${d}/${m}`, "", 
            "Đã thanh toán (Lũy kế)", "Tổng xuất thực tế", "Số lượng chưa xuất",
            "Tỷ lệ đơn hàng thanh toán", "Tỷ lệ hoàn thành", "Xếp Hạng"
        ],
        [
            "", "", "", "", 
            "SL đã thanh toán", "SL đã xuất", 
            "", "", "", "", "", ""
        ]
    ];

    const merges = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
        { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }, 
        { s: { r: 1, c: 1 }, e: { r: 2, c: 1 } }, 
        { s: { r: 1, c: 2 }, e: { r: 2, c: 2 } }, 
        { s: { r: 1, c: 3 }, e: { r: 2, c: 3 } }, 
        { s: { r: 1, c: 4 }, e: { r: 1, c: 5 } }, 
        { s: { r: 1, c: 6 }, e: { r: 2, c: 6 } }, 
        { s: { r: 1, c: 7 }, e: { r: 2, c: 7 } }, 
        { s: { r: 1, c: 8 }, e: { r: 2, c: 8 } }, 
        { s: { r: 1, c: 9 }, e: { r: 2, c: 9 } }, 
        { s: { r: 1, c: 10 }, e: { r: 2, c: 10 } },
        { s: { r: 1, c: 11 }, e: { r: 2, c: 11 } } 
    ];

    SELLIN_REGIONS.forEach((r) => {
        let paidInput = document.getElementById(`sellin_paid_${r.id}`)?.value || '';
        let shippedInput = document.getElementById(`sellin_shipped_${r.id}`)?.value || '';
        let totalPaid = document.getElementById(`td_paid_total_${r.id}`)?.innerText || '';
        let totalShipped = document.getElementById(`td_shipped_total_${r.id}`)?.innerText || '';
        let unShipped = document.getElementById(`td_unshipped_${r.id}`)?.innerText || '';
        let paidRate = document.getElementById(`td_paid_rate_${r.id}`)?.innerText || '';
        let compRate = document.getElementById(`td_comp_rate_${r.id}`)?.innerText || '';
        let rank = document.getElementById(`td_rank_${r.id}`)?.innerText || '';

        wsData.push([
            r.id, r.dir_vi, r.reg_vi, r.target || '',
            paidInput, shippedInput,
            totalPaid, totalShipped, unShipped,
            paidRate, compRate, rank
        ]);
    });

    const sumTarget = document.getElementById('foot_sum_target')?.innerText || '';
    const sumPaidDay = document.getElementById('foot_sum_paid_day')?.innerText || '';
    const sumShippedDay = document.getElementById('foot_sum_shipped_day')?.innerText || '';
    const sumPaidTotal = document.getElementById('foot_sum_paid_total')?.innerText || '';
    const sumShippedTotal = document.getElementById('foot_sum_shipped_total')?.innerText || '';
    const sumUnshipped = document.getElementById('foot_sum_unshipped')?.innerText || '';
    const tPaidRate = document.getElementById('foot_paid_rate')?.innerText || '';
    const tCompRate = document.getElementById('foot_comp_rate')?.innerText || '';

    wsData.push([
        "", "", "Tổng doanh số tại Việt Nam", sumTarget, 
        sumPaidDay, sumShippedDay, sumPaidTotal, sumShippedTotal, sumUnshipped, 
        tPaidRate, tCompRate, ""
    ]);
    merges.push({ s: { r: wsData.length - 1, c: 0 }, e: { r: wsData.length - 1, c: 2 } });

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = merges;
    
    XLSX.utils.book_append_sheet(wb, ws, "Bao_Cao_SellIn");
    XLSX.writeFile(wb, `Bao_Cao_SellIn_Thang${m}_Ngay${d}.xlsx`);
};

init();