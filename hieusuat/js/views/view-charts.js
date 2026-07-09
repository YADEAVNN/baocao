export const chartsHTML = `
<div class="p-4 md:p-8 fade-in max-w-[1600px] mx-auto space-y-6">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 class="text-xl md:text-2xl font-black text-slate-800 uppercase whitespace-nowrap" data-i18n="title_charts">5. Phân Tích Tổng Quan</h1>
        </div>
        <div class="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <button onclick="window.exportOverviewExcel()" class="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase shadow-lg hover:bg-green-700 transition flex items-center gap-2 whitespace-nowrap">
                <i class="fa-solid fa-file-excel"></i> Xuất Excel
            </button>
        </div>
    </div>

    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4 items-end">
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block">Từ Ngày</label>
                <input type="date" id="ov_filter_date_from" onchange="window.filterOverview()" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-blue-50 border-blue-100 text-blue-700 cursor-pointer">
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block">Đến Ngày</label>
                <input type="date" id="ov_filter_date_to" onchange="window.filterOverview()" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-blue-50 border-blue-100 text-blue-700 cursor-pointer">
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_director">Giám Đốc Miền</label>
                <select id="ov_filter_director" onchange="window.updateOVFilters('director')" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-slate-700"></select>
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_sale">Quản Lý Vùng (Sale)</label>
                <select id="ov_filter_sale" onchange="window.updateOVFilters('sale')" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-slate-700"></select>
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_svn">Mã SVN</label>
                <select id="ov_filter_svn" onchange="window.updateOVFilters('svn')" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-purple-700"></select>
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-[#F97316] font-black uppercase mb-1.5 block" data-i18n="lbl_shop">Cửa Hàng (Shop)</label>
                <select id="ov_filter_shop" onchange="window.filterOverview()" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-orange-50/50 shadow-sm border-orange-200 text-orange-800"></select>
            </div>
            <div class="xl:col-span-1">
                <button onclick="window.resetOverviewFilters()" class="w-full bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-200 transition border border-gray-200 flex items-center justify-center gap-2" title="Làm mới bộ lọc">
                    <i class="fa-solid fa-rotate-right"></i> <span data-i18n="btn_reset_filter">Làm Mới</span>
                </button>
            </div>
        </div>
    </div>

    <div class="grid grid-cols-2 md:grid-cols-6 gap-4">
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-red-500">
            <p class="text-[10px] text-gray-500 font-bold uppercase mb-1" data-i18n="lbl_revenue">Doanh Thu</p>
            <h3 id="ov_rev" class="text-xl md:text-2xl font-black text-red-600 truncate">0đ</h3>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-[#F97316]">
            <p class="text-[10px] text-gray-500 font-bold uppercase mb-1" data-i18n="lbl_total_so">Tổng Xe Bán (S.O)</p>
            <h3 id="ov_so" class="text-xl md:text-2xl font-black text-[#F97316] truncate">0</h3>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-green-500">
            <p class="text-[10px] text-gray-500 font-bold uppercase mb-1" data-i18n="lbl_natural">Khách Offline</p>
            <h3 id="ov_natural" class="text-xl md:text-2xl font-black text-green-600 truncate">0</h3>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-purple-500">
            <p class="text-[10px] text-gray-500 font-bold uppercase mb-1" data-i18n="lbl_leads">Khách Online</p>
            <h3 id="ov_leads" class="text-xl md:text-2xl font-black text-purple-600 truncate">0</h3>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-blue-500">
            <p class="text-[10px] text-gray-500 font-bold uppercase mb-1" data-i18n="lbl_total_traffic">Tổng Lượt Khách</p>
            <h3 id="ov_traffic" class="text-xl md:text-2xl font-black text-blue-600 truncate">0</h3>
        </div>
        <div class="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 border-b-4 border-b-teal-500">
            <p class="text-[10px] text-gray-500 font-bold uppercase mb-1" data-i18n="lbl_rate">Tỷ lệ chốt</p>
            <h3 id="ov_rate" class="text-xl md:text-2xl font-black text-teal-600 truncate">0%</h3>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 mb-6">
        <div class="bg-indigo-50 p-4 rounded-2xl shadow-sm border border-indigo-100">
            <p class="text-[10px] text-indigo-500 font-bold uppercase mb-1" data-i18n="lbl_total_mkt">Tổng Chi Phí MKT</p>
            <h3 id="ov_mkt_cost" class="text-xl md:text-2xl font-black text-indigo-700 truncate">0đ</h3>
        </div>
        <div class="bg-rose-50 p-4 rounded-2xl shadow-sm border border-rose-100">
            <p class="text-[10px] text-rose-500 font-bold uppercase mb-1" data-i18n="lbl_cpl">Chi phí / Khách (CPL)</p>
            <h3 id="ov_cpl" class="text-xl md:text-2xl font-black text-rose-700 truncate">0đ</h3>
        </div>
        <div class="bg-fuchsia-50 p-4 rounded-2xl shadow-sm border border-fuchsia-100">
            <p class="text-[10px] text-fuchsia-500 font-bold uppercase mb-1" data-i18n="lbl_cps">Chi phí / Xe (CPS)</p>
            <h3 id="ov_cps" class="text-xl md:text-2xl font-black text-fuchsia-700 truncate">0đ</h3>
        </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 xl:col-span-2">
            <h3 class="text-sm font-black text-slate-700 mb-4 uppercase"><i class="fa-solid fa-chart-line text-blue-500 mr-2"></i>Xu hướng Bán Hàng</h3>
            <div class="h-64 w-full"><canvas id="chart_TrendSO"></canvas></div>
        </div>
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-sm font-black text-slate-700 mb-4 uppercase"><i class="fa-solid fa-trophy text-yellow-500 mr-2"></i>Top Shop</h3>
            <div class="h-64 w-full"><canvas id="chart_TopShop"></canvas></div>
        </div>
        
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 xl:col-span-3">
            <h3 class="text-sm font-black text-slate-700 mb-4 uppercase">
                <i class="fa-solid fa-chart-area text-indigo-500 mr-2"></i><span data-i18n="lbl_roi_chart">Hiệu Quả Truyền Thông (View vs Khách)</span>
            </h3>
            <div class="h-64 w-full"><canvas id="chart_MediaROI"></canvas></div>
        </div>

        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-sm font-black text-slate-700 mb-4 uppercase">
                <i class="fa-solid fa-motorcycle text-[#F97316] mr-2"></i><span data-i18n="lbl_top_qty">Top Mẫu Xe (Theo Số Lượng)</span>
            </h3>
            <div class="h-64 w-full"><canvas id="chart_TopModelsQty"></canvas></div>
        </div>
        
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-sm font-black text-slate-700 mb-4 uppercase">
                <i class="fa-solid fa-money-bill-trend-up text-red-500 mr-2"></i><span data-i18n="lbl_top_rev">Top Mẫu Xe (Theo Doanh Thu)</span>
            </h3>
            <div class="h-64 w-full"><canvas id="chart_TopModels"></canvas></div>
        </div>
        
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
            <h3 class="text-sm font-black text-slate-700 mb-4 uppercase">
                <i class="fa-solid fa-users-rays text-purple-500 mr-2"></i><span data-i18n="lbl_traffic_src">Tỷ Lệ Nguồn Khách</span>
            </h3>
            <div class="h-64 w-full"><canvas id="chart_TrafficSource"></canvas></div>
        </div>
    </div>

    <div class="hidden bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <h3 class="text-sm font-black text-slate-700 mb-4 uppercase"><i class="fa-solid fa-table-cells text-slate-500 mr-2"></i>Bảng Hiệu Suất Cửa Hàng</h3>
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                        <th class="p-4" data-i18n="lbl_shop">Cửa Hàng (Shop)</th>
                        <th class="p-4 text-right text-red-600" data-i18n="lbl_revenue">Doanh Thu</th>
                        <th class="p-4 text-center text-[#F97316]" data-i18n="lbl_total_so">Tổng S.O</th>
                        <th class="p-4 text-center text-green-600" data-i18n="lbl_natural">Khách Offline</th>
                        <th class="p-4 text-center text-purple-600" data-i18n="lbl_leads">Khách Online</th>
                        <th class="p-4 text-center text-blue-600" data-i18n="lbl_total_traffic">Tổng Khách</th>
                        <th class="p-4 text-center text-teal-600" data-i18n="lbl_rate">Tỷ Lệ Chốt</th>
                    </tr>
                </thead>
                <tbody id="body_HeatmapSO" class="divide-y divide-gray-100"></tbody>
            </table>
        </div>
    </div>
</div>
`;