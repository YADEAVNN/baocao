// File: js/views/view-fund.js

export const fundHTML = `
<div class="p-4 md:p-6 fade-in max-w-[1200px] mx-auto bg-[#F8FAFC] min-h-screen pb-10">
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
            <h1 class="text-2xl font-black text-blue-800 uppercase tracking-tight flex items-center gap-3">
                <i class="fa-solid fa-piggy-bank text-blue-600"></i> QUẢN LÝ QUỸ ĐÓNG GÓP
            </h1>
            <p class="text-sm font-bold text-gray-500 mt-1 ml-9">Theo dõi và gạch nợ quỹ thi đua hàng tháng</p>
        </div>
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <i class="fa-regular fa-calendar text-gray-400"></i>
                <input type="month" id="fund_month_filter" onchange="window.loadFundData(true)" class="bg-transparent border-none font-bold text-slate-700 outline-none cursor-pointer text-sm">
            </div>
            <button onclick="window.loadFundData(true)" class="bg-white text-gray-500 hover:text-blue-600 px-3 py-2 rounded-lg border border-gray-200 shadow-sm transition">
                <i class="fa-solid fa-rotate-right"></i> Làm mới
            </button>
        </div>
    </div>

    <!-- TABS 4 NÚT -->
    <div class="flex flex-wrap justify-center gap-3 mb-6 relative z-20 px-2">
        <button onclick="window.switchFundTab('SUMMARY')" id="btn_fund_summary" class="flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 shadow-sm text-xs md:text-sm">
            <i class="fa-solid fa-wallet mr-1"></i> TỔNG HỢP QUỸ
        </button>
        <button onclick="window.switchFundTab('GAME01')" id="btn_fund_g1" class="flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-orange-500 text-white shadow-lg shadow-orange-500/30 text-xs md:text-sm border border-transparent">
            GAME 01 - SOLO
        </button>
        <button onclick="window.switchFundTab('GAME02')" id="btn_fund_g2" class="flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 shadow-sm text-xs md:text-sm">
            GAME 02 - KHU VỰC
        </button>
        <button onclick="window.switchFundTab('MANUAL')" id="btn_fund_manual" class="flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 shadow-sm text-xs md:text-sm">
            THU/PHẠT KHÁC
        </button>
    </div>

    <!-- MAIN TABLE -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gray-50 gap-4">
            <h2 class="text-sm font-black text-slate-800 uppercase flex items-center gap-2" id="fund_table_title">
                DANH SÁCH CẦN ĐÓNG QUỸ - GAME 01
            </h2>
            
            <div id="fund_admin_actions" class="hidden">
                <button onclick="window.openManualFundModal()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md transition flex items-center gap-2 uppercase">
                    <i class="fa-solid fa-plus"></i> Thêm Thu / Chi
                </button>
            </div>
            <div id="fund_admin_info" class="text-[10px] font-bold text-gray-500 italic bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                <i class="fa-solid fa-circle-info text-blue-500 mr-1"></i> Chỉ Admin mới có quyền thao tác
            </div>
        </div>

        <div class="overflow-x-auto flex-1 custom-scrollbar">
            <table class="w-full text-center whitespace-nowrap text-sm border-collapse">
                <thead class="bg-[#0b2447] text-white font-bold text-[10px] uppercase" id="fund_table_head">
                    <!-- Javascript sẽ render Cột tiêu đề tương ứng tại đây -->
                </thead>
                <tbody id="fund_table_body" class="divide-y divide-gray-100 text-slate-700 font-medium">
                    <tr><td colspan="6" class="p-10 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- MODAL THÊM KHOẢN THU/CHI KHÁC -->
    <div id="fund_manual_modal" class="fixed inset-0 z-[100] bg-gray-900/80 hidden items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col">
            <div class="p-4 flex justify-between items-center border-b border-gray-100 bg-blue-50">
                <h3 class="text-lg font-black text-blue-600 uppercase flex items-center gap-2">
                    <i class="fa-solid fa-file-invoice-dollar"></i> SỔ QUỸ (THU / CHI)
                </h3>
                <button onclick="window.closeManualFundModal()" class="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-red-500 hover:bg-red-100 transition shadow-sm">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-6 space-y-4 bg-slate-50/50">
                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Chọn thành viên</label>
                    <select id="manual_sale_name" class="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 font-bold text-slate-700 bg-white">
                        <option value="">-- Đang tải danh sách --</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Loại Giao Dịch</label>
                    <select id="manual_type" class="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 font-bold text-slate-700 bg-white">
                        <option value="THU">🟢 THU TIỀN (Phạt vi phạm / Đóng góp)</option>
                        <option value="CHI">🔴 CHI TIỀN (Trao thưởng / Hỗ trợ)</option>
                    </select>
                </div>
                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Số tiền (VNĐ)</label>
                    <input type="number" id="manual_amount" placeholder="Ví dụ: 500000" class="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 font-black text-blue-600 bg-white">
                </div>
                <div>
                    <label class="text-xs font-bold text-gray-500 uppercase mb-1.5 block">Ghi chú / Lý do giao dịch</label>
                    <textarea id="manual_note" rows="2" placeholder="Nhập lý do thu hoặc chi rõ ràng..." class="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 text-sm bg-white"></textarea>
                </div>
            </div>
            <div class="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                <button onclick="window.closeManualFundModal()" class="px-6 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Hủy</button>
                <button onclick="window.submitManualFund()" class="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 shadow-lg">
                    <i class="fa-solid fa-check"></i> Xác nhận Lưu
                </button>
            </div>
        </div>
    </div>
</div>
`;

// ==========================================
// TỐI ƯU CẤU TRÚC LƯU TRỮ DỮ LIỆU ĐỂ UI MƯỢT MÀ
// ==========================================
window.fundState = { 
    tab: 'SUMMARY', 
    cache: null // Lưu trữ dữ liệu đã fetch
};

window.switchFundTab = (tab) => {
    window.fundState.tab = tab;
    
    const btnSummary = document.getElementById('btn_fund_summary');
    const btnG1 = document.getElementById('btn_fund_g1');
    const btnG2 = document.getElementById('btn_fund_g2');
    const btnManual = document.getElementById('btn_fund_manual');
    const title = document.getElementById('fund_table_title');
    const thead = document.getElementById('fund_table_head');
    const adminActions = document.getElementById('fund_admin_actions');
    const adminInfo = document.getElementById('fund_admin_info');

    const activeClass = "flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all text-white shadow-lg text-xs md:text-sm border border-transparent";
    const inactiveClass = "flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 shadow-sm text-xs md:text-sm";

    btnSummary.className = inactiveClass;
    btnG1.className = inactiveClass;
    btnG2.className = inactiveClass;
    btnManual.className = inactiveClass;

    adminActions.classList.add('hidden');
    adminInfo.classList.remove('hidden');

    if (tab === 'SUMMARY') {
        btnSummary.className = activeClass + " bg-emerald-600 shadow-emerald-500/30";
        title.innerText = "SỔ TỔNG HỢP GIAO DỊCH QUỸ";
        adminInfo.classList.add('hidden');
        thead.innerHTML = `
            <tr>
                <th class="py-3 px-3 border border-slate-600 w-10">STT</th>
                <th class="py-3 px-4 text-left border border-slate-600">THÀNH VIÊN</th>
                <th class="py-3 px-3 border border-slate-600">PHÂN LOẠI QUỸ</th>
                <th class="py-3 px-3 border border-slate-600 text-green-400">SỐ TIỀN GIAO DỊCH</th>
                <th class="py-3 px-4 text-left border border-slate-600">GHI CHÚ / LÝ DO</th>
                <th class="py-3 px-3 border border-slate-600">NGÀY GHI NHẬN</th>
            </tr>`;
    }
    else if (tab === 'GAME01') {
        btnG1.className = activeClass + " bg-orange-500 shadow-orange-500/30";
        title.innerText = "DANH SÁCH CẦN ĐÓNG QUỸ - GAME 01 (SOLO)";
        thead.innerHTML = `
            <tr>
                <th class="py-3 px-3 border border-slate-600 w-10">STT</th>
                <th class="py-3 px-4 text-left border border-slate-600">THÀNH VIÊN BỊ PHẠT (NVKD)</th>
                <th class="py-3 px-3 border border-slate-600">TỔNG NỢ KỲ NÀY</th>
                <th class="py-3 px-3 border border-slate-600 text-green-400">ĐÃ ĐÓNG</th>
                <th class="py-3 px-3 border border-slate-600 text-orange-400 font-black">CÒN LẠI (THỰC NỢ)</th>
                <th class="py-3 px-3 border border-slate-600 w-32">THAO TÁC</th>
            </tr>`;
    } 
    else if (tab === 'GAME02') {
        btnG2.className = activeClass + " bg-red-600 shadow-red-500/30";
        title.innerText = "DANH SÁCH TÀI TRỢ PICKLEBALL - GAME 02 (KHU VỰC)";
        thead.innerHTML = `
            <tr>
                <th class="py-3 px-3 border border-slate-600 w-10">STT</th>
                <th class="py-3 px-4 text-left border border-slate-600">THÀNH VIÊN ĐÓNG QUỸ (RSM / ASM / SALE)</th>
                <th class="py-3 px-3 border border-slate-600">TỔNG NỢ KỲ NÀY</th>
                <th class="py-3 px-3 border border-slate-600 text-green-400">ĐÃ ĐÓNG</th>
                <th class="py-3 px-3 border border-slate-600 text-orange-400 font-black">CÒN LẠI (THỰC NỢ)</th>
                <th class="py-3 px-3 border border-slate-600 w-32">THAO TÁC</th>
            </tr>`;
    }
    else if (tab === 'MANUAL') {
        btnManual.className = activeClass + " bg-blue-600 shadow-blue-500/30";
        title.innerText = "SỔ QUỸ: CÁC KHOẢN THU / CHI KHÁC";
        thead.innerHTML = `
            <tr>
                <th class="py-3 px-3 border border-slate-600 w-10">STT</th>
                <th class="py-3 px-4 text-left border border-slate-600">THÀNH VIÊN (NVKD / ASM / RSM)</th>
                <th class="py-3 px-3 border border-slate-600">SỐ TIỀN GIAO DỊCH</th>
                <th class="py-3 px-4 text-left border border-slate-600">GHI CHÚ / LÝ DO</th>
                <th class="py-3 px-3 border border-slate-600">NGÀY GHI NHẬN</th>
                <th class="py-3 px-3 border border-slate-600 w-32">THAO TÁC</th>
            </tr>`;
        
        if (window.STATE?.currentUser?.role === 'Admin') {
            adminActions.classList.remove('hidden');
            adminInfo.classList.add('hidden');
        }
    }
    
    // RENDER NGAY LẬP TỨC TỪ CACHE (KHÔNG FETCH LẠI)
    window.renderFundTable();
};

window.loadFundData = async (forceRefresh = false) => {
    const monthInput = document.getElementById('fund_month_filter');
    if (!monthInput.value) {
        const today = new Date();
        monthInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }
    
    const month = monthInput.value;

    // NẾU CÓ CACHE VÀ KHÔNG BẮT BUỘC TẢI LẠI -> RENDER LUÔN
    if (!forceRefresh && window.fundState.cache && window.fundState.cache.month === month) {
        window.renderFundTable();
        return;
    }

    const tbody = document.getElementById('fund_table_body');
    tbody.innerHTML = '<tr><td colspan="6" class="p-10 text-gray-400 text-center"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải và tính toán dữ liệu...</td></tr>';

    const [year, monthStr] = month.split('-');
    const daysInMonth = new Date(year, monthStr, 0).getDate();
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

    try {
        const [shopsRes, targetRes, soRes, paymentRes] = await Promise.all([
            window.sb.from('master_shop_list').select('*'),
            window.sb.from('monthly_sale_targets').select('*').like('report_month', `${year}-${monthStr}%`),
            window.sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', endDate),
            window.sb.from('fund_payments').select('*').eq('report_month', month)
        ]);

        // LƯU TOÀN BỘ VÀO CACHE 
        window.fundState.cache = {
            month: month,
            year: year,
            monthStr: monthStr,
            daysInMonth: daysInMonth,
            shops: shopsRes.data || [],
            targets: targetRes.data || [],
            soData: soRes.data || [],
            payments: paymentRes.data || []
        };

        // Render ra giao diện
        window.renderFundTable();

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-red-500 font-bold text-center">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
};

window.renderFundTable = () => {
    if (!window.fundState.cache) {
        window.loadFundData();
        return;
    }

    const { month, year, monthStr, daysInMonth, shops, targets, soData, payments } = window.fundState.cache;
    const tbody = document.getElementById('fund_table_body');
    
    const normalize = (name) => name ? name.trim().toLowerCase().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null;
    const isAdmin = window.STATE?.currentUser?.role === 'Admin';
    const fmt = n => Math.round(Number(n)).toLocaleString('vi-VN');

    const getNormalizedRegion = (rawReg) => {
        const nReg = normalize(rawReg);
        if (!nReg) return null;
        if(nReg.includes("tây bắc") || nReg.includes("tay bac")) return "Tây Bắc";
        const validRegions = ["Hà Nội", "Đông Bắc", "Bắc Trung Bộ", "Hồng Hà", "Tây Bắc", "Trung Trung Bộ"];
        for (const reg of validRegions) {
            if (nReg.includes(normalize(reg))) return reg;
        }
        return nReg;
    };

    // =====================================
    // TAB 4: TỔNG HỢP QUỸ (SUMMARY)
    // =====================================
    if (window.fundState.tab === 'SUMMARY') {
        const totalThu = payments.filter(p => p.paid_amount > 0).reduce((sum, p) => sum + Number(p.paid_amount), 0);
        const totalChi = payments.filter(p => p.paid_amount < 0).reduce((sum, p) => sum + Math.abs(Number(p.paid_amount)), 0);
        const balance = totalThu - totalChi;

        const titleEl = document.getElementById('fund_table_title');
        if (titleEl) {
            titleEl.innerHTML = `
                SỔ TỔNG HỢP GIAO DỊCH QUỸ THÁNG ${monthStr}/${year}
                <span class="ml-4 text-[10px] font-bold bg-green-50 text-green-700 px-3 py-1.5 rounded-lg border border-green-200 shadow-sm"><i class="fa-solid fa-arrow-down mr-1"></i> TỔNG THU: ${fmt(totalThu)}đ</span>
                <span class="ml-2 text-[10px] font-bold bg-red-50 text-red-600 px-3 py-1.5 rounded-lg border border-red-200 shadow-sm"><i class="fa-solid fa-arrow-up mr-1"></i> TỔNG CHI: ${fmt(totalChi)}đ</span>
                <span class="ml-2 text-[11px] font-black bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-md"><i class="fa-solid fa-wallet mr-1"></i> ADMIN ĐANG CẦM: ${fmt(balance)}đ</span>
            `;
        }

        if (payments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-gray-400 font-bold text-center">Chưa có giao dịch nào được ghi nhận trong tháng này.</td></tr>`;
            return;
        }

        let summaryPayments = [...payments].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        tbody.innerHTML = summaryPayments.map((p, i) => {
            const dateObj = new Date(p.created_at);
            const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
            
            const amt = Number(p.paid_amount);
            let amtHtml = '';
            if (amt >= 0) {
                amtHtml = `<span class="text-green-600 font-black bg-green-50 px-3 py-1 rounded border border-green-200">+${fmt(amt)}đ</span>`;
            } else {
                amtHtml = `<span class="text-red-500 font-black bg-red-50 px-3 py-1 rounded border border-red-200">${fmt(amt)}đ</span>`;
            }

            let typeHtml = '';
            if (p.game_type === 'GAME01') typeHtml = '<span class="text-orange-600 font-bold text-[10px] bg-orange-50 px-3 py-1 rounded border border-orange-200">Game 1 (Solo)</span>';
            else if (p.game_type === 'GAME02') typeHtml = '<span class="text-red-600 font-bold text-[10px] bg-red-50 px-3 py-1 rounded border border-red-200">Game 2 (Khu vực)</span>';
            else typeHtml = '<span class="text-blue-600 font-bold text-[10px] bg-blue-50 px-3 py-1 rounded border border-blue-200">Thu/Chi Khác</span>';

            let noteHtml = p.note ? p.note : (p.game_type === 'GAME01' ? 'Góp quỹ Solo Bứt Phá' : (p.game_type === 'GAME02' ? 'Tài trợ quỹ Pickleball' : '---'));

            return `
                <tr class="hover:bg-slate-50 transition border-b border-gray-100">
                    <td class="py-3 px-3 text-center border border-gray-100 font-bold text-gray-400">${i+1}</td>
                    <td class="py-3 px-4 text-left border border-gray-100 font-black text-slate-800">${p.sale_name}</td>
                    <td class="py-3 px-3 text-center border border-gray-100">${typeHtml}</td>
                    <td class="py-3 px-3 text-center border border-gray-100">${amtHtml}</td>
                    <td class="py-3 px-4 text-left border border-gray-100 text-gray-600 font-medium whitespace-normal max-w-xs">${noteHtml}</td>
                    <td class="py-3 px-3 text-center border border-gray-100 font-bold text-slate-500">${dateStr}</td>
                </tr>
            `;
        }).join('');
        return;
    }

    // =====================================
    // TAB 3: THU PHẠT KHÁC (MANUAL)
    // =====================================
    if (window.fundState.tab === 'MANUAL') {
        const manualPayments = payments.filter(p => p.game_type === 'MANUAL');
        
        const totalThu = manualPayments.filter(p => p.paid_amount > 0).reduce((sum, p) => sum + Number(p.paid_amount), 0);
        const totalChi = manualPayments.filter(p => p.paid_amount < 0).reduce((sum, p) => sum + Math.abs(Number(p.paid_amount)), 0);
        const balance = totalThu - totalChi;

        const titleEl = document.getElementById('fund_table_title');
        if (titleEl) {
            titleEl.innerHTML = `
                CÁC KHOẢN THU / CHI KHÁC 
                <span class="ml-4 text-[10px] font-bold bg-green-50 text-green-700 px-2 py-1 rounded border border-green-200 shadow-sm"><i class="fa-solid fa-arrow-down mr-1"></i> TỔNG THU: ${fmt(totalThu)}đ</span>
                <span class="ml-2 text-[10px] font-bold bg-red-50 text-red-600 px-2 py-1 rounded border border-red-200 shadow-sm"><i class="fa-solid fa-arrow-up mr-1"></i> TỔNG CHI: ${fmt(totalChi)}đ</span>
            `;
        }

        if (manualPayments.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-gray-400 font-bold text-center">Chưa có khoản thu/chi nào được ghi nhận trong tháng này.</td></tr>`;
            return;
        }

        manualPayments.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        tbody.innerHTML = manualPayments.map((p, i) => {
            const dateObj = new Date(p.created_at);
            const dateStr = `${String(dateObj.getDate()).padStart(2, '0')}/${String(dateObj.getMonth() + 1).padStart(2, '0')}/${dateObj.getFullYear()}`;
            
            let actionHtml = '---';
            if (isAdmin) {
                actionHtml = `<button onclick="window.deleteManualFund(${p.id})" class="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-lg transition text-xs font-bold border border-red-100 shadow-sm"><i class="fa-solid fa-trash"></i> Xóa</button>`;
            }

            const amt = Number(p.paid_amount);
            let amtHtml = '';
            if (amt >= 0) {
                amtHtml = `<span class="text-green-600 font-black bg-green-50 px-3 py-1 rounded border border-green-200">+${fmt(amt)}đ</span>`;
            } else {
                amtHtml = `<span class="text-red-500 font-black bg-red-50 px-3 py-1 rounded border border-red-200">${fmt(amt)}đ</span>`;
            }

            return `
                <tr class="hover:bg-slate-50 transition border-b border-gray-100">
                    <td class="py-3 px-3 text-center border border-gray-100 font-bold text-gray-400">${i+1}</td>
                    <td class="py-3 px-4 text-left border border-gray-100 font-black text-slate-800">${p.sale_name}</td>
                    <td class="py-3 px-3 text-center border border-gray-100">${amtHtml}</td>
                    <td class="py-3 px-4 text-left border border-gray-100 text-gray-600 font-medium whitespace-normal max-w-xs">${p.note || '---'}</td>
                    <td class="py-3 px-3 text-center border border-gray-100 font-bold text-slate-500">${dateStr}</td>
                    <td class="py-3 px-3 text-center border border-gray-100 bg-slate-50/50">${actionHtml}</td>
                </tr>
            `;
        }).join('');
        
        return; 
    }

    // =====================================
    // TAB 1 & 2: GAME 01, GAME 02 
    // =====================================
    let fundList = [];

    if (window.fundState.tab === 'GAME01') {
        let validSalesMap = {};
        shops.forEach(s => {
            const sName = normalize(s.sale_name);
            if (sName) validSalesMap[sName] = normalize(s.director_name) || 'Chưa rõ';
        });

        let saleStatsMap = {};
        Object.keys(validSalesMap).forEach(sName => {
            const tgtRow = targets.find(t => normalize(t.sale_name) === sName);
            const targetMonth = tgtRow ? Number(tgtRow.target_so || 0) : 0;
            const targetDay = targetMonth > 0 ? Math.ceil(targetMonth / daysInMonth) : 0;
            if (targetDay > 0) {
                saleStatsMap[sName] = { name: sName, director: validSalesMap[sName], targetDay: targetDay, accumDebt: 0 };
            }
        });

        const today = new Date();
        let currentDayNum = daysInMonth;
        if (parseInt(year) === today.getFullYear() && parseInt(monthStr) === today.getMonth() + 1) {
            currentDayNum = today.getDate();
        } else if (parseInt(year) > today.getFullYear() || (parseInt(year) === today.getFullYear() && parseInt(monthStr) > today.getMonth() + 1)) {
            currentDayNum = 0;
        }

        for (let d = 1; d <= currentDayNum; d++) {
            const dDateStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
            const dailyReports = soData.filter(r => r.report_date === dDateStr);

            Object.keys(saleStatsMap).forEach(sName => {
                let actualForGame = 0;
                dailyReports.filter(r => normalize(r.sale_name) === sName).forEach(r => {
                    if (r.status !== 'approved') return;
                    
                    let createdStr = r.created_at || r.inserted_at;
                    if (createdStr) {
                        let createdDateObj = new Date(createdStr);
                        let [rY, rM, rD] = dDateStr.split('-').map(Number);
                        let deadlineMs = Date.UTC(rY, rM - 1, rD + 1, 5, 0, 0); 
                        if (createdDateObj.getTime() <= deadlineMs) {
                            actualForGame += Number(r.total_so || 0);
                        }
                    } else {
                        actualForGame += Number(r.total_so || 0);
                    }
                });
                
                if (actualForGame < saleStatsMap[sName].targetDay) {
                    saleStatsMap[sName].accumDebt += 50000;
                }
            });
        }

        fundList = Object.values(saleStatsMap).map(s => {
            const paid = payments.filter(p => p.sale_name === s.name && p.game_type === 'GAME01').reduce((sum, p) => sum + Number(p.paid_amount), 0);
            return { ...s, paidAmount: paid, remaining: s.accumDebt - paid };
        }).filter(s => s.accumDebt > 0); 
    } 
    else if (window.fundState.tab === 'GAME02') {
        const validRegions = ["Hà Nội", "Đông Bắc", "Bắc Trung Bộ", "Hồng Hà", "Tây Bắc", "Trung Trung Bộ"];
        let game2FundMap = {};

        shops.forEach(s => {
            let reg = getNormalizedRegion(s.khu_vuc || s.area || s.region_name);
            if (!reg && normalize(s.area)?.includes("tây bắc")) reg = "Tây Bắc";

            if (validRegions.includes(reg)) {
                const sale = normalize(s.sale_name);
                const asm = normalize(s.director_name);
                let rsm = normalize(s.gd_mien || s.rsm || s.regional_director);

                if (sale) {
                    if (!game2FundMap[sale]) game2FundMap[sale] = { name: sale, role: 'Sale', region: reg, accumDebt: 500000 };
                }
                if (asm) {
                    if (!game2FundMap[asm]) game2FundMap[asm] = { name: asm, role: 'GĐ Khu Vực', region: reg, accumDebt: 1000000 };
                }
                if (!rsm) rsm = "Giám Đốc Miền (Chưa cập nhật)";
                if (!game2FundMap[rsm]) {
                    game2FundMap[rsm] = { name: rsm, role: 'RSM', region: 'Toàn Miền', accumDebt: 1000000, managedRegions: new Set([reg]) };
                } else {
                    if (!game2FundMap[rsm].managedRegions.has(reg)) {
                        game2FundMap[rsm].managedRegions.add(reg);
                        game2FundMap[rsm].accumDebt += 1000000;
                    }
                }
            }
        });

        fundList = Object.values(game2FundMap).map(p => {
            const paid = payments.filter(pay => pay.sale_name === p.name && pay.game_type === 'GAME02').reduce((sum, pay) => sum + Number(pay.paid_amount), 0);
            return {
                name: p.name,
                director: `${p.role} - Khu vực: ${p.region}`,
                accumDebt: p.accumDebt,
                paidAmount: paid,
                remaining: p.accumDebt - paid
            };
        });
    }

    if (fundList.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-gray-400 font-bold text-center">Chưa có phát sinh danh sách đóng quỹ trong kỳ này.</td></tr>`;
        return;
    }

    fundList.sort((a, b) => b.remaining - a.remaining);

    tbody.innerHTML = fundList.map((s, i) => {
        let actionHtml = '';
        
        if (s.remaining > 0) {
            if (isAdmin) {
                actionHtml = `
                <div class="flex items-center justify-center gap-2">
                    <button onclick="window.markFundPaid('${s.name}', '${window.fundState.tab}', ${s.remaining})" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> Xác nhận thu</button>
                    ${s.paidAmount > 0 ? `<button onclick="window.undoFundPaid('${s.name}', '${window.fundState.tab}')" class="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1 border border-red-100" title="Hoàn tác"><i class="fa-solid fa-rotate-left"></i> Hủy</button>` : ''}
                </div>`;
            } else {
                actionHtml = `<span class="text-orange-500 font-bold text-[11px] bg-orange-50 px-3 py-1.5 rounded border border-orange-200"><i class="fa-regular fa-clock"></i> Chờ thu</span>`;
            }
        } else {
            if (isAdmin) {
                actionHtml = `
                <div class="flex items-center justify-center gap-2">
                    <span class="text-green-600 font-bold text-[11px] bg-green-50 px-3 py-1.5 rounded border border-green-200"><i class="fa-solid fa-check-double"></i> Đã hoàn tất</span>
                    <button onclick="window.undoFundPaid('${s.name}', '${window.fundState.tab}')" class="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 px-3 py-1.5 rounded-lg transition text-xs font-bold flex items-center gap-1 border border-red-100" title="Hoàn tác"><i class="fa-solid fa-rotate-left"></i> Hủy</button>
                </div>`;
            } else {
                actionHtml = `<span class="text-green-600 font-bold text-[11px] bg-green-50 px-3 py-1.5 rounded border border-green-200"><i class="fa-solid fa-check-double"></i> Đã hoàn tất</span>`;
            }
        }

        return `
            <tr class="hover:bg-slate-50 transition border-b border-gray-100">
                <td class="py-3 px-3 text-center border border-gray-100 font-bold text-gray-400">${i+1}</td>
                <td class="py-3 px-4 text-left border border-gray-100">
                    <p class="font-black text-slate-800">${s.name}</p>
                    <p class="text-[10px] font-bold text-gray-400">${s.director}</p>
                </td>
                <td class="py-3 px-3 text-center border border-gray-100 font-bold text-slate-600">${fmt(s.accumDebt)}đ</td>
                <td class="py-3 px-3 text-center border border-gray-100 font-bold text-green-500">${fmt(s.paidAmount)}đ</td>
                <td class="py-3 px-3 text-center border border-gray-100 font-black text-orange-600 text-base bg-orange-50/30">${fmt(s.remaining)}đ</td>
                <td class="py-3 px-3 text-center border border-gray-100 bg-slate-50/50">${actionHtml}</td>
            </tr>
        `;
    }).join('');
};

// =====================================
// CÁC HÀM THAO TÁC CỦA ADMIN
// Dùng loadFundData(true) để buộc làm mới Cache
// =====================================

window.markFundPaid = async (name, gameType, amount) => {
    if (!confirm(`Xác nhận đã thu ${amount.toLocaleString('vi-VN')}đ từ [${name}]? Hành động này không thể hoàn tác.`)) return;
    try {
        const month = document.getElementById('fund_month_filter').value;
        const payload = { sale_name: name, game_type: gameType, report_month: month, paid_amount: amount };
        const { error } = await window.sb.from('fund_payments').insert([payload]);
        if (error) throw error;
        window.loadFundData(true); 
    } catch (err) { alert('❌ Lỗi hệ thống: ' + err.message); }
};

window.undoFundPaid = async (name, gameType) => {
    if (!confirm(`⚠️ Bạn có chắc chắn muốn HỦY (Hoàn tác) thao tác thu tiền tháng này của [${name}]?`)) return;
    try {
        const month = document.getElementById('fund_month_filter').value;
        const { error } = await window.sb.from('fund_payments').delete().eq('sale_name', name).eq('game_type', gameType).eq('report_month', month);
        if (error) throw error;
        window.loadFundData(true); 
    } catch (err) { alert('❌ Lỗi hệ thống khi hoàn tác: ' + err.message); }
};

// --- LOGIC CHO TAB THU/CHI KHÁC ---

window.openManualFundModal = async () => {
    const select = document.getElementById('manual_sale_name');
    select.innerHTML = '<option value="">-- Đang tải danh sách... --</option>';
    document.getElementById('fund_manual_modal').classList.remove('hidden');
    document.getElementById('fund_manual_modal').classList.add('flex');

    try {
        const { data } = await window.sb.from('master_shop_list').select('*');
        if (data) {
            const normalize = (name) => name ? name.trim().toLowerCase().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null;
            const members = new Set();
            data.forEach(s => {
                if (s.sale_name) members.add(normalize(s.sale_name));
                if (s.director_name) members.add(normalize(s.director_name));
                if (s.gd_mien) members.add(normalize(s.gd_mien));
                if (s.rsm) members.add(normalize(s.rsm));
            });
            
            const sorted = [...members].filter(Boolean).sort();
            select.innerHTML = '<option value="">-- Chọn thành viên --</option>' + sorted.map(m => `<option value="${m}">${m}</option>`).join('');
        }
    } catch (e) {
        console.error(e);
        select.innerHTML = '<option value="">Lỗi tải danh sách</option>';
    }
};

window.closeManualFundModal = () => {
    const modal = document.getElementById('fund_manual_modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
};

window.submitManualFund = async () => {
    const name = document.getElementById('manual_sale_name').value;
    const rawAmount = document.getElementById('manual_amount').value;
    const note = document.getElementById('manual_note').value;
    const month = document.getElementById('fund_month_filter').value;
    const type = document.getElementById('manual_type').value;

    if (!name || !rawAmount) return alert("Vui lòng chọn tên nhân sự và nhập số tiền!");

    let amount = Number(rawAmount);
    if (type === 'CHI') amount = -Math.abs(amount);
    else amount = Math.abs(amount);

    try {
        const payload = {
            sale_name: name,
            game_type: 'MANUAL',
            report_month: month,
            paid_amount: amount,
            note: note
        };

        const { error } = await window.sb.from('fund_payments').insert([payload]);
        if (error) throw error;

        alert('✅ Đã lưu khoản Thu/Chi thành công!');
        window.closeManualFundModal();
        
        document.getElementById('manual_amount').value = '';
        document.getElementById('manual_note').value = '';

        window.loadFundData(true); 
    } catch (err) {
        alert('❌ Lỗi hệ thống: ' + err.message);
    }
};

window.deleteManualFund = async (id) => {
    if (!confirm('⚠️ Bạn có chắc chắn muốn xóa vĩnh viễn bản ghi Thu/Chi này?')) return;
    try {
        const { error } = await window.sb.from('fund_payments').delete().eq('id', id);
        if (error) throw error;
        window.loadFundData(true);
    } catch (err) {
        alert('❌ Lỗi hệ thống: ' + err.message);
    }
};