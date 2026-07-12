export const targetHTML = `
<div class="p-4 md:p-8 fade-in max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 class="text-xl md:text-2xl font-black text-slate-800 uppercase whitespace-nowrap" data-i18n="title_target">6. Hoàn Thành Tiến Độ</h1>
        </div>
    </div>
    
    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col gap-5 relative mb-6">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-4">
            <div class="flex items-center gap-3 w-full md:w-auto">
                <div class="bg-orange-100 text-[#F97316] p-2.5 rounded-xl"><i class="fa-solid fa-calendar-days text-xl"></i></div>
                <div>
                    <input type="month" id="tgt_filter_month" onchange="window.loadTargetDashboard()" class="form-input py-2 px-3 text-base font-black w-full md:w-auto bg-gray-50 border-gray-200 text-[#F97316] shadow-inner uppercase tracking-wider cursor-pointer">
                </div>
            </div>
            <div class="flex flex-wrap gap-3 w-full md:w-auto">
                <button onclick="window.loadTargetDashboard()" class="flex-1 md:flex-none bg-slate-900 text-white px-6 py-3 rounded-xl font-black text-sm uppercase shadow-lg hover:bg-slate-800 transition flex items-center justify-center gap-2 whitespace-nowrap">
                    <i class="fa-solid fa-bolt text-yellow-400"></i> Tải Tiến Độ
                </button>
                <button onclick="window.showMissingReportsModal()" class="flex-1 md:flex-none bg-red-500 text-white px-6 py-3 rounded-xl font-black text-sm uppercase shadow-lg hover:bg-red-600 transition flex items-center justify-center gap-2 whitespace-nowrap">
                    <i class="fa-solid fa-triangle-exclamation"></i> Cảnh Báo Thiếu Số
                </button>
                <button onclick="window.exportTargetExcel()" class="flex-1 md:flex-none bg-green-600 text-white px-6 py-3 rounded-xl font-black text-sm uppercase shadow-lg hover:bg-green-700 transition flex items-center justify-center gap-2 whitespace-nowrap">
                    <i class="fa-solid fa-file-excel"></i> Xuất Excel
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-6 gap-4 items-end">
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_director">Giám Đốc Miền</label>
                <select id="tgt_filter_director" onchange="window.updateTGTFilters('director')" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-slate-800"></select>
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_sale">Quản Lý Vùng (Sale)</label>
                <select id="tgt_filter_sale" onchange="window.updateTGTFilters('sale')" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-slate-800"></select>
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_svn">Mã SVN</label>
                <select id="tgt_filter_svn" onchange="window.updateTGTFilters('svn')" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-purple-700"></select>
            </div>
            
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block">Lọc Tiến Độ</label>
                <select id="tgt_filter_status" onchange="window.filterTargetDashboard()" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-slate-800">
                    <option value="">-- Tất cả --</option>
                    <option value="stable">✅ Ổn định</option>
                    <option value="delay">⚠️ Chậm tiến độ</option>
                </select>
            </div>

            <div class="xl:col-span-1 relative">
                <label class="text-[11px] text-[#F97316] font-black uppercase mb-1.5 block" data-i18n="lbl_shop">Tìm Cửa Hàng / DVN</label>
                <div class="relative">
                    <input type="text" id="tgt_filter_search" oninput="window.filterTargetDashboard()" placeholder="..." class="form-input py-2.5 pl-10 pr-3 text-sm font-bold w-full bg-orange-50/50 shadow-sm border-orange-200 text-slate-800 focus:border-[#F97316]">
                    <i class="fa-solid fa-magnifying-glass absolute left-3.5 top-1/2 -translate-y-1/2 text-[#F97316]"></i>
                </div>
            </div>

            <div class="xl:col-span-1 flex items-end">
                <button onclick="window.updateTGTFilters('init')" class="w-full bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-200 transition border border-gray-200 flex items-center justify-center gap-2" title="Làm mới bộ lọc">
                    <i class="fa-solid fa-rotate-right"></i> <span data-i18n="btn_reset_filter">Làm Mới</span>
                </button>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-slate-400">
            <p class="text-[11px] text-gray-500 font-black uppercase mb-1" data-i18n="lbl_target_so">Tổng Target S.O</p>
            <h3 id="tgt_sum_target" class="text-3xl md:text-4xl font-black text-slate-800">0</h3>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-[#F97316]">
            <p class="text-[11px] text-[#F97316] font-black uppercase mb-1" data-i18n="lbl_actual_so">Thực Đạt S.O</p>
            <h3 id="tgt_sum_actual" class="text-3xl md:text-4xl font-black text-[#F97316]">0</h3>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-green-500">
            <p class="text-[11px] text-gray-500 font-black uppercase mb-1" data-i18n="lbl_percent_so">% Hoàn Thành S.O</p>
            <h3 id="tgt_sum_percent" class="text-3xl md:text-4xl font-black text-green-600">0%</h3>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-blue-500">
            <p class="text-[11px] text-gray-500 font-black uppercase mb-1" data-i18n="lbl_traffic_ytd">Lượt Khách Đến Nay</p>
            <h3 id="tgt_sum_traffic" class="text-3xl md:text-4xl font-black text-blue-600">0</h3>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-pink-500">
            <p class="text-[11px] text-gray-500 font-black uppercase mb-1" data-i18n="lbl_digital">Video & Livestream</p>
            <h3 id="tgt_sum_digital" class="text-3xl md:text-4xl font-black text-pink-600">0</h3>
        </div>
    </div>

    <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-gray-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                        <th class="p-4" data-i18n="lbl_shop">Cửa Hàng / Mã DVN</th>
                        <th class="p-4 text-center">Mục Tiêu</th>
                        <th class="p-4 text-center">Thực Đạt</th>
                        <th class="p-4 w-48">Tiến Độ S.O (%)</th>
                        <th class="p-4 text-center">Kỷ Luật Báo Cáo (%)</th>
                        <th class="p-4 text-center">Khách (Thực/Mục Tiêu)</th>
                        <th class="p-4 text-center">Digital</th>
                        <th class="p-4 text-center" data-i18n="lbl_status">Trạng Thái</th>
                    </tr>
                </thead>
                <tbody id="body_TargetDashboard" class="divide-y divide-gray-100">
                    <tr>
                        <td colspan="8" class="text-center p-8 text-sm text-gray-400">Nhấn "Tải Tiến Độ" để xem dữ liệu...</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

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