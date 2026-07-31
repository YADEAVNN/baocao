// ==========================================
// MODULE: GAME 02 - CHIẾN TRƯỜNG KHU VỰC
// Dành riêng cho 6 khu vực Miền Bắc thi đua Sell-out
// ==========================================

export const game02HTML = `
<div class="p-4 md:p-6 fade-in max-w-[1500px] mx-auto bg-[#F8FAFC] min-h-screen pb-20">
    
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
            <h1 class="text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                <button onclick="window.switchView('dashboard')" class="text-gray-400 hover:text-[#F97316] transition"><i class="fa-solid fa-arrow-left"></i></button>
                <i class="fa-solid fa-shield-halved text-[#F97316]"></i> GAME 02 – CHIẾN TRƯỜNG KHU VỰC
            </h1>
            <p class="text-sm font-bold text-gray-500 mt-1 ml-9">Thi đua SELL-OUT – 06 Khu vực miền Bắc</p>
        </div>
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <i class="fa-regular fa-calendar text-gray-400"></i>
                <input type="month" id="g2-month-filter" onchange="window.loadGame02Data()" class="bg-transparent border-none font-bold text-slate-700 outline-none cursor-pointer text-sm">
            </div>
            <button onclick="window.loadGame02Data()" class="bg-white text-gray-500 hover:text-blue-600 px-3 py-2 rounded-lg border border-gray-200 shadow-sm transition">
                <i class="fa-solid fa-rotate-right"></i>
            </button>
        </div>
    </div>

    <!-- 4 THẺ TỔNG QUAN -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <!-- Thẻ 1: Tổng quỹ -->
        <div class="bg-white rounded-xl shadow-sm border border-orange-200 p-4 relative overflow-hidden">
            <div class="flex items-center gap-3 mb-3">
                <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center text-lg shrink-0"><i class="fa-solid fa-sack-dollar"></i></div>
                <div>
                    <p class="text-[10px] font-black text-gray-400 uppercase">TỔNG QUỸ THI ĐUA</p>
                    <p class="text-xl font-black text-orange-600">20.000.000đ</p>
                </div>
            </div>
            <div class="space-y-1 text-[11px] font-bold text-gray-600">
                <div class="flex justify-between"><span><i class="fa-solid fa-user text-gray-400 w-4"></i> 16 Sale</span> <span>8.000.000đ</span></div>
                <div class="flex justify-between"><span><i class="fa-solid fa-user-tie text-gray-400 w-4"></i> 06 ASM</span> <span>6.000.000đ</span></div>
                <div class="flex justify-between"><span><i class="fa-solid fa-user-gear text-gray-400 w-4"></i> 01 RSM</span> <span>6.000.000đ</span></div>
            </div>
        </div>

        <!-- Thẻ 2: Tiến độ cuộc chơi -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p class="text-[10px] font-black text-gray-400 uppercase mb-4 text-center">TIẾN ĐỘ CUỘC CHƠI</p>
            <div class="relative px-4 mt-2">
                <div class="absolute top-2 left-6 right-6 h-0.5 bg-gray-200"></div>
                <div class="flex justify-between relative z-10 text-center">
                    <div class="flex flex-col items-center">
                        <div class="w-4 h-4 rounded-full bg-gray-400 border-2 border-white mb-1"></div>
                        <span class="text-[9px] font-black text-gray-800">01/07</span>
                        <span class="text-[8px] text-gray-500 font-bold uppercase mt-1">Giai đoạn 1<br>(Tích lũy)</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="w-4 h-4 rounded-full bg-orange-500 border-2 border-white mb-1 shadow-[0_0_0_2px_#fed7aa]"></div>
                        <span class="text-[9px] font-black text-orange-600">15/07</span>
                        <span class="text-[8px] text-orange-500 font-bold uppercase mt-1">Giai đoạn 2<br>(Chốt phe)</span>
                    </div>
                    <div class="flex flex-col items-center">
                        <div class="w-4 h-4 rounded-full bg-gray-400 border-2 border-white mb-1"></div>
                        <span class="text-[9px] font-black text-gray-800">31/07</span>
                        <span class="text-[8px] text-gray-500 font-bold uppercase mt-1">Tổng kết<br>(Trao giải)</span>
                    </div>
                </div>
            </div>
        </div>

        <!-- Thẻ 3: Trạng thái phe -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p class="text-[10px] font-black text-gray-400 uppercase mb-3 text-center">TRẠNG THÁI PHE (SAU 15/07)</p>
            <div class="flex gap-2">
                <div class="flex-1 border border-green-200 bg-green-50/50 rounded-lg p-2 text-center">
                    <p class="text-[10px] font-black text-green-700 uppercase">CHÍNH DIỆN</p>
                    <div class="flex items-center justify-center gap-1 my-1">
                        <i class="fa-solid fa-shield-halved text-green-600 text-xl"></i>
                        <span class="text-2xl font-black text-green-700" id="g2-count-hero">0</span>
                    </div>
                    <p class="text-[9px] text-gray-500 font-bold">Khu vực</p>
                </div>
                <div class="flex-1 border border-red-200 bg-red-50/50 rounded-lg p-2 text-center">
                    <p class="text-[10px] font-black text-red-700 uppercase">PHẢN DIỆN</p>
                    <div class="flex items-center justify-center gap-1 my-1">
                        <i class="fa-solid fa-skull text-red-600 text-xl"></i>
                        <span class="text-2xl font-black text-red-700" id="g2-count-villain">0</span>
                    </div>
                    <p class="text-[9px] text-gray-500 font-bold">Khu vực</p>
                </div>
            </div>
            <p class="text-[8px] text-gray-400 text-center mt-2 italic">*Phe được cố định dựa trên BXH ngày 15/07</p>
        </div>

        <!-- Thẻ 4: Tiến độ Target chung -->
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center">
            <p class="text-[10px] font-black text-gray-400 uppercase mb-2">TIẾN ĐỘ TARGET CHUNG</p>
            <div id="g2-radial-overall" class="mt-[-10px] mb-[-15px]"></div>
            <p class="text-xs font-black text-green-600">6 / 6 KHU VỰC</p>
            <p class="text-[9px] text-gray-500 font-bold uppercase mt-0.5">Tham gia đường đua</p>
        </div>
    </div>

    <!-- BẢNG XẾP HẠNG CHÍNH -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 class="text-sm font-black text-slate-800 uppercase">BẢNG XẾP HẠNG <span class="text-[10px] text-gray-500 font-medium normal-case ml-2" id="g2-update-time">(Cập nhật...)</span></h2>
        </div>
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-center whitespace-nowrap text-[12px]">
                <thead class="bg-[#0f172a] text-white font-bold text-[9px] uppercase border-b border-gray-200">
                    <tr>
                        <th class="py-3 px-2 w-10 border-r border-gray-700">#</th>
                        <th class="py-3 px-3 text-left border-r border-gray-700">KHU VỰC</th>
                        <th class="py-3 px-2 w-16 border-r border-gray-700">PHE<br><span class="text-[8px] font-normal">(SAU 15/07)</span></th>
                        <th class="py-3 px-2 border-r border-gray-700">CHỈ TIÊU<br>THÁNG</th>
                        <th class="py-3 px-2 border-r border-gray-700 text-green-400">THỰC ĐẠT</th>
                        <th class="py-3 px-2 border-r border-gray-700 text-orange-400">TIẾN ĐỘ<br>HIỆN TẠI (%)</th>
                        <th class="py-3 px-4 border-r border-gray-700 min-w-[250px]">
                            <div class="flex justify-between text-[8px] text-gray-400 mb-1">
                                <span>01</span> <span>08</span> <span>15</span> <span>22</span> <span>31</span>
                            </div>
                            TIẾN ĐỘ THEO THỜI GIAN (%)
                        </th>
                        <th class="py-3 px-2 border-r border-gray-700">THỨ HẠNG<br>15/07</th>
                        <th class="py-3 px-2 border-r border-gray-700 text-orange-400">THỨ HẠNG<br>HIỆN TẠI</th>
                        <th class="py-3 px-3 bg-green-900/40 border-r border-gray-700 text-green-400">DỰ BÁO GIẢI THƯỞNG<br><span class="text-[8px] font-normal text-gray-400" id="g2-reward-date"></span></th>
                        <th class="py-3 px-3 bg-red-900/40 text-red-400">DỰ BÁO HÌNH PHẠT<br><span class="text-[8px] font-normal text-gray-400">(TÀI TRỢ PICKLEBALL)</span></th>
                    </tr>
                </thead>
                <tbody id="g2-table-body" class="divide-y divide-gray-100 text-slate-700 font-medium">
                    <tr><td colspan="11" class="p-10 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tính toán dữ liệu chiến trường...</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- KHỐI THÔNG TIN BỔ SUNG (LUẬT CHƠI & GIẢI THƯỞNG) -->
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <div class="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 class="text-[10px] font-black text-gray-800 uppercase mb-3 border-b pb-2">QUY TẮC GIẢI THƯỞNG</h4>
            <div class="space-y-3 text-[11px]">
                <div>
                    <p class="font-black text-green-700 mb-1 flex items-center gap-1"><i class="fa-solid fa-shield-halved"></i> PHE CHÍNH DIỆN</p>
                    <p class="text-gray-600 leading-tight">Chỉ 04 khu vực có thứ hạng cao nhất (tính đến 15/07) mới có quyền tranh Giải Nhất - Nhì - Ba.</p>
                </div>
                <div>
                    <p class="font-black text-red-600 mb-1 flex items-center gap-1"><i class="fa-solid fa-skull"></i> PHE PHẢN DIỆN</p>
                    <p class="text-gray-600 leading-tight">02 khu vực chót bảng ngày 15/07. Không được tranh Nhất/Nhì/Ba. Chỉ có cơ hội đạt <span class="font-bold text-red-600">Giải Hồi Sinh</span> nếu hoàn thành ≥ 100% chỉ tiêu và dẫn đầu nhóm Phản Diện.</p>
                </div>
            </div>
        </div>

        <div class="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <h4 class="text-[10px] font-black text-gray-800 uppercase mb-3 border-b pb-2 text-center">CƠ CẤU GIẢI THƯỞNG TỔNG KẾT</h4>
            <div class="grid grid-cols-4 gap-2 text-center">
                <div class="bg-orange-50 rounded-lg p-2 border border-orange-100">
                    <i class="fa-solid fa-trophy text-yellow-500 text-2xl mb-1"></i>
                    <p class="text-[10px] font-black text-slate-800 uppercase">Giải Nhất</p>
                    <p class="text-xs font-black text-orange-600">8.000.000đ</p>
                </div>
                <div class="bg-slate-50 rounded-lg p-2 border border-slate-200">
                    <i class="fa-solid fa-medal text-slate-400 text-2xl mb-1"></i>
                    <p class="text-[10px] font-black text-slate-800 uppercase">Giải Nhì</p>
                    <p class="text-xs font-black text-slate-600">5.000.000đ</p>
                </div>
                <div class="bg-orange-50 rounded-lg p-2 border border-orange-100">
                    <i class="fa-solid fa-medal text-orange-600 text-2xl mb-1"></i>
                    <p class="text-[10px] font-black text-slate-800 uppercase">Giải Ba</p>
                    <p class="text-xs font-black text-orange-600">3.000.000đ</p>
                </div>
                <div class="bg-red-50 rounded-lg p-2 border border-red-200">
                    <i class="fa-solid fa-crow text-red-600 text-2xl mb-1"></i>
                    <p class="text-[10px] font-black text-red-700 uppercase">Giải Hồi Sinh</p>
                    <p class="text-xs font-black text-red-600">4.000.000đ</p>
                </div>
            </div>
        </div>

        <div class="lg:col-span-1 bg-white rounded-xl border border-gray-200 p-0 shadow-sm flex flex-col overflow-hidden">
            <div class="p-4 border-b border-gray-100 bg-slate-50 text-center flex-1 flex flex-col justify-center">
                <h4 class="text-[10px] font-black text-blue-800 uppercase mb-2">HÌNH PHẠT: TÀI TRỢ PICKLEBALL</h4>
                <div class="flex items-center justify-center gap-2 mb-1">
                    <i class="fa-solid fa-table-tennis-paddle-ball text-orange-500 text-2xl"></i>
                    <span class="text-lg font-black text-slate-800">1.500.000đ</span>
                </div>
                <p class="text-[9px] font-bold text-gray-500">Phạt 02 khu vực đứng cuối bảng cuối tháng.</p>
            </div>
            <div class="bg-[#0f172a] text-white p-3 text-center">
                <p class="text-[9px] font-bold text-gray-400 uppercase mb-1">ĐẾM NGƯỢC ĐẾN TỔNG KẾT</p>
                <div class="flex justify-center gap-3 text-lg font-black text-orange-500" id="g2-countdown">
                    <div>00<span class="text-[8px] text-white font-normal block mt-[-4px]">NGÀY</span></div>:
                    <div>00<span class="text-[8px] text-white font-normal block mt-[-4px]">GIỜ</span></div>:
                    <div>00<span class="text-[8px] text-white font-normal block mt-[-4px]">PHÚT</span></div>
                </div>
            </div>
        </div>
    </div>
</div>
`;

window.loadGame02Data = async () => {
    const monthInput = document.getElementById('g2-month-filter');
    if (!monthInput.value) {
        const today = new Date();
        monthInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }

    const [yearStr, monthStr] = monthInput.value.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Đặt ngày hiện tại để tính toán (tránh timeline tương lai)
    const today = new Date();
    let currentDayNum = daysInMonth;
    if (year === today.getFullYear() && month === today.getMonth() + 1) {
        currentDayNum = today.getDate();
    } else if (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1)) {
        currentDayNum = 0; 
    }

    document.getElementById('g2-update-time').innerText = `(Cập nhật ngày ${String(currentDayNum).padStart(2, '0')}/${monthStr})`;
    document.getElementById('g2-reward-date').innerText = `(CẤP NHẬT ${String(currentDayNum).padStart(2, '0')}/${monthStr})`;

    // Khởi tạo CountDown
    setupCountdown(year, month, daysInMonth);

    try {
        const startDate = `${yearStr}-${monthStr}-01`;
        const endDate = `${yearStr}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

        // FIX 1: Lấy toàn bộ số lượng S.O (Không lọc status=approved nữa để đồng bộ 100% với màn ERP)
        // FIX 2: Rút toàn bộ Target về Javascript để lọc thủ công tránh lỗi column
        const [resSO, resTarget, resShops] = await Promise.all([
            window.sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', endDate),
            window.sb.from('monthly_sale_targets').select('*'),
            window.sb.from('master_shop_list').select('*')
        ]);

        const rawSO = resSO.data || [];
        const shops = resShops.data || [];
        
        // Lọc Target Tháng dựa trên JS để độ chính xác đạt 100%
        const rawTarget = (resTarget.data || []).filter(t => {
            const m = t.report_month || t.month || t.thang || "";
            return m.startsWith(`${yearStr}-${monthStr}`);
        });

        const validRegions = ["Hà Nội", "Đông Bắc", "Bắc Trung Bộ", "Hồng Hà", "Tây Bắc", "Trung Trung Bộ"];
        
        // Cụm hàm chuẩn hóa chuỗi
        const norm = (str) => str ? str.toString().trim().toLowerCase().replace(/\s+/g, ' ') : "";
        const getNormalizedRegion = (rawReg) => {
            const nReg = norm(rawReg);
            if(nReg.includes("tây bắc") || nReg.includes("tay bac")) return "Tây Bắc";
            for (const reg of validRegions) {
                if (nReg.includes(norm(reg))) return reg;
            }
            return null;
        };

        // Bộ từ điển map tên Giám Đốc sang Khu vực (Chuẩn hóa để gánh Target)
        const dirToRegionMap = {
            "khổng văn trọng": "Tây Bắc",
            "khuất văn đức": "Hà Nội",
            "trịnh trần cường": "Đông Bắc",
            "đỗ tuấn minh": "Hồng Hà",
            "nông đức long": "Bắc Trung Bộ",
            "bùi minh trung": "Trung Trung Bộ"
        };

        // Khởi tạo cấu trúc dữ liệu cho 6 khu vực
        const regionStats = {};
        validRegions.forEach(r => {
            regionStats[r] = { 
                name: r, target: 0, actualCurrent: 0, 
                actual01: 0, actual08: 0, actual15: 0, actual22: 0, actual31: 0 
            };
        });

        // Xây dựng bản đồ map Sale -> Region
        const saleToRegionMap = {};
        shops.forEach(s => {
            const sName = norm(s.sale_name || s.sale || s.nhan_vien);
            const dName = norm(s.director_name || s.giam_doc || s.gd_mien);
            
            let reg = getNormalizedRegion(s.area || s.khu_vuc || s.region);
            if (!reg && dName && dirToRegionMap[dName]) {
                reg = dirToRegionMap[dName];
            }
            
            if (sName && reg) saleToRegionMap[sName] = reg;
        });

        // ==========================================
        // 1. TÍNH TOÁN TARGET THỰC TẾ
        // ==========================================
        rawTarget.forEach(t => {
            const sName = norm(t.sale_name);
            const dName = norm(t.director_name || t.giam_doc || t.giam_doc_khu_vuc);
            
            let reg = getNormalizedRegion(t.area || t.khu_vuc || t.region_name);
            
            // Tìm theo tên Giám đốc trước (Chính xác cao nhất cho Target)
            if (!reg && dName && dirToRegionMap[dName]) {
                reg = dirToRegionMap[dName];
            }
            // Nếu không có, tìm tiếp theo tên Sale
            if (!reg && saleToRegionMap[sName]) {
                reg = saleToRegionMap[sName];
            }
            
            if (reg && regionStats[reg]) {
                regionStats[reg].target += Number(t.target_so || 0);
            }
        });

        // ==========================================
        // 2. TÍNH TOÁN ACTUALS (SỐ THỰC TẾ LŨY KẾ)
        // ==========================================
        rawSO.forEach(r => {
            const sName = norm(r.sale_name);
            let reg = getNormalizedRegion(r.region_name || r.khu_vuc);
            
            if (!reg && saleToRegionMap[sName]) {
                reg = saleToRegionMap[sName];
            }

            const val = Number(r.total_so || r.so_luong || r.ban_ra || 0);
            
            if (reg && regionStats[reg]) {
                const day = parseInt(r.report_date.slice(-2), 10);
                
                // Lũy kế cho các mốc để vẽ Timeline
                if (day <= 1) regionStats[reg].actual01 += val;
                if (day <= 8) regionStats[reg].actual08 += val;
                if (day <= 15) regionStats[reg].actual15 += val;
                if (day <= 22) regionStats[reg].actual22 += val;
                if (day <= 31) regionStats[reg].actual31 += val;

                // Lũy kế cho hiện tại
                if (day <= currentDayNum) regionStats[reg].actualCurrent += val;
            }
        });

        const getPct = (act, tar) => tar > 0 ? (act / tar) * 100 : 0;
        
        // 3. Tính toán tỷ lệ % và xếp hạng ngày 15/07 (Chốt Phe)
        let rank15Data = Object.values(regionStats).map(r => ({
            name: r.name,
            pct15: getPct(r.actual15, r.target)
        })).sort((a, b) => b.pct15 - a.pct15);

        const factionMap = {}; 
        const rank15Map = {};  
        
        rank15Data.forEach((item, index) => {
            rank15Map[item.name] = index + 1;
            // Luật: Nếu đã qua ngày 15, Top 4 là Chính diện, Bottom 2 là Phản diện
            if (currentDayNum >= 15) {
                factionMap[item.name] = (index >= 4) ? 'Villain' : 'Hero'; 
            } else {
                factionMap[item.name] = 'TBD'; 
            }
        });

        // 4. Xếp hạng hiện tại
        let currentRankData = Object.values(regionStats).map(r => {
            r.pctCurrent = getPct(r.actualCurrent, r.target);
            r.rank15 = rank15Map[r.name];
            r.faction = factionMap[r.name];
            r.pct01 = getPct(r.actual01, r.target);
            r.pct08 = getPct(r.actual08, r.target);
            r.pct15Real = getPct(r.actual15, r.target); 
            r.pct22 = getPct(r.actual22, r.target);
            r.pct31 = getPct(r.actual31, r.target);
            return r;
        }).sort((a, b) => b.pctCurrent - a.pctCurrent);

        currentRankData.forEach((item, index) => {
            item.currentRank = index + 1;
        });

        // 5. Tính toán Dự Báo Giải Thưởng
        const heroes = currentRankData.filter(r => r.faction === 'Hero');
        const villains = currentRankData.filter(r => r.faction === 'Villain');
        const bottom2 = currentRankData.slice(-2); 

        currentRankData.forEach(item => {
            item.rewardHtml = '<span class="text-gray-300">-</span>';
            item.penaltyHtml = '<span class="text-gray-300">-</span>';

            // Phạt Pickleball
            if (bottom2.some(b => b.name === item.name)) {
                item.penaltyHtml = `
                    <div class="flex items-center gap-2 justify-center text-orange-500 font-bold">
                        <i class="fa-solid fa-table-tennis-paddle-ball text-xl"></i>
                        <div class="text-left leading-tight"><span class="text-[8px] text-gray-500 uppercase">Tài trợ Pickleball</span><br>1.500.000đ</div>
                    </div>`;
            }

            // Thưởng Chính diện
            if (item.faction === 'Hero') {
                if (item.name === heroes[0]?.name) {
                    item.rewardHtml = `<div class="flex items-center gap-2 text-yellow-600 font-black justify-center"><i class="fa-solid fa-trophy text-xl"></i><div class="text-left leading-tight"><span class="text-[8px] text-gray-500 uppercase">Giải Nhất</span><br>8.000.000đ</div></div>`;
                } else if (item.name === heroes[1]?.name) {
                    item.rewardHtml = `<div class="flex items-center gap-2 text-slate-500 font-black justify-center"><i class="fa-solid fa-medal text-xl"></i><div class="text-left leading-tight"><span class="text-[8px] text-gray-500 uppercase">Giải Nhì</span><br>5.000.000đ</div></div>`;
                } else if (item.name === heroes[2]?.name && item.currentRank <= 3) {
                    item.rewardHtml = `<div class="flex items-center gap-2 text-orange-600 font-black justify-center"><i class="fa-solid fa-medal text-xl"></i><div class="text-left leading-tight"><span class="text-[8px] text-gray-500 uppercase">Giải Ba</span><br>3.000.000đ</div></div>`;
                }
            } 
            // Thưởng Phản diện (Hồi sinh)
            else if (item.faction === 'Villain') {
                if (item.name === villains[0]?.name && item.pctCurrent >= 100) { 
                    item.rewardHtml = `<div class="flex items-center gap-2 text-red-600 font-black justify-center"><i class="fa-solid fa-crow text-xl"></i><div class="text-left leading-tight"><span class="text-[8px] text-red-400 uppercase">Giải Hồi Sinh</span><br>4.000.000đ</div></div>`;
                } else if (item.name === villains[0]?.name && item.pctCurrent < 100) {
                    item.rewardHtml = `<div class="flex items-center gap-2 text-red-300 font-bold opacity-50 justify-center" title="Cần đạt 100% để nhận giải"><i class="fa-solid fa-crow text-xl"></i><div class="text-left leading-tight"><span class="text-[8px] text-gray-400 uppercase">Giải Hồi Sinh (Hụt)</span><br>4.000.000đ</div></div>`;
                }
            }
        });

        // 6. Update UI Tổng quan
        let heroCount = 0; let villainCount = 0;
        let totalTarget = 0; let totalAct = 0;
        
        currentRankData.forEach(r => {
            if (r.faction === 'Hero') heroCount++;
            if (r.faction === 'Villain') villainCount++;
            totalTarget += r.target;
            totalAct += r.actualCurrent;
        });

        document.getElementById('g2-count-hero').innerText = heroCount;
        document.getElementById('g2-count-villain').innerText = villainCount;
        
        const overallPct = totalTarget > 0 ? (totalAct / totalTarget) * 100 : 0;
        renderRadialGame02('g2-radial-overall', overallPct);

        // 7. Render Table
        const tbody = document.getElementById('g2-table-body');
        tbody.innerHTML = currentRankData.map(r => {
            
            // Xử lý icon Phe
            let factionIcon = `<span class="text-gray-300 font-medium text-[9px]"><i class="fa-regular fa-clock"></i> Chờ 15/07</span>`;
            let colorTheme = "gray"; 
            
            if (r.faction === 'Hero') {
                factionIcon = `<i class="fa-solid fa-shield-halved text-green-600 text-lg"></i>`;
                colorTheme = "green";
            } else if (r.faction === 'Villain') {
                factionIcon = `<i class="fa-solid fa-skull text-red-600 text-lg"></i>`;
                colorTheme = "red";
            }

            // Xử lý mũi tên Trend
            let trendIcon = '<i class="fa-solid fa-minus text-gray-300 ml-1"></i>';
            if (currentDayNum > 15) {
                if (r.currentRank < r.rank15) trendIcon = '<i class="fa-solid fa-arrow-up text-green-500 ml-1"></i>';
                else if (r.currentRank > r.rank15) trendIcon = '<i class="fa-solid fa-arrow-down text-red-500 ml-1"></i>';
            }

            // Xử lý chấm tròn Timeline
            const getDotStr = (pct, actDay) => {
                if (currentDayNum < actDay) return `<div class="w-2 h-2 rounded-full bg-gray-200 z-10"></div>`;
                return `<div class="w-2 h-2 rounded-full bg-${colorTheme}-500 z-10 relative group cursor-help">
                            <div class="absolute bottom-3 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition whitespace-nowrap z-20 pointer-events-none">${Math.round(pct)}%</div>
                        </div>`;
            };

            const timelineHtml = `
                <div class="relative w-full h-4 flex items-center justify-between px-2">
                    <div class="absolute left-2 right-2 h-[2px] bg-gray-200 z-0"></div>
                    <div class="absolute left-2 h-[2px] bg-${colorTheme}-500 z-0 transition-all duration-1000" style="width: ${Math.min(100, Math.max(0, r.pctCurrent))}%"></div>
                    ${getDotStr(r.pct01, 1)}
                    ${getDotStr(r.pct08, 8)}
                    ${getDotStr(r.pct15Real, 15)}
                    ${getDotStr(r.pct22, 22)}
                    ${getDotStr(r.pct31, 31)}
                </div>
            `;

            // Style top 3
            let rankNum = `<span class="font-bold text-gray-400">${r.currentRank}</span>`;
            if (r.currentRank === 1) rankNum = `<span class="w-6 h-6 rounded-full bg-yellow-100 text-yellow-600 flex items-center justify-center font-black mx-auto">1</span>`;
            if (r.currentRank === 2) rankNum = `<span class="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center font-black mx-auto">2</span>`;
            if (r.currentRank === 3) rankNum = `<span class="w-6 h-6 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-black mx-auto">3</span>`;

            return `
            <tr class="border-b border-gray-100 transition-colors hover:bg-slate-50">
                <td class="py-4 px-2 text-center font-bold text-gray-400 border-r border-gray-100">${rankNum}</td>
                <td class="py-4 px-3 text-left font-black text-slate-800 border-r border-gray-100 whitespace-nowrap uppercase">${r.name}</td>
                <td class="py-4 px-2 text-center border-r border-gray-100">${factionIcon}</td>
                <td class="py-4 px-2 text-center font-bold text-gray-600 border-r border-gray-100">${Number(r.target).toLocaleString('vi-VN')}</td>
                <td class="py-4 px-2 text-center font-black text-green-600 border-r border-gray-100 text-sm">${Number(r.actualCurrent).toLocaleString('vi-VN')}</td>
                <td class="py-4 px-2 text-center font-black text-orange-600 border-r border-gray-100 text-sm">${r.pctCurrent.toFixed(1)}%</td>
                <td class="py-4 px-4 border-r border-gray-100">${timelineHtml}</td>
                <td class="py-4 px-2 text-center font-bold text-gray-500 border-r border-gray-100">
                    ${currentDayNum >= 15 ? r.rank15 : '<span class="text-[9px] font-normal italic">-</span>'}
                    <br><span class="text-[8px] font-normal ${r.faction==='Hero'?'text-green-600':(r.faction==='Villain'?'text-red-500':'')} uppercase">${r.faction==='Hero'?'(Chính diện)':(r.faction==='Villain'?'(Phản diện)':'')}</span>
                </td>
                <td class="py-4 px-2 text-center font-black text-slate-800 border-r border-gray-100 text-sm">
                    ${r.currentRank} ${trendIcon}
                    <br><span class="text-[8px] font-normal ${r.faction==='Hero'?'text-green-600':(r.faction==='Villain'?'text-red-500':'')} uppercase">${r.faction==='Hero'?'(Chính diện)':(r.faction==='Villain'?'(Phản diện)':'')}</span>
                </td>
                <td class="py-4 px-3 text-center border-r border-gray-100">${r.rewardHtml}</td>
                <td class="py-4 px-3 text-center">${r.penaltyHtml}</td>
            </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Lỗi tải Game 02:", err);
        document.getElementById('g2-table-body').innerHTML = `<tr><td colspan="11" class="p-10 text-center text-red-500 font-bold">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
};

// ==========================================
// HÀM HỖ TRỢ: VẼ BIỂU ĐỒ & COUNTDOWN
// ==========================================

function renderRadialGame02(id, val) {
    if (typeof ApexCharts === 'undefined') return;
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = ''; 

    let safeVal = isNaN(val) ? 0 : Math.round(val);

    const opts = { 
        chart: { type: 'radialBar', width: 120, height: 120, sparkline: { enabled: true } }, 
        series: [safeVal > 100 ? 100 : safeVal], 
        colors: ['#16a34a'], 
        plotOptions: { 
            radialBar: { 
                hollow: { size: '60%' }, 
                track: { background: '#e2e8f0', strokeWidth: '100%' }, 
                dataLabels: { 
                    name: { show: false }, 
                    value: { show: true, fontSize: '20px', fontWeight: 900, color: '#16a34a', offsetY: 8, formatter: () => safeVal + "%" } 
                } 
            } 
        }
    };
    new ApexCharts(el, opts).render();
}

let game02Timer;
function setupCountdown(year, month, daysInMonth) {
    if (game02Timer) clearInterval(game02Timer);
    
    const endDate = new Date(year, month - 1, daysInMonth, 23, 59, 59).getTime();

    game02Timer = setInterval(() => {
        const now = new Date().getTime();
        const distance = endDate - now;

        if (distance < 0) {
            clearInterval(game02Timer);
            document.getElementById("g2-countdown").innerHTML = "<div class='text-green-500'>ĐÃ KẾT THÚC</div>";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));

        const html = `
            <div>${String(days).padStart(2, '0')}<span class="text-[8px] text-white font-normal block mt-[-4px]">NGÀY</span></div><span class="mt-[-2px]">:</span>
            <div>${String(hours).padStart(2, '0')}<span class="text-[8px] text-white font-normal block mt-[-4px]">GIỜ</span></div><span class="mt-[-2px]">:</span>
            <div>${String(minutes).padStart(2, '0')}<span class="text-[8px] text-white font-normal block mt-[-4px]">PHÚT</span></div>
        `;
        const container = document.getElementById("g2-countdown");
        if(container) container.innerHTML = html;

    }, 1000);
}