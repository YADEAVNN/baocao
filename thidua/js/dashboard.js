// ==========================================
// MODULE: DASHBOARD PHÂN TÍCH TỔNG QUAN (BẢN FINAL FULL TÍNH NĂNG ĐÃ FIX LỖI)
// ==========================================

const safeNumber = (value) => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
    const cleaned = String(value).replace(/,/g, '').replace(/\./g, '').trim();
    const number = Number(cleaned);
    return Number.isFinite(number) ? number : 0;
};

const safeDivide = (value, total) => {
    const numerator = safeNumber(value);
    const denominator = safeNumber(total);
    if (denominator === 0) return 0;
    return numerator / denominator;
};

const formatNum = (num) => safeNumber(num).toLocaleString('vi-VN');
const formatPct = (num) => (safeNumber(num)).toFixed(1) + '%';
const getDiffColor = (num) => num >= 0 ? 'text-green-600' : 'text-red-600';
const getStatusIcon = (status) => {
    if(status === 'Tốt') return `<span class="flex items-center justify-center text-green-600"><i class="fa-solid fa-circle-check mr-1"></i> Tốt</span>`;
    if(status === 'Theo dõi') return `<span class="flex items-center justify-center text-yellow-500"><i class="fa-solid fa-circle-minus mr-1"></i> Theo dõi</span>`;
    return `<span class="flex items-center justify-center text-red-600"><i class="fa-solid fa-circle-exclamation mr-1"></i> Chậm</span>`;
};

const norm = (str) => str ? str.toString().trim().toLowerCase() : "";

window.renderDashboardView = async (targetMonthParam) => {
    const appContent = document.getElementById('app-content');
    
    const today = new Date();
    const currentMonthStr = targetMonthParam || `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

    appContent.innerHTML = `
        <div class="p-8 space-y-6 bg-slate-50 min-h-screen">
            <div class="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div class="grid grid-cols-2 gap-4">
                <div class="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
                <div class="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div class="h-64 bg-gray-200 rounded-lg animate-pulse w-full"></div>
            <div class="grid grid-cols-5 gap-4 mt-4">
                <div class="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
                <div class="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
                <div class="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
                <div class="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
                <div class="h-40 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
        </div>
    `;

    try {
        // GỌI DỮ LIỆU
        const [resSI, resSO, resTarget, resShops] = await Promise.all([
            window.sb.from('daily_si_reports').select('*'),
            window.sb.from('daily_so_reports').select('*'),
            window.sb.from('monthly_sale_targets').select('*'),
            window.sb.from('master_shop_list').select('*') // Mapping bằng master_shop_list để lấy chuẩn Area
        ]);

        const siReports = resSI.data || [];
        const soReports = resSO.data || [];
        const targetData = resTarget.data || [];
        const shopsData = resShops.data || [];

        // KHỞI TẠO TỪ ĐIỂN MAPPING (TÊN NVKD -> KHU VỰC)
        const saleToRegionMap = {};
        shopsData.forEach(shop => {
            const saleName = norm(shop.sale_name || shop.sale || shop.nhan_vien || shop.ten_nvkd || shop.nvkd); 
            const regionName = norm(shop.area || shop.khu_vuc || shop.region); 
            
            if (saleName && regionName) {
                saleToRegionMap[saleName] = regionName;
            }
        });

        const siRegions = ["Tây Bắc Bộ", "Hà Nội", "Đông Bắc", "Hồng Hà", "Bắc Trung Bộ", "Trung Trung Bộ", "Nam Trung Bộ", "Tây Nguyên", "Đông Nam", "Hồ Chí Minh", "Tây Nam", "Sông Cửu Long"];
        const soRegions = ["Hà Nội", "Đông Bắc", "Hồng Hà", "Tây Bắc", "Bắc Trung Bộ", "Trung Trung Bộ"];

        let regionMapSI = {};
        siRegions.forEach(reg => regionMapSI[norm(reg)] = { name: reg, target: 0, actual: 0 });

        let regionMapSO = {};
        soRegions.forEach(reg => regionMapSO[norm(reg)] = { name: reg, target: 0, actual: 0 });

        // TỔNG HỢP DATA NVKD CHO WIDGET BÊN DƯỚI
        let saleStats = {};

        // CỘNG DỒN KẾ HOẠCH TỪ BẢNG TARGET
        targetData.forEach(row => {
            const tSI = safeNumber(row.target_si);
            const tSO = safeNumber(row.target_so);
            
            const saleNameTarget = norm(row.sale_name);
            const rawSaleName = row.sale_name || "Chưa rõ";
            
            // Xử lý Target cho từng NVKD
            if (saleNameTarget) {
                if (!saleStats[saleNameTarget]) saleStats[saleNameTarget] = { name: rawSaleName, target: 0, actual: 0 };
                saleStats[saleNameTarget].target += tSO;
            }

            const mappedRegion = saleToRegionMap[saleNameTarget] || norm(row.area || row.khu_vuc);

            for (const reg of siRegions) {
                const nReg = norm(reg);
                if (mappedRegion.includes(nReg) || (nReg === "tây bắc bộ" && mappedRegion.includes("tây bắc"))) {
                    regionMapSI[nReg].target += tSI;
                    break;
                }
            }

            for (const reg of soRegions) {
                const nReg = norm(reg);
                if (mappedRegion.includes(nReg) || (nReg === "tây bắc" && mappedRegion.includes("tây bắc"))) {
                    regionMapSO[nReg].target += tSO;
                    break;
                }
            }
        });

        // CỘNG DỒN THỰC TẾ S.I
        siReports.forEach(row => {
            // ĐÃ FIX: Chỉ lấy dữ liệu của tháng đang lọc
            if (row.report_date && !row.report_date.startsWith(currentMonthStr)) return;

            const mappedRegion = norm(row.region_name || row.khu_vuc);
            const val = safeNumber(row.xuat_hang);

            for (const reg of siRegions) {
                const nReg = norm(reg);
                // ĐÃ FIX: So sánh tuyệt đối (===) để lọc dữ liệu rác, tính đúng tổng S.I
                if (mappedRegion === nReg) {
                    regionMapSI[nReg].actual += val;
                    break;
                }
            }
        });

        // CỘNG DỒN THỰC TẾ S.O
        soReports.forEach(row => {
            // ĐÃ FIX: Chỉ lấy dữ liệu S.O của tháng đang lọc
            if (row.report_date && !row.report_date.startsWith(currentMonthStr)) return;

            const saleNameTarget = norm(row.sale_name);
            
            // ĐÃ FIX: Map khu vực dựa vào Tên Sale (vì bảng daily_so_reports ko lưu khu vực)
            const mappedRegion = saleToRegionMap[saleNameTarget] || norm(row.region_name || row.khu_vuc);
            const val = safeNumber(row.total_so || row.so_luong || row.ban_ra || 0);

            // Cập nhật cho Vùng (Bảng Miền Bắc)
            for (const reg of soRegions) {
                const nReg = norm(reg);
                if (mappedRegion.includes(nReg) || (nReg === "tây bắc" && mappedRegion.includes("tây bắc"))) {
                    regionMapSO[nReg].actual += val;
                    break;
                }
            }

            // Cập nhật cho cá nhân NVKD (Dành cho 5 Widget bên dưới)
            if (saleNameTarget) {
                if (!saleStats[saleNameTarget]) saleStats[saleNameTarget] = { name: row.sale_name, target: 0, actual: 0 };
                saleStats[saleNameTarget].actual += val;
            }
        });

        // XỬ LÝ DỮ LIỆU BẢNG & TỔNG
        const sellInData = siRegions.map((reg, index) => {
            const item = regionMapSI[norm(reg)];
            const diff = item.actual - item.target;
            const diffPct = safeDivide(diff, item.target) * 100;
            return {
                id: index + 1, name: item.name, kph: item.target, target: item.target, 
                actual: item.actual, diff: diff, diffPct: Number(diffPct.toFixed(1)), 
                rankTrend: diff >= 0 ? "up" : "down", sparkline: [0, 0, 0, 0, 0, 0, item.actual]
            };
        });

        const totalSITarget = sellInData.reduce((sum, r) => sum + r.kph, 0);
        const totalSIActual = sellInData.reduce((sum, r) => sum + r.actual, 0);
        const totalSIDiff = totalSIActual - totalSITarget;

        const sellOutData = soRegions.map((reg, index) => {
            const item = regionMapSO[norm(reg)];
            const diff = item.actual - item.target;
            const diffPct = safeDivide(diff, item.target) * 100;
            let status = "Chậm";
            if (diff >= 0) status = "Tốt";
            else if (diffPct >= -10) status = "Theo dõi";

            return {
                name: item.name, kph: item.target, target: item.target, 
                actual: item.actual, diff: diff, diffPct: Number(diffPct.toFixed(1)), 
                status: status, sparkline: [0,0,0,0,0,0,item.actual]
            };
        });
        
        const totalSOTarget = sellOutData.reduce((sum, r) => sum + r.kph, 0);
        const totalSOActual = sellOutData.reduce((sum, r) => sum + r.actual, 0);
        const totalSODiff = totalSOActual - totalSOTarget;

        // XỬ LÝ DỮ LIỆU CHO 5 WIDGET BÊN DƯỚI
        let saleArr = Object.values(saleStats).map(s => {
            s.diff = s.actual - s.target;
            return s;
        });
        
        // Sắp xếp top
        let top5Vuot = saleArr.filter(s => s.diff > 0).sort((a,b) => b.diff - a.diff).slice(0, 5);
        let top5Cham = saleArr.filter(s => s.diff < 0).sort((a,b) => a.diff - b.diff).slice(0, 5);
        let chamRegions = sellOutData.filter(r => r.diff < 0);

        // RENDER GIAO DIỆN
        appContent.innerHTML = `
            <div class="bg-slate-50 min-h-screen pb-10 p-4 md:p-6 fade-in">
                <!-- HEADER -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-200 pb-4 gap-4">
                    <div>
                        <h2 class="text-2xl font-black text-slate-800 tracking-tight uppercase">PHÂN TÍCH TỔNG QUAN</h2>
                        <p class="text-sm text-gray-500 mt-1"><i class="fa-solid fa-rotate-right mr-1"></i> Cập nhật đến: ${new Date().toLocaleTimeString('vi-VN')} ${new Date().toLocaleDateString('vi-VN')}</p>
                    </div>
                    
                    <div class="flex gap-3 items-center">
                        <div class="bg-white border border-gray-300 rounded-lg px-3 py-1.5 flex items-center shadow-sm hover:border-blue-500 transition">
                            <span class="text-xs text-gray-500 font-semibold mr-2">THÁNG:</span>
                            <input type="month" id="dashboard-month-filter" value="${currentMonthStr}" 
                                   onchange="window.renderDashboardView(this.value)"
                                   class="font-bold text-slate-800 text-sm bg-transparent border-0 focus:outline-none cursor-pointer">
                        </div>
                    </div>
                </div>

                <!-- TỔNG QUAN KPI -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <!-- SELL OUT -->
                    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <h3 class="text-[#c0392b] font-bold text-sm mb-4">SELL OUT – TIẾN ĐỘ THÁNG HIỆN TẠI (TOÀN MIỀN BẮC)</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1"><i class="fa-solid fa-bullseye text-orange-500 mr-1"></i> KẾ HOẠCH THÁNG</p>
                                <p class="text-2xl font-bold text-orange-500">${formatNum(totalSOTarget)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">CẦN ĐẠT ĐẾN HÔM NAY</p>
                                <p class="text-2xl font-bold text-gray-800">${formatNum(totalSOTarget)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">THỰC TẾ ĐẠT</p>
                                <p class="text-2xl font-bold text-green-600">${formatNum(totalSOActual)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">ĐỘ LỆCH TIẾN ĐỘ</p>
                                <p class="text-2xl font-bold ${totalSODiff >= 0 ? 'text-green-600' : 'text-red-600'}">${totalSODiff >= 0 ? '+' : ''}${formatNum(totalSODiff)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- SELL IN -->
                    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <h3 class="text-[#2980b9] font-bold text-sm mb-4">SELL IN – TIẾN ĐỘ THÁNG (TOÀN QUỐC)</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1"><i class="fa-solid fa-box text-blue-500 mr-1"></i> KẾ HOẠCH THÁNG</p>
                                <p class="text-2xl font-bold text-blue-600">${formatNum(totalSITarget)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">CẦN ĐẠT HÔM NAY</p>
                                <p class="text-2xl font-bold text-gray-800">${formatNum(totalSITarget)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">THỰC TẾ ĐÃ ĐẠT (PHÁT HÀNG)</p>
                                <p class="text-2xl font-bold text-green-600">${formatNum(totalSIActual)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">ĐỘ LỆCH TIẾN ĐỘ</p>
                                <p class="text-2xl font-bold ${totalSIDiff >= 0 ? 'text-green-600' : 'text-red-600'}">${totalSIDiff >= 0 ? '+' : ''}${formatNum(totalSIDiff)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- BẢNG CHI TIẾT KHU VỰC -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <!-- TABLE SO -->
                    <div class="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 class="text-[#c0392b] font-bold text-sm uppercase">SELL OUT – NHỊP ĐỘ 6 KHU VỰC MIỀN BẮC</h3>
                        </div>
                        <div class="p-0 flex-1 overflow-x-auto">
                            <table class="w-full text-xs text-right whitespace-nowrap">
                                <thead class="bg-gray-100 text-gray-500 font-semibold border-b border-gray-200">
                                    <tr>
                                        <th class="py-3 px-3 text-left">KHU VỰC</th>
                                        <th class="py-3 px-3">K.HOẠCH</th>
                                        <th class="py-3 px-3">THỰC TẾ</th>
                                        <th class="py-3 px-3">LỆCH</th>
                                        <th class="py-3 px-3 text-center w-24">NHỊP ĐỘ</th>
                                        <th class="py-3 px-3 text-center">ĐÁNH GIÁ</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 font-medium text-gray-700">
                                    ${sellOutData.map((row, i) => `
                                        <tr class="hover:bg-slate-50 transition">
                                            <td class="py-3 px-3 text-left font-bold text-gray-800">${row.name}</td>
                                            <td class="py-3 px-3 font-semibold text-gray-600">${formatNum(row.kph)}</td>
                                            <td class="py-3 px-3 font-bold ${getDiffColor(row.diff)}">${formatNum(row.actual)}</td>
                                            <td class="py-3 px-3 ${getDiffColor(row.diff)}">${row.diff > 0 ? '+' : ''}${formatNum(row.diff)}</td>
                                            <td class="py-1 px-3"><div id="so-spark-${i}" class="h-6 w-full"></div></td>
                                            <td class="py-3 px-3 text-center">${getStatusIcon(row.status)}</td>
                                        </tr>
                                    `).join('')}
                                    <tr class="bg-orange-50 font-bold">
                                        <td class="py-3 px-3 text-left text-gray-800">TỔNG MIỀN BẮC</td>
                                        <td class="py-3 px-3 text-gray-800">${formatNum(totalSOTarget)}</td>
                                        <td class="py-3 px-3 font-bold ${totalSOActual >= totalSOTarget ? 'text-green-600' : 'text-red-600'}">${formatNum(totalSOActual)}</td>
                                        <td class="py-3 px-3 ${totalSODiff >= 0 ? 'text-green-600' : 'text-red-600'}">${totalSODiff >= 0 ? '+' : ''}${formatNum(totalSODiff)}</td>
                                        <td class="py-3 px-3"><div id="so-spark-total" class="h-6 w-full"></div></td>
                                        <td class="py-3 px-3 text-center">${getStatusIcon(totalSODiff >= 0 ? 'Tốt' : 'Chậm')}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- TABLE SI -->
                    <div class="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 class="text-[#2980b9] font-bold text-sm uppercase">SELL IN – NHỊP ĐỘ 12 KHU VỰC TOÀN QUỐC</h3>
                        </div>
                        <div class="p-0 flex-1 overflow-x-auto">
                            <table class="w-full text-xs text-right whitespace-nowrap">
                                <thead class="bg-gray-100 text-gray-500 font-semibold border-b border-gray-200">
                                    <tr>
                                        <th class="py-3 px-2 text-center w-8">#</th>
                                        <th class="py-3 px-3 text-left">KHU VỰC</th>
                                        <th class="py-3 px-3">K.HOẠCH</th>
                                        <th class="py-3 px-3">THỰC TẾ</th>
                                        <th class="py-3 px-3">LỆCH (xe)</th>
                                        <th class="py-3 px-3 text-center w-24">NHỊP ĐỘ</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 font-medium text-gray-700">
                                    ${sellInData.map((row, i) => `
                                        <tr class="transition hover:bg-slate-50">
                                            <td class="py-3 px-2 text-center text-gray-400">${row.id}</td>
                                            <td class="py-3 px-3 text-left font-bold text-gray-800">${row.name}</td>
                                            <td class="py-3 px-3 font-semibold text-gray-600">${formatNum(row.kph)}</td>
                                            <td class="py-3 px-3 font-bold ${getDiffColor(row.diff)}">${formatNum(row.actual)}</td>
                                            <td class="py-3 px-3 ${getDiffColor(row.diff)}">${row.diff > 0 ? '+' : ''}${formatNum(row.diff)}</td>
                                            <td class="py-1 px-3"><div id="si-spark-${i}" class="h-6 w-full"></div></td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
                
                <!-- WIDGETS CẢNH BÁO & XẾP HẠNG -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
                    <!-- Card 1 -->
                    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col h-44">
                        <h4 class="text-xs font-black text-gray-700 uppercase mb-3">Nhịp độ NVKD - Sell Out</h4>
                        <div class="flex-1 flex items-center justify-center">
                            <div class="text-center w-full">
                                <div class="text-3xl font-black text-gray-800">${saleArr.length}</div>
                                <div class="text-[11px] font-bold uppercase text-gray-400 mt-1 tracking-wider">Nhân sự có dữ liệu</div>
                            </div>
                        </div>
                        <a href="#" onclick="window.customSwitchView('leaderboard')" class="text-blue-500 text-xs font-bold hover:underline mt-2 text-center block w-full">Xem danh sách chi tiết <i class="fa-solid fa-arrow-right ml-1"></i></a>
                    </div>

                    <!-- Card 2 -->
                    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col h-44">
                        <h4 class="text-xs font-black text-gray-700 uppercase mb-3 text-center">Top 5 NVKD Vượt Nhịp</h4>
                        <div class="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                            ${top5Vuot.length > 0 ? top5Vuot.map((s, i) => `
                                <div class="flex justify-between items-center text-xs">
                                    <span class="text-gray-700 font-bold truncate max-w-[120px]" title="${s.name}">${i+1}. ${s.name}</span>
                                    <span class="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded border border-green-100">+${formatNum(s.diff)}</span>
                                </div>
                            `).join('') : '<div class="text-center text-gray-400 text-xs italic mt-8">Chưa có dữ liệu</div>'}
                        </div>
                    </div>

                    <!-- Card 3 -->
                    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col h-44">
                        <h4 class="text-xs font-black text-gray-700 uppercase mb-3 text-center">Top 5 NVKD Chậm Nhất</h4>
                        <div class="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                            ${top5Cham.length > 0 ? top5Cham.map((s, i) => `
                                <div class="flex justify-between items-center text-xs">
                                    <span class="text-gray-700 font-bold truncate max-w-[120px]" title="${s.name}">${i+1}. ${s.name}</span>
                                    <span class="text-red-600 font-bold bg-red-50 px-1.5 py-0.5 rounded border border-red-100">${formatNum(s.diff)}</span>
                                </div>
                            `).join('') : '<div class="text-center text-gray-400 text-xs italic mt-8">Chưa có dữ liệu</div>'}
                        </div>
                    </div>

                    <!-- Card 4 -->
                    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col h-44">
                        <h4 class="text-xs font-black text-gray-700 uppercase mb-2">Cảnh Báo Nhịp Độ</h4>
                        <div class="flex-1 overflow-y-auto custom-scrollbar text-[11px] leading-relaxed">
                            <div class="mb-3">
                                <div class="font-bold text-red-600 flex items-center mb-1"><i class="fa-solid fa-circle-exclamation mr-1"></i> KHU VỰC CHẬM TIẾN ĐỘ</div>
                                ${chamRegions.length > 0 ? chamRegions.map(r => `<div class="text-gray-600 ml-4">• ${r.name} (<span class="text-red-500 font-medium">${formatNum(r.diff)}</span>)</div>`).join('') : '<div class="text-gray-400 ml-4 italic">• Hệ thống chưa phát hiện cảnh báo</div>'}
                            </div>
                            <div>
                                <div class="font-bold text-yellow-600 flex items-center mb-1"><i class="fa-solid fa-triangle-exclamation mr-1"></i> NHÂN SỰ CHẬM / NGUY CƠ</div>
                                ${top5Cham.length > 0 ? top5Cham.slice(0,3).map(s => `<div class="text-gray-600 ml-4">• ${s.name} (<span class="text-red-500 font-medium">${formatNum(s.diff)}</span>)</div>`).join('') : '<div class="text-gray-400 ml-4 italic">• Chưa có dữ liệu tiến độ</div>'}
                            </div>
                        </div>
                    </div>

                    <!-- Card 5 -->
                    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm flex flex-col h-44">
                        <h4 class="text-xs font-black text-gray-700 uppercase mb-3">Xu Hướng Nhịp Độ Miền</h4>
                        <div class="flex-1 flex flex-col justify-end w-full">
                            <div id="trend-sparkline-mb" class="w-full h-16"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Vẽ biểu đồ
        setTimeout(() => {
            if (typeof ApexCharts === 'undefined') return;

            const renderSparkline = (id, data, color) => {
                const el = document.querySelector(`#${id}`);
                if (!el) return;
                new ApexCharts(el, {
                    series: [{ data: data }],
                    chart: { type: 'line', width: '100%', height: 25, sparkline: { enabled: true } },
                    stroke: { curve: 'smooth', width: 2 },
                    colors: [color],
                    tooltip: { fixed: { enabled: false } }
                }).render();
            };

            // Biểu đồ trên bảng
            sellOutData.forEach((row, i) => renderSparkline(`so-spark-${i}`, row.sparkline, row.diff >= 0 ? '#10b981' : '#ef4444'));
            renderSparkline('so-spark-total', [0, 0, 0, 0, 0, 0, totalSOActual], totalSODiff >= 0 ? '#10b981' : '#ef4444');
            sellInData.forEach((row, i) => renderSparkline(`si-spark-${i}`, row.sparkline, row.diff >= 0 ? '#10b981' : '#ef4444'));
            
            // Biểu đồ Widget cuối cùng (Tạo một đường đồ thị mô phỏng xu hướng dẫn đến số thực tế hiện tại)
            const trendData = [0, totalSOActual * 0.2, totalSOActual * 0.5, totalSOActual * 0.8, totalSOActual];
            renderSparkline('trend-sparkline-mb', trendData, totalSODiff >= 0 ? '#10b981' : '#ef4444');

        }, 100);

    } catch (err) {
        console.error("Lỗi khi tải Dashboard:", err);
    }
};