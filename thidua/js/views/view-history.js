export const historyHTML = `
<div class="p-4 md:p-8 fade-in max-w-full mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 class="text-xl md:text-2xl font-black text-slate-800 uppercase whitespace-nowrap">2. Lịch sử báo cáo S.O</h1>
            <p class="text-sm font-bold text-gray-500 mt-1">Quản lý và kiểm soát số lượng Sell-Out dạng Ma trận (Matrix)</p>
        </div>
        <div class="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <button onclick="window.showMissingReportsModal()" class="bg-red-500 text-white px-6 py-3 rounded-xl font-black text-sm uppercase shadow-lg hover:bg-red-600 transition flex items-center gap-2 whitespace-nowrap">
                <i class="fa-solid fa-triangle-exclamation text-lg"></i> Cảnh Báo Thiếu Số
            </button>
            <button onclick="window.exportHistoryExcel()" class="bg-green-600 text-white px-6 py-3 rounded-xl font-black text-sm uppercase shadow-lg hover:bg-green-700 transition flex items-center gap-2 whitespace-nowrap">
                <i class="fa-solid fa-file-excel text-lg"></i> Xuất Excel S.O
            </button>
        </div>
    </div>

    <!-- KHỐI BỘ LỌC -->
    <div class="bg-white p-6 rounded-3xl shadow-sm border border-gray-200 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 items-end">
            <div class="xl:col-span-1">
                <label class="text-xs font-black text-slate-500 uppercase mb-2 block">Tháng báo cáo</label>
                <input type="month" id="history_month_filter" onchange="window.applyHistoryFilter()" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-[#F97316] uppercase">
            </div>
            <div class="xl:col-span-1">
                <label class="text-xs font-black text-slate-500 uppercase mb-2 block">Giám Đốc Miền</label>
                <select id="history_filter_director" onchange="window.updateHistoryFilters('director')" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-[#F97316]"></select>
            </div>
            <div class="xl:col-span-1">
                <label class="text-xs font-black text-slate-500 uppercase mb-2 block">Quản lý vùng (Sale)</label>
                <select id="history_filter_sale" onchange="window.updateHistoryFilters('sale')" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-[#F97316]"></select>
            </div>
            <div class="xl:col-span-1">
                <label class="text-xs font-black text-slate-500 uppercase mb-2 block">Mã SVN</label>
                <select id="history_filter_svn" onchange="window.updateHistoryFilters('svn')" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-slate-800 outline-none focus:border-[#F97316]"></select>
            </div>
            <div class="xl:col-span-1 flex items-end">
                <button onclick="window.resetHistoryFilters()" class="w-full bg-gray-100 text-gray-600 px-4 py-3 rounded-xl font-black text-sm shadow-sm hover:bg-gray-200 transition border border-gray-200 flex items-center justify-center gap-2">
                    <i class="fa-solid fa-rotate-right"></i> Bỏ Lọc
                </button>
            </div>
        </div>
    </div>

    <!-- KHỐI BẢNG DỮ LIỆU S.O (DẠNG MA TRẬN) -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden relative">
        <p class="text-[10px] text-gray-400 font-bold p-3 bg-gray-50 border-b border-gray-100 italic">💡 Bấm vào ô có số liệu màu cam để chỉnh sửa/xóa báo cáo của ngày đó.</p>
        <div class="overflow-x-auto" id="historyTableContainer">
            <!-- Bảng ma trận sẽ được JS đổ vào đây -->
        </div>
    </div>

    <!-- MODAL HIỂN THỊ DANH SÁCH NHẬP THIẾU -->
    <div id="missingReportModal" class="fixed inset-0 z-[100] bg-gray-900/80 hidden items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div class="p-4 flex justify-between items-center border-b border-gray-100 bg-red-50">
                <h3 class="text-lg font-black text-red-600 uppercase flex items-center gap-2">
                    <i class="fa-solid fa-triangle-exclamation"></i> CẢNH BÁO KỶ LUẬT BÁO CÁO
                </h3>
                <button onclick="window.closeMissingReportsModal()" class="w-8 h-8 rounded-full bg-white text-gray-500 hover:text-red-500 hover:bg-red-100 transition shadow-sm">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            <div class="p-6 overflow-y-auto bg-red-50/30 flex-1">
                <div id="missingReportContent" class="text-sm font-medium text-red-800 space-y-4 whitespace-pre-wrap leading-relaxed">
                </div>
            </div>
            <div class="p-4 border-t border-gray-100 bg-white flex justify-end gap-3">
                <button onclick="window.closeMissingReportsModal()" class="px-6 py-2.5 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200 transition">Đóng lại</button>
                <button onclick="window.copyMissingReports()" class="px-6 py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition flex items-center gap-2 shadow-lg">
                    <i class="fa-regular fa-copy"></i> COPY GỬI ZALO GROUP
                </button>
            </div>
        </div>
    </div>
</div>
`;