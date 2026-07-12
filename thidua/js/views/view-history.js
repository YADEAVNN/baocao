export const historyHTML = `
<div class="p-4 md:p-8 fade-in max-w-[1200px] mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 class="text-xl md:text-2xl font-black text-slate-800 uppercase whitespace-nowrap">2. Lịch sử báo cáo S.O</h1>
            <p class="text-sm font-bold text-gray-500 mt-1">Quản lý và kiểm soát số lượng Sell-Out đã nhập</p>
        </div>
        <div class="flex flex-wrap gap-2 w-full md:w-auto items-center">
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

    <!-- KHỐI BẢNG DỮ LIỆU S.O -->
    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead class="bg-[#F8FAFC] border-b border-gray-200 font-black text-slate-500">
                    <tr>
                        <th class="p-5 uppercase text-xs w-40">Ngày Thực Hiện</th>
                        <th class="p-5 uppercase text-xs">Đại Lý / Cửa hàng</th>
                        <th class="p-5 uppercase text-xs text-center text-[#F97316]">Tổng Số Sell-Out</th>
                        <th class="p-5 uppercase text-xs text-center w-28">Thao Tác</th>
                    </tr>
                </thead>
                <tbody id="historyBodySO" class="divide-y divide-gray-100">
                    <!-- Dữ liệu đổ vào đây -->
                </tbody>
            </table>
        </div>
    </div>
</div>
`;