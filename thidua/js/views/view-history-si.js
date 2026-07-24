export const historySiHTML = `
<div class="p-4 md:p-6 fade-in max-w-[1400px] mx-auto pb-20">
    <!-- Header -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h2 class="text-2xl font-black text-slate-800 uppercase tracking-tight">2. LỊCH SỬ BÁO CÁO S.I</h2>
            <p class="text-sm text-gray-500 mt-1">Quản lý và kiểm soát số lượng Thanh toán & Xuất hàng dạng Ma trận (Matrix)</p>
        </div>
        <div class="flex gap-2">
            <button onclick="window.showMissingReportsModalSI()" class="bg-red-500 hover:bg-red-600 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors text-xs flex items-center uppercase tracking-wider">
                <i class="fa-solid fa-triangle-exclamation mr-2"></i> Cảnh báo thiếu số
            </button>
            <button onclick="window.exportHistorySIExcel()" class="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-sm transition-colors text-xs flex items-center uppercase tracking-wider">
                <i class="fa-solid fa-file-excel mr-2"></i> Xuất Excel S.I
            </button>
        </div>
    </div>

    <!-- Bộ lọc -->
    <div class="bg-white rounded-2xl p-4 md:p-6 shadow-sm border border-slate-200 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-2">Tháng báo cáo</label>
                <input type="month" id="filter_month_si" class="form-input bg-gray-50 text-sm py-2" onchange="window.loadHistorySIData()">
            </div>
            <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-2">Giám đốc miền</label>
                <select id="filter_rsm_si" class="form-input bg-gray-50 text-sm py-2"><option value="">-- Tất cả GĐ --</option></select>
            </div>
            <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-2">Quản lý vùng (SALE)</label>
                <select id="filter_sale_si" class="form-input bg-gray-50 text-sm py-2"><option value="">-- Tất cả NVKD --</option></select>
            </div>
            <div>
                <label class="block text-[10px] font-bold text-gray-400 uppercase mb-2">Mã SVN</label>
                <select id="filter_svn_si" class="form-input bg-gray-50 text-sm py-2"><option value="">-- Tất cả SVN --</option></select>
            </div>
            <div class="flex items-end">
                <button onclick="window.loadHistorySIData()" class="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2 px-4 rounded-xl transition-colors border border-slate-300 h-[42px] flex items-center justify-center">
                    <i class="fa-solid fa-rotate-right mr-2"></i> Bộ lọc
                </button>
            </div>
        </div>
    </div>

    <!-- Bảng Ma Trận -->
    <div class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="p-4 bg-blue-50/50 border-b border-blue-100 text-[11px] text-blue-600 font-bold">
            <i class="fa-solid fa-lightbulb text-yellow-500 mr-1"></i> Bấm vào ô có số liệu màu xanh để chỉnh sửa/xóa báo cáo S.I của ngày đó.
        </div>
        <div class="overflow-x-auto custom-scrollbar">
            <table class="w-full text-center text-xs whitespace-nowrap">
                <thead class="bg-gray-50 text-slate-500 font-bold border-b border-gray-200" id="si_matrix_head">
                    <!-- Javascript sẽ vẽ các ngày 1->31 vào đây -->
                </thead>
                <tbody id="si_matrix_body" class="divide-y divide-gray-100">
                    <tr><td colspan="34" class="p-8 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải ma trận S.I...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
`;