// ==========================================
// MODULE: SELL-IN (S.I) - MA TRẬN NHẬP LIỆU (BẢN FIX THANH CUỘN NGANG)
// ==========================================

// 0. HÀM KIỂM TRA QUYỀN ADMIN
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

// 1. HÀM KHỞI TẠO GIAO DIỆN CHÍNH
window.renderSellInView = () => {
    const appContent = document.getElementById('app-content');
    const isAdmin = checkIsAdmin();
    
    const adminHint = isAdmin ? `<p class="text-xs text-orange-500 italic hidden md:block"><i class="fa-solid fa-circle-info mr-1"></i> Bấm vào ô trống để nhập liệu.</p>` : '';
    const adminImportBtn = isAdmin ? `
        <input type="file" id="excel_import_si" class="hidden" accept=".xlsx, .xls" onchange="window.importSellInExcel(event)">
        <button onclick="document.getElementById('excel_import_si').click()" class="bg-green-100 text-green-700 px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-green-200 transition shadow-sm">
            <i class="fa-solid fa-file-import mr-1"></i> Nhập Excel
        </button>
    ` : '';

    appContent.innerHTML = `
        <div class="mb-6">
            <h2 class="text-2xl font-black text-gray-800 tracking-tight">TIẾN ĐỘ SELL-IN (12 KHU VỰC)</h2>
            <p class="text-gray-500 mt-1">Quản lý ma trận báo cáo: Thanh toán, Xuất thực tế & Hàng chưa xuất</p>
        </div>
        
        <div class="bg-white p-4 rounded-xl shadow-sm mb-6 border border-gray-100 flex flex-wrap items-center gap-4">
            <div class="flex items-center gap-3">
                <label class="font-bold text-gray-700 text-sm">CHỌN THÁNG BÁO CÁO</label>
                <input type="month" id="si-month-filter" class="border border-gray-300 px-4 py-2 rounded-lg font-medium text-gray-700 outline-none focus:border-blue-500 shadow-sm" onchange="window.loadSellInData()">
            </div>
            
            ${adminHint}
            
            <div class="ml-auto flex gap-2">
                ${adminImportBtn}
                <button onclick="window.exportSellInExcel()" class="bg-emerald-100 text-emerald-700 px-4 py-2 rounded-lg font-bold text-sm uppercase hover:bg-emerald-200 transition shadow-sm">
                    <i class="fa-solid fa-file-export mr-1"></i> Xuất Excel
                </button>
            </div>
        </div>

        <!-- ĐÃ FIX CSS: Thêm overflow-x-auto, max-width: 100% và display: grid để ép khung chứa không bị tràn màn hình -->
        <div id="si_matrix_container" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto relative w-full" style="max-width: 100%; display: grid;">
            <div class="p-10 flex justify-center items-center text-blue-500 font-bold"><i class="fa-solid fa-spinner fa-spin mr-3 text-2xl"></i> Đang tải dữ liệu ma trận...</div>
        </div>
    `;

    const d = new Date();
    const monthVal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    document.getElementById('si-month-filter').value = monthVal;
    
    window.loadSellInData();
};

// 2. HÀM TẢI DỮ LIỆU TỪ SUPABASE
window.loadSellInData = async () => {
    const monthInput = document.getElementById('si-month-filter').value;
    if (!monthInput) return;

    const [year, month] = monthInput.split('-');
    const startDate = `${year}-${month}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month}-${daysInMonth}`;

    const container = document.getElementById('si_matrix_container');
    container.innerHTML = '<div class="p-10 flex justify-center items-center text-blue-500 font-bold"><i class="fa-solid fa-spinner fa-spin mr-3 text-2xl"></i> Đang tải dữ liệu...</div>';

    try {
        const { data: reports, error: reportsErr } = await window.sb.from('daily_si_reports')
            .select('*').gte('report_date', startDate).lte('report_date', endDate);
        
        if (reportsErr) throw reportsErr;

        const { data: shopsData, error: shopsErr } = await window.sb.from('shops').select('khu_vuc, gd_khu_vuc');
        
        if (!shopsErr && shopsData && shopsData.length > 0) {
            let directorMap = {};
            shopsData.forEach(shop => {
                if (shop.khu_vuc && shop.gd_khu_vuc) {
                    directorMap[shop.khu_vuc.trim().toUpperCase()] = shop.gd_khu_vuc;
                }
            });

            REGIONS_SI = REGIONS_SI.map(region => ({
                ...region,
                dir: directorMap[region.name.toUpperCase()] || region.dir
            }));
        }
        
        window.STATE.rawHistorySI = reports || [];
        window.STATE.siDaysInMonth = daysInMonth;
        window.STATE.siYear = year;
        window.STATE.siMonth = month;

        window.renderSellInMatrix();

    } catch (err) {
        console.error("Lỗi tải dữ liệu S.I:", err);
        container.innerHTML = `<div class="p-6 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200">Lỗi tải dữ liệu: ${err.message}</div>`;
    }
};

// 3. HÀM VẼ MA TRẬN
window.renderSellInMatrix = () => {
    const container = document.getElementById('si_matrix_container');
    const reports = window.STATE.rawHistorySI || [];
    const daysInMonth = window.STATE.siDaysInMonth || 31;
    const year = window.STATE.siYear;
    const month = window.STATE.siMonth;
    
    const isAdmin = checkIsAdmin(); 

    const wSTT = 50, wKhuVuc = 160, wPhanLoai = 120, wTong = 80;
    const lKhuVuc = wSTT;               
    const lPhanLoai = wSTT + wKhuVuc;   
    const lTong = wSTT + wKhuVuc + wPhanLoai; 

    let thead = `
        <tr class="border-b-2 border-gray-200 bg-gray-50 text-gray-600 text-xs uppercase text-center">
            <th class="py-4 px-2 font-bold sticky left-0 z-20 bg-gray-50 border-r border-gray-200 min-w-[${wSTT}px] shadow-[1px_0_0_0_#e5e7eb]">STT</th>
            <th class="py-4 px-3 font-bold sticky left-[${lKhuVuc}px] z-20 bg-gray-50 border-r border-gray-200 min-w-[${wKhuVuc}px] text-left shadow-[1px_0_0_0_#e5e7eb]">KHU VỰC</th>
            <th class="py-4 px-2 font-bold sticky left-[${lPhanLoai}px] z-20 bg-gray-50 border-r border-gray-200 min-w-[${wPhanLoai}px] shadow-[1px_0_0_0_#e5e7eb]">PHÂN LOẠI</th>
            <th class="py-4 px-3 font-black text-orange-600 sticky left-[${lTong}px] z-20 bg-orange-100 border-r border-gray-300 min-w-[${wTong}px] shadow-[1px_0_0_0_#e5e7eb]">TỔNG</th>
    `;
    
    for (let d = 1; d <= daysInMonth; d++) {
        thead += `<th class="py-4 px-1 min-w-[45px]">${d}</th>`;
    }
    thead += `</tr>`;

    let tbody = '';

    REGIONS_SI.forEach((region, index) => {
        const regionReports = reports.filter(r => r.region_name === region.name);
        
        let sumTT = 0, sumXH = 0, sumCX = 0;
        let dailyHtmlTT = '', dailyHtmlXH = '', dailyHtmlCX = '';

        for (let d = 1; d <= daysInMonth; d++) {
            const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const dailyData = regionReports.find(r => r.report_date === fullDate) || { thanh_toan: 0, xuat_hang: 0, chua_xuat: 0 };
            
            sumTT += (dailyData.thanh_toan || 0);
            sumXH += (dailyData.xuat_hang || 0);
            sumCX += (dailyData.chua_xuat || 0);

            const onClickFn = isAdmin ? `onclick="window.openSellInModal('${fullDate}', '${region.name}', ${dailyData.thanh_toan || 0}, ${dailyData.xuat_hang || 0}, ${dailyData.chua_xuat || 0})"` : '';
            const cursorClass = isAdmin ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default';
            const cellClass = `${cursorClass} bg-white border border-gray-100 rounded text-sm py-1.5 font-semibold transition w-full h-full block`;
            
            dailyHtmlTT += `<td class="p-1 text-center"><div ${onClickFn} class="${cellClass} ${dailyData.thanh_toan > 0 ? 'text-blue-600 border-blue-200 bg-blue-50/30' : 'text-gray-300'}">${dailyData.thanh_toan > 0 ? dailyData.thanh_toan : '-'}</div></td>`;
            dailyHtmlXH += `<td class="p-1 text-center"><div ${onClickFn} class="${cellClass} ${dailyData.xuat_hang > 0 ? 'text-green-600 border-green-200 bg-green-50/30' : 'text-gray-300'}">${dailyData.xuat_hang > 0 ? dailyData.xuat_hang : '-'}</div></td>`;
            dailyHtmlCX += `<td class="p-1 text-center"><div ${onClickFn} class="${cellClass} ${dailyData.chua_xuat > 0 ? 'text-orange-600 border-orange-200 bg-orange-50/30' : 'text-gray-300'}">${dailyData.chua_xuat > 0 ? dailyData.chua_xuat : '-'}</div></td>`;
        }

        const tdSTT = `sticky left-0 bg-white z-10 border-r border-gray-200 text-center font-bold text-gray-500 shadow-[1px_0_0_0_#e5e7eb]`;
        const tdKhuVuc = `sticky left-[${lKhuVuc}px] bg-white z-10 border-r border-gray-200 px-3 shadow-[1px_0_0_0_#e5e7eb]`;
        const tdPhanLoai = `sticky left-[${lPhanLoai}px] z-10 bg-white border-r border-gray-200 text-center px-2 py-2 text-[13px] font-bold shadow-[1px_0_0_0_#e5e7eb]`;
        const tdTong = `sticky left-[${lTong}px] z-10 bg-orange-50 border-r border-gray-300 text-center px-2 py-2 font-black text-[15px] shadow-[1px_0_0_0_#e5e7eb]`;

        tbody += `
            <tr class="border-t-2 border-gray-200 bg-white hover:bg-slate-50">
                <td rowspan="3" class="${tdSTT}">${index + 1}</td>
                <td rowspan="3" class="${tdKhuVuc}">
                    <div class="font-black text-gray-800 text-[15px]">${region.name}</div>
                    <div class="text-[12px] text-gray-500 font-medium mt-0.5"><i class="fa-regular fa-user mr-1"></i>${region.dir}</div>
                </td>
                <td class="${tdPhanLoai} text-blue-600 bg-blue-50/50">Thanh toán</td>
                <td class="${tdTong} text-blue-700">${sumTT}</td>
                ${dailyHtmlTT}
            </tr>
            <tr class="bg-white hover:bg-slate-50">
                <td class="${tdPhanLoai} text-green-600 bg-green-50/50">Xuất thực tế</td>
                <td class="${tdTong} text-green-700">${sumXH}</td>
                ${dailyHtmlXH}
            </tr>
            <tr class="border-b-2 border-gray-200 bg-white hover:bg-slate-50">
                <td class="${tdPhanLoai} text-orange-600 bg-orange-50/50">Hàng chưa xuất</td>
                <td class="${tdTong} text-orange-700">${sumCX}</td>
                ${dailyHtmlCX}
            </tr>
        `;
    });

    // ĐÃ FIX CSS: Thêm max-width: 100% để hiển thị thanh scroll trượt ngang
    container.innerHTML = `
        <div class="overflow-x-auto relative w-full pb-4 custom-scrollbar" style="max-width: 100%; width: 100%;">
            <table id="table_sellin_export" class="w-full text-left border-collapse whitespace-nowrap" style="min-width: max-content;">
                <thead>${thead}</thead>
                <tbody>${tbody}</tbody>
            </table>
        </div>
    `;
};

// 4. HÀM MỞ MODAL NHẬP LIỆU GỘP
window.openSellInModal = (date, regionName, currentTT, currentXH, currentCX) => {
    const existingModal = document.getElementById('si-input-modal');
    if (existingModal) existingModal.remove();

    const formattedDate = date.split('-').reverse().join('/');

    const modalHtml = `
        <div id="si-input-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity p-4">
            <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden font-sans fade-in">
                <div class="bg-slate-800 text-white px-6 py-4 flex items-center justify-between">
                    <div>
                        <h3 class="font-bold text-lg">NHẬP LIỆU SELL-IN</h3>
                        <p class="text-xs text-slate-300 mt-1">${regionName} | Ngày ${formattedDate}</p>
                    </div>
                    <button onclick="document.getElementById('si-input-modal').remove()" class="text-slate-400 hover:text-white rounded-full w-8 h-8 flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark text-xl"></i>
                    </button>
                </div>
                
                <div class="p-6 space-y-4">
                    <div>
                        <label class="block text-sm font-bold text-blue-600 mb-1">1. Thanh toán</label>
                        <input type="number" id="input-tt" value="${currentTT || ''}" placeholder="Nhập số lượng..." class="w-full border-2 border-blue-100 px-4 py-2.5 rounded-xl outline-none focus:border-blue-500 font-bold text-gray-700 bg-blue-50/30">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-green-600 mb-1">2. Xuất thực tế</label>
                        <input type="number" id="input-xh" value="${currentXH || ''}" placeholder="Nhập số lượng..." class="w-full border-2 border-green-100 px-4 py-2.5 rounded-xl outline-none focus:border-green-500 font-bold text-gray-700 bg-green-50/30">
                    </div>
                    <div>
                        <label class="block text-sm font-bold text-orange-600 mb-1">3. Hàng chưa xuất</label>
                        <input type="number" id="input-cx" value="${currentCX || ''}" placeholder="Nhập số lượng..." class="w-full border-2 border-orange-100 px-4 py-2.5 rounded-xl outline-none focus:border-orange-500 font-bold text-gray-700 bg-orange-50/30">
                    </div>
                </div>
                
                <div class="bg-gray-50 px-6 py-4 border-t flex justify-between gap-3">
                    <button onclick="window.deleteSellIn('${date}', '${regionName}')" class="px-5 py-2.5 bg-red-100 text-red-600 font-bold rounded-xl hover:bg-red-200 transition">
                        <i class="fa-solid fa-trash-can"></i> Xóa
                    </button>
                    <div class="flex gap-2">
                        <button onclick="document.getElementById('si-input-modal').remove()" class="px-5 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-300 transition">
                            Hủy
                        </button>
                        <button onclick="window.saveSellIn('${date}', '${regionName}')" class="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-md transition flex items-center gap-2">
                            <i class="fa-solid fa-floppy-disk"></i> LƯU LẠI
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('input-tt').focus();
};

// 5. HÀM LƯU DỮ LIỆU LÊN SUPABASE
window.saveSellIn = async (date, regionName) => {
    const valTT = parseInt(document.getElementById('input-tt').value) || 0;
    const valXH = parseInt(document.getElementById('input-xh').value) || 0;
    const valCX = parseInt(document.getElementById('input-cx').value) || 0;

    if (valTT < 0 || valXH < 0 || valCX < 0) {
        alert("❌ Số lượng không được nhỏ hơn 0");
        return;
    }

    const btnSave = document.querySelector('#si-input-modal button.bg-blue-600');
    btnSave.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG LƯU...';
    btnSave.disabled = true;

    try {
        const { data: existingData } = await window.sb.from('daily_si_reports').select('id').eq('report_date', date).eq('region_name', regionName);

        if (existingData && existingData.length > 0) {
            const { error } = await window.sb.from('daily_si_reports').update({ thanh_toan: valTT, xuat_hang: valXH, chua_xuat: valCX }).eq('report_date', date).eq('region_name', regionName);
            if (error) throw error;
        } else {
            const { error } = await window.sb.from('daily_si_reports').insert([{ report_date: date, region_name: regionName, thanh_toan: valTT, xuat_hang: valXH, chua_xuat: valCX }]);
            if (error) throw error;
        }

        document.getElementById('si-input-modal').remove();
        window.loadSellInData(); 

    } catch (err) {
        console.error(err);
        alert("❌ Lỗi khi lưu dữ liệu: " + err.message);
        btnSave.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> LƯU LẠI';
        btnSave.disabled = false;
    }
};

// 6. HÀM XÓA BÁO CÁO NGÀY ĐÓ
window.deleteSellIn = async (date, regionName) => {
    if(!confirm(`⚠️ Bạn có chắc chắn muốn xóa toàn bộ số liệu ngày ${date.split('-').reverse().join('/')} của khu vực ${regionName} không?`)) return;

    try {
        const { error } = await window.sb.from('daily_si_reports').delete().eq('report_date', date).eq('region_name', regionName);
        if (error) throw error;
        
        document.getElementById('si-input-modal').remove();
        window.loadSellInData();

    } catch (err) {
        console.error(err);
        alert("❌ Lỗi khi xóa: " + err.message);
    }
};

// ==========================================
// TÍNH NĂNG NHẬP / XUẤT EXCEL
// ==========================================
window.exportSellInExcel = function() {
    let table = document.getElementById("table_sellin_export");
    if(!table) {
        alert("Không tìm thấy bảng dữ liệu để xuất!"); 
        return;
    }
    let workbook = XLSX.utils.table_to_book(table, {sheet: "Tien_Do_Sell_In"});
    XLSX.writeFile(workbook, 'Bao_Cao_SellIn.xlsx');
};

window.importSellInExcel = async function(event) {
    let file = event.target.files[0];
    if (!file) return;

    const container = document.getElementById('si_matrix_container');
    container.innerHTML = '<div class="p-10 flex justify-center items-center text-blue-500 font-bold"><i class="fa-solid fa-spinner fa-spin mr-3 text-2xl"></i> Đang xử lý file Excel và đồng bộ lên hệ thống...</div>';

    let reader = new FileReader();
    reader.onload = async function(e) {
        try {
            let data = new Uint8Array(e.target.result);
            let workbook = XLSX.read(data, {type: 'array'});
            let worksheet = workbook.Sheets[workbook.SheetNames[0]];
            let json_data = XLSX.utils.sheet_to_json(worksheet, {header: 1});

            const monthFilter = document.getElementById('si-month-filter').value;
            if (!monthFilter) throw new Error("Vui lòng chọn tháng trên màn hình trước khi Import.");

            const validRegions = REGIONS_SI.map(r => r.name);
            let currentRegion = "";
            let parsedData = {};

            for (let r = 1; r < json_data.length; r++) {
                let row = json_data[r];
                if (!row || row.length === 0) continue;

                if (row[1] && String(row[1]).trim() !== "") {
                    let rawText = String(row[1]).trim();
                    let matched = validRegions.find(vr => rawText.startsWith(vr));
                    if (matched) currentRegion = matched;
                    else continue; 
                }
                
                if (!currentRegion) continue;
                let phanLoai = row[2] ? String(row[2]).trim().toLowerCase() : "";

                for (let d = 1; d <= 31; d++) {
                    let colIndex = 3 + d; 
                    if (colIndex >= row.length) continue;

                    let cellVal = row[colIndex];
                    if (cellVal === "-" || cellVal === "" || cellVal == null) continue; 
                    
                    let val = parseInt(cellVal);
                    if (isNaN(val)) continue;

                    let fullDate = `${monthFilter}-${String(d).padStart(2, '0')}`;
                    let key = `${currentRegion}_${fullDate}`;

                    if (!parsedData[key]) {
                        parsedData[key] = { region_name: currentRegion, report_date: fullDate, thanh_toan: 0, xuat_hang: 0, chua_xuat: 0 };
                    }

                    if (phanLoai.includes("thanh toán")) parsedData[key].thanh_toan = val;
                    else if (phanLoai.includes("xuất thực tế")) parsedData[key].xuat_hang = val;
                    else if (phanLoai.includes("chưa xuất")) parsedData[key].chua_xuat = val;
                }
            }

            const [year, month] = monthFilter.split('-');
            const daysInMonth = new Date(year, month, 0).getDate();
            
            const { data: existingData, error: fetchErr } = await window.sb.from('daily_si_reports')
                .select('id, region_name, report_date')
                .gte('report_date', `${monthFilter}-01`)
                .lte('report_date', `${monthFilter}-${daysInMonth}`);
            
            if (fetchErr) throw fetchErr;

            let existingMap = {};
            if (existingData) {
                existingData.forEach(row => { existingMap[`${row.region_name}_${row.report_date}`] = row.id; });
            }

            let toInsert = [];
            let toUpdate = [];

            Object.values(parsedData).forEach(newData => {
                let key = `${newData.region_name}_${newData.report_date}`;
                if (existingMap[key]) {
                    newData.id = existingMap[key]; 
                    toUpdate.push(newData);
                } else {
                    toInsert.push(newData); 
                }
            });

            if (toInsert.length > 0) {
                const { error: insErr } = await window.sb.from('daily_si_reports').insert(toInsert);
                if (insErr) throw insErr;
            }
            if (toUpdate.length > 0) {
                const { error: updErr } = await window.sb.from('daily_si_reports').upsert(toUpdate);
                if (updErr) throw updErr;
            }

            let total = toInsert.length + toUpdate.length;
            if (total > 0) {
                alert(`✅ Đã nhập thành công ${total} bản ghi (${toInsert.length} mới, cập nhật ${toUpdate.length})!`);
            } else {
                alert("⚠️ File Excel không có số liệu hợp lệ mới nào để nhập.");
            }

        } catch (error) {
            console.error(error);
            alert("❌ Lỗi khi xử lý file Excel: " + error.message);
        } finally {
            window.loadSellInData();
        }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = ''; 
};