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

    <!-- MAIN GRID 9:3 -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-5">
        <!-- BẢNG XẾP HẠNG (CỘT TRÁI - Chiếm 9 phần) -->
        <div class="xl:col-span-9 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
            <div class="p-4 border-b border-gray-100 flex justify-between items-center">
                <h2 class="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                    <span class="bg-[#F97316] text-white w-6 h-6 rounded flex items-center justify-center text-xs shadow-sm">2</span> 
                    BẢNG XẾP HẠNG THÀNH VIÊN (THEO NGÀY) 
                    <span id="g1-display-date" class="text-gray-400 font-bold text-xs ml-1">(--/--)</span>
                </h2>
                <select id="g1-status-filter" onchange="window.renderGame01Table()" class="bg-white border border-gray-200 text-xs font-bold py-1.5 px-2 rounded-lg outline-none shadow-sm cursor-pointer">
                    <option value="ALL">Tất cả trạng thái</option>
                    <option value="PASS">Hoàn thành</option>
                    <option value="FAIL">Không hoàn thành</option>
                </select>
            </div>
            
            <div class="overflow-x-auto flex-1">
                <table class="w-full text-center whitespace-nowrap text-xs border-collapse">
                    <thead class="text-white font-bold text-[9px] uppercase">
                        <tr class="bg-[#0b2447]">
                            <th rowspan="2" class="py-3 px-2 w-8 border border-slate-600 align-middle">STT</th>
                            <th rowspan="2" class="py-3 px-3 text-left border border-slate-600 align-middle">THÀNH VIÊN (NVKD)</th>
                            <th rowspan="2" class="py-3 px-2 border border-slate-600 align-middle">TIẾN ĐỘ S.O NGÀY<br><span class="text-[8px] font-normal text-blue-200">(Thực đạt / Target)</span></th>
                            <th class="py-3 px-2 border border-slate-600 align-middle">TRẠNG THÁI NGÀY</th>
                            <th class="py-3 px-2 border border-slate-600 align-middle">THƯỞNG NGÀY</th>
                            <th class="py-3 px-2 border border-slate-600 align-middle">ĐÓNG GÓP NGÀY</th>
                            <th class="py-3 px-2 border border-slate-600 align-middle">THƯỞNG TÍCH LŨY<br><span class="text-[8px] font-normal text-blue-200">(Từ đầu chương trình)</span></th>
                            <th class="py-3 px-2 border border-slate-600 align-middle">ĐÓNG GÓP TÍCH LŨY<br><span class="text-[8px] font-normal text-blue-200">(Từ đầu chương trình)</span></th>
                            <th rowspan="2" class="py-3 px-2 w-12 border border-slate-600 align-middle">XẾP HẠNG</th>
                        </tr>
                        <tr class="bg-white">
                            <th colspan="3" class="py-1.5 px-2 border border-blue-200 text-blue-600 text-[9px]">KẾT QUẢ NGÀY (Phát sinh của ngày được chọn)</th>
                            <th colspan="2" class="py-1.5 px-2 border border-green-200 text-green-600 text-[9px]">TỔNG KẾT TÍCH LŨY (Tích lũy từ đầu chương trình đến ngày được chọn)</th>
                        </tr>
                    </thead>
                    <tbody id="g1-table-body" class="text-slate-700 font-medium">
                        <tr><td colspan="9" class="p-10 text-gray-400 border border-gray-200"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu thi đua...</td></tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Chú giải bảng -->
            <div class="p-3 bg-white border-t border-gray-200 flex flex-wrap gap-4 text-[10px] font-bold text-slate-600 justify-between items-center">
                <div class="flex gap-4">
                    <div class="flex items-center"><i class="fa-solid fa-circle text-green-500 mr-1.5 text-[8px]"></i> ĐẠT: Thực đạt ≥ Target ngày <i class="fa-solid fa-arrow-right mx-1.5 text-gray-400"></i> <span class="text-slate-800">Nhận thưởng</span></div>
                    <div class="flex items-center"><i class="fa-solid fa-circle text-red-500 mr-1.5 text-[8px]"></i> KHÔNG ĐẠT: Thực đạt < Target ngày <i class="fa-solid fa-arrow-right mx-1.5 text-gray-400"></i> <span class="text-slate-800">Đóng góp</span></div>
                </div>
                <div class="text-gray-400 font-medium italic">* Mức thưởng / đóng góp theo quy định chương trình</div>
            </div>
        </div>

        <!-- THÔNG TIN PHỤ (CỘT PHẢI - Chiếm 3 phần) -->
        <div class="xl:col-span-3 space-y-5">
            <!-- TỔNG QUAN QUỸ (DONUT CHART) -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <h3 class="text-[11px] font-black text-slate-800 uppercase mb-3">TỔNG QUAN QUỸ</h3>
                <div class="flex flex-col xl:flex-row items-center gap-2">
                    <div id="g1-donut-chart" class="w-full xl:w-1/2 -ml-2"></div>
                    <div class="w-full xl:w-1/2 space-y-2 text-[10px] font-bold">
                        <div class="flex items-center justify-between"><div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-orange-400"></span> <span class="text-gray-500">Chưa TT</span></div> <span class="text-slate-800" id="g1-donut-unpaid">0đ</span></div>
                        <div class="flex items-center justify-between"><div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-blue-500"></span> <span class="text-gray-500">ASM duyệt</span></div> <span class="text-slate-800">0đ</span></div>
                        <div class="flex items-center justify-between"><div class="flex items-center gap-1.5"><span class="w-2 h-2 rounded-full bg-purple-600"></span> <span class="text-gray-500">RSM duyệt</span></div> <span class="text-slate-800">0đ</span></div>
                    </div>
                </div>
            </div>

            <!-- TOP THƯỞNG -->
            <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
                <h3 class="text-[11px] font-black text-slate-800 uppercase mb-3">TOP NHẬN THƯỞNG HÔM NAY</h3>
                <div id="g1-top-rewards" class="space-y-3">
                    <!-- Render by JS -->
                </div>
            </div>

            <!-- MỤC TIÊU QUỸ NGÀY -->
            <div class="bg-purple-50 rounded-2xl border border-purple-100 p-4 relative overflow-hidden">
                <div class="absolute -right-4 -bottom-4 text-purple-100 text-6xl opacity-50"><i class="fa-solid fa-bullseye"></i></div>
                <h3 class="text-[11px] font-black text-purple-800 uppercase mb-3 relative z-10">MỤC TIÊU HOÀN THÀNH</h3>
                <div class="flex items-center gap-3 relative z-10">
                    <div class="w-8 h-8 rounded-full bg-purple-200 text-purple-600 flex items-center justify-center text-lg shrink-0"><i class="fa-solid fa-bullseye"></i></div>
                    <div class="flex-1">
                        <p class="text-[9px] font-bold text-gray-500 mb-1">Mục tiêu: Đạt > 80% NVKD</p>
                        <div class="w-full bg-purple-200 h-1.5 rounded-full overflow-hidden">
                            <div id="g1-goal-bar" class="bg-purple-600 h-full rounded-full transition-all duration-1000" style="width: 0%"></div>
                        </div>
                        <p class="text-[9px] font-black text-purple-700 mt-1 text-right" id="g1-goal-text">0%</p>
                    </div>
                </div>
            </div>
            
            <!-- NHẮC ĐÓNG QUỸ -->
            <div class="bg-orange-50 border border-orange-200 rounded-2xl p-3 flex items-center justify-between">
                <div class="flex items-center gap-2">
                    <div class="text-orange-500 text-xl animate-pulse"><i class="fa-solid fa-bell"></i></div>
                    <div>
                        <h4 class="text-[10px] font-black text-orange-800 uppercase leading-tight">NHẮC ĐÓNG QUỸ</h4>
                        <p class="text-[9px] font-bold text-orange-600"><span id="g1-debt-count">0</span> NVKD đang nợ quỹ</p>
                    </div>
                </div>
                <button onclick="window.showDebtModal()" class="bg-white border border-orange-200 text-orange-600 text-[9px] font-black px-2 py-1.5 rounded-lg hover:bg-orange-500 hover:text-white transition shadow-sm">Nhắc nhở</button>
            </div>
        </div>
    </div>

    <!-- MODAL CHI TIẾT ĐÓNG QUỸ -->
    <div id="g1-debt-modal" class="fixed inset-0 z-[100] bg-gray-900/80 hidden items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-4 flex justify-between items-center border-b border-gray-100 bg-orange-50">
                <h3 class="text-lg font-black text-orange-600 uppercase flex items-center gap-2">
                    <i class="fa-solid fa-bell"></i> CHI TIẾT CẦN ĐÓNG QUỸ
                </h3>
                <button onclick="window.closeDebtModal()" class="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-red-500 hover:bg-red-100 transition shadow-sm">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-3 border-b border-gray-100 bg-orange-50/30 text-xs text-gray-600 font-medium">
                <span class="text-[11px] italic">* Số tiền hiển thị là khoản NVKD cần đóng thực tế (đã trừ đi những lần nộp trước đó thông qua Tab Quỹ).</span>
            </div>
            <div class="p-0 overflow-y-auto flex-1 custom-scrollbar">
                <table class="w-full text-center whitespace-nowrap text-sm">
                    <thead class="bg-gray-50 text-gray-500 font-bold text-[10px] uppercase sticky top-0">
                        <tr>
                            <th class="py-3 px-4 text-left">Thành viên (NVKD)</th>
                            <th class="py-3 px-4 text-orange-600">SỐ TIỀN CẦN ĐÓNG</th>
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
    const dateInput = document.getElementById('g1-date-filter');
    if (!dateInput.value) {
        const today = new Date();
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

        // Lấy thêm dữ liệu từ fund_payments để tính toán
        const [shopsRes, targetRes, soRes, paymentRes] = await Promise.all([
            window.sb.from('master_shop_list').select('sale_name, director_name'),
            window.sb.from('monthly_sale_targets').select('*').like('report_month', `${year}-${month}%`),
            window.sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', selectedDate),
            window.sb.from('fund_payments').select('*').eq('report_month', `${year}-${month}`).eq('game_type', 'GAME01')
        ]);

        const shops = shopsRes.data || [];
        const targets = targetRes.data || [];
        const soData = soRes.data || [];
        const payments = paymentRes.data || [];

        const normalize = (name) => name ? name.trim().toLowerCase().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null;
        
        let validSalesMap = {}; 
        shops.forEach(s => {
            const sName = normalize(s.sale_name);
            const dName = normalize(s.director_name);
            if (sName) validSalesMap[sName] = dName || 'Chưa rõ';
        });

        const rsms = [...new Set(Object.values(validSalesMap))].sort();
        const rsmSelect = document.getElementById('g1-rsm-filter');
        if (rsmSelect.options.length <= 1) {
            rsmSelect.innerHTML = '<option value="">Tất cả Giám Đốc</option>' + rsms.map(r => `<option value="${r}">${r}</option>`).join('');
            if (rsmFilter) rsmSelect.value = rsmFilter;
        }

        let saleStatsMap = {};
        Object.keys(validSalesMap).forEach(sName => {
            const tgtRow = targets.find(t => normalize(t.sale_name) === sName);
            const targetMonth = tgtRow ? Number(tgtRow.target_so || 0) : 0;
            const targetDay = targetMonth > 0 ? Math.ceil(targetMonth / daysInMonth) : 0;

            if (targetDay > 0) { 
                saleStatsMap[sName] = {
                    name: sName,
                    director: validSalesMap[sName],
                    targetDay: targetDay,
                    accumReward: 0,
                    accumDebt: 0, // Sẽ lưu nợ gốc
                    todayActual: 0,
                    todayPass: false,
                    todayReward: 0,
                    todayDebt: 0
                };
            }
        });

        let totalAccumFund = 0;
        let todayFund = 0;
        let todayPassCount = 0;
        let todayFailCount = 0;
        const currentDayNum = parseInt(day, 10);

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

            const dailyFund = dailyFailCount * PENALTY_FEE;
            totalAccumFund += dailyFund;
            const dailyRewardPerPerson = dailyPassCount > 0 ? dailyFund / dailyPassCount : 0;

            if (d === currentDayNum) {
                todayFund = dailyFund;
                todayPassCount = dailyPassCount;
                todayFailCount = dailyFailCount;
            }

            dailyValidSales.forEach(s => {
                const stats = saleStatsMap[s.name];
                if (s.isPass) {
                    stats.accumReward += dailyRewardPerPerson;
                    if (d === currentDayNum) {
                        stats.todayPass = true;
                        stats.todayReward = dailyRewardPerPerson;
                    }
                } else {
                    stats.accumDebt += PENALTY_FEE; // Nợ gốc
                    if (d === currentDayNum) {
                        stats.todayPass = false;
                        stats.todayDebt = PENALTY_FEE;
                    }
                }
            });
        }

        let finalStats = Object.values(saleStatsMap);
        if (rsmFilter) finalStats = finalStats.filter(s => s.director === rsmFilter);

        // THUẬT TOÁN SẮP XẾP MỚI VÀ TRỪ TIỀN QUỸ ĐÃ ĐÓNG
        finalStats.forEach(s => {
            // Lấy tổng số tiền Sale đã đóng trên Tab Quỹ
            const paid = payments.filter(p => p.sale_name === s.name).reduce((sum, p) => sum + Number(p.paid_amount), 0);
            
            // Trừ đi số tiền đã đóng, ra nợ thực tế hiển thị trên bảng
            s.accumDebt = Math.max(0, s.accumDebt - paid); 
            
            // Tính số ngày nợ tương ứng với tiền thực tế
            s.debtDays = Math.ceil(s.accumDebt / PENALTY_FEE);
        });

        finalStats.sort((a, b) => {
            if (b.accumReward !== a.accumReward) return b.accumReward - a.accumReward; 
            if (a.accumDebt !== b.accumDebt) return a.accumDebt - b.accumDebt;         
            return b.todayActual - a.todayActual;                                      
        });

        window.g1State.data = finalStats;

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
        
        let totalDebtCount = finalStats.filter(s => s.accumDebt > 0).length;
        document.getElementById('g1-debt-count').innerText = totalDebtCount;

        window.renderGame01Table();
        window.renderGame01Charts(totalAccumFund); 

    } catch (err) {
        console.error(err);
        document.getElementById('g1-table-body').innerHTML = `<tr><td colspan="9" class="p-10 text-red-500 font-bold text-center">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
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
        tbody.innerHTML = `<tr><td colspan="9" class="p-10 text-gray-400 text-center border border-gray-200">Không có dữ liệu phù hợp</td></tr>`;
        return;
    }

    let topHtml = '';
    const topToday = [...data].filter(s => s.todayPass).sort((a, b) => b.todayActual - a.todayActual).slice(0, 3);
    
    topToday.forEach((s, idx) => {
        const colors = ['text-yellow-500', 'text-slate-300', 'text-amber-600'];
        topHtml += `
            <div class="flex items-center justify-between border-b border-gray-50 pb-3 last:border-0 last:pb-0">
                <div class="flex items-center gap-3">
                    <span class="font-bold text-gray-400 w-3">${idx+1}</span>
                    <i class="fa-solid fa-trophy ${colors[idx]} text-lg"></i>
                    <span class="font-bold text-slate-700 text-xs">${s.name}</span>
                </div>
                <span class="font-black text-green-600 text-xs">+${fmt(s.todayReward)}đ</span>
            </div>
        `;
    });
    document.getElementById('g1-top-rewards').innerHTML = topHtml || '<p class="text-xs text-gray-400 italic">Chưa có ai nhận thưởng hôm nay</p>';

    // RENDER BẢNG XẾP HẠNG CHÍNH ĐÚNG CHUẨN MẪU MỚI
    tbody.innerHTML = data.map((s, i) => {
        const isPass = s.todayPass;
        
        const statusHtml = isPass 
            ? `<div class="inline-flex items-center gap-1 bg-green-50 text-green-600 px-3 py-1 rounded-full text-[10px] font-black uppercase"><i class="fa-solid fa-circle-check"></i> Đạt</div>` 
            : `<div class="inline-flex items-center gap-1 bg-red-50 text-red-500 px-3 py-1 rounded-full text-[10px] font-black uppercase"><i class="fa-solid fa-circle-xmark"></i> Không đạt</div>`;
            
        const rewardToday = isPass ? `<span class="text-green-600 font-bold">${fmt(s.todayReward)}đ</span>` : `<span class="text-gray-800">0đ</span>`;
        const debtToday = !isPass ? `<span class="text-red-500 font-bold">${fmt(s.todayDebt)}đ</span>` : `<span class="text-gray-800">0đ</span>`;
        
        const accumReward = `<span class="text-green-600 font-bold">${fmt(s.accumReward)}đ</span>`;
        
        // Hiển thị Số lượt nợ và Số tiền
        const accumDebt = s.accumDebt === 0 
            ? `<span class="text-red-500 font-bold">0đ</span>` 
            : `<span class="text-red-500 font-bold">${fmt(s.accumDebt)}đ</span><br><span class="text-[8px] text-gray-400">Còn nợ ${s.debtDays} lượt</span>`;

        let rankHtml = `<span class="font-bold text-gray-800">${i+1}</span>`;
        if (i === 0) rankHtml = `<i class="fa-solid fa-crown text-yellow-500 text-xl drop-shadow-sm"></i><span class="ml-1.5 font-black text-slate-800">1</span>`;
        else if (i === 1) rankHtml = `<i class="fa-solid fa-medal text-lg text-slate-400 drop-shadow-sm"></i><span class="ml-1.5 font-black text-slate-800">2</span>`;
        else if (i === 2) rankHtml = `<i class="fa-solid fa-medal text-lg text-amber-600 drop-shadow-sm"></i><span class="ml-1.5 font-black text-slate-800">3</span>`;

        return `
            <tr class="hover:bg-slate-50 transition">
                <td class="py-2.5 px-2 border border-gray-200 text-center font-bold text-gray-500 w-8">${i+1}</td>
                <td class="py-2.5 px-3 border border-gray-200 text-left">
                    <div class="flex items-center gap-2">
                        <div class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center shrink-0 text-[10px]"><i class="fa-solid fa-user-tie"></i></div>
                        <div class="leading-tight">
                            <p class="font-black text-slate-800 text-[11px]">${s.name}</p>
                            <p class="text-[8px] font-bold text-gray-400 truncate w-32" title="${s.director}">${s.director}</p>
                        </div>
                    </div>
                </td>
                <td class="py-2.5 px-2 border border-gray-200 text-center font-bold text-slate-700">
                    ${s.todayActual} / ${s.targetDay} xe
                </td>
                <td class="py-2.5 px-2 border border-gray-200 text-center">${statusHtml}</td>
                <td class="py-2.5 px-2 border border-gray-200 text-center">${rewardToday}</td>
                <td class="py-2.5 px-2 border border-gray-200 text-center bg-red-50/10">${debtToday}</td>
                <td class="py-2.5 px-2 border border-gray-200 text-center">${accumReward}</td>
                <td class="py-2.5 px-2 border border-gray-200 text-center bg-red-50/10 leading-tight">${accumDebt}</td>
                <td class="py-2.5 px-1 border border-gray-200 text-center w-16">
                    <div class="flex items-center justify-center">
                        ${rankHtml}
                    </div>
                </td>
            </tr>
        `;
    }).join('');
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
// LOGIC MODAL CHI TIẾT ĐÓNG QUỸ & NHẮC QUỸ
// ==========================================

window.showDebtModal = () => {
    const data = window.g1State.data || [];
    const tbody = document.getElementById('g1-debt-body');
    const fmt = n => Math.round(Number(n)).toLocaleString('vi-VN');

    // Nợ bao nhiêu thì hiện bấy nhiêu
    const debtList = data.map(s => {
        return {
            name: s.name,
            director: s.director,
            accumDebt: s.accumDebt
        };
    })
    .filter(s => s.accumDebt > 0)
    .sort((a, b) => b.accumDebt - a.accumDebt);

    if (debtList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="2" class="p-8 text-center text-gray-500 font-bold">Không có NVKD nào cần đóng quỹ lúc này.</td></tr>';
    } else {
        tbody.innerHTML = debtList.map(s => `
            <tr class="hover:bg-orange-50/30 transition border-b border-gray-100">
                <td class="py-3 px-4 text-left">
                    <p class="font-black text-slate-800">${s.name}</p>
                    <p class="text-[10px] font-bold text-gray-400">${s.director}</p>
                </td>
                <td class="py-3 px-4 font-black text-red-500 text-base">${fmt(s.accumDebt)}đ</td>
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
        accumDebt: s.accumDebt
    })).filter(s => s.accumDebt > 0).sort((a, b) => b.accumDebt - a.accumDebt);

    if(debtList.length === 0) return alert("Hiện tại không có NVKD nào cần đóng quỹ để nhắc!");

    let text = "🔔 THÔNG BÁO ĐÓNG QUỸ SOLO BỨT PHÁ\n\n";
    debtList.forEach((s, i) => {
        text += `${i+1}. ${s.name}: Cần đóng ${fmt(s.accumDebt)}đ\n`;
    });
    
    text += "\n*(Số tiền trên tính theo số lượt chưa đạt mục tiêu S.O hàng ngày, 50k/lượt)*\n\nĐề nghị các đồng chí thanh toán quỹ đúng hạn để duy trì cuộc đua!";

    navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('btn-copy-debt');
        btn.innerHTML = '<i class="fa-solid fa-check"></i> ĐÃ COPY THÀNH CÔNG';
        btn.className = 'px-6 py-2.5 bg-green-600 text-white font-bold rounded-xl hover:bg-green-700 transition flex items-center gap-2 shadow-lg';
    });
};