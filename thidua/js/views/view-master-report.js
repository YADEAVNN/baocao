// File: js/views/view-master-report.js

export const masterReportHTML = `
<div class="p-4 md:p-6 fade-in w-full mx-auto max-w-[1500px]">
    <!-- Màn hình khóa nếu không phải Admin -->
    <div id="master_access_denied" class="hidden text-center mt-32">
        <div class="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <i class="fa-solid fa-lock text-4xl"></i>
        </div>
        <h2 class="text-2xl font-black text-slate-800 uppercase tracking-tight">Khu vực bảo mật cấp cao</h2>
        <p class="text-sm font-bold text-gray-500 mt-2">Chỉ Quản trị viên (Admin) mới có quyền truy cập Data Nguồn.</p>
    </div>

    <!-- Nội dung chính dành cho Admin -->
    <div id="master_admin_panel" class="hidden">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 class="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">DATA NGUỒN TỔNG HỢP</h1>
                <p class="text-sm font-bold text-blue-600 mt-1 uppercase">Báo cáo hợp nhất S.I & S.O kèm Dự báo cuối tháng</p>
            </div>
            
            <div class="flex items-center gap-3 bg-white p-2 rounded-2xl shadow-sm border border-slate-200">
                <input type="month" id="master_month_filter" onchange="window.loadMasterData()" class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-black text-slate-800 outline-none focus:border-blue-500 cursor-pointer">
                <button onclick="window.loadMasterData()" class="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl font-black text-sm uppercase hover:bg-blue-200 transition shadow-sm">
                    <i class="fa-solid fa-rotate-right"></i>
                </button>
                <button onclick="window.exportMasterExcel()" class="bg-green-600 text-white px-5 py-2 rounded-xl font-black text-sm uppercase hover:bg-green-700 transition shadow-sm flex items-center gap-2">
                    <i class="fa-solid fa-file-excel"></i> Xuất File Tổng
                </button>
            </div>
        </div>

        <div class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden fade-in">
            <div class="overflow-x-auto custom-scrollbar max-h-[70vh]">
                <table class="w-full text-center whitespace-nowrap border-collapse">
                    <thead class="bg-gray-800 text-white font-black text-xs uppercase sticky top-0 z-20">
                        <tr>
                            <th rowspan="2" class="p-3 border-r border-gray-600 sticky left-0 bg-gray-800 z-30">Khu Vực</th>
                            <th rowspan="2" class="p-3 border-r border-gray-600">Giám Đốc</th>
                            <th rowspan="2" class="p-3 border-r border-gray-600">Sale</th>
                            <th colspan="4" class="p-2 border-r border-gray-600 bg-blue-900">SELL-IN (PHÁT HÀNG)</th>
                            <th colspan="4" class="p-2 bg-green-900">SELL-OUT (BÁN RA)</th>
                        </tr>
                        <tr class="text-[10px] text-gray-300">
                            <th class="p-2 border-r border-gray-600 bg-blue-800">Target</th>
                            <th class="p-2 border-r border-gray-600 bg-blue-800">Thực đạt</th>
                            <th class="p-2 border-r border-gray-600 bg-blue-800">% HT</th>
                            <th class="p-2 border-r border-gray-600 bg-blue-700 text-white">Dự báo (FC)</th>
                            
                            <th class="p-2 border-r border-gray-600 bg-green-800">Target</th>
                            <th class="p-2 border-r border-gray-600 bg-green-800">Thực đạt</th>
                            <th class="p-2 border-r border-gray-600 bg-green-800">% HT</th>
                            <th class="p-2 bg-green-700 text-white">Dự báo (FC)</th>
                        </tr>
                    </thead>
                    <tbody id="master_table_body" class="divide-y divide-gray-100 text-sm font-medium text-slate-700">
                        <!-- Data sẽ được đổ vào đây -->
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
`;

// Logic Tải Dữ liệu
window.loadMasterData = async () => {
    // 1. Kiểm tra quyền Admin
    const user = window.STATE?.currentUser;
    if (!user || user.role !== 'Admin') {
        document.getElementById('master_access_denied').classList.remove('hidden');
        document.getElementById('master_admin_panel').classList.add('hidden');
        return;
    } else {
        document.getElementById('master_access_denied').classList.add('hidden');
        document.getElementById('master_admin_panel').classList.remove('hidden');
    }

    const monthInput = document.getElementById('master_month_filter').value;
    if (!monthInput) return;

    const tbody = document.getElementById('master_table_body');
    tbody.innerHTML = '<tr><td colspan="11" class="p-10 text-gray-400 font-bold"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tổng hợp Data Nguồn...</td></tr>';

    try {
        // GỌI DATA TỪ VIEW TRÊN SUPABASE (Đã bổ sung bộ lọc tháng và SẮP XẾP)
        const { data: masterData, error } = await window.sb
            .from('master_sales_report')
            .select('*')
            .eq('report_month', monthInput)              // Lọc theo tháng
            .order('khu_vuc', { ascending: true })       // Sắp xếp ưu tiên 1: Khu vực
            .order('director_name', { ascending: true }) // Sắp xếp ưu tiên 2: Giám đốc
            .order('sale_name', { ascending: true });    // Sắp xếp ưu tiên 3: Tên Sale

        if (error) throw error;

        // --- BẮT ĐẦU ĐOẠN LOGIC TÍNH DỰ BÁO THÔNG MINH ---
        const [yearStr, monthStr] = monthInput.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        
        // Tính tổng số ngày của tháng được chọn (Ví dụ: Tháng 7 có 31 ngày)
        const daysInMonth = new Date(year, month, 0).getDate();
        
        const today = new Date();
        let daysPassed = daysInMonth; // Mặc định giả sử đã hết tháng (Dành cho tháng cũ)

        // Nếu người dùng đang xem báo cáo của chính tháng hiện tại
        if (year === today.getFullYear() && month === today.getMonth() + 1) {
            daysPassed = today.getDate(); // Chỉ tính đến ngày hôm nay
            if (daysPassed === 0) daysPassed = 1; // Tránh chia cho 0 vào ngày mùng 1 đầu tháng
        }
        // --- KẾT THÚC ĐOẠN LOGIC TÍNH NGÀY ---

        if (masterData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="11" class="p-10 text-gray-400 font-bold">Chưa có dữ liệu cho tháng này</td></tr>';
            return;
        }

        // Cập nhật lại masterData để gài số Forecast mới tính vào mảng, phục vụ cho xuất Excel
        const processedData = masterData.map(row => {
            const actual_si = Number(row.actual_si || 0);
            const actual_so = Number(row.actual_so || 0);
            
            // Công thức: (Thực đạt / Số ngày đã qua) * Tổng ngày trong tháng
            row.smart_forecast_si = Math.round((actual_si / daysPassed) * daysInMonth);
            row.smart_forecast_so = Math.round((actual_so / daysPassed) * daysInMonth);
            
            return row;
        });

        // Lưu vào biến toàn cục để lát xuất Excel
        window.STATE.currentMasterData = processedData;

        // Render ra bảng với biến smart_forecast mới
        tbody.innerHTML = processedData.map((row, i) => `
            <tr class="hover:bg-slate-50 transition ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}">
                <td class="p-3 border-r border-gray-100 sticky left-0 font-bold text-slate-800 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'} z-10">${row.khu_vuc || '---'}</td>
                <td class="p-3 border-r border-gray-100 text-gray-500">${row.director_name || '---'}</td>
                <td class="p-3 border-r border-gray-100 font-bold">${row.sale_name || '---'}</td>
                
                <td class="p-3 border-r border-gray-100 bg-blue-50/30">${row.target_si || 0}</td>
                <td class="p-3 border-r border-gray-100 font-bold text-blue-600 bg-blue-50/50">${row.actual_si || 0}</td>
                <td class="p-3 border-r border-gray-100 text-blue-500">${row.percent_si || 0}%</td>
                <td class="p-3 border-r border-gray-200 font-black text-blue-700 bg-blue-100/50">${row.smart_forecast_si}</td>
                
                <td class="p-3 border-r border-gray-100 bg-green-50/30">${row.target_so || 0}</td>
                <td class="p-3 border-r border-gray-100 font-bold text-green-600 bg-green-50/50">${row.actual_so || 0}</td>
                <td class="p-3 border-r border-gray-100 text-green-500">${row.percent_so || 0}%</td>
                <td class="p-3 font-black text-green-700 bg-green-100/50">${row.smart_forecast_so}</td>
            </tr>
        `).join('');

    } catch (err) {
        tbody.innerHTML = `<tr><td colspan="11" class="p-10 text-red-500 font-bold">Lỗi: ${err.message}</td></tr>`;
    }
};

// Logic Xuất Excel siêu nhanh
window.exportMasterExcel = () => {
    const data = window.STATE.currentMasterData;
    if (!data || data.length === 0) return alert("Không có dữ liệu để xuất!");

    // Map lại tên cột cho đẹp để gửi Sếp
    const excelData = data.map(row => ({
        "Khu Vực": row.khu_vuc,
        "Giám Đốc": row.director_name,
        "Chiến Binh (Sale)": row.sale_name,
        "Target S.I": row.target_si,
        "Thực Đạt S.I": row.actual_si,
        "% Hoàn Thành S.I": (row.percent_si || 0) + "%",
        "DỰ BÁO S.I CUỐI THÁNG": row.smart_forecast_si,
        "Target S.O": row.target_so,
        "Thực Đạt S.O": row.actual_so,
        "% Hoàn Thành S.O": (row.percent_so || 0) + "%",
        "DỰ BÁO S.O CUỐI THÁNG": row.smart_forecast_so
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Master_Data");
    
    const month = document.getElementById('master_month_filter').value;
    XLSX.writeFile(wb, `Bao_Cao_Tong_Hop_Master_${month}.xlsx`);
};