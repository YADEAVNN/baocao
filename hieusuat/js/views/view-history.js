export const historyHTML = `
<div class="p-4 md:p-8 fade-in max-w-[1600px] mx-auto">
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
            <h1 class="text-xl md:text-2xl font-black text-slate-800 uppercase whitespace-nowrap" data-i18n="title_history">4. Lịch sử báo cáo</h1>
        </div>
        <div class="flex flex-wrap gap-2 w-full md:w-auto items-center">
            <button onclick="window.downloadCRMTemplate()" id="btn_download_template" class="hidden bg-blue-600 text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-blue-700 transition flex items-center gap-2 whitespace-nowrap">
                <i class="fa-solid fa-download"></i> Tải Mẫu
            </button>
            <input type="file" id="import_crm_excel" accept=".xlsx, .xls" class="hidden" onchange="window.handleImportCRMExcel(event)">
            <button onclick="document.getElementById('import_crm_excel').click()" id="btn_import_excel" class="hidden bg-[#F97316] text-white px-5 py-3 rounded-xl font-bold text-sm shadow-lg hover:bg-orange-600 transition flex items-center gap-2 whitespace-nowrap">
                <i class="fa-solid fa-upload"></i> Nhập Excel
            </button>
            <button onclick="window.exportHistoryExcel()" class="bg-green-600 text-white px-6 py-3 rounded-xl font-bold text-sm uppercase shadow-lg hover:bg-green-700 transition flex items-center gap-2 whitespace-nowrap">
                <i class="fa-solid fa-file-excel"></i> Xuất Excel
            </button>
        </div>
    </div>

    <div class="bg-white p-5 rounded-2xl shadow-sm border border-gray-200 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-7 gap-4 items-end">
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_month">Tháng</label>
                <input type="month" id="history_month_filter" onchange="window.applyHistoryFilter()" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-blue-50 border-blue-100 text-blue-700 uppercase">
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_director">Giám Đốc</label>
                <select id="history_filter_director" onchange="window.updateHistoryFilters('director')" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-slate-700"></select>
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_sale">Sale</label>
                <select id="history_filter_sale" onchange="window.updateHistoryFilters('sale')" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-slate-700"></select>
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_svn">Mã SVN</label>
                <select id="history_filter_svn" onchange="window.updateHistoryFilters('svn')" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-purple-700"></select>
            </div>
            <div class="xl:col-span-1">
                <label class="text-[11px] text-[#F97316] font-black uppercase mb-1.5 block" data-i18n="lbl_shop">Cửa Hàng (Shop)</label>
                <select id="history_filter_shop" onchange="window.applyHistoryFilter()" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-orange-50/50 shadow-sm border-orange-200 text-orange-800"></select>
            </div>
            <div class="xl:col-span-1 hidden" id="history_status_container">
                <label class="text-[11px] text-gray-500 font-black uppercase mb-1.5 block" data-i18n="lbl_status">Trạng Thái CRM</label>
                <select id="history_status_filter" onchange="window.applyHistoryFilter()" class="form-input py-2.5 px-3 text-sm font-bold w-full bg-gray-50 shadow-sm border-gray-200 text-gray-700">
                    <option value="">-- Tất cả --</option>
                    <option value="Đã mua xe">✅ Đã chốt</option>
                    <option value="Đang phân vân">🤔 Chưa chốt</option>
                    <option value="Không mua">❌ Không mua</option>
                </select>
            </div>
            <div class="xl:col-span-1">
                <button onclick="window.resetHistoryFilters()" class="w-full bg-gray-100 text-gray-600 px-4 py-2.5 rounded-xl font-bold text-sm shadow-sm hover:bg-gray-200 transition border border-gray-200 flex items-center justify-center gap-2" title="Làm mới bộ lọc">
                    <i class="fa-solid fa-rotate-right"></i> <span data-i18n="btn_reset_filter">Làm Mới</span>
                </button>
            </div>
        </div>
    </div>

    <div class="flex gap-4 mb-4 border-b border-gray-200">
        <button onclick="switchHistoryTab('so')" id="htab-so" class="px-4 py-2 border-b-2 border-orange-500 text-orange-600 font-bold uppercase text-xs" data-i18n="sub_tab_so">Báo Cáo S.O</button>
        <button onclick="switchHistoryTab('media')" id="htab-media" class="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-slate-800 font-bold uppercase text-xs" data-i18n="sub_tab_media">Truyền Thông</button>
        <button onclick="switchHistoryTab('crm')" id="htab-crm" class="px-4 py-2 border-b-2 border-transparent text-gray-500 hover:text-slate-800 font-bold uppercase text-xs" data-i18n="sub_tab_crm">Khách Hàng</button>
    </div>

    <div id="hcontent-so" class="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-100/80 border-b border-gray-200 font-bold text-slate-600">
                    <tr>
                        <th class="p-4 uppercase text-[10px] w-24">Ngày S.O</th>
                        <th class="p-4 uppercase text-[10px]" data-i18n="lbl_shop">Shop</th>
                        <th class="p-4 uppercase text-[10px] text-center text-green-600" data-i18n="lbl_natural">Khách Offline</th>
                        <th class="p-4 uppercase text-[10px] text-center text-purple-600" data-i18n="lbl_leads">Khách Online</th>
                        <th class="p-4 uppercase text-[10px] text-center text-orange-600" data-i18n="lbl_total_so">Tổng Xe (S.O)</th>
                        <th class="p-4 uppercase text-[10px] text-center w-24">Thao Tác</th>
                    </tr>
                </thead>
                <tbody id="historyBodySO" class="divide-y divide-gray-100"></tbody>
            </table>
        </div>
    </div>

    <div id="hcontent-media" class="hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-100/80 border-b border-gray-200 font-bold text-slate-600">
                    <tr>
                        <th class="p-4 uppercase text-[10px] w-24">Ngày</th>
                        <th class="p-4 uppercase text-[10px] text-center" data-i18n="lbl_video_content">Nội Dung Video</th>
                        <th class="p-4 uppercase text-[10px] text-center" data-i18n="lbl_tiktok_qty">Video TikTok</th>
                        <th class="p-4 uppercase text-[10px] text-center" data-i18n="lbl_views">Lượt View</th>
                        <th class="p-4 uppercase text-[10px] text-center text-red-600" data-i18n="lbl_cost">Chi Phí</th>
                        <th class="p-4 uppercase text-[10px]" data-i18n="lbl_tiktok_link">Link Nguồn</th>
                        <th class="p-4 uppercase text-[10px] text-center w-20">Thao tác</th>
                    </tr>
                </thead>
                <tbody id="historyBodyMedia" class="divide-y divide-gray-100"></tbody>
            </table>
        </div>
    </div>

    <div id="hcontent-crm" class="hidden bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
                <thead class="bg-gray-100/80 border-b border-gray-200 font-bold text-slate-600">
                    <tr>
                        <th class="p-4 uppercase text-[10px] w-24">Ngày</th>
                        <th class="p-4 uppercase text-[10px]" data-i18n="lbl_cus_name">Khách Hàng</th>
                        <th class="p-4 uppercase text-[10px]" data-i18n="lbl_phone">SĐT</th>
                        <th class="p-4 uppercase text-[10px]" data-i18n="lbl_model">Mẫu Xe</th>
                        <th class="p-4 uppercase text-[10px]" data-i18n="lbl_note">Ghi chú</th>
                        <th class="p-4 uppercase text-[10px] text-center" data-i18n="lbl_status">Trạng Thái</th>
                        <th class="p-4 uppercase text-[10px] text-center w-20">Thao tác</th>
                    </tr>
                </thead>
                <tbody id="historyBodyCRM" class="divide-y divide-gray-100"></tbody>
            </table>
        </div>
    </div>
</div>
`;