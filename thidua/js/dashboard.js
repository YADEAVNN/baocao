// ==========================================
// MODULE: DASHBOARD PHÂN TÍCH TỔNG QUAN
// ==========================================

// --- HÀM XỬ LÝ SỐ AN TOÀN ---
const safeNumber = (value) => {
    const number = Number(value);
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

window.renderDashboardView = async () => {
    const appContent = document.getElementById('app-content');
    
    // 1. GIAO DIỆN CHỜ TẢI DỮ LIỆU
    appContent.innerHTML = `
        <div class="p-8 space-y-6 bg-slate-50 min-h-screen">
            <div class="h-8 bg-gray-200 rounded w-1/4 animate-pulse"></div>
            <div class="grid grid-cols-2 gap-4">
                <div class="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
                <div class="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
            </div>
            <div class="h-64 bg-gray-200 rounded-lg animate-pulse w-full"></div>
        </div>
    `;

    try {
        // 2. LẤY DỮ LIỆU THỰC TẾ TỪ SUPABASE
        const { data: siReports, error: siErr } = await window.sb.from('daily_si_reports').select('*');
        if (siErr) console.error("Lỗi lấy dữ liệu SI:", siErr);

        const reports = siReports || [];

        // 3. TÍNH TOÁN DỮ LIỆU SELL IN (12 KHU VỰC)
        const standardRegions = [
            "Tây Bắc Bộ", "Hà Nội", "Đông Bắc", "Hồng Hà", 
            "Bắc Trung Bộ", "Trung Trung Bộ", "Nam Trung Bộ", 
            "Tây Nguyên", "Đông Nam", "Hồ Chí Minh", "Tây Nam", "Sông Cửu Long"
        ];

        let regionMap = {};
        standardRegions.forEach(reg => {
            regionMap[reg] = { name: reg, target: 0, actual: 0 };
        });

        reports.forEach(r => {
            const regName = r.region_name ? r.region_name.trim() : "";
            if (regionMap[regName]) {
                regionMap[regName].actual += safeNumber(r.xuat_hang);
            }
        });

        const sellInData = Object.values(regionMap).map((item, index) => {
            const diff = item.actual - item.target;
            const diffPct = safeDivide(diff, item.target) * 100;
            return {
                id: index + 1,
                name: item.name,
                kph: item.target,
                target: item.target,
                actual: item.actual,
                diff: diff,
                diffPct: Number(diffPct.toFixed(1)),
                rankTrend: diff >= 0 ? "up" : "down",
                sparkline: [0, 0, 0, 0, 0, 0, item.actual] // Biểu đồ đường cơ bản
            };
        });

        const totalSITarget = sellInData.reduce((sum, r) => sum + r.kph, 0);
        const totalSIActual = sellInData.reduce((sum, r) => sum + r.actual, 0);
        const totalSIDiff = totalSIActual - totalSITarget;
        const totalSIDiffPct = safeDivide(totalSIDiff, totalSITarget) * 100;

        // 4. TÍNH TOÁN DỮ LIỆU SELL OUT (Mặc định 0 nếu chưa có bảng SO)
        const soRegions = ["Hà Nội", "Đông Bắc", "Hồng Hà", "Tây Bắc", "Bắc Trung Bộ", "Trung Trung Bộ"];
        const sellOutData = soRegions.map(reg => ({
            name: reg, kph: 0, target: 0, actual: 0, diff: 0, diffPct: 0, status: "Chậm", sparkline: [0,0,0,0,0,0,0]
        }));
        
        const totalSOTarget = 0;
        const totalSOActual = 0;
        const totalSODiff = 0;
        const totalSODiffPct = 0;

        // 5. DỮ LIỆU TOP/BOTTOM NHÂN SỰ
        const topSales = []; 
        const bottomSales = [];

        // 6. XÂY DỰNG GIAO DIỆN HTML
        appContent.innerHTML = `
            <div class="bg-slate-50 min-h-screen pb-10 p-4 md:p-6 fade-in">
                <!-- HEADER -->
                <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-200 pb-4 gap-4">
                    <div>
                        <h2 class="text-2xl font-black text-slate-800 tracking-tight uppercase">PHÂN TÍCH TỔNG QUAN </h2>
                        <p class="text-sm text-gray-500 mt-1"><i class="fa-solid fa-rotate-right mr-1"></i> Cập nhật đến: ${new Date().toLocaleTimeString('vi-VN')} ${new Date().toLocaleDateString('vi-VN')}</p>
                    </div>
                    <div class="flex gap-3">
                        <div class="bg-white border border-gray-200 rounded px-3 py-2 flex items-center shadow-sm">
                            <div class="text-xs text-gray-500 mr-2">Hôm nay<br><span class="font-bold text-gray-800 text-sm">${new Date().toLocaleDateString('vi-VN')}</span></div>
                            <i class="fa-regular fa-calendar text-gray-400"></i>
                        </div>
                        <div class="bg-white border border-gray-200 rounded px-3 py-2 flex items-center shadow-sm cursor-pointer hover:bg-gray-50">
                            <div class="text-xs text-gray-500 mr-2">Khu vực<br><span class="font-bold text-gray-800 text-sm">Miền Bắc</span></div>
                            <i class="fa-solid fa-chevron-down text-gray-400 text-xs"></i>
                        </div>
                    </div>
                </div>

                <!-- ROW 1: TỔNG QUAN KPI -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <!-- SELL OUT KPI -->
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
                                <p class="text-xs ${totalSODiff >= 0 ? 'text-green-600' : 'text-red-500'} mt-1">${formatPct(totalSODiffPct)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- SELL IN KPI -->
                    <div class="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <h3 class="text-[#2980b9] font-bold text-sm mb-4">SELL IN – TIẾN ĐỘ QUÝ (TOÀN QUỐC)</h3>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1"><i class="fa-solid fa-box text-blue-500 mr-1"></i> KẾ HOẠCH QUÝ</p>
                                <p class="text-2xl font-bold text-blue-600">${formatNum(totalSITarget)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">CẦN ĐẠT HÔM NAY</p>
                                <p class="text-2xl font-bold text-gray-800">${formatNum(totalSITarget)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">THỰC TẾ ĐÃ ĐẠT</p>
                                <p class="text-2xl font-bold text-green-600">${formatNum(totalSIActual)} <span class="text-sm font-normal">xe</span></p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-500 font-semibold mb-1">ĐỘ LỆCH TIẾN ĐỘ</p>
                                <p class="text-2xl font-bold ${totalSIDiff >= 0 ? 'text-green-600' : 'text-red-600'}">${totalSIDiff >= 0 ? '+' : ''}${formatNum(totalSIDiff)} <span class="text-sm font-normal">xe</span></p>
                                <p class="text-xs ${totalSIDiff >= 0 ? 'text-green-600' : 'text-red-500'} mt-1">${formatPct(totalSIDiffPct)}</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- ROW 2: BẢNG CHI TIẾT KHU VỰC -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <!-- TABLE SELL OUT -->
                    <div class="bg-white rounded-lg border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <h3 class="text-[#c0392b] font-bold text-sm uppercase">SELL OUT – NHỊP ĐỘ 6 KHU VỰC MIỀN BẮC</h3>
                        </div>
                        <div class="p-0 flex-1 overflow-x-auto">
                            <!-- Bổ sung whitespace-nowrap để chống vỡ khung chữ -->
                            <table class="w-full text-xs text-right whitespace-nowrap">
                                <thead class="bg-gray-100 text-gray-500 font-semibold border-b border-gray-200">
                                    <tr>
                                        <th class="py-3 px-3 text-left">KHU VỰC</th>
                                        <th class="py-3 px-3">K.HOẠCH (xe)</th>
                                        <th class="py-3 px-3">CẦN ĐẠT (xe)</th>
                                        <th class="py-3 px-3">THỰC TẾ (xe)</th>
                                        <th class="py-3 px-3">LỆCH (xe)</th>
                                        <th class="py-3 px-3">LỆCH %</th>
                                        <th class="py-3 px-3 text-center w-24">NHỊP ĐỘ 7 NGÀY</th>
                                        <th class="py-3 px-3 text-center">ĐÁNH GIÁ</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 font-medium text-gray-700">
                                    ${sellOutData.map((row, i) => `
                                        <tr class="hover:bg-slate-50 transition">
                                            <td class="py-3 px-3 text-left font-bold text-gray-800">${row.name}</td>
                                            <td class="py-3 px-3">${formatNum(row.kph)}</td>
                                            <td class="py-3 px-3">${formatNum(row.target)}</td>
                                            <td class="py-3 px-3 font-bold ${getDiffColor(row.diff)}">${formatNum(row.actual)}</td>
                                            <td class="py-3 px-3 ${getDiffColor(row.diff)}">${row.diff > 0 ? '+' : ''}${formatNum(row.diff)}</td>
                                            <td class="py-3 px-3 ${getDiffColor(row.diff)}">${row.diffPct > 0 ? '+' : ''}${row.diffPct}%</td>
                                            <td class="py-1 px-3"><div id="so-spark-${i}" class="h-6 w-full"></div></td>
                                            <td class="py-3 px-3 text-center">${getStatusIcon(row.status)}</td>
                                        </tr>
                                    `).join('')}
                                    <tr class="bg-orange-50 font-bold">
                                        <td class="py-3 px-3 text-left text-gray-800">TỔNG MIỀN BẮC</td>
                                        <td class="py-3 px-3">${formatNum(totalSOTarget)}</td>
                                        <td class="py-3 px-3">${formatNum(totalSOTarget)}</td>
                                        <td class="py-3 px-3 font-bold text-red-600">${formatNum(totalSOActual)}</td>
                                        <td class="py-3 px-3 text-red-600">${formatNum(totalSODiff)}</td>
                                        <td class="py-3 px-3 text-red-600">${formatPct(totalSODiffPct)}</td>
                                        <td class="py-3 px-3"><div id="so-spark-total" class="h-6 w-full"></div></td>
                                        <td class="py-3 px-3 text-center text-red-600"><i class="fa-solid fa-circle-exclamation mr-1"></i> Chậm</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    <!-- TABLE SELL IN -->
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
                                        <th class="py-3 px-3">K.HOẠCH (xe)</th>
                                        <th class="py-3 px-3">CẦN ĐẠT (xe)</th>
                                        <th class="py-3 px-3">THỰC TẾ</th>
                                        <th class="py-3 px-3">LỆCH (xe)</th>
                                        <th class="py-3 px-3">LỆCH %</th>
                                        <th class="py-3 px-3 text-center w-24">NHỊP ĐỘ 7 NGÀY</th>
                                        <th class="py-3 px-2 text-center">HẠNG</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-100 font-medium text-gray-700">
                                    ${sellInData.map((row, i) => `
                                        <tr class="transition hover:bg-slate-50">
                                            <td class="py-3 px-2 text-center text-gray-400">${row.id}</td>
                                            <td class="py-3 px-3 text-left font-bold text-gray-800">${row.name}</td>
                                            <td class="py-3 px-3">${formatNum(row.kph)}</td>
                                            <td class="py-3 px-3 text-blue-600">${formatNum(row.target)}</td>
                                            <td class="py-3 px-3 font-bold ${getDiffColor(row.diff)}">${formatNum(row.actual)}</td>
                                            <td class="py-3 px-3 ${getDiffColor(row.diff)}">${row.diff > 0 ? '+' : ''}${formatNum(row.diff)}</td>
                                            <td class="py-3 px-3 ${getDiffColor(row.diff)}">${row.diffPct > 0 ? '+' : ''}${row.diffPct}%</td>
                                            <td class="py-1 px-3"><div id="si-spark-${i}" class="h-6 w-full"></div></td>
                                            <td class="py-3 px-2 text-center">
                                                ${row.rankTrend === 'up' ? '<i class="fa-solid fa-arrow-up text-green-500 text-[10px]"></i>' : '<i class="fa-solid fa-arrow-down text-red-500 text-[10px]"></i>'}
                                            </td>
                                        </tr>
                                    `).join('')}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- ROW 3: PHÂN TÍCH NHÂN SỰ & CẢNH BÁO -->
                <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <!-- Donut Chart -->
                    <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4 text-center">
                        <h3 class="text-gray-700 font-bold text-xs uppercase mb-2 text-left">NHỊP ĐỘ NVKD - SELL OUT</h3>
                        <div id="staff-donut-chart" class="h-32 flex justify-center"></div>
                        <a href="#" class="text-[10px] text-blue-500 mt-2 block">Xem danh sách chi tiết <i class="fa-solid fa-arrow-right"></i></a>
                    </div>

                    <!-- Top 5 Vượt -->
                    <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                        <h3 class="text-gray-700 font-bold text-xs uppercase mb-3">TOP 5 NVKD VƯỢT NHỊP</h3>
                        ${topSales.length === 0 ? '<p class="text-xs text-gray-400 mt-4 text-center">Chưa có dữ liệu</p>' : `
                        <table class="w-full text-[11px]">
                            <tbody>
                                ${topSales.map((s, i) => `
                                    <tr class="border-b border-gray-100 last:border-0">
                                        <td class="py-1.5 text-gray-400">${i+1}</td>
                                        <td class="py-1.5 font-bold text-gray-700">${s.name}</td>
                                        <td class="py-1.5 text-gray-500">${s.region}</td>
                                        <td class="py-1.5 text-right text-green-600 font-bold">+${s.diff}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>`}
                    </div>

                    <!-- Top 5 Chậm -->
                    <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                        <h3 class="text-gray-700 font-bold text-xs uppercase mb-3">TOP 5 NVKD CHẬM NHẤT</h3>
                        ${bottomSales.length === 0 ? '<p class="text-xs text-gray-400 mt-4 text-center">Chưa có dữ liệu</p>' : `
                        <table class="w-full text-[11px]">
                            <tbody>
                                ${bottomSales.map((s, i) => `
                                    <tr class="border-b border-gray-100 last:border-0">
                                        <td class="py-1.5 text-gray-400">${i+1}</td>
                                        <td class="py-1.5 font-bold text-gray-700">${s.name}</td>
                                        <td class="py-1.5 text-gray-500">${s.region}</td>
                                        <td class="py-1.5 text-right text-red-600 font-bold">${s.diff}</td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>`}
                    </div>

                    <!-- Cảnh báo -->
                    <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                        <h3 class="text-gray-700 font-bold text-xs uppercase mb-3">CẢNH BÁO NHỊP ĐỘ</h3>
                        <ul class="text-[11px] space-y-3">
                            <li class="flex gap-2">
                                <i class="fa-solid fa-circle-exclamation text-red-500 mt-0.5"></i>
                                <div>
                                    <p class="font-bold text-gray-800">KHU VỰC CHẬM TIẾN ĐỘ</p>
                                    <p class="text-gray-500">• Hệ thống chưa phát hiện cảnh báo</p>
                                </div>
                            </li>
                            <li class="flex gap-2">
                                <i class="fa-solid fa-triangle-exclamation text-yellow-500 mt-0.5"></i>
                                <div>
                                    <p class="font-bold text-gray-800">NHÂN SỰ CHẬM / NGUY CƠ</p>
                                    <p class="text-gray-500">• Chưa có dữ liệu tiến độ</p>
                                </div>
                            </li>
                        </ul>
                    </div>

                    <!-- Xu hướng -->
                    <div class="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
                        <h3 class="text-gray-700 font-bold text-xs uppercase mb-2">XU HƯỚNG NHỊP ĐỘ MIỀN</h3>
                        <div id="trend-line-chart" class="h-28"></div>
                    </div>
                </div>
            </div>
        `;

        // 7. VẼ CÁC BIỂU ĐỒ BẰNG APEXCHARTS
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
                    tooltip: { fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => '' } }, marker: { show: false } }
                }).render();
            };

            sellOutData.forEach((row, i) => renderSparkline(`so-spark-${i}`, row.sparkline, row.diff >= 0 ? '#10b981' : '#ef4444'));
            renderSparkline('so-spark-total', [0, 0, 0, 0, 0, 0, 0], '#ef4444');

            sellInData.forEach((row, i) => renderSparkline(`si-spark-${i}`, row.sparkline, row.diff >= 0 ? '#10b981' : '#ef4444'));

            new ApexCharts(document.querySelector("#staff-donut-chart"), {
                series: [0, 0, 0], // Mặc định 0 khi chưa có số liệu 
                chart: { type: 'donut', height: 140 },
                labels: ['Đúng nhịp', 'Chậm nhẹ', 'Nguy cơ'],
                colors: ['#10b981', '#f59e0b', '#ef4444'],
                plotOptions: { donut: { size: '65%' } },
                dataLabels: { enabled: false },
                legend: { show: false },
                noData: { text: "Chưa có dữ liệu", align: 'center', verticalAlign: 'middle', style: { color: '#9ca3af', fontSize: '11px' } }
            }).render();

            new ApexCharts(document.querySelector("#trend-line-chart"), {
                series: [{ name: 'Lệch %', data: [0, 0, 0, 0, 0, 0, 0] }], // Mặc định 0 khi chưa có số liệu
                chart: { type: 'area', height: 120, sparkline: { enabled: true } },
                stroke: { curve: 'straight', width: 2 },
                fill: { opacity: 0.2 },
                colors: ['#ef4444'],
                xaxis: { categories: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] },
                tooltip: { y: { formatter: (val) => val + "%" } }
            }).render();
        }, 100);

    } catch (err) {
        console.error("Lỗi:", err);
    }
};