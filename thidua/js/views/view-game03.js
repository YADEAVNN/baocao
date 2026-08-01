// ==========================================
// MODULE: GAME 03 - ĐẠI CHIẾN TOÀN QUỐC
// Thi đua SELL-IN Toàn quốc - 12 Khu vực (Quý III)
// Data Source: Miền Bắc (Sale nhập) + Miền Nam (Admin nhập)
// ==========================================

export const game03HTML = `
<div class="p-4 md:p-6 fade-in max-w-[1600px] mx-auto bg-[#F8FAFC] min-h-screen pb-20">
    
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
            <h1 class="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                <button onclick="window.switchView('dashboard')" class="text-gray-400 hover:text-[#F97316] transition"><i class="fa-solid fa-arrow-left"></i></button>
                <i class="fa-solid fa-globe text-[#F97316]"></i> GAME 03 – ĐẠI CHIẾN TOÀN QUỐC
                <span class="bg-red-100 text-red-600 text-[10px] font-black px-2 py-1 rounded border border-red-200 ml-2 shadow-sm">LIVE RANKING - QUÝ III</span>
            </h1>
            <p class="text-sm font-bold text-gray-500 mt-1 ml-9">Thi đua SELL-IN – Số liệu: Miền Bắc (Sale nhập) & Miền Nam (Admin nhập)</p>
        </div>
        <div class="flex items-center gap-4">
            <div class="text-right hidden md:block">
                <p class="text-[9px] font-bold text-gray-400 uppercase">Cập nhật cuối ngày</p>
                <p class="font-black text-sm text-slate-700" id="g3-last-update"><i class="fa-regular fa-calendar text-[#F97316]"></i> --/--/----</p>
            </div>
            <button onclick="window.loadGame03Data()" class="bg-white text-gray-500 hover:text-blue-600 px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm transition font-bold text-xs uppercase flex items-center gap-2">
                <i class="fa-solid fa-rotate-right"></i> Làm mới
            </button>
        </div>
    </div>

    <!-- 5 THẺ TỔNG QUAN GIẢI THƯỞNG -->
    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 mb-6">
        
        <!-- Thẻ 1: Tổng Sell-In Quý -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <div>
                <p class="text-[10px] font-black text-gray-500 uppercase mb-1">TỔNG SELL-IN QUÝ III</p>
                <p class="text-2xl font-black text-slate-800"><span id="g3-total-actual">0</span> <span class="text-xs text-gray-400">xe</span></p>
                <p class="text-[9px] font-bold text-gray-400 mt-1 uppercase">Mục tiêu: <span id="g3-total-target" class="text-slate-600">0</span> xe</p>
            </div>
            <div id="g3-radial-total" class="-mr-4 -my-4"></div>
        </div>

        <!-- Thẻ 2: TOP 1 -->
        <div class="bg-white rounded-xl shadow-sm border border-yellow-200 p-4 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-yellow-50 to-transparent"></div>
            <i class="fa-solid fa-trophy text-4xl text-yellow-500 relative z-10 drop-shadow-sm"></i>
            <div class="relative z-10">
                <p class="text-[10px] font-black text-slate-700 uppercase">TOP 1</p>
                <p class="text-lg font-black text-red-600 leading-tight">100.000.000đ</p>
                <p class="text-[9px] font-bold text-gray-500 mt-1">Điều kiện: ≥ 90% TARGET</p>
            </div>
        </div>

        <!-- Thẻ 3: TOP 2 -->
        <div class="bg-white rounded-xl shadow-sm border border-slate-200 p-4 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-slate-50 to-transparent"></div>
            <i class="fa-solid fa-trophy text-4xl text-slate-400 relative z-10 drop-shadow-sm"></i>
            <div class="relative z-10">
                <p class="text-[10px] font-black text-slate-700 uppercase">TOP 2</p>
                <p class="text-lg font-black text-red-600 leading-tight">80.000.000đ</p>
                <p class="text-[9px] font-bold text-gray-500 mt-1">Điều kiện: ≥ 90% TARGET</p>
            </div>
        </div>

        <!-- Thẻ 4: TOP 3 -->
        <div class="bg-white rounded-xl shadow-sm border border-orange-200 p-4 flex items-center gap-3 relative overflow-hidden">
            <div class="absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-orange-50 to-transparent"></div>
            <i class="fa-solid fa-trophy text-4xl text-orange-500 relative z-10 drop-shadow-sm"></i>
            <div class="relative z-10">
                <p class="text-[10px] font-black text-slate-700 uppercase">TOP 3</p>
                <p class="text-lg font-black text-red-600 leading-tight">50.000.000đ</p>
                <p class="text-[9px] font-bold text-gray-500 mt-1">Điều kiện: ≥ 90% TARGET</p>
            </div>
        </div>

        <!-- Thẻ 5: Thưởng Hoàn Thành & Thời gian -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center justify-between">
            <div>
                <p class="text-[10px] font-black text-emerald-600 uppercase flex items-center gap-1"><i class="fa-solid fa-bullseye"></i> THƯỞNG HOÀN THÀNH</p>
                <p class="text-lg font-black text-emerald-600 leading-tight">30.000.000đ</p>
                <p class="text-[9px] font-bold text-gray-500 mt-1">Mỗi khu vực đạt ≥ 90%</p>
            </div>
            <div class="text-center pl-3 border-l border-gray-100 ml-2">
                <p class="text-[9px] font-black text-gray-400 uppercase">QUÝ III ĐÃ ĐI</p>
                <p class="text-xl font-black text-blue-600 leading-none mt-1" id="g3-time-pct">0%</p>
                <p class="text-[8px] font-bold text-gray-500 mt-1">Còn <span id="g3-days-left">0</span> ngày</p>
            </div>
        </div>
    </div>

    <!-- MARQUEE CẢNH BÁO BIẾN ĐỘNG -->
    <div class="bg-white border border-red-100 rounded-xl p-3 mb-6 shadow-sm flex items-center gap-3 overflow-hidden">
        <div class="bg-red-50 text-red-600 px-3 py-1 rounded text-[10px] font-black uppercase shrink-0 flex items-center gap-1.5 border border-red-100">
            <i class="fa-solid fa-fire text-red-500 animate-pulse"></i> <span id="g3-marquee-title">BIẾN ĐỘNG HÔM NAY</span>
        </div>
        <div class="flex-1 overflow-hidden relative h-5">
            <div class="absolute whitespace-nowrap text-sm font-bold text-slate-700 animate-[marquee_20s_linear_infinite]" id="g3-marquee-content">
                Đang phân tích dữ liệu biến động...
            </div>
        </div>
    </div>

    <style>
        @keyframes marquee { 0% { left: 100%; transform: translateX(0); } 100% { left: 0; transform: translateX(-100%); } }
    </style>

    <!-- MAIN CONTENT GRID -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        <!-- BẢNG XẾP HẠNG CHÍNH (Chiếm 9 cột) -->
        <div class="xl:col-span-9 bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div class="overflow-x-auto flex-1 custom-scrollbar">
                <table class="w-full text-center whitespace-nowrap text-xs">
                    <thead class="bg-[#0f172a] text-white font-bold text-[9px] uppercase border-b border-gray-200">
                        <tr>
                            <th rowspan="2" class="py-3 px-2 w-10 border-r border-gray-700">#</th>
                            <th rowspan="2" class="py-3 px-3 text-left border-r border-gray-700 sticky left-0 bg-[#0f172a] z-10">KHU VỰC</th>
                            <th colspan="2" class="py-2 px-2 border-r border-gray-700 border-b">THỨ HẠNG</th>
                            <th rowspan="2" class="py-3 px-2 border-r border-gray-700 w-16">THAY ĐỔI</th>
                            <th colspan="3" class="py-2 px-2 border-r border-gray-700 border-b">SẢN LƯỢNG QUÝ III</th>
                            <th colspan="3" class="py-2 px-2 border-r border-gray-700 border-b">TIẾN ĐỘ THEO THÁNG (xe)</th>
                            <th rowspan="2" class="py-3 px-2 w-32">NHỊP ĐỘ 7 NGÀY QUA<br><span class="text-[8px] font-normal text-gray-400 normal-case">(đơn vị: xe)</span></th>
                        </tr>
                        <tr>
                            <th class="py-2 px-2 border-r border-gray-700 font-medium text-gray-400">HÔM QUA</th>
                            <th class="py-2 px-2 border-r border-gray-700 text-yellow-400">HÔM NAY</th>
                            
                            <th class="py-2 px-2 border-r border-gray-700 font-medium text-gray-400">MỤC TIÊU (xe)</th>
                            <th class="py-2 px-2 border-r border-gray-700">LŨY KẾ (xe)</th>
                            <th class="py-2 px-2 border-r border-gray-700">% HOÀN THÀNH QUÝ</th>
                            
                            <th class="py-2 px-2 border-r border-gray-700">THÁNG 7<br><span class="text-[8px] font-normal text-gray-400">(31 ngày)</span></th>
                            <th class="py-2 px-2 border-r border-gray-700">THÁNG 8<br><span class="text-[8px] font-normal text-gray-400">(31 ngày)</span></th>
                            <th class="py-2 px-2 border-r border-gray-700">THÁNG 9<br><span class="text-[8px] font-normal text-gray-400">(30 ngày)</span></th>
                        </tr>
                    </thead>
                    <tbody id="g3-table-body" class="divide-y divide-gray-100 text-slate-700 font-medium">
                        <tr><td colspan="12" class="p-10 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang đồng bộ số liệu Admin & Sale...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- KHỐI PANEL PHẢI (Chiếm 3 cột) -->
        <div class="xl:col-span-3 space-y-6">
            
            <!-- Biến động hôm nay -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 class="text-[11px] font-black text-slate-700 uppercase mb-3 border-b border-gray-100 pb-2">BIẾN ĐỘNG HÔM NAY</h3>
                <div class="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p class="text-2xl font-black text-green-500"><i class="fa-solid fa-arrow-up text-sm"></i> <span id="g3-count-up">0</span></p>
                        <p class="text-[9px] font-bold text-gray-500 uppercase mt-1">khu vực<br>tăng hạng</p>
                    </div>
                    <div class="border-l border-r border-gray-100">
                        <p class="text-2xl font-black text-red-500"><i class="fa-solid fa-arrow-down text-sm"></i> <span id="g3-count-down">0</span></p>
                        <p class="text-[9px] font-bold text-gray-500 uppercase mt-1">khu vực<br>tụt hạng</p>
                    </div>
                    <div>
                        <p class="text-2xl font-black text-gray-400"><i class="fa-solid fa-minus text-sm"></i> <span id="g3-count-unchanged">0</span></p>
                        <p class="text-[9px] font-bold text-gray-500 uppercase mt-1">khu vực<br>không đổi</p>
                    </div>
                </div>
            </div>

            <!-- Top 3 Bám đuổi -->
            <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
                <h3 class="text-[11px] font-black text-red-600 uppercase mb-3 border-b border-gray-100 pb-2">TOP 3 BÁM ĐUỔI <span class="text-[9px] font-medium text-gray-400 normal-case">(Hạng 4, 5, 6)</span></h3>
                <div class="space-y-3" id="g3-chasing-list">
                    <div class="text-center py-4 text-xs text-gray-400"><i class="fa-solid fa-spinner fa-spin"></i></div>
                </div>
            </div>

            <!-- AI Nhận định -->
            <div class="bg-blue-50/50 rounded-xl shadow-sm border border-blue-100 p-4">
                <div class="flex justify-between items-center mb-3 border-b border-blue-100 pb-2">
                    <h3 class="text-[11px] font-black text-blue-800 uppercase">AI NHẬN ĐỊNH</h3>
                    <span class="bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded font-black">AI</span>
                </div>
                <ul class="text-[11px] text-slate-700 space-y-2 font-medium leading-relaxed" id="g3-ai-insights">
                    <li><i class="fa-solid fa-circle text-[4px] text-blue-500 mr-1.5 relative -top-0.5"></i> Đang phân tích...</li>
                </ul>
            </div>

        </div>
    </div>
</div>
`;

window.loadGame03Data = async () => {
    try {
        // --- 1. SETUP THỜI GIAN QUÝ 3 ---
        const today = new Date();
        const year = today.getFullYear();
        
        // Cố định cấu hình Quý 3
        const q3Start = `${year}-07-01`;
        const q3End = `${year}-09-30`;
        const q3FirstDays = [`${year}-07-01`, `${year}-08-01`, `${year}-09-01`]; // Các ngày Admin chốt Target

        // Lấy ngày báo cáo
        let reportDate = today.toISOString().split('T')[0];
        if (reportDate > q3End) reportDate = q3End;
        if (reportDate < q3Start) reportDate = q3Start;

        // Ngày hôm qua để so sánh hạng
        let prevDateObj = new Date(reportDate);
        prevDateObj.setDate(prevDateObj.getDate() - 1);
        let yesterday = prevDateObj.toISOString().split('T')[0];

        // Mảng 7 ngày qua cho biểu đồ Sparkline
        const last7Days = [];
        for(let i=6; i>=0; i--) {
            let d = new Date(reportDate);
            d.setDate(d.getDate() - i);
            if(d >= new Date(q3Start)) last7Days.push(d.toISOString().split('T')[0]);
        }

        // Cập nhật UI Thời gian
        const totalDaysQ3 = 92; // 31 + 31 + 30
        const daysPassed = Math.floor((new Date(reportDate) - new Date(q3Start)) / (1000 * 60 * 60 * 24)) + 1;
        const daysLeft = Math.max(0, totalDaysQ3 - daysPassed);
        const timePct = Math.min(100, Math.round((daysPassed / totalDaysQ3) * 100));

        document.getElementById('g3-last-update').innerHTML = `<i class="fa-regular fa-calendar text-[#F97316]"></i> ${reportDate.split('-').reverse().join('/')}`;
        document.getElementById('g3-time-pct').innerText = `${timePct}%`;
        document.getElementById('g3-days-left').innerText = daysLeft;

        // --- 2. FETCH DỮ LIỆU ---
        // Fetch Admin SI (Để lấy Target tất cả vùng & Actual Miền Nam)
        // Fetch Game SI (Để lấy Actual Miền Bắc do Sale nhập)
        const [resAdminSI, resGameSI, resShops] = await Promise.all([
            window.sb.from('daily_si_reports').select('*').gte('report_date', q3Start).lte('report_date', reportDate),
            window.sb.from('game_si_reports').select('*').gte('report_date', q3Start).lte('report_date', reportDate),
            window.sb.from('master_shop_list').select('sale_name, director_name, area, khu_vuc, region')
        ]);

        const rawAdminSI = resAdminSI.data || [];
        const rawGameSI = resGameSI.data || [];
        const rawShops = resShops.data || [];

        // --- 3. ĐỊNH NGHĨA 12 KHU VỰC VÀ MAP TÊN GIÁM ĐỐC ---
        const mienBacRegions = ["Tây Bắc", "Hà Nội", "Đông Bắc", "Hồng Hà", "Bắc Trung Bộ", "Trung Trung Bộ"];
        const validRegions = ["Tây Bắc", "Hà Nội", "Đông Bắc", "Hồng Hà", "Bắc Trung Bộ", "Trung Trung Bộ", "Nam Trung Bộ", "Tây Nguyên", "Đông Nam", "Hồ Chí Minh", "Tây Nam", "Sông Cửu Long"];
        
        const norm = (str) => str ? str.toString().trim().toLowerCase().replace(/\s+/g, ' ') : "";
        
        const getNormalizedRegion = (rawReg) => {
            const nReg = norm(rawReg);
            if(nReg.includes("tây bắc bộ") || nReg.includes("tay bac")) return "Tây Bắc";
            if(nReg.includes("sông cửu long") || nReg.includes("scl")) return "Sông Cửu Long";
            if(nReg.includes("hồ chí minh") || nReg.includes("hcm")) return "Hồ Chí Minh";
            for (const reg of validRegions) {
                if (nReg.includes(norm(reg))) return reg;
            }
            return null;
        };

        // Bộ từ điển để Map nếu r.region_name là tên GĐ
        const dirToRegionMap = {
            "khổng văn trọng": "Tây Bắc",
            "khuất văn đức": "Hà Nội",
            "trịnh trần cường": "Đông Bắc",
            "đỗ tuấn minh": "Hồng Hà",
            "nông đức long": "Bắc Trung Bộ",
            "bùi minh trung": "Trung Trung Bộ",
            "cấn đình nguyên": "Nam Trung Bộ",
            "lê thế duy": "Tây Nguyên",
            "nguyễn văn hùng": "Đông Nam",
            "nguyễn thành nam": "Hồ Chí Minh",
            "trần đức cường": "Tây Nam",
            "bùi trung tuấn": "Sông Cửu Long"
        };

        const saleToRegionMap = {};
        rawShops.forEach(s => {
            const sName = norm(s.sale_name);
            const dName = norm(s.director_name);
            const reg = getNormalizedRegion(s.area || s.khu_vuc || s.region);
            if (sName && reg && !dName.includes(sName)) { 
                saleToRegionMap[sName] = reg;
            }
        });

        // Khởi tạo Object cấu trúc 12 khu vực
        const regionsData = {};
        validRegions.forEach(r => {
            regionsData[r] = { 
                name: r, target: 0, actualTotal: 0, actualYest: 0, 
                actM7: 0, actM8: 0, actM9: 0,
                daily7: Array(last7Days.length).fill(0)
            };
        });

        // --- 4. TÍNH TOÁN TARGET VÀ THỰC ĐẠT THEO LUẬT MỚI ---
        let totalSITarget = 0;
        let totalSIActual = 0;

        // XỬ LÝ DỮ LIỆU ADMIN (Lấy TARGET cho 12 Khu vực + Lấy THỰC ĐẠT cho 6 Khu vực Miền Nam)
        rawAdminSI.forEach(r => {
            let reg = getNormalizedRegion(r.region_name || r.khu_vuc);
            
            if (!reg && r.region_name) {
                const nDir = norm(r.region_name);
                for (const [key, val] of Object.entries(dirToRegionMap)) {
                    if (nDir.includes(key)) {
                        reg = val; break;
                    }
                }
            }

            if (reg && regionsData[reg]) {
                const rDate = r.report_date;

                // A. Cộng dồn Target (Chỉ lấy ở các ngày mùng 1 của Quý 3 do Admin khai báo)
                if (q3FirstDays.includes(rDate) && r.target_ph) {
                    regionsData[reg].target += Number(r.target_ph || 0);
                }

                // B. Cộng dồn Thực đạt (Chỉ áp dụng nếu là khu vực MIỀN NAM)
                if (!mienBacRegions.includes(reg)) {
                    const val = Number(r.xuat_hang || r.phat_hang || 0);
                    if (val > 0) {
                        regionsData[reg].actualTotal += val;
                        if (rDate <= yesterday) regionsData[reg].actualYest += val;

                        if (rDate.startsWith(`${year}-07`)) regionsData[reg].actM7 += val;
                        else if (rDate.startsWith(`${year}-08`)) regionsData[reg].actM8 += val;
                        else if (rDate.startsWith(`${year}-09`)) regionsData[reg].actM9 += val;

                        const idx = last7Days.indexOf(rDate);
                        if (idx !== -1) regionsData[reg].daily7[idx] += val;
                    }
                }
            }
        });

        // XỬ LÝ DỮ LIỆU SALE GAME (Lấy THỰC ĐẠT cho 6 Khu vực Miền Bắc)
        rawGameSI.forEach(r => {
            const sName = norm(r.sale_name);
            const reg = getNormalizedRegion(r.region_name || r.khu_vuc) || saleToRegionMap[sName];
            
            // Chỉ xử lý nếu khu vực thuộc MIỀN BẮC
            if (reg && regionsData[reg] && mienBacRegions.includes(reg)) {
                const val = Number(r.xuat_hang || 0);
                const rDate = r.report_date;

                if (val > 0) {
                    regionsData[reg].actualTotal += val;
                    if (rDate <= yesterday) regionsData[reg].actualYest += val;

                    if (rDate.startsWith(`${year}-07`)) regionsData[reg].actM7 += val;
                    else if (rDate.startsWith(`${year}-08`)) regionsData[reg].actM8 += val;
                    else if (rDate.startsWith(`${year}-09`)) regionsData[reg].actM9 += val;

                    const idx = last7Days.indexOf(rDate);
                    if (idx !== -1) regionsData[reg].daily7[idx] += val;
                }
            }
        });

        // Tính tổng toàn quốc
        Object.values(regionsData).forEach(r => totalSITarget += r.target);

        // --- 5. TÍNH TOÁN XẾP HẠNG ---
        let arr = Object.values(regionsData);

        // Xếp hạng hôm qua
        arr.sort((a,b) => b.actualYest - a.actualYest || b.target - a.target);
        arr.forEach((r, i) => r.rankYest = i + 1);

        // Xếp hạng hôm nay
        arr.sort((a,b) => b.actualTotal - a.actualTotal || b.target - a.target);
        arr.forEach((r, i) => {
            r.rankToday = i + 1;
            r.rankChange = r.rankYest - r.rankToday; // > 0: Tăng hạng, < 0: Tụt hạng
            totalSIActual += r.actualTotal;
            r.pct = r.target > 0 ? (r.actualTotal / r.target) * 100 : 0;
        });

        // --- 6. RENDER UI TỔNG QUAN ---
        document.getElementById('g3-total-actual').innerText = Math.round(totalSIActual).toLocaleString('vi-VN');
        document.getElementById('g3-total-target').innerText = Math.round(totalSITarget).toLocaleString('vi-VN');
        renderRadialGame03('g3-radial-total', totalSITarget > 0 ? (totalSIActual/totalSITarget)*100 : 0, '#10b981');

        // Phân tích biến động
        let countUp = 0, countDown = 0, countUnchanged = 0;
        let aiInsights = [];

        arr.forEach(r => {
            if (r.rankChange > 0) countUp++;
            else if (r.rankChange < 0) countDown++;
            else countUnchanged++;

            // AI Insight Logic
            if (r.rankToday === 1 && r.rankChange > 0) {
                aiInsights.push(`<i class="fa-solid fa-circle text-[4px] text-green-500 mr-1.5 relative -top-0.5"></i> <span class="font-bold text-slate-800">${r.name}</span> xuất sắc giành lại <b>Top 1</b> toàn quốc!`);
            }
            if (r.rankYest <= 3 && r.rankToday > 3) {
                aiInsights.push(`<i class="fa-solid fa-circle text-[4px] text-red-500 mr-1.5 relative -top-0.5"></i> <span class="font-bold text-slate-800">${r.name}</span> trượt khỏi Top 3, hiện đang ở hạng ${r.rankToday}.`);
            }
            if (r.rankChange >= 2) {
                aiInsights.push(`<i class="fa-solid fa-circle text-[4px] text-green-500 mr-1.5 relative -top-0.5"></i> <span class="font-bold text-slate-800">${r.name}</span> bứt phá mạnh mẽ, thăng ${r.rankChange} bậc lên hạng ${r.rankToday}.`);
            }
        });

        document.getElementById('g3-count-up').innerText = countUp;
        document.getElementById('g3-count-down').innerText = countDown;
        document.getElementById('g3-count-unchanged').innerText = countUnchanged;

        // Bổ sung Insight mặc định nếu không có biến động lớn
        if (aiInsights.length === 0) {
            aiInsights.push(`<i class="fa-solid fa-circle text-[4px] text-blue-500 mr-1.5 relative -top-0.5"></i> Cục diện Top 3 hiện tại đang khá ổn định.`);
            aiInsights.push(`<i class="fa-solid fa-circle text-[4px] text-blue-500 mr-1.5 relative -top-0.5"></i> Các khu vực top dưới đang duy trì nhịp độ đều đặn.`);
        }
        document.getElementById('g3-ai-insights').innerHTML = aiInsights.slice(0, 3).map(i => `<li>${i}</li>`).join('');

        // Cập nhật Marquee
        document.getElementById('g3-marquee-title').innerText = countUp > 0 ? `HÔM NAY CÓ ${countUp + countDown} KHU VỰC ĐỔI HẠNG!` : `NHỊP ĐỘ ĐANG DUY TRÌ ỔN ĐỊNH`;
        document.getElementById('g3-marquee-content').innerText = arr.filter(r => r.rankChange !== 0).map(r => `${r.name} ${r.rankChange > 0 ? 'tăng' : 'tụt'} ${Math.abs(r.rankChange)} bậc`).join(' • ') || 'Không có khu vực nào thay đổi thứ hạng so với hôm qua.';

        // Render Top 3 Bám đuổi
        const rank3 = arr[2];
        const htmlChasing = arr.slice(3, 6).map(r => {
            const gap = Math.max(0, rank3.actualTotal + 1 - r.actualTotal);
            return `
            <div class="flex justify-between items-center bg-slate-50 p-2 rounded border border-slate-100">
                <div class="flex items-center gap-2">
                    <span class="font-black text-gray-400 w-4">${r.rankToday}</span>
                    <span class="font-bold text-slate-700 uppercase text-[10px]">${r.name}</span>
                </div>
                <div class="text-right">
                    <p class="text-[8px] text-gray-500">Cần thêm <span class="font-black text-slate-800 text-[10px]">${Math.round(gap).toLocaleString('vi-VN')} xe</span></p>
                    <p class="text-[8px] text-gray-500">để lên TOP 3</p>
                </div>
            </div>`;
        }).join('');
        document.getElementById('g3-chasing-list').innerHTML = htmlChasing;

        // --- 7. RENDER MAIN TABLE ---
        const tbody = document.getElementById('g3-table-body');
        tbody.innerHTML = arr.map((r, i) => {
            // Định dạng Hạng
            let rankHtml = `<span class="font-bold text-gray-400">${r.rankToday}</span>`;
            if (r.rankToday === 1) rankHtml = `<span class="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-black mx-auto shadow-sm">1</span>`;
            if (r.rankToday === 2) rankHtml = `<span class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-black mx-auto shadow-sm">2</span>`;
            if (r.rankToday === 3) rankHtml = `<span class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black mx-auto shadow-sm">3</span>`;

            // Định dạng thay đổi
            let changeHtml = `<span class="text-gray-300 font-bold">-</span>`;
            if (r.rankChange > 0) changeHtml = `<span class="text-green-500 font-black flex items-center justify-center gap-1"><i class="fa-solid fa-caret-up"></i> ${r.rankChange}</span>`;
            if (r.rankChange < 0) changeHtml = `<span class="text-red-500 font-black flex items-center justify-center gap-1"><i class="fa-solid fa-caret-down"></i> ${Math.abs(r.rankChange)}</span>`;

            // Progress bar Quý
            const barW = Math.min(100, r.pct);
            let barColor = 'bg-blue-500';
            if (r.pct >= 100) barColor = 'bg-emerald-500';
            else if (r.pct >= 90) barColor = 'bg-green-400';

            return `
            <tr class="hover:bg-slate-50 transition border-b border-gray-100">
                <td class="py-3 px-2 border-r border-gray-100">${rankHtml}</td>
                <td class="py-3 px-3 text-left font-black text-slate-800 border-r border-gray-100 sticky left-0 bg-white z-10 shadow-[1px_0_0_0_#f1f5f9]">${r.name}</td>
                
                <td class="py-3 px-2 text-center text-gray-500 font-medium border-r border-gray-100">${r.rankYest}</td>
                <td class="py-3 px-2 text-center font-bold text-slate-800 border-r border-gray-100">${r.rankToday}</td>
                <td class="py-3 px-2 text-center border-r border-gray-100 bg-gray-50/50">${changeHtml}</td>
                
                <td class="py-3 px-2 text-center font-medium text-gray-500 border-r border-gray-100">${Math.round(r.target).toLocaleString('vi-VN')}</td>
                <td class="py-3 px-2 text-center font-black text-slate-800 border-r border-gray-100">${Math.round(r.actualTotal).toLocaleString('vi-VN')}</td>
                <td class="py-3 px-2 border-r border-gray-100 w-32">
                    <div class="flex items-center gap-2">
                        <span class="font-black text-xs w-10 text-right ${r.pct>=90?'text-emerald-600':''}">${r.pct.toFixed(0)}%</span>
                        <div class="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                            <div class="h-full ${barColor}" style="width: ${barW}%"></div>
                        </div>
                    </div>
                </td>
                
                <td class="py-3 px-2 text-center font-bold text-blue-600 border-r border-gray-100 bg-blue-50/20">${Math.round(r.actM7).toLocaleString('vi-VN')}</td>
                <td class="py-3 px-2 text-center font-bold text-blue-600 border-r border-gray-100 bg-blue-50/20">${Math.round(r.actM8).toLocaleString('vi-VN')}</td>
                <td class="py-3 px-2 text-center font-bold text-blue-600 border-r border-gray-100 bg-blue-50/20">${Math.round(r.actM9).toLocaleString('vi-VN')}</td>
                
                <td class="py-1 px-2 h-10 align-middle">
                    <div id="g3-spark-${i}" class="w-full h-[30px] flex items-center justify-center"></div>
                </td>
            </tr>`;
        }).join('');

        // Vẽ Sparkline sau khi DOM update
        setTimeout(() => {
            arr.forEach((r, i) => {
                const el = document.querySelector(`#g3-spark-${i}`);
                if(el) {
                    const opts = {
                        series: [{ data: r.daily7 }],
                        chart: { type: 'line', width: 100, height: 35, sparkline: { enabled: true } },
                        stroke: { curve: 'smooth', width: 2 },
                        colors: [r.rankToday <= 3 ? '#10b981' : (r.rankToday >= 10 ? '#ef4444' : '#f59e0b')],
                        tooltip: { fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => '' } }, marker: { show: false } }
                    };
                    new ApexCharts(el, opts).render();
                }
            });
        }, 100);

    } catch (err) {
        console.error("Lỗi Game 03:", err);
        document.getElementById('g3-table-body').innerHTML = `<tr><td colspan="12" class="p-10 text-red-500 font-bold text-center">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
};

// Hàm hỗ trợ vẽ biểu đồ vòng
function renderRadialGame03(id, val, color) {
    if (typeof ApexCharts === 'undefined') return;
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = ''; 
    let safeVal = isNaN(val) ? 0 : Math.round(val);
    const opts = { 
        chart: { type: 'radialBar', width: 90, height: 90, sparkline: { enabled: true } }, 
        series: [safeVal > 100 ? 100 : safeVal], 
        colors: [color], 
        plotOptions: { 
            radialBar: { 
                hollow: { size: '60%' }, 
                track: { background: '#e2e8f0', strokeWidth: '100%' }, 
                dataLabels: { name: { show: false }, value: { show: true, fontSize: '16px', fontWeight: 900, color: color, offsetY: 6, formatter: () => safeVal + "%" } } 
            } 
        }
    };
    new ApexCharts(el, opts).render();
}