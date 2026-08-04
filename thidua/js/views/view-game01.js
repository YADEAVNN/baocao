// File: js/views/view-game01.js

export const game01HTML = `
<div class="p-4 md:p-6 fade-in max-w-[1400px] mx-auto bg-[#F8FAFC] min-h-screen pb-10">
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
            <h1 class="text-2xl font-black text-orange-600 uppercase tracking-tight flex items-center gap-3">
                <button onclick="window.switchView('dashboard')" class="text-gray-400 hover:text-orange-500 transition"><i class="fa-solid fa-arrow-left"></i></button>
                GAME 01 - SOLO BỨT PHÁ
            </h1>
            <p class="text-sm font-bold text-gray-500 mt-1 ml-9">Quỹ Bứt Tốc – Kiểm soát hàng ngày (Target S.O)</p>
        </div>
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <i class="fa-regular fa-calendar text-gray-400"></i>
                <input type="date" id="g1-date-filter" onchange="window.loadGame01Data()" class="bg-transparent border-none font-bold text-slate-700 outline-none cursor-pointer text-sm">
            </div>
            <select id="g1-rsm-filter" onchange="window.loadGame01Data()" class="bg-white border border-gray-200 text-slate-700 font-bold py-2 px-3 rounded-lg text-sm outline-none shadow-sm cursor-pointer">
                <option value="">Tất cả Giám Đốc</option>
            </select>
            <button onclick="window.loadGame01Data()" class="bg-white text-gray-500 hover:text-blue-600 px-3 py-2 rounded-lg border border-gray-200 shadow-sm transition">
                <i class="fa-solid fa-rotate-right"></i>
            </button>
        </div>
    </div>

    <!-- 5 THẺ CHỈ SỐ TỔNG QUAN -->
    <div class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-xl shrink-0"><i class="fa-solid fa-users"></i></div>
            <div>
                <p class="text-[10px] font-black text-gray-400 uppercase">THÀNH VIÊN</p>
                <p class="text-xl font-black text-slate-800"><span id="g1-total-members">0</span> <span class="text-xs font-bold text-gray-400">người</span></p>
            </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl shrink-0"><i class="fa-solid fa-circle-check"></i></div>
            <div>
                <p class="text-[10px] font-black text-gray-400 uppercase">HOÀN THÀNH</p>
                <p class="text-xl font-black text-green-600"><span id="g1-passed">0</span> <span id="g1-passed-pct" class="text-xs font-bold text-gray-400">(0%)</span></p>
            </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xl shrink-0"><i class="fa-solid fa-circle-xmark"></i></div>
            <div>
                <p class="text-[10px] font-black text-gray-400 uppercase">KHÔNG HOÀN THÀNH</p>
                <p class="text-xl font-black text-red-600"><span id="g1-failed">0</span> <span id="g1-failed-pct" class="text-xs font-bold text-gray-400">(0%)</span></p>
            </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-orange-200 p-4 flex items-center gap-4 shadow-orange-100 relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 text-orange-100 text-6xl"><i class="fa-solid fa-sack-dollar"></i></div>
            <div class="w-12 h-12 rounded-full bg-orange-500 text-white flex items-center justify-center text-xl shrink-0 z-10"><i class="fa-solid fa-dollar-sign"></i></div>
            <div class="z-10">
                <p class="text-[10px] font-black text-orange-600 uppercase">QUỸ HÔM NAY</p>
                <p class="text-xl font-black text-orange-600"><span id="g1-fund-today">0</span>đ</p>
                <p class="text-[9px] font-bold text-gray-500" id="g1-fund-calc">(0 lượt x 50.000đ)</p>
            </div>
        </div>
        <div class="bg-white rounded-xl shadow-sm border border-purple-200 p-4 flex items-center gap-4 shadow-purple-100 relative overflow-hidden">
            <div class="absolute -right-4 -bottom-4 text-purple-100 text-6xl"><i class="fa-solid fa-gift"></i></div>
            <div class="w-12 h-12 rounded-full bg-purple-600 text-white flex items-center justify-center text-xl shrink-0 z-10"><i class="fa-solid fa-gift"></i></div>
            <div class="z-10">
                <p class="text-[10px] font-black text-purple-600 uppercase">QUỸ TÍCH LŨY THỰC</p>
                <p class="text-xl font-black text-purple-700"><span id="g1-fund-accum">0</span>đ</p>
                <p class="text-[9px] font-bold text-gray-500">Từ đầu tháng đến nay</p>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <!-- BẢNG XẾP HẠNG (CỘT TRÁI) -->
        <div class="xl:col-span-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div class="p-5 border-b border-gray-100 flex justify-between items-center">
                <h2 class="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                    BẢNG XẾP HẠNG THƯỞNG HÔM NAY (<span id="g1-display-date">--/--</span>) 
                    <i class="fa-solid fa-circle-info text-orange-400 text-xs" title="Hạn chót nộp và duyệt số là 12h00 trưa ngày kế tiếp để không bị phạt!"></i>
                </h2>
                <select id="g1-status-filter" onchange="window.renderGame01Table()" class="bg-gray-50 border border-gray-200 text-xs font-bold py-1.5 px-3 rounded-lg outline-none">
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PASS">Hoàn thành</option>
                    <option value="FAIL">Không hoàn thành</option>
                </select>
            </div>
            <div class="overflow-x-auto custom-scrollbar flex-1">
                <table class="w-full text-center whitespace-nowrap text-[13px]">
                    <thead class="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase border-b border-gray-200">
                        <tr>
                            <th class="py-3 px-3">STT</th>
                            <th class="py-3 px-3 text-left">THÀNH VIÊN (NVKD)</th>
                            <th class="py-3 px-3">TIẾN ĐỘ S.O (NGÀY)</th>
                            <th class="py-3 px-3">KẾT QUẢ HÔM NAY</th>
                            <th class="py-3 px-3">CÔNG NỢ LŨY KẾ <i class="fa-solid fa-circle-info text-gray-300"></i></th>
                            <th class="py-3 px-3">THƯỞNG HÔM NAY</th>
                            <th class="py-3 px-3">XẾP HẠNG</th>
                        </tr>
                    </thead>
                    <tbody id="g1-table-body" class="divide-y divide-gray-100 text-slate-700 font-medium">
                        <tr><td colspan="7" class="p-10 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu thi đua...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- THÔNG TIN PHỤ (CỘT PHẢI) -->
        <div class="xl:col-span-4 space-y-6">
            <!-- TỔNG QUAN QUỸ (DONUT CHART) -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h3 class="text-xs font-black text-slate-800 uppercase mb-4">TỔNG QUAN QUỸ</h3>
                <div class="flex items-center gap-4">
                    <div id="g1-donut-chart" class="w-1/2"></div>
                    <div class="w-1/2 space-y-3 text-[11px] font-bold">
                        <div class="flex items-center justify-between"><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-orange-400"></span> <span class="text-gray-500">Chưa TT</span></div> <span class="text-slate-800" id="g1-donut-unpaid">0đ</span></div>
                        <div class="flex items-center justify-between"><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-blue-500"></span> <span class="text-gray-500">ASM xác nhận</span></div> <span class="text-slate-800">0đ</span></div>
                        <div class="flex items-center justify-between"><div class="flex items-center gap-2"><span class="w-2.5 h-2.5 rounded-full bg-purple-600"></span> <span class="text-gray-500">RSM xác nhận</span></div> <span class="text-slate-800">0đ</span></div>
                    </div>
                </div>
            </div>

            <!-- TOP THƯỞNG -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h3 class="text-xs font-black text-slate-800 uppercase mb-4 flex justify-between">
                    TOP NHẬN THƯỞNG HÔM NAY
                </h3>
                <div id="g1-top-rewards" class="space-y-4">
                    <!-- Render by JS -->
                </div>
            </div>

            <!-- MỤC TIÊU QUỸ NGÀY -->
            <div class="bg-purple-50 rounded-2xl border border-purple-100 p-5 relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-purple-100 text-6xl opacity-50"><i class="fa-solid fa-bullseye"></i></div>
                <h3 class="text-xs font-black text-purple-800 uppercase mb-4 relative z-10">MỤC TIÊU TỶ LỆ HOÀN THÀNH</h3>
                <div class="flex items-center gap-4 relative z-10">
                    <div class="w-10 h-10 rounded-full bg-purple-200 text-purple-600 flex items-center justify-center text-xl shrink-0"><i class="fa-solid fa-bullseye"></i></div>
                    <div class="flex-1">
                        <p class="text-[10px] font-bold text-gray-500 mb-1">Mục tiêu: Đạt > 80% NVKD hoàn thành</p>
                        <div class="w-full bg-purple-200 h-2 rounded-full overflow-hidden">
                            <div id="g1-goal-bar" class="bg-purple-600 h-full rounded-full transition-all duration-1000" style="width: 0%"></div>
                        </div>
                        <p class="text-[10px] font-black text-purple-700 mt-1 text-right" id="g1-goal-text">0%</p>
                    </div>
                </div>
            </div>
            
            <!-- NHẮC THANH TOÁN -->
            <div class="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="text-orange-500 text-2xl animate-pulse"><i class="fa-solid fa-bell"></i></div>
                    <div>
                        <h4 class="text-xs font-black text-orange-800 uppercase">NHẮC THANH TOÁN</h4>
                        <p class="text-[10px] font-bold text-orange-600"><span id="g1-debt-count">0</span> lượt chưa đóng quỹ tháng này</p>
                    </div>
                </div>
                <button onclick="window.showDebtModal()" class="bg-white border border-orange-200 text-orange-600 text-[10px] font-black px-3 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition shadow-sm">Xem chi tiết & nhắc</button>
            </div>
        </div>
    </div>

    <!-- MODAL CHI TIẾT CÔNG NỢ & NHẮC QUỸ -->
    <div id="g1-debt-modal" class="fixed inset-0 z-[100] bg-gray-900/80 hidden items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-4 flex justify-between items-center border-b border-gray-100 bg-orange-50">
                <h3 class="text-lg font-black text-orange-600 uppercase flex items-center gap-2">
                    <i class="fa-solid fa-bell"></i> CHI TIẾT CÔNG NỢ QUỸ
                </h3>
                <button onclick="window.closeDebtModal()" class="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-red-500 hover:bg-red-100 transition shadow-sm">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-4 border-b border-gray-100 bg-orange-50/30 text-sm text-gray-600 font-medium">
                Công thức: <span class="font-bold text-red-500">Nợ lũy kế</span> - <span class="font-bold text-green-600">Thưởng lũy kế</span> = <span class="font-bold text-orange-600">Thực nợ</span><br>
                <span class="text-[11px] italic">(*Chỉ hiển thị những NVKD có Thực nợ > 0đ)</span>
            </div>
            <div class="p-0 overflow-y-auto flex-1 custom-scrollbar">
                <table class="w-full text-center whitespace-nowrap text-sm">
                    <thead class="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase sticky top-0">
                        <tr>
                            <th class="py-3 px-4 text-left">Thành viên (NVKD)</th>
                            <th class="py-3 px-4">Tổng Nợ</th>
                            <th class="py-3 px-4">Tổng Thưởng</th>
                            <th class="py-3 px-4 text-orange-600">THỰC NỢ QUỸ</th>
                        </tr>
                    </thead>
                    <tbody id="g1-debt-body" class="divide-y divide-gray-100 text-slate-700 font-medium">
                        <!-- Render bằng JS -->
                    </tbody>
                </table>
            </div>
            <div class="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                <button onclick="window.closeDebtModal()" class="px-6 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Đóng</button>
                <button onclick="window.copyDebtList()" id="btn-copy-debt" class="px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition flex items-center gap-2 shadow-lg">
                    <i class="fa-regular fa-copy"></i> COPY GỬI ZALO GROUP
                </button>
            </div>
        </div>
    </div>
</div>
`;

window.g1State = { data: [] };

window.loadGame01Data = async () => {
    // 1. Setup Date Filter
    const dateInput = document.getElementById('g1-date-filter');
    if (!dateInput.value) {
        const today = new Date();
        // Lấy giờ VN an toàn
        const vnTime = new Date(today.getTime() + 7 * 3600 * 1000);
        dateInput.value = vnTime.toISOString().split('T')[0];
    }
    const selectedDate = dateInput.value;
    const [year, month, day] = selectedDate.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    document.getElementById('g1-display-date').innerText = `${day}/${month}`;

    const rsmFilter = document.getElementById('g1-rsm-filter').value;
    const PENALTY_FEE = 50000;

    try {
        const startDate = `${year}-${month}-01`;

        // 2. Fetch Data: Lấy data từ MÙNG 1 đến NGÀY HIỆN TẠI để tính Lũy Kế
        const [shopsRes, targetRes, soRes] = await Promise.all([
            window.sb.from('master_shop_list').select('sale_name, director_name'),
            window.sb.from('monthly_sale_targets').select('*').like('report_month', `${year}-${month}%`),
            window.sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', selectedDate)
        ]);

        const shops = shopsRes.data || [];
        const targets = targetRes.data || [];
        const soData = soRes.data || [];

        // Normalize tên cho chuẩn
        const normalize = (name) => name ? name.trim().toLowerCase().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null;
        
        let validSalesMap = {}; 
        shops.forEach(s => {
            const sName = normalize(s.sale_name);
            const dName = normalize(s.director_name);
            if (sName) validSalesMap[sName] = dName || 'Chưa rõ';
        });

        // Đổ bộ lọc RSM
        const rsms = [...new Set(Object.values(validSalesMap))].sort();
        const rsmSelect = document.getElementById('g1-rsm-filter');
        if (rsmSelect.options.length <= 1) {
            rsmSelect.innerHTML = '<option value="">Tất cả Giám Đốc</option>' + rsms.map(r => `<option value="${r}">${r}</option>`).join('');
            if (rsmFilter) rsmSelect.value = rsmFilter;
        }

        // Khởi tạo bảng thống kê cho từng Sale
        let saleStatsMap = {};
        Object.keys(validSalesMap).forEach(sName => {
            const tgtRow = targets.find(t => normalize(t.sale_name) === sName);
            const targetMonth = tgtRow ? Number(tgtRow.target_so || 0) : 0;
            const targetDay = targetMonth > 0 ? Math.ceil(targetMonth / daysInMonth) : 0;

            if (targetDay > 0) { // Chỉ đưa người có Target vào Game
                saleStatsMap[sName] = {
                    name: sName,
                    director: validSalesMap[sName],
                    targetDay: targetDay,
                    accumReward: 0,
                    accumDebt: 0,
                    todayActual: 0,
                    todayPass: false,
                    todayReward: 0,
                    todayDebt: 0,
                    debtDays: 0 // Đếm số ngày tạch
                };
            }
        });

        let totalAccumFund = 0;
        let todayFund = 0;
        let todayPassCount = 0;
        let todayFailCount = 0;
        const currentDayNum = parseInt(day, 10);

        // 3. VÒNG LẶP LỊCH SỬ TỪ MÙNG 1 -> NGÀY ĐANG CHỌN 
        for (let d = 1; d <= currentDayNum; d++) {
            const dDateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const dailyReports = soData.filter(r => r.report_date === dDateStr);

            let dailyPassCount = 0;
            let dailyFailCount = 0;
            let dailyValidSales = [];

            Object.keys(saleStatsMap).forEach(sName => {
                const stats = saleStatsMap[sName];
                const saleReports = dailyReports.filter(r => normalize(r.sale_name) === sName);

                let actualForGame = 0;

                saleReports.forEach(r => {
                    // XỬ LÝ LUẬT SẮT 1: CHỈ LẤY CÁC BÁO CÁO ĐÃ ĐƯỢC DUYỆT (Loại bỏ pending, rejected)
                    if (r.status !== 'approved') return;

                    // XỬ LÝ LUẬT SẮT 2: HẠN CHÓT LÀ 12H TRƯA NGÀY HÔM SAU
                    let createdStr = r.created_at || r.inserted_at;
                    if (createdStr) {
                        let createdDateObj = new Date(createdStr);
                        
                        // Lấy ngày báo cáo (dDateStr = YYYY-MM-DD)
                        let [rY, rM, rD] = dDateStr.split('-').map(Number);
                        
                        // Tính mốc deadline: 12h00 trưa giờ VN (UTC+7) của ngày hôm sau.
                        // 12h trưa VN = 5h sáng UTC.
                        let deadlineMs = Date.UTC(rY, rM - 1, rD + 1, 5, 0, 0);

                        // Nếu giờ ấn nút Gửi <= Mốc 12h trưa ngày hôm sau
                        if (createdDateObj.getTime() <= deadlineMs) {
                            actualForGame += Number(r.total_so || 0);
                        }
                    } else {
                        // Nếu không có timestamp thì vẫn cộng (tránh lỗi data cũ)
                        actualForGame += Number(r.total_so || 0);
                    }
                });

                if (d === currentDayNum) {
                    stats.todayActual = actualForGame;
                }

                const isPass = actualForGame >= stats.targetDay;

                if (isPass) {
                    dailyPassCount++;
                    dailyValidSales.push({ name: sName, isPass: true });
                } else {
                    dailyFailCount++;
                    dailyValidSales.push({ name: sName, isPass: false });
                }
            });

            // Tính Quỹ của ngày 'd'
            const dailyFund = dailyFailCount * PENALTY_FEE;
            totalAccumFund += dailyFund;
            const dailyRewardPerPerson = dailyPassCount > 0 ? dailyFund / dailyPassCount : 0;

            if (d === currentDayNum) {
                todayFund = dailyFund;
                todayPassCount = dailyPassCount;
                todayFailCount = dailyFailCount;
            }

            // Ghi nhận tích lũy vào Stats
            dailyValidSales.forEach(s => {
                const stats = saleStatsMap[s.name];
                if (s.isPass) {
                    stats.accumReward += dailyRewardPerPerson;
                    if (d === currentDayNum) {
                        stats.todayPass = true;
                        stats.todayReward = dailyRewardPerPerson;
                        stats.todayDebt = 0;
                    }
                } else {
                    stats.accumDebt += PENALTY_FEE;
                    stats.debtDays += 1;
                    if (d === currentDayNum) {
                        stats.todayPass = false;
                        stats.todayReward = 0;
                        stats.todayDebt = PENALTY_FEE;
                    }
                }
            });
        }

        // Chuyển Object thành Mảng và Lọc theo Giám đốc
        let finalStats = Object.values(saleStatsMap);
        if (rsmFilter) finalStats = finalStats.filter(s => s.director === rsmFilter);

        // Sort: Người Pass đứng trước, sau đó theo Actual Day
        finalStats.sort((a, b) => {
            if (a.todayPass && !b.todayPass) return -1;
            if (!a.todayPass && b.todayPass) return 1;
            return b.todayActual - a.todayActual;
        });

        window.g1State.data = finalStats;

        // 4. Đổ dữ liệu ra Card Tổng Quan
        const fmt = n => Math.round(Number(n)).toLocaleString('vi-VN');
        const totalMembersFiltered = finalStats.length; 
        
        const passPct = totalMembersFiltered > 0 ? ((todayPassCount/totalMembersFiltered)*100).toFixed(1) : 0;
        const failPct = totalMembersFiltered > 0 ? ((todayFailCount/totalMembersFiltered)*100).toFixed(1) : 0;

        document.getElementById('g1-total-members').innerText = totalMembersFiltered;
        document.getElementById('g1-passed').innerText = todayPassCount;
        document.getElementById('g1-passed-pct').innerText = `(${passPct}%)`;
        document.getElementById('g1-failed').innerText = todayFailCount;
        document.getElementById('g1-failed-pct').innerText = `(${failPct}%)`;
        
        document.getElementById('g1-fund-today').innerText = fmt(todayFund);
        document.getElementById('g1-fund-calc').innerText = `(${todayFailCount} lượt x 50.000đ)`;
        
        document.getElementById('g1-fund-accum').innerText = fmt(totalAccumFund);

        document.getElementById('g1-goal-bar').style.width = `${Math.min(100, passPct)}%`;
        document.getElementById('g1-goal-text').innerText = `${passPct}% (Mục tiêu > 80%)`;
        
        let totalDebtDays = finalStats.reduce((sum, s) => sum + s.debtDays, 0);
        document.getElementById('g1-debt-count').innerText = totalDebtDays;

        window.renderGame01Table();
        window.renderGame01Charts(totalAccumFund); 

    } catch (err) {
        console.error(err);
        document.getElementById('g1-table-body').innerHTML = `<tr><td colspan="7" class="p-10 text-red-500 font-bold">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
};

window.renderGame01Table = () => {
    const filter = document.getElementById('g1-status-filter').value;
    let data = window.g1State.data;

    if (filter === 'PASS') data = data.filter(s => s.todayPass);
    if (filter === 'FAIL') data = data.filter(s => !s.todayPass);

    const tbody = document.getElementById('g1-table-body');
    const fmt = n => Math.round(Number(n)).toLocaleString('vi-VN');

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-10 text-gray-400">Không có dữ liệu phù hợp</td></tr>`;
        return;
    }

    let topHtml = '';

    tbody.innerHTML = data.map((s, i) => {
        const isPass = s.todayPass;
        
        const statusHtml = isPass 
            ? `<div class="inline-flex items-center gap-1.5 bg-green-50 text-green-600 border border-green-200 px-3 py-1 rounded-full text-[10px] font-black uppercase"><i class="fa-solid fa-circle-check"></i> Đạt</div>` 
            : `<div class="inline-flex items-center gap-1.5 bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded-full text-[10px] font-black uppercase"><i class="fa-solid fa-circle-xmark"></i> Không đạt</div>`;
        
        const debtHtml = s.accumDebt === 0
            ? `<span class="text-green-600 font-bold">0đ</span><br><span class="text-[9px] text-gray-400">Đủ</span>`
            : `<span class="text-red-500 font-black">${fmt(s.accumDebt)}đ</span><br><span class="text-[9px] text-gray-400">Nợ ${s.debtDays} lượt</span>`;
            
        const rewardHtml = isPass
            ? `<span class="text-orange-500 font-black flex items-center justify-center gap-1"><i class="fa-solid fa-coins"></i> ${fmt(s.todayReward)}đ</span>`
            : `<span class="text-gray-300 font-bold">0đ</span><br><span class="text-[9px] text-gray-300">--</span>`;

        let rankHtml = `<span class="font-bold text-gray-400">${i+1}</span>`;
        if (isPass) {
            if (i === 0) rankHtml = `<i class="fa-solid fa-medal text-2xl text-yellow-500 drop-shadow-md"></i>`;
            else if (i === 1) rankHtml = `<i class="fa-solid fa-medal text-xl text-slate-300 drop-shadow-md"></i>`;
            else if (i === 2) rankHtml = `<i class="fa-solid fa-medal text-xl text-amber-600 drop-shadow-md"></i>`;
            
            if (i < 3) {
                const colors = ['text-yellow-500', 'text-slate-300', 'text-amber-600'];
                topHtml += `
                    <div class="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                        <div class="flex items-center gap-3">
                            <span class="font-bold text-gray-400 w-3">${i+1}</span>
                            <i class="fa-solid fa-trophy ${colors[i]} text-lg"></i>
                            <span class="font-bold text-slate-700 text-xs">${s.name}</span>
                        </div>
                        <span class="font-black text-orange-500 text-xs">+${fmt(s.todayReward)}đ</span>
                    </div>
                `;
            }
        }

        return `
            <tr class="hover:bg-slate-50 transition border-b border-gray-50">
                <td class="py-3 px-3 font-bold text-gray-400">${i+1}</td>
                <td class="py-3 px-3 text-left">
                    <div class="flex items-center gap-2">
                        <div class="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0"><i class="fa-solid fa-user-tie"></i></div>
                        <div>
                            <p class="font-black text-slate-800">${s.name}</p>
                            <p class="text-[9px] font-bold text-gray-400">${s.director}</p>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-3">
                    <div class="text-xs font-bold text-gray-500">Đạt <span class="text-slate-800 font-black text-sm">${s.todayActual}</span> / ${s.targetDay} xe</div>
                </td>
                <td class="py-3 px-3">${statusHtml}</td>
                <td class="py-3 px-3 leading-tight">${debtHtml}</td>
                <td class="py-3 px-3 leading-tight bg-orange-50/30">${rewardHtml}</td>
                <td class="py-3 px-3">
                    <div class="flex flex-col items-center">
                        <span class="font-bold text-green-600 mb-1" title="Tổng thưởng tích lũy từ đầu tháng">${fmt(s.accumReward)}đ</span>
                        ${rankHtml}
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    document.getElementById('g1-top-rewards').innerHTML = topHtml || '<p class="text-xs text-gray-400 italic">Chưa có ai nhận thưởng hôm nay</p>';
};

window.renderGame01Charts = (totalFund) => {
    if (typeof ApexCharts !== 'undefined') {
        const el = document.querySelector("#g1-donut-chart");
        el.innerHTML = ''; 
        
        const unPaid = totalFund; 
        document.getElementById('g1-donut-unpaid').innerText = Number(unPaid).toLocaleString('vi-VN') + 'đ';

        const options = {
            series: [unPaid, 0, 0], 
            labels: ['Chưa thanh toán', 'ASM xác nhận', 'RSM xác nhận'],
            chart: { type: 'donut', height: 160, fontFamily: 'Inter, sans-serif' },
            colors: ['#fb923c', '#3b82f6', '#9333ea'],
            plotOptions: {
                pie: {
                    donut: {
                        size: '70%',
                        labels: {
                            show: true,
                            name: { show: false },
                            value: { show: true, fontSize: '14px', fontWeight: 900, color: '#1e293b', formatter: () => 'Quỹ Thực' },
                            total: { show: true, showAlways: true, label: 'Quỹ', fontSize: '10px', color: '#94a3b8' }
                        }
                    }
                }
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            stroke: { show: false }
        };

        const chart = new ApexCharts(el, options);
        chart.render();
    }
};

// ==========================================
// LOGIC MODAL CHI TIẾT CÔNG NỢ & NHẮC QUỸ
// ==========================================

window.showDebtModal = () => {
    const data = window.g1State.data || [];
    const tbody = document.getElementById('g1-debt-body');
    const fmt = n => Math.round(Number(n)).toLocaleString('vi-VN');

    // Tính Thực nợ = Nợ lũy kế - Thưởng lũy kế
    const debtList = data.map(s => {
        return {
            name: s.name,
            director: s.director,
            accumDebt: s.accumDebt,
            accumReward: s.accumReward,
            netDebt: s.accumDebt - s.accumReward // THỰC NỢ
        };
    })
    .filter(s => s.netDebt > 0)
    .sort((a, b) => b.netDebt - a.netDebt);

    if (debtList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="p-8 text-center text-gray-500 font-bold">Tất cả đều đã cấn trừ xong. Không có ai đang nợ quỹ.</td></tr>';
    } else {
        tbody.innerHTML = debtList.map(s => `
            <tr class="hover:bg-orange-50/30 transition">
                <td class="py-3 px-4 text-left">
                    <p class="font-black text-slate-800">${s.name}</p>
                    <p class="text-[10px] font-bold text-gray-400">${s.director}</p>
                </td>
                <td class="py-3 px-4 font-bold text-red-500">${fmt(s.accumDebt)}đ</td>
                <td class="py-3 px-4 font-bold text-green-600">${fmt(s.accumReward)}đ</td>
                <td class="py-3 px-4 font-black text-orange-600 text-base">${fmt(s.netDebt)}đ</td>
            </tr>
        `).join('');
    }

    const modal = document.getElementById('g1-debt-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeDebtModal = () => {
    const modal = document.getElementById('g1-debt-modal');
    modal.classList.add('hidden');
    modal.classList.remove('flex');
    
    const btnCopy = document.getElementById('btn-copy-debt');
    if(btnCopy) {
        btnCopy.innerHTML = '<i class="fa-regular fa-copy"></i> COPY GỬI ZALO GROUP';
        btnCopy.className = 'px-6 py-2.5 bg-orange-500 text-white font-bold rounded-xl hover:bg-orange-600 transition flex items-center gap-2 shadow-lg';
    }
};

window.copyDebtList = () => {
    const data = window.g1State.data || [];
    const fmt = n => Math.round(Number(n)).toLocaleString('vi-VN');
    
    const debtList = data.map(s => ({
        name: s.name,
        netDebt: s.accumDebt - s.accumReward
    })).filter(s => s.netDebt > 0).sort((a, b) => b.netDebt - a.netDebt);

    if(debtList.length === 0) return alert("Hiện tại không có NVKD nào nợ quỹ để nhắc!");

    let text = "🔔 THÔNG BÁO CÔNG NỢ QUỸ SOLO BỨT PHÁ\n\n";
    debtList.forEach((s, i) => {
        text += `${i+1}. ${s.name}: Nợ ${fmt(s.netDebt)}đ\n`;
    });
    
    text += "\n*(Số tiền trên là THỰC NỢ sau khi đã cấn trừ khoản Thưởng tích lũy)*\n\nĐề nghị các đồng chí thanh toán quỹ đúng hạn để duy trì cuộc đua!";

    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btn-copy-debt');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ĐÃ COPY THÀNH CÔNG';
        btn.className = 'px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center gap-2 shadow-lg';
    });
};