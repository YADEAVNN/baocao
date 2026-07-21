// ==========================================
// MODULE: SELL-IN (S.I) - 2 TABS, LƯU NGẦM & EXCEL HOÀN CHỈNH
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
    { name: "Nam Trung Bộ", dir: "GD 7" }, 
    { name: "Tây Nguyên", dir: "GD 8" },
    { name: "Đông Nam", dir: "GD 9" },
    { name: "Hồ Chí Minh", dir: "GD 10" },
    { name: "Tây Nam", dir: "GD 11" },
    { name: "Sông Cửu Long", dir: "GD 12" }
];

const getLast7Days = (endDateStr) => {
    const end = new Date(endDateStr);
    const days = [];
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    for (let i = 6; i >= 0; i--) {
        const d = new Date(end);
        d.setDate(end.getDate() - i);
        days.push({
            fullDate: d.toISOString().split('T')[0],
            displayDate: `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`,
            dayOfWeek: dayNames[d.getDay()]
        });
    }
    return days;
};

// 1. KHỞI TẠO GIAO DIỆN
window.renderSellInView = () => {
    const appContent = document.getElementById('app-content');
    const isAdmin = checkIsAdmin();
    
    window.STATE = window.STATE || {};
    window.STATE.activeTab = window.STATE.activeTab || 'TT'; // Mặc định mở tab Thanh Toán
    
    const adminImportBtn = isAdmin ? `
        <input type="file" id="excel_import_si" class="hidden" accept=".xlsx, .xls" onchange="window.importSellInExcel(event)">
        <button onclick="document.getElementById('excel_import_si').click()" class="bg-gray-100 text-gray-700 px-4 py-2 rounded border border-gray-300 font-bold text-sm hover:bg-gray-200 transition">
            <i class="fa-solid fa-file-import mr-1"></i> Nhập Excel
        </button>
    ` : '';

    appContent.innerHTML = `
        <div class="flex flex-wrap items-center justify-between mb-6 gap-4">
            <div class="flex items-center gap-4">
                <h2 class="text-2xl font-black text-blue-900 tracking-tight uppercase">NHẬP LIỆU SELLIN</h2>
                <div class="flex items-center bg-white border border-gray-200 rounded-md px-3 py-1.5 shadow-sm">
                    <i class="fa-regular fa-calendar text-blue-600 mr-2"></i>
                    <label class="text-sm font-medium text-gray-600 mr-2">Ngày làm việc:</label>
                    <input type="date" id="si-date-filter" class="outline-none text-sm font-bold text-gray-800 bg-transparent" onchange="window.loadSellIn7DaysData()">
                </div>
            </div>
            <div class="flex gap-2">
                ${adminImportBtn}
                <button onclick="window.exportSellInExcel()" class="bg-blue-50 text-blue-700 px-4 py-2 rounded border border-blue-200 font-bold text-sm hover:bg-blue-100 transition">
                    <i class="fa-solid fa-file-export mr-1"></i> Xuất Excel
                </button>
            </div>
        </div>

        <div id="si_tables_container" class="space-y-4">
            <div class="p-10 flex justify-center items-center text-blue-500 font-bold">
                <i class="fa-solid fa-spinner fa-spin mr-3 text-2xl"></i> Đang tải dữ liệu...
            </div>
        </div>
    `;

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('si-date-filter').value = today;
    window.loadSellIn7DaysData();
};

window.switchTab = (tab) => {
    window.STATE.activeTab = tab;
    window.renderDualTables();
};

// 2. TẢI DỮ LIỆU TỪ SUPABASE
window.loadSellIn7DaysData = async () => {
    const targetDate = document.getElementById('si-date-filter').value;
    if (!targetDate) return;

    const days7 = getLast7Days(targetDate);
    const startDate = days7[0].fullDate;
    const endDate = days7[6].fullDate;

    const container = document.getElementById('si_tables_container');
    container.innerHTML = '<div class="p-10 flex justify-center items-center text-blue-500 font-bold"><i class="fa-solid fa-spinner fa-spin mr-3 text-2xl"></i> Đang tải dữ liệu...</div>';

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
        window.STATE.days7 = days7;
        window.STATE.targetDate = targetDate;

        window.renderDualTables();
    } catch (err) {
        console.error("Lỗi tải dữ liệu S.I:", err);
        container.innerHTML = `<div class="p-6 bg-red-50 text-red-600 font-bold rounded border border-red-200">Lỗi tải dữ liệu: ${err.message}</div>`;
    }
};

// 3. VẼ GIAO DIỆN CHIA 2 TABS
window.renderDualTables = () => {
    const container = document.getElementById('si_tables_container');
    const reports = window.STATE.rawHistorySI || [];
    const days7 = window.STATE.days7;
    const targetDate = window.STATE.targetDate;
    const isAdmin = checkIsAdmin(); 
    const activeTab = window.STATE.activeTab;

    const tabsHtml = `
        <div class="flex border-b border-gray-200 mb-2 space-x-1">
            <button onclick="window.switchTab('TT')" class="px-6 py-3 font-bold text-sm rounded-t-lg transition ${activeTab === 'TT' ? 'bg-[#004b93] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
                1. NHẬP ĐƠN THANH TOÁN
            </button>
            <button onclick="window.switchTab('XH')" class="px-6 py-3 font-bold text-sm rounded-t-lg transition ${activeTab === 'XH' ? 'bg-[#137a3f] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}">
                2. NHẬP ĐƠN PHÁT HÀNG
            </button>
        </div>
    `;

    const renderDateHeaders = () => {
        let html = '';
        days7.forEach(d => {
            const isWeekend = d.dayOfWeek === 'CN';
            html += `
                <th class="border border-gray-300 py-1.5 px-2 min-w-[70px]">
                    <div class="${isWeekend ? 'text-red-500' : 'text-gray-700'}">${d.displayDate}</div>
                    <div class="${isWeekend ? 'text-red-500' : 'text-gray-500'} font-medium">${d.dayOfWeek}</div>
                </th>
            `;
        });
        return html;
    };

    let tableHtml = '';

    if (activeTab === 'TT') {
        // ================= TAB 1: THANH TOÁN =================
        let colTotalsTT = Array(7).fill(0);
        let totalAllTT = 0;
        let tbodyTT = '';
        
        REGIONS_SI.forEach((region, index) => {
            let rowTotal = 0;
            let inputsHtml = '';
            
            days7.forEach((d, dIndex) => {
                const dailyData = reports.find(r => r.region_name === region.name && r.report_date === d.fullDate) || {};
                const val = dailyData.thanh_toan || 0;
                rowTotal += val;
                colTotalsTT[dIndex] += val;

                const inputElement = isAdmin 
                    ? `<input type="number" value="${val === 0 ? '' : val}" onchange="window.saveInlineData('${d.fullDate}', '${region.name}', 'thanh_toan', this)" class="tt-input tt-row-${index} tt-col-${dIndex} w-full h-full text-center outline-none bg-transparent hover:bg-gray-50 focus:bg-blue-50 py-1.5 font-medium text-gray-700 transition-colors">`
                    : `<div class="py-1.5 text-center text-gray-700">${val === 0 ? '' : val}</div>`;

                inputsHtml += `<td class="border border-gray-200 p-0 h-full align-middle">${inputElement}</td>`;
            });
            
            totalAllTT += rowTotal;
            tbodyTT += `
                <tr class="bg-white hover:bg-slate-50 transition">
                    <td class="border border-gray-200 text-center py-2 font-medium text-gray-600">${index + 1}</td>
                    <td class="border border-gray-200 px-3 font-medium text-gray-800 whitespace-nowrap">${region.name}</td>
                    <td class="border border-gray-200 px-3 text-sm text-gray-600 whitespace-nowrap">${region.dir}</td>
                    <td id="tt-row-total-${index}" class="border border-gray-200 text-center font-bold bg-yellow-50 text-gray-800 shadow-[inset_0_0_2px_rgba(0,0,0,0.05)]">${rowTotal.toLocaleString()}</td>
                    ${inputsHtml}
                    <td class="border border-gray-200 p-0"><input type="text" class="w-full h-full outline-none px-2 text-sm bg-transparent" ${isAdmin ? '' : 'readonly'}></td>
                </tr>
            `;
        });

        tableHtml = `
            <div class="bg-white rounded-b-lg rounded-tr-lg shadow-sm border border-gray-200 overflow-hidden fade-in">
                <div class="overflow-x-auto w-full custom-scrollbar">
                    <table id="table_tt_export" class="w-full text-sm border-collapse min-w-max">
                        <thead>
                            <tr class="bg-[#004b93] text-white text-center font-semibold">
                                <th rowspan="2" class="border border-[#003970] py-2 px-2 w-12">STT</th>
                                <th rowspan="2" class="border border-[#003970] py-2 px-4 w-40">Tên Khu Vực</th>
                                <th rowspan="2" class="border border-[#003970] py-2 px-4 w-40">Tên Giám Đốc</th>
                                <th rowspan="2" class="border border-[#003970] bg-[#fff5d6] text-gray-800 py-2 px-2 w-24 leading-tight">TOTAL<br><span class="text-xs font-normal">(Đơn)</span></th>
                                <th colspan="7" class="border border-gray-300 bg-gray-50 text-gray-700 py-1.5 uppercase text-xs">CHI TIẾT NHẬP LIỆU THEO NGÀY <span class="font-normal normal-case">(Đơn thanh toán)</span></th>
                                <th rowspan="2" class="border border-gray-300 bg-gray-50 text-gray-700 py-2 px-4 w-40">Ghi chú</th>
                            </tr>
                            <tr class="bg-white text-center text-xs">${renderDateHeaders()}</tr>
                        </thead>
                        <tbody>${tbodyTT}</tbody>
                        <tfoot>
                            <tr class="bg-[#f4f7fb] font-bold text-blue-700 text-center">
                                <td colspan="3" class="border border-gray-300 py-3 text-right px-4">TỔNG CỘNG</td>
                                <td id="tt-grand-total" class="border border-gray-300 bg-[#fff5d6] text-orange-600">${totalAllTT.toLocaleString()}</td>
                                ${colTotalsTT.map((total, i) => `<td id="tt-col-total-${i}" class="border border-gray-300 py-3">${total.toLocaleString()}</td>`).join('')}
                                <td class="border border-gray-300"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;

    } else {
        // ================= TAB 2: PHÁT HÀNG =================
        let colTotalsXH = Array(7).fill(0);
        let totalAllXH = 0;
        let totalAllCX = 0;
        let tbodyXH = '';
        
        REGIONS_SI.forEach((region, index) => {
            let rowTotalXH = 0;
            let inputsHtml = '';
            
            const currentDayData = reports.find(r => r.region_name === region.name && r.report_date === targetDate) || {};
            const valCX = currentDayData.chua_xuat || 0;
            totalAllCX += valCX;

            const inputCXElement = isAdmin 
                ? `<input type="number" value="${valCX === 0 ? '' : valCX}" onchange="window.saveInlineData('${targetDate}', '${region.name}', 'chua_xuat', this)" class="cx-input cx-row-${index} w-full h-full text-center outline-none bg-transparent hover:bg-red-50 focus:bg-red-100 py-2 font-bold text-red-600 transition-colors">`
                : `<div class="py-2 text-center text-red-600 font-bold">${valCX === 0 ? '' : valCX}</div>`;

            days7.forEach((d, dIndex) => {
                const dailyData = reports.find(r => r.region_name === region.name && r.report_date === d.fullDate) || {};
                const val = dailyData.xuat_hang || 0;
                rowTotalXH += val;
                colTotalsXH[dIndex] += val;

                const inputElement = isAdmin 
                    ? `<input type="number" value="${val === 0 ? '' : val}" onchange="window.saveInlineData('${d.fullDate}', '${region.name}', 'xuat_hang', this)" class="xh-input xh-row-${index} xh-col-${dIndex} w-full h-full text-center outline-none bg-transparent hover:bg-gray-50 focus:bg-green-50 py-1.5 font-medium text-gray-700 transition-colors">`
                    : `<div class="py-1.5 text-center text-gray-700">${val === 0 ? '' : val}</div>`;

                inputsHtml += `<td class="border border-gray-200 p-0 h-full align-middle">${inputElement}</td>`;
            });
            
            totalAllXH += rowTotalXH;
            tbodyXH += `
                <tr class="bg-white hover:bg-slate-50 transition">
                    <td class="border border-gray-200 text-center py-2 font-medium text-gray-600">${index + 1}</td>
                    <td class="border border-gray-200 px-3 font-medium text-gray-800 whitespace-nowrap">${region.name}</td>
                    <td class="border border-gray-200 px-3 text-sm text-gray-600 whitespace-nowrap">${region.dir}</td>
                    <td class="border border-gray-200 p-0 bg-[#ffe6e6]">${inputCXElement}</td>
                    <td id="xh-row-total-${index}" class="border border-gray-200 text-center font-bold bg-[#fff5d6] text-gray-800 shadow-[inset_0_0_2px_rgba(0,0,0,0.05)]">${rowTotalXH.toLocaleString()}</td>
                    ${inputsHtml}
                    <td class="border border-gray-200 p-0"><input type="text" class="w-full h-full outline-none px-2 text-sm bg-transparent" ${isAdmin ? '' : 'readonly'}></td>
                </tr>
            `;
        });

        tableHtml = `
            <div class="bg-white rounded-b-lg rounded-tl-lg shadow-sm border border-gray-200 overflow-hidden fade-in">
                <div class="overflow-x-auto w-full custom-scrollbar">
                    <table id="table_xh_export" class="w-full text-sm border-collapse min-w-max">
                        <thead>
                            <tr class="bg-[#137a3f] text-white text-center font-semibold">
                                <th rowspan="2" class="border border-[#0e5c2f] py-2 px-2 w-12">STT</th>
                                <th rowspan="2" class="border border-[#0e5c2f] py-2 px-4 w-40">Tên Khu Vực</th>
                                <th rowspan="2" class="border border-[#0e5c2f] py-2 px-4 w-40">Tên Giám Đốc</th>
                                <th rowspan="2" class="border border-gray-300 bg-[#fde8e8] text-gray-800 py-2 px-2 w-28 leading-tight">SỐ LƯỢNG<br>CHƯA PHÁT HÀNG<br><span class="text-xs font-normal">(Hiện tại)</span></th>
                                <th rowspan="2" class="border border-gray-300 bg-[#fff5d6] text-gray-800 py-2 px-2 w-24 leading-tight">TOTAL<br>PHÁT HÀNG<br><span class="text-xs font-normal">(Đơn)</span></th>
                                <th colspan="7" class="border border-gray-300 bg-gray-50 text-gray-700 py-1.5 uppercase text-xs">CHI TIẾT NHẬP LIỆU THEO NGÀY <span class="font-normal normal-case">(Đơn phát hàng)</span></th>
                                <th rowspan="2" class="border border-gray-300 bg-gray-50 text-gray-700 py-2 px-4 w-40">Ghi chú</th>
                            </tr>
                            <tr class="bg-white text-center text-xs">${renderDateHeaders()}</tr>
                        </thead>
                        <tbody>${tbodyXH}</tbody>
                        <tfoot>
                            <tr class="bg-[#f0fdf4] font-bold text-green-700 text-center">
                                <td colspan="3" class="border border-gray-300 py-3 text-right px-4">TỔNG CỘNG</td>
                                <td id="cx-grand-total" class="border border-gray-300 bg-[#ffe6e6] text-red-600">${totalAllCX.toLocaleString()}</td>
                                <td id="xh-grand-total" class="border border-gray-300 bg-[#fff5d6] text-orange-600">${totalAllXH.toLocaleString()}</td>
                                ${colTotalsXH.map((total, i) => `<td id="xh-col-total-${i}" class="border border-gray-300 py-3">${total.toLocaleString()}</td>`).join('')}
                                <td class="border border-gray-300"></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            </div>
        `;
    }

    container.innerHTML = tabsHtml + tableHtml;
};

// 4. LƯU NGẦM VÀ TÍNH TỔNG TỰ ĐỘNG BẰNG JS (KHÔNG LOAD LẠI TRANG)
window.recalculateTotals = () => {
    const activeTab = window.STATE.activeTab;
    
    if (activeTab === 'TT') {
        let grandTotal = 0;
        let colSums = Array(7).fill(0);
        
        REGIONS_SI.forEach((_, rIdx) => {
            let rowSum = 0;
            for(let cIdx = 0; cIdx < 7; cIdx++) {
                const el = document.querySelector(`.tt-row-${rIdx}.tt-col-${cIdx}`);
                const val = el ? (parseInt(el.value) || 0) : 0;
                rowSum += val;
                colSums[cIdx] += val;
            }
            const rowTotalEl = document.getElementById(`tt-row-total-${rIdx}`);
            if(rowTotalEl) rowTotalEl.innerText = rowSum.toLocaleString();
            grandTotal += rowSum;
        });
        
        for(let cIdx = 0; cIdx < 7; cIdx++) {
            const colTotalEl = document.getElementById(`tt-col-total-${cIdx}`);
            if(colTotalEl) colTotalEl.innerText = colSums[cIdx].toLocaleString();
        }
        
        const grandTotalEl = document.getElementById(`tt-grand-total`);
        if(grandTotalEl) grandTotalEl.innerText = grandTotal.toLocaleString();
        
    } else {
        let xhGrandTotal = 0;
        let cxGrandTotal = 0;
        let xhColSums = Array(7).fill(0);
        
        REGIONS_SI.forEach((_, rIdx) => {
            // Tính tổng Xuất hàng
            let rowSumXH = 0;
            for(let cIdx = 0; cIdx < 7; cIdx++) {
                const el = document.querySelector(`.xh-row-${rIdx}.xh-col-${cIdx}`);
                const val = el ? (parseInt(el.value) || 0) : 0;
                rowSumXH += val;
                xhColSums[cIdx] += val;
            }
            const rowTotalXHEl = document.getElementById(`xh-row-total-${rIdx}`);
            if(rowTotalXHEl) rowTotalXHEl.innerText = rowSumXH.toLocaleString();
            xhGrandTotal += rowSumXH;

            // Tính tổng Chưa xuất (chỉ có 1 cột)
            const cxEl = document.querySelector(`.cx-row-${rIdx}`);
            const valCX = cxEl ? (parseInt(cxEl.value) || 0) : 0;
            cxGrandTotal += valCX;
        });
        
        for(let cIdx = 0; cIdx < 7; cIdx++) {
            const colTotalXHEl = document.getElementById(`xh-col-total-${cIdx}`);
            if(colTotalXHEl) colTotalXHEl.innerText = xhColSums[cIdx].toLocaleString();
        }
        
        const xhGrandTotalEl = document.getElementById(`xh-grand-total`);
        if(xhGrandTotalEl) xhGrandTotalEl.innerText = xhGrandTotal.toLocaleString();
        
        const cxGrandTotalEl = document.getElementById(`cx-grand-total`);
        if(cxGrandTotalEl) cxGrandTotalEl.innerText = cxGrandTotal.toLocaleString();
    }
};

window.saveInlineData = async (date, regionName, field, inputEl) => {
    let val = parseInt(inputEl.value);
    if (isNaN(val) || val < 0) {
        val = 0;
        inputEl.value = ''; 
    }

    // Hiệu ứng UX: Nháy màu xanh lá cây báo đã lưu cục bộ
    inputEl.style.backgroundColor = '#dcfce3'; 
    setTimeout(() => { inputEl.style.backgroundColor = ''; }, 500);

    // Cập nhật State nội bộ để không mất dữ liệu khi chuyển tab
    let rawData = window.STATE.rawHistorySI || [];
    let existingRecord = rawData.find(r => r.region_name === regionName && r.report_date === date);
    if (existingRecord) {
        existingRecord[field] = val;
    } else {
        let newRec = { report_date: date, region_name: regionName, thanh_toan: 0, xuat_hang: 0, chua_xuat: 0 };
        newRec[field] = val;
        rawData.push(newRec);
    }

    // Tự động tính toán lại tổng trên màn hình ngay lập tức
    window.recalculateTotals();

    // Lưu ngầm lên Database (Không load lại UI)
    try {
        const { data: dbData } = await window.sb.from('daily_si_reports')
            .select('id').eq('report_date', date).eq('region_name', regionName);

        if (dbData && dbData.length > 0) {
            let updateObj = {}; updateObj[field] = val;
            await window.sb.from('daily_si_reports').update(updateObj).eq('id', dbData[0].id);
        } else {
            let insertObj = { report_date: date, region_name: regionName, thanh_toan: 0, xuat_hang: 0, chua_xuat: 0 };
            insertObj[field] = val;
            await window.sb.from('daily_si_reports').insert([insertObj]);
        }
    } catch (err) {
        console.error("Lỗi lưu ngầm:", err);
        inputEl.style.backgroundColor = '#fee2e2'; // Báo đỏ nếu kết nối mạng lỗi
    }
};

// ==========================================
// TÍNH NĂNG NHẬP / XUẤT EXCEL TỰ ĐỘNG MAP 2 TABS
// ==========================================

window.exportSellInExcel = function() {
    const days7 = window.STATE.days7;
    const reports = window.STATE.rawHistorySI || [];
    const targetDate = window.STATE.targetDate;

    if (!days7 || days7.length === 0) {
        alert("Chưa có dữ liệu ngày để xuất!"); return;
    }

    // 1. Dựng dữ liệu Sheet 1: Thanh Toán
    let aoaTT = [
        ["STT", "Tên Khu Vực", "Tên Giám Đốc", "TOTAL ĐƠN", ...days7.map(d => `${d.displayDate} (${d.dayOfWeek})`)]
    ];

    REGIONS_SI.forEach((region, index) => {
        let rowTT = [index + 1, region.name, region.dir, 0];
        let totalTT = 0;
        days7.forEach(d => {
            const dailyData = reports.find(r => r.region_name === region.name && r.report_date === d.fullDate) || {};
            const val = dailyData.thanh_toan || 0;
            totalTT += val;
            rowTT.push(val === 0 ? "" : val);
        });
        rowTT[3] = totalTT; // Cập nhật tổng
        aoaTT.push(rowTT);
    });

    // 2. Dựng dữ liệu Sheet 2: Phát Hàng
    let aoaXH = [
        ["STT", "Tên Khu Vực", "Tên Giám Đốc", "CHƯA PHÁT HÀNG (HIỆN TẠI)", "TOTAL PHÁT HÀNG", ...days7.map(d => `${d.displayDate} (${d.dayOfWeek})`)]
    ];

    REGIONS_SI.forEach((region, index) => {
        const currentDayData = reports.find(r => r.region_name === region.name && r.report_date === targetDate) || {};
        const valCX = currentDayData.chua_xuat || 0;

        let rowXH = [index + 1, region.name, region.dir, (valCX === 0 ? "" : valCX), 0];
        let totalXH = 0;
        days7.forEach(d => {
            const dailyData = reports.find(r => r.region_name === region.name && r.report_date === d.fullDate) || {};
            const val = dailyData.xuat_hang || 0;
            totalXH += val;
            rowXH.push(val === 0 ? "" : val);
        });
        rowXH[4] = totalXH; // Cập nhật tổng
        aoaXH.push(rowXH);
    });

    // 3. Tạo file Excel và tải xuống
    let wb = XLSX.utils.book_new();
    let wsTT = XLSX.utils.aoa_to_sheet(aoaTT);
    let wsXH = XLSX.utils.aoa_to_sheet(aoaXH);

    // Styling cơ bản độ rộng cột
    const wscols = [{wch: 5}, {wch: 20}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}, {wch: 15}];
    wsTT['!cols'] = wscols;
    wsXH['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, wsTT, "Thanh_Toan");
    XLSX.utils.book_append_sheet(wb, wsXH, "Phat_Hang");
    
    XLSX.writeFile(wb, `Nhap_Lieu_SellIn_${targetDate.replace(/-/g, '')}.xlsx`);
};

window.importSellInExcel = async function(event) {
    let file = event.target.files[0];
    if (!file) return;

    const container = document.getElementById('si_tables_container');
    const oldHtml = container.innerHTML;
    container.innerHTML = '<div class="p-10 flex justify-center items-center text-blue-500 font-bold"><i class="fa-solid fa-spinner fa-spin mr-3 text-2xl"></i> Đang đọc file Excel và đồng bộ lên hệ thống...</div>';

    let reader = new FileReader();
    reader.onload = async function(e) {
        try {
            let data = new Uint8Array(e.target.result);
            let workbook = XLSX.read(data, {type: 'array'});
            
            const days7 = window.STATE.days7;
            const targetDate = window.STATE.targetDate;
            const validRegions = REGIONS_SI.map(r => r.name);
            let parsedData = {};

            // Hàm tạo key gộp dữ liệu
            const initKey = (region, date) => {
                let key = `${region}_${date}`;
                if (!parsedData[key]) parsedData[key] = { region_name: region, report_date: date, hasData: false };
                return key;
            };

            // 1. Quét Sheet Thanh Toán (nếu có)
            if (workbook.SheetNames.includes("Thanh_Toan")) {
                let wsTT = workbook.Sheets["Thanh_Toan"];
                let jsonTT = XLSX.utils.sheet_to_json(wsTT, {header: 1});
                
                for (let i = 1; i < jsonTT.length; i++) {
                    let row = jsonTT[i];
                    if (!row || row.length === 0) continue;
                    let rawRegion = String(row[1] || "").trim();
                    let regionName = validRegions.find(vr => rawRegion.includes(vr));
                    if (!regionName) continue;

                    // Đọc 7 ngày (Cột E đến K, tương ứng index 4 đến 10)
                    for (let d = 0; d < 7; d++) {
                        let val = parseInt(row[4 + d]);
                        if (!isNaN(val)) {
                            let key = initKey(regionName, days7[d].fullDate);
                            parsedData[key].thanh_toan = val;
                            parsedData[key].hasData = true;
                        }
                    }
                }
            }

            // 2. Quét Sheet Phát Hàng (nếu có)
            if (workbook.SheetNames.includes("Phat_Hang")) {
                let wsXH = workbook.Sheets["Phat_Hang"];
                let jsonXH = XLSX.utils.sheet_to_json(wsXH, {header: 1});
                
                for (let i = 1; i < jsonXH.length; i++) {
                    let row = jsonXH[i];
                    if (!row || row.length === 0) continue;
                    let rawRegion = String(row[1] || "").trim();
                    let regionName = validRegions.find(vr => rawRegion.includes(vr));
                    if (!regionName) continue;

                    // Đọc cột "Chưa phát hàng" (Cột D, index 3) map vào targetDate
                    let valCX = parseInt(row[3]);
                    if (!isNaN(valCX)) {
                        let key = initKey(regionName, targetDate);
                        parsedData[key].chua_xuat = valCX;
                        parsedData[key].hasData = true;
                    }

                    // Đọc 7 ngày (Cột F đến L, tương ứng index 5 đến 11)
                    for (let d = 0; d < 7; d++) {
                        let val = parseInt(row[5 + d]);
                        if (!isNaN(val)) {
                            let key = initKey(regionName, days7[d].fullDate);
                            parsedData[key].xuat_hang = val;
                            parsedData[key].hasData = true;
                        }
                    }
                }
            }

            // Lọc bỏ những object không có dữ liệu thực tế
            let finalDataToSave = Object.values(parsedData).filter(item => item.hasData);
            if (finalDataToSave.length === 0) {
                alert("⚠️ Không tìm thấy số liệu hợp lệ trong file Excel!");
                container.innerHTML = oldHtml;
                return;
            }

            // 3. Xử lý đồng bộ lên Supabase
            const startDate = days7[0].fullDate;
            const endDate = days7[6].fullDate;
            
            const { data: existingRecords, error: fetchErr } = await window.sb.from('daily_si_reports')
                .select('id, region_name, report_date, thanh_toan, xuat_hang, chua_xuat')
                .gte('report_date', startDate)
                .lte('report_date', endDate);
            
            if (fetchErr) throw fetchErr;

            let existingMap = {};
            if (existingRecords) {
                existingRecords.forEach(r => { existingMap[`${r.region_name}_${r.report_date}`] = r; });
            }

            let toInsert = [];
            let toUpdate = [];

            finalDataToSave.forEach(newData => {
                let key = `${newData.region_name}_${newData.report_date}`;
                let oldRec = existingMap[key];

                if (oldRec) {
                    // Cập nhật giá trị mới, giữ nguyên giá trị cũ nếu Excel không điền
                    newData.id = oldRec.id;
                    newData.thanh_toan = newData.thanh_toan !== undefined ? newData.thanh_toan : oldRec.thanh_toan;
                    newData.xuat_hang = newData.xuat_hang !== undefined ? newData.xuat_hang : oldRec.xuat_hang;
                    newData.chua_xuat = newData.chua_xuat !== undefined ? newData.chua_xuat : oldRec.chua_xuat;
                    
                    delete newData.hasData;
                    toUpdate.push(newData);
                } else {
                    // Nếu là bản ghi mới hoàn toàn, set các trường thiếu về 0
                    newData.thanh_toan = newData.thanh_toan || 0;
                    newData.xuat_hang = newData.xuat_hang || 0;
                    newData.chua_xuat = newData.chua_xuat || 0;
                    
                    delete newData.hasData;
                    toInsert.push(newData);
                }
            });

            // Gửi lệnh lên database
            if (toInsert.length > 0) {
                const { error: insErr } = await window.sb.from('daily_si_reports').insert(toInsert);
                if (insErr) throw insErr;
            }
            if (toUpdate.length > 0) {
                const { error: updErr } = await window.sb.from('daily_si_reports').upsert(toUpdate);
                if (updErr) throw updErr;
            }

            alert(`✅ Đã Import thành công! Cập nhật ${toUpdate.length} dòng, Thêm mới ${toInsert.length} dòng.`);
            
        } catch (error) {
            console.error(error);
            alert("❌ Lỗi khi xử lý file Excel: " + error.message);
        } finally {
            event.target.value = ''; // Reset input file
            window.loadSellIn7DaysData(); // Tải lại bảng ngay lập tức
        }
    };
    reader.readAsArrayBuffer(file);
};