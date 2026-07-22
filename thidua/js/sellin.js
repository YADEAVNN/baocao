// ==========================================
// MODULE: SELL-IN (S.I) - ĐÃ TỐI ƯU TỐC ĐỘ GÕ (DEBOUNCE)
// ==========================================

const checkIsAdmin = () => {
    try {
        const xpath = "//text()[normalize-space(translate(., 'admin', 'ADMIN'))='ADMIN']";
        const matchingElement = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (matchingElement) return true;

        for (let i = 0; i < localStorage.length; i++) {
            const val = localStorage.getItem(localStorage.key(i));
            if (val && typeof val === 'string' && val.toUpperCase().includes('ADMIN')) return true;
        }
        for (let i = 0; i < sessionStorage.length; i++) {
            const val = sessionStorage.getItem(sessionStorage.key(i));
            if (val && typeof val === 'string' && val.toUpperCase().includes('ADMIN')) return true;
        }
    } catch (error) {
        console.error("Lỗi khi kiểm tra quyền:", error);
    }
    return false;
};

let REGIONS_SI = [
    { name: "Tây Bắc Bộ", dir: "Khổng Văn Trọng" },
    { name: "Hà Nội", dir: "Khuất Văn Đức" },
    { name: "Đông Bắc", dir: "Trịnh Trần Cường" },
    { name: "Hồng Hà", dir: "Đỗ Tuấn Minh" },
    { name: "Bắc Trung Bộ", dir: "Nông Đức Long" },
    { name: "Trung Trung Bộ", dir: "Bùi Minh Trung" },
    { name: "Nam Trung Bộ", dir: "Cấn Đình Nguyên" },
    { name: "Tây Nguyên", dir: "Lê Thế Duy" },
    { name: "Đông Nam", dir: "Nguyễn Văn Hùng" },
    { name: "Hồ Chí Minh", dir: "Nguyễn Thành Nam" },
    { name: "Tây Nam", dir: "Trần Đức Cường" },
    { name: "Sông Cửu Long", dir: "Bùi Trung Tuấn" }
];

const getDaysInMonth = (year, month) => {
    const date = new Date(year, month - 1, 1);
    const days = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    while (date.getMonth() === month - 1) {
        const dNum = String(date.getDate()).padStart(2, '0');
        const mNum = String(date.getMonth() + 1).padStart(2, '0');
        days.push({
            fullDate: `${year}-${mNum}-${dNum}`,
            dayNum: dNum,
            dayName: dayNames[date.getDay()]
        });
        date.setDate(date.getDate() + 1);
    }
    return days;
};

// --- HÀM TỐI ƯU TỐC ĐỘ GÕ (DEBOUNCE) ---
let recalculateTimer;
window.debouncedRecalculate = () => {
    clearTimeout(recalculateTimer);
    recalculateTimer = setTimeout(() => {
        window.recalculateTotals();
    }, 400); // Chờ 400ms sau khi ngừng gõ mới chạy hàm tính tổng
};

// 1. KHỞI TẠO GIAO DIỆN CHÍNH
window.renderSellInView = () => {
    const appContent = document.getElementById('app-content');
    const isAdmin = checkIsAdmin();
    window.STATE = window.STATE || {};
    
    const adminActionBtns = isAdmin ? `
        <button onclick="window.saveAllData()" id="btn-save-si" class="bg-blue-600 text-white px-5 py-2 rounded font-bold text-sm hover:bg-blue-700 shadow-sm transition flex items-center">
            <i class="fa-solid fa-floppy-disk mr-2"></i> Lưu dữ liệu
        </button>
        <input type="file" id="excel_import_si" class="hidden" accept=".xlsx, .xls" onchange="window.importSellInExcel(event)">
        <button onclick="document.getElementById('excel_import_si').click()" class="bg-white text-gray-700 px-4 py-2 rounded border border-gray-300 font-bold text-sm hover:bg-gray-50 transition shadow-sm">
            <i class="fa-solid fa-file-import mr-1"></i> Nhập Excel
        </button>
    ` : '';

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, '0');
    const initialMonthVal = `${currentYear}-${currentMonth}`;

    appContent.innerHTML = `
        <div class="bg-white min-h-screen pb-10 p-4 fade-in">
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-200 pb-4 gap-4">
                <div class="flex items-center gap-3">
                    <div class="bg-orange-500 text-white p-2 rounded-lg">
                        <i class="fa-solid fa-motorcycle text-xl"></i>
                    </div>
                    <div>
                        <h2 class="text-2xl font-black text-orange-600 tracking-tight uppercase">NHẬP LIỆU SELLIN</h2>
                        <p class="text-sm text-gray-500 mt-1">Nhập liệu theo tháng - 12 KHU VỰC</p>
                    </div>
                </div>
                
                <div class="flex items-center gap-4 bg-orange-50/50 border border-orange-100 rounded-lg p-2 shadow-sm">
                    <i class="fa-regular fa-calendar-days text-orange-500 text-xl ml-2"></i>
                    <div>
                        <p class="text-[10px] text-gray-500 font-bold uppercase mb-0.5">Chọn Tháng</p>
                        <input type="month" id="si-month-filter" class="bg-transparent border-0 font-bold text-gray-800 text-sm focus:ring-0 cursor-pointer outline-none" value="${initialMonthVal}" onchange="window.loadSellInMonthData()">
                    </div>
                </div>

                <div class="flex gap-2 items-center">
                    ${adminActionBtns}
                    <button onclick="window.exportSellInExcel()" class="bg-orange-500 text-white px-4 py-2 rounded font-bold text-sm hover:bg-orange-600 shadow-sm transition">
                        <i class="fa-solid fa-file-export mr-1"></i> Xuất Excel
                    </button>
                </div>
            </div>

            <style>
                .custom-scrollbar::-webkit-scrollbar { height: 8px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #c1c1c1; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #a8a8a8; }
                .sticky-col { position: sticky; z-index: 20; }
                thead .sticky-col { z-index: 30; } 
                tbody .sticky-col { z-index: 20; box-shadow: 2px 0 5px -2px rgba(0,0,0,0.1); }
                input[type="number"]::-webkit-outer-spin-button, input[type="number"]::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
                input[type="number"] { -moz-appearance: textfield; }
            </style>

            <div id="si_tables_container" class="space-y-8">
                <div class="p-10 flex justify-center items-center text-orange-500 font-bold">
                    <i class="fa-solid fa-spinner fa-spin mr-3 text-2xl"></i> Đang tải dữ liệu...
                </div>
            </div>
        </div>
    `;

    window.loadSellInMonthData();
};

// 2. TẢI DỮ LIỆU TỪ SUPABASE
window.loadSellInMonthData = async () => {
    const monthVal = document.getElementById('si-month-filter').value;
    if (!monthVal) return;

    const [year, month] = monthVal.split('-');
    const daysArray = getDaysInMonth(parseInt(year), parseInt(month));
    const startDate = daysArray[0].fullDate;
    const endDate = daysArray[daysArray.length - 1].fullDate;

    const container = document.getElementById('si_tables_container');
    container.innerHTML = '<div class="p-10 flex justify-center items-center text-orange-500 font-bold"><i class="fa-solid fa-spinner fa-spin mr-3 text-2xl"></i> Đang tải dữ liệu...</div>';

    try {
        const { data: reports, error: reportsErr } = await window.sb.from('daily_si_reports')
            .select('*').gte('report_date', startDate).lte('report_date', endDate);
        if (reportsErr) throw reportsErr;

        const { data: shopsData, error: shopsErr } = await window.sb.from('shops').select('khu_vuc, gd_khu_vuc');
        if (!shopsErr && shopsData && shopsData.length > 0) {
            let directorMap = {};
            shopsData.forEach(shop => { if (shop.khu_vuc && shop.gd_khu_vuc) directorMap[shop.khu_vuc.trim().toUpperCase()] = shop.gd_khu_vuc; });
            REGIONS_SI = REGIONS_SI.map(region => ({ ...region, dir: directorMap[region.name.toUpperCase()] || region.dir }));
        }
        
        window.STATE.rawHistorySI = reports || [];
        window.STATE.daysArray = daysArray;
        window.STATE.currentMonthBase = `${year}-${month}-01`; 
        
        window.renderMonthTables();
    } catch (err) {
        console.error("Lỗi tải dữ liệu S.I:", err);
        container.innerHTML = `<div class="p-6 bg-red-50 text-red-600 font-bold rounded border border-red-200">Lỗi tải dữ liệu: ${err.message}</div>`;
    }
};

// 3. VẼ GIAO DIỆN BẢNG
window.renderMonthTables = () => {
    const container = document.getElementById('si_tables_container');
    const reports = window.STATE.rawHistorySI || [];
    const daysArray = window.STATE.daysArray;
    const baseDate = window.STATE.currentMonthBase; 
    const isAdmin = checkIsAdmin();

    const renderDateHeaders = () => {
        return daysArray.map(d => {
            const isWeekend = d.dayName === 'CN';
            return `
                <th class="border-r border-b border-gray-300 py-1 px-1 min-w-[45px] text-center">
                    <div class="${isWeekend ? 'text-red-600' : 'text-[#c0392b]'} font-bold text-[13px]">${d.dayNum}</div>
                    <div class="${isWeekend ? 'text-red-500' : 'text-[#2980b9]'} text-[10px]">${d.dayName}</div>
                </th>
            `;
        }).join('');
    };

    let tbodyTT = '';
    let tbodyXH = '';

    REGIONS_SI.forEach((region, index) => {
        const baseData = reports.find(r => r.region_name === region.name && r.report_date === baseDate) || {};
        const valTargetTT = baseData.target_tt || 0;
        const valTargetPH = baseData.target_ph || 0;
        const valCX = baseData.chua_xuat || 0;

        // Tích hợp oninput="window.debouncedRecalculate()"
        const inputTargetTT = isAdmin 
            ? `<input type="number" value="${valTargetTT === 0 ? '' : valTargetTT}" oninput="window.debouncedRecalculate()" data-region="${region.name}" class="target-tt-input w-full text-center py-2 font-bold text-orange-700 bg-transparent outline-none">`
            : `<div class="py-2 text-center font-bold text-orange-700">${valTargetTT === 0 ? '0' : valTargetTT.toLocaleString()}</div>`;

        const inputTargetPH = isAdmin 
            ? `<input type="number" value="${valTargetPH === 0 ? '' : valTargetPH}" oninput="window.debouncedRecalculate()" data-region="${region.name}" class="target-ph-input w-full text-center py-2 font-bold text-green-700 bg-transparent outline-none">`
            : `<div class="py-2 text-center font-bold text-green-700">${valTargetPH === 0 ? '0' : valTargetPH.toLocaleString()}</div>`;

        const inputCXElement = isAdmin 
            ? `<input type="number" value="${valCX === 0 ? '' : valCX}" oninput="window.debouncedRecalculate()" data-region="${region.name}" class="cx-input w-full text-center py-2 font-bold text-red-600 bg-transparent outline-none">`
            : `<div class="py-2 text-center font-bold text-red-600">${valCX === 0 ? '0' : valCX.toLocaleString()}</div>`;

        let inputsTT = '';
        let inputsPH = '';

        daysArray.forEach((d) => {
            const dailyData = reports.find(r => r.region_name === region.name && r.report_date === d.fullDate) || {};
            const valTT = dailyData.thanh_toan || 0;
            const valPH = dailyData.xuat_hang || 0;

            const elTT = isAdmin 
                ? `<input type="number" value="${valTT === 0 ? '' : valTT}" oninput="window.debouncedRecalculate()" data-date="${d.fullDate}" data-region="${region.name}" class="tt-input w-full text-center py-1.5 hover:bg-orange-50 focus:bg-orange-100 rounded outline-none transition font-medium text-gray-700 bg-transparent">`
                : `<div class="py-1.5 text-center font-medium text-gray-700">${valTT === 0 ? '' : valTT}</div>`;
            
            const elPH = isAdmin 
                ? `<input type="number" value="${valPH === 0 ? '' : valPH}" oninput="window.debouncedRecalculate()" data-date="${d.fullDate}" data-region="${region.name}" class="ph-input w-full text-center py-1.5 hover:bg-green-50 focus:bg-green-100 rounded outline-none transition font-medium text-gray-700 bg-transparent">`
                : `<div class="py-1.5 text-center font-medium text-gray-700">${valPH === 0 ? '' : valPH}</div>`;

            inputsTT += `<td class="p-1 border-r border-gray-200 text-center">${elTT}</td>`;
            inputsPH += `<td class="p-1 border-r border-gray-200 text-center">${elPH}</td>`;
        });

        tbodyTT += `
            <tr class="bg-white hover:bg-slate-50 transition border-b border-gray-200">
                <td class="sticky-col left-0 bg-white py-2 px-2 text-center border-r font-medium text-gray-600">${index + 1}</td>
                <td class="sticky-col left-[40px] bg-white py-2 px-3 text-left border-r font-bold text-gray-800">${region.name}</td>
                <td class="sticky-col left-[168px] bg-white py-2 px-3 text-left border-r text-gray-700">${region.dir}</td>
                <td class="p-0 border-r bg-orange-50/50">${inputTargetTT}</td>
                <td id="tt-row-total-${index}" class="py-2 px-2 text-center border-r bg-yellow-50 text-gray-800 font-bold shadow-[inset_0_0_2px_rgba(0,0,0,0.05)]">0</td>
                ${inputsTT}
            </tr>
        `;

        tbodyXH += `
            <tr class="bg-white hover:bg-slate-50 transition border-b border-gray-200">
                <td class="sticky-col left-0 bg-white py-2 px-2 text-center border-r font-medium text-gray-600">${index + 1}</td>
                <td class="sticky-col left-[40px] bg-white py-2 px-3 text-left border-r font-bold text-gray-800">${region.name}</td>
                <td class="sticky-col left-[168px] bg-white py-2 px-3 text-left border-r text-gray-700">${region.dir}</td>
                <td class="p-0 border-r bg-green-50/50">${inputTargetPH}</td>
                <td class="p-0 border-r bg-red-50/50">${inputCXElement}</td>
                <td id="ph-row-total-${index}" class="py-2 px-2 text-center border-r bg-green-100 text-green-800 font-bold shadow-[inset_0_0_2px_rgba(0,0,0,0.05)]">0</td>
                ${inputsPH}
            </tr>
        `;
    });

    container.innerHTML = `
        <div class="mb-8 border border-gray-200 shadow-sm bg-white overflow-hidden relative fade-in">
            <div class="bg-orange-500 text-white font-bold px-4 py-2 inline-block rounded-br-lg mb-2 text-sm shadow-sm">
                1. NHẬP ĐƠN THANH TOÁN
            </div>
            <div class="overflow-x-auto pb-4 custom-scrollbar">
                <table class="w-full text-xs whitespace-nowrap min-w-[2000px] border-collapse">
                    <thead class="bg-gray-100 text-gray-700 font-semibold text-center border-b border-gray-300">
                        <tr>
                            <th class="py-2 px-2 border-r sticky-col left-0 bg-gray-100 w-10">STT</th>
                            <th class="py-2 px-3 border-r sticky-col left-[40px] bg-gray-100 text-left w-32">Tên Khu Vực</th>
                            <th class="py-2 px-3 border-r sticky-col left-[168px] bg-gray-100 text-left w-48">Tên Giám Đốc</th>
                            <th class="py-2 px-2 border-r bg-orange-50 w-24">TARGET THÁNG<br><span class="text-[10px] font-normal">(Đơn)</span></th>
                            <th class="py-2 px-2 border-r bg-yellow-50 w-24">TOTAL<br><span class="text-[10px] font-normal">(Đơn)</span></th>
                            <th colspan="${daysArray.length}" class="py-1 px-2 border-r border-b">CHI TIẾT NHẬP LIỆU THEO NGÀY <span class="text-[10px] font-normal">(Đơn thanh toán)</span></th>
                        </tr>
                        <tr>
                            <th class="sticky-col left-0 bg-gray-100 border-r border-b"></th>
                            <th class="sticky-col left-[40px] bg-gray-100 border-r border-b"></th>
                            <th class="sticky-col left-[168px] bg-gray-100 border-r border-b"></th>
                            <th class="bg-orange-50 border-r border-b"></th>
                            <th class="bg-yellow-50 border-r border-b"></th>
                            ${renderDateHeaders()}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">${tbodyTT}</tbody>
                    <tfoot class="bg-gray-50 border-t-2 border-gray-300 font-bold">
                        <tr>
                            <td colspan="3" class="sticky-col left-0 bg-gray-50 py-3 px-3 text-center border-r text-orange-600 z-30">TỔNG CỘNG</td>
                            <td id="tt-sum-target" class="py-3 px-2 text-center border-r text-orange-600 bg-orange-50">0</td>
                            <td id="tt-grand-total" class="py-3 px-2 text-center border-r text-orange-600 bg-yellow-50">0</td>
                            ${daysArray.map((_, i) => `<td id="tt-col-total-${i}" class="py-3 px-2 text-center border-r text-orange-500">0</td>`).join('')}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <div class="mb-8 border border-gray-200 shadow-sm bg-white overflow-hidden relative fade-in">
            <div class="bg-green-700 text-white font-bold px-4 py-2 inline-block rounded-br-lg mb-2 text-sm shadow-sm">
                2. NHẬP ĐƠN PHÁT HÀNG
            </div>
            <div class="overflow-x-auto pb-4 custom-scrollbar">
                <table class="w-full text-xs whitespace-nowrap min-w-[2000px] border-collapse">
                    <thead class="bg-gray-100 text-gray-700 font-semibold text-center border-b border-gray-300">
                        <tr>
                            <th class="py-2 px-2 border-r sticky-col left-0 bg-gray-100 w-10">STT</th>
                            <th class="py-2 px-3 border-r sticky-col left-[40px] bg-gray-100 text-left w-32">Tên Khu Vực</th>
                            <th class="py-2 px-3 border-r sticky-col left-[168px] bg-gray-100 text-left w-48">Tên Giám Đốc</th>
                            <th class="py-2 px-2 border-r bg-green-50 w-24">TARGET THÁNG<br><span class="text-[10px] font-normal">(Đơn)</span></th>
                            <th class="py-2 px-2 border-r bg-red-50 w-28">SỐ LƯỢNG<br>CHƯA PHÁT HÀNG<br><span class="text-[10px] font-normal">(Hiện tại)</span></th>
                            <th class="py-2 px-2 border-r bg-green-100 w-24">TOTAL PHÁT HÀNG<br><span class="text-[10px] font-normal">(Đơn)</span></th>
                            <th colspan="${daysArray.length}" class="py-1 px-2 border-r border-b">CHI TIẾT NHẬP LIỆU THEO NGÀY <span class="text-[10px] font-normal">(Đơn phát hàng)</span></th>
                        </tr>
                        <tr>
                            <th class="sticky-col left-0 bg-gray-100 border-r border-b"></th>
                            <th class="sticky-col left-[40px] bg-gray-100 border-r border-b"></th>
                            <th class="sticky-col left-[168px] bg-gray-100 border-r border-b"></th>
                            <th class="bg-green-50 border-r border-b"></th>
                            <th class="bg-red-50 border-r border-b"></th>
                            <th class="bg-green-100 border-r border-b"></th>
                            ${renderDateHeaders()}
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200">${tbodyXH}</tbody>
                    <tfoot class="bg-gray-50 border-t-2 border-gray-300 font-bold">
                        <tr>
                            <td colspan="3" class="sticky-col left-0 bg-gray-50 py-3 px-3 text-center border-r text-green-700 z-30">TỔNG CỘNG</td>
                            <td id="ph-sum-target" class="py-3 px-2 text-center border-r text-green-700 bg-green-50">0</td>
                            <td id="cx-grand-total" class="py-3 px-2 text-center border-r text-red-600 bg-red-50">0</td>
                            <td id="ph-grand-total" class="py-3 px-2 text-center border-r text-green-700 bg-green-100">0</td>
                            ${daysArray.map((_, i) => `<td id="ph-col-total-${i}" class="py-3 px-2 text-center border-r text-green-600">0</td>`).join('')}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            <div class="col-span-2 text-[11px] text-gray-500 border border-gray-200 rounded p-3 bg-gray-50 leading-relaxed">
                <span class="font-bold text-gray-700">GHI CHÚ:</span><br>
                • <span class="font-semibold">TARGET THÁNG:</span> Chỉ tiêu Sellin được giao trong tháng<br>
                • <span class="font-semibold">SỐ LƯỢNG CHƯA PHÁT HÀNG:</span> Số lượng đơn đã TT nhưng chưa phát hàng<br>
                • <span class="font-semibold">TOTAL PHÁT HÀNG:</span> Lũy kế số lượng đã phát hàng trong tháng
            </div>
            <div class="border border-orange-200 rounded p-4 text-center shadow-sm bg-white">
                <p class="text-xs font-bold text-gray-600 mb-1">TỔNG TARGET THÁNG</p>
                <p id="summary-target" class="text-xl font-black text-orange-600">0</p>
            </div>
            <div class="border border-blue-200 rounded p-4 text-center shadow-sm bg-blue-50/30">
                <p class="text-xs font-bold text-gray-600 mb-1">TỔNG ĐƠN THANH TOÁN</p>
                <p id="summary-tt" class="text-xl font-black text-blue-700">0</p>
            </div>
            <div class="border border-green-200 rounded p-4 text-center shadow-sm bg-green-50/30">
                <p class="text-xs font-bold text-gray-600 mb-1">TỔNG PHÁT HÀNG</p>
                <p id="summary-ph" class="text-xl font-black text-green-700">0</p>
            </div>
        </div>
    `;

    window.recalculateTotals();
};

// 4. HÀM TÍNH TỔNG DỮ LIỆU
window.recalculateTotals = () => {
    const daysArray = window.STATE.daysArray;
    let totalTargetTT = 0; let grandTotalTT = 0; let colSumsTT = Array(daysArray.length).fill(0);
    let totalTargetPH = 0; let grandTotalPH = 0; let grandTotalCX = 0; let colSumsPH = Array(daysArray.length).fill(0);

    REGIONS_SI.forEach((reg, rIdx) => {
        const tgTTEl = document.querySelectorAll('.target-tt-input')[rIdx];
        const tgPHEl = document.querySelectorAll('.target-ph-input')[rIdx];
        
        let tTT = tgTTEl ? (parseInt(tgTTEl.value) || 0) : 0;
        let tPH = tgPHEl ? (parseInt(tgPHEl.value) || 0) : 0;
        totalTargetTT += tTT;
        totalTargetPH += tPH;

        let rowSumTT = 0;
        const ttInputs = document.querySelectorAll(`.tt-input[data-region="${reg.name}"]`);
        ttInputs.forEach((el, cIdx) => {
            const val = parseInt(el.value) || 0;
            rowSumTT += val;
            colSumsTT[cIdx] += val;
        });
        const elTotalTT = document.getElementById(`tt-row-total-${rIdx}`);
        if(elTotalTT) elTotalTT.innerText = rowSumTT.toLocaleString();
        grandTotalTT += rowSumTT;

        let rowSumPH = 0;
        const phInputs = document.querySelectorAll(`.ph-input[data-region="${reg.name}"]`);
        phInputs.forEach((el, cIdx) => {
            const val = parseInt(el.value) || 0;
            rowSumPH += val;
            colSumsPH[cIdx] += val;
        });
        const elTotalPH = document.getElementById(`ph-row-total-${rIdx}`);
        if(elTotalPH) elTotalPH.innerText = rowSumPH.toLocaleString();
        grandTotalPH += rowSumPH;

        const elCX = document.querySelectorAll('.cx-input')[rIdx];
        grandTotalCX += elCX ? (parseInt(elCX.value) || 0) : 0;
    });

    colSumsTT.forEach((sum, i) => { const el = document.getElementById(`tt-col-total-${i}`); if(el) el.innerText = sum.toLocaleString(); });
    const ftTTTarget = document.getElementById('tt-sum-target'); if(ftTTTarget) ftTTTarget.innerText = totalTargetTT.toLocaleString();
    const ftTTGrand = document.getElementById('tt-grand-total'); if(ftTTGrand) ftTTGrand.innerText = grandTotalTT.toLocaleString();

    colSumsPH.forEach((sum, i) => { const el = document.getElementById(`ph-col-total-${i}`); if(el) el.innerText = sum.toLocaleString(); });
    const ftPHTarget = document.getElementById('ph-sum-target'); if(ftPHTarget) ftPHTarget.innerText = totalTargetPH.toLocaleString();
    const ftPHGrand = document.getElementById('ph-grand-total'); if(ftPHGrand) ftPHGrand.innerText = grandTotalPH.toLocaleString();
    const ftCXGrand = document.getElementById('cx-grand-total'); if(ftCXGrand) ftCXGrand.innerText = grandTotalCX.toLocaleString();

    const boxTarget = document.getElementById('summary-target'); if(boxTarget) boxTarget.innerText = totalTargetTT.toLocaleString();
    const boxTT = document.getElementById('summary-tt'); if(boxTT) boxTT.innerText = grandTotalTT.toLocaleString();
    const boxPH = document.getElementById('summary-ph'); if(boxPH) boxPH.innerText = grandTotalPH.toLocaleString();
};

// 5. LƯU BATCH (FIX LỖI NULL ID UPSERT SUPABASE)
window.saveAllData = async () => {
    const btnSave = document.getElementById('btn-save-si');
    const originalText = btnSave.innerHTML;
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang lưu...';
    btnSave.disabled = true;

    try {
        const baseDate = window.STATE.currentMonthBase;
        let dataMap = {}; 

        const initKey = (region, date) => {
            let key = `${region}_${date}`;
            if (!dataMap[key]) {
                dataMap[key] = { report_date: date, region_name: region, hasData: false };
            }
            return key;
        };

        REGIONS_SI.forEach(reg => {
            const elTgTT = document.querySelector(`.target-tt-input[data-region="${reg.name}"]`);
            const elTgPH = document.querySelector(`.target-ph-input[data-region="${reg.name}"]`);
            const elCX = document.querySelector(`.cx-input[data-region="${reg.name}"]`);
            
            let key = initKey(reg.name, baseDate);
            if (elTgTT) { dataMap[key].target_tt = parseInt(elTgTT.value) || 0; dataMap[key].hasData = true; }
            if (elTgPH) { dataMap[key].target_ph = parseInt(elTgPH.value) || 0; dataMap[key].hasData = true; }
            if (elCX) { dataMap[key].chua_xuat = parseInt(elCX.value) || 0; dataMap[key].hasData = true; }
        });

        document.querySelectorAll('.tt-input').forEach(input => {
            let val = parseInt(input.value);
            if (!isNaN(val)) {
                let key = initKey(input.getAttribute('data-region'), input.getAttribute('data-date'));
                dataMap[key].thanh_toan = val;
                dataMap[key].hasData = true;
            }
        });

        document.querySelectorAll('.ph-input').forEach(input => {
            let val = parseInt(input.value);
            if (!isNaN(val)) {
                let key = initKey(input.getAttribute('data-region'), input.getAttribute('data-date'));
                dataMap[key].xuat_hang = val;
                dataMap[key].hasData = true;
            }
        });

        const finalPayload = Object.values(dataMap).filter(r => r.hasData).map(r => {
            delete r.hasData;
            return r;
        });

        if (finalPayload.length === 0) {
            alert("Chưa có dữ liệu nào để lưu!");
            btnSave.innerHTML = originalText;
            btnSave.disabled = false;
            return;
        }

        const startDate = window.STATE.daysArray[0].fullDate;
        const endDate = window.STATE.daysArray[window.STATE.daysArray.length - 1].fullDate;
        const { data: existingRecords } = await window.sb.from('daily_si_reports')
            .select('id, region_name, report_date').gte('report_date', startDate).lte('report_date', endDate);
            
        let existingMap = {};
        if (existingRecords) existingRecords.forEach(r => existingMap[`${r.region_name}_${r.report_date}`] = r.id);

        let toInsert = [];
        let toUpdate = [];

        finalPayload.forEach(row => {
            let id = existingMap[`${row.region_name}_${row.report_date}`];
            if (id) {
                row.id = id;
                toUpdate.push(row);
            } else {
                toInsert.push(row);
            }
        });

        if (toInsert.length > 0) {
            const { error: errIns } = await window.sb.from('daily_si_reports').insert(toInsert);
            if (errIns) throw errIns;
        }
        
        if (toUpdate.length > 0) {
            const { error: errUpd } = await window.sb.from('daily_si_reports').upsert(toUpdate);
            if (errUpd) throw errUpd;
        }

        alert("✅ Đã lưu dữ liệu thành công!");
        window.loadSellInMonthData(); 
    } catch (err) {
        console.error(err);
        alert("❌ Có lỗi khi lưu dữ liệu: " + err.message);
    } finally {
        btnSave.innerHTML = originalText;
        btnSave.disabled = false;
    }
};

// ==========================================
// 6. TÍNH NĂNG XUẤT / NHẬP EXCEL (HỖ TRỢ THÁNG & TARGET)
// ==========================================
window.exportSellInExcel = function() {
    const daysArray = window.STATE.daysArray;
    const reports = window.STATE.rawHistorySI || [];
    const baseDate = window.STATE.currentMonthBase;

    if (!daysArray || daysArray.length === 0) { alert("Chưa có dữ liệu!"); return; }

    let aoaTT = [["STT", "Tên Khu Vực", "Tên Giám Đốc", "TARGET THÁNG", "TOTAL THANH TOÁN", ...daysArray.map(d => `${d.dayNum}/${d.dayName}`)]];
    let aoaXH = [["STT", "Tên Khu Vực", "Tên Giám Đốc", "TARGET THÁNG", "CHƯA PHÁT HÀNG", "TOTAL PHÁT HÀNG", ...daysArray.map(d => `${d.dayNum}/${d.dayName}`)]];

    REGIONS_SI.forEach((region, index) => {
        const baseData = reports.find(r => r.region_name === region.name && r.report_date === baseDate) || {};
        
        // Row TT
        let rowTT = [index + 1, region.name, region.dir, (baseData.target_tt || 0), 0];
        let totalTT = 0;
        daysArray.forEach(d => {
            const data = reports.find(r => r.region_name === region.name && r.report_date === d.fullDate) || {};
            totalTT += data.thanh_toan || 0;
            rowTT.push(data.thanh_toan ? data.thanh_toan : "");
        });
        rowTT[4] = totalTT; 
        aoaTT.push(rowTT);

        // Row XH
        let rowXH = [index + 1, region.name, region.dir, (baseData.target_ph || 0), (baseData.chua_xuat || 0), 0];
        let totalPH = 0;
        daysArray.forEach(d => {
            const data = reports.find(r => r.region_name === region.name && r.report_date === d.fullDate) || {};
            totalPH += data.xuat_hang || 0;
            rowXH.push(data.xuat_hang ? data.xuat_hang : "");
        });
        rowXH[5] = totalPH; 
        aoaXH.push(rowXH);
    });

    let wb = XLSX.utils.book_new();
    let wsTT = XLSX.utils.aoa_to_sheet(aoaTT);
    let wsXH = XLSX.utils.aoa_to_sheet(aoaXH);
    
    const wscols = [{wch: 5}, {wch: 20}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}];
    wsTT['!cols'] = wscols; wsXH['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, wsTT, "Thanh_Toan");
    XLSX.utils.book_append_sheet(wb, wsXH, "Phat_Hang");
    
    const monthStr = document.getElementById('si-month-filter').value.replace("-", "");
    XLSX.writeFile(wb, `SellIn_Thang_${monthStr}.xlsx`);
};

window.importSellInExcel = async function(event) {
    let file = event.target.files[0];
    if (!file) return;

    const container = document.getElementById('si_tables_container');
    const oldHtml = container.innerHTML;
    container.innerHTML = '<div class="p-10 flex justify-center items-center text-orange-500 font-bold"><i class="fa-solid fa-spinner fa-spin mr-3 text-2xl"></i> Đang đọc file Excel...</div>';

    let reader = new FileReader();
    reader.onload = async function(e) {
        try {
            let data = new Uint8Array(e.target.result);
            let workbook = XLSX.read(data, {type: 'array'});
            
            const daysArray = window.STATE.daysArray;
            const baseDate = window.STATE.currentMonthBase;
            const validRegions = REGIONS_SI.map(r => r.name);
            let parsedData = {};

            const initKey = (region, date) => {
                let key = `${region}_${date}`;
                if (!parsedData[key]) parsedData[key] = { region_name: region, report_date: date, hasData: false };
                return key;
            };

            if (workbook.SheetNames.includes("Thanh_Toan")) {
                let jsonTT = XLSX.utils.sheet_to_json(workbook.Sheets["Thanh_Toan"], {header: 1});
                for (let i = 1; i < jsonTT.length; i++) {
                    let row = jsonTT[i];
                    if (!row) continue;
                    let regionName = validRegions.find(vr => String(row[1] || "").includes(vr));
                    if (!regionName) continue;
                    
                    let valTgTT = parseInt(row[3]);
                    if (!isNaN(valTgTT)) {
                        let key = initKey(regionName, baseDate);
                        parsedData[key].target_tt = valTgTT;
                        parsedData[key].hasData = true;
                    }

                    for (let d = 0; d < daysArray.length; d++) {
                        let val = parseInt(row[5 + d]);
                        if (!isNaN(val)) {
                            let key = initKey(regionName, daysArray[d].fullDate);
                            parsedData[key].thanh_toan = val;
                            parsedData[key].hasData = true;
                        }
                    }
                }
            }

            if (workbook.SheetNames.includes("Phat_Hang")) {
                let jsonXH = XLSX.utils.sheet_to_json(workbook.Sheets["Phat_Hang"], {header: 1});
                for (let i = 1; i < jsonXH.length; i++) {
                    let row = jsonXH[i];
                    if (!row) continue;
                    let regionName = validRegions.find(vr => String(row[1] || "").includes(vr));
                    if (!regionName) continue;
                    
                    let valTgPH = parseInt(row[3]);
                    let valCX = parseInt(row[4]);
                    
                    let keyBase = initKey(regionName, baseDate);
                    if (!isNaN(valTgPH)) { parsedData[keyBase].target_ph = valTgPH; parsedData[keyBase].hasData = true; }
                    if (!isNaN(valCX)) { parsedData[keyBase].chua_xuat = valCX; parsedData[keyBase].hasData = true; }

                    for (let d = 0; d < daysArray.length; d++) {
                        let val = parseInt(row[6 + d]);
                        if (!isNaN(val)) {
                            let key = initKey(regionName, daysArray[d].fullDate);
                            parsedData[key].xuat_hang = val;
                            parsedData[key].hasData = true;
                        }
                    }
                }
            }

            let finalDataToSave = Object.values(parsedData).filter(item => item.hasData);
            if (finalDataToSave.length === 0) throw new Error("File Excel rỗng hoặc sai cấu trúc Tháng!");

            const startDate = daysArray[0].fullDate;
            const endDate = daysArray[daysArray.length - 1].fullDate;
            
            const { data: existingRecords } = await window.sb.from('daily_si_reports')
                .select('id, region_name, report_date').gte('report_date', startDate).lte('report_date', endDate);
            
            let existingMap = {};
            if (existingRecords) existingRecords.forEach(r => existingMap[`${r.region_name}_${r.report_date}`] = r);

            let toInsert = [], toUpdate = [];

            finalDataToSave.forEach(newData => {
                let oldRec = existingMap[`${newData.region_name}_${newData.report_date}`];
                if (oldRec) {
                    newData.id = oldRec.id;
                    delete newData.hasData; 
                    toUpdate.push(newData);
                } else {
                    delete newData.hasData; 
                    toInsert.push(newData);
                }
            });

            if (toInsert.length > 0) await window.sb.from('daily_si_reports').insert(toInsert);
            if (toUpdate.length > 0) await window.sb.from('daily_si_reports').upsert(toUpdate);

            alert(`✅ Đã Import Excel thành công! Cập nhật ${toUpdate.length} bản ghi, Thêm mới ${toInsert.length} bản ghi.`);
        } catch (error) {
            alert("❌ Lỗi khi xử lý file Excel: " + error.message);
        } finally {
            event.target.value = ''; window.loadSellInMonthData();
        }
    };
    reader.readAsArrayBuffer(file);
};