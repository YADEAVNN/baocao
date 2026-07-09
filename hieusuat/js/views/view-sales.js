export const salesHTML = `
<div class="p-4 md:p-8 fade-in max-w-[1600px] mx-auto">
    <div class="flex justify-between items-end mb-4 gap-2">
        <div>
            <h1 id="entryTitle" class="text-xl md:text-2xl font-black text-slate-800 uppercase" data-i18n="title_so">1. Báo Cáo Ngày (S.O)</h1>
        </div>
    </div>
    <div class="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        <div class="xl:col-span-1 bg-white p-5 rounded-2xl shadow-sm border border-slate-200 h-full">
            <input type="hidden" id="editReportId" value="">
            <input type="hidden" id="hidden_shop_code" value="">
            
            <div class="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                <span class="text-lg text-slate-400 font-black">A.</span>
                <h3 class="text-sm font-black text-slate-700 uppercase" data-i18n="lbl_info">Thông Tin</h3>
            </div>
            <div class="space-y-4">
                <input type="date" id="so_daily_date" required class="form-input font-bold bg-blue-50 text-blue-700">
                
                <div class="bg-blue-50 border border-blue-200 p-3 rounded-xl flex items-center gap-3 shadow-sm">
                     <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white shrink-0">
                         <i class="fa-solid fa-store"></i>
                     </div>
                     <div class="flex-1 overflow-hidden">
                          <p class="text-[10px] uppercase font-bold text-blue-500" id="display_prov_svn">Đang tải...</p>
                          <select id="select_shop_so" onchange="window.changeInputShop(this.value)" class="w-full bg-transparent font-black text-slate-800 text-sm outline-none cursor-pointer truncate">
                              <option value="">Vui lòng đợi...</option>
                          </select>
                     </div>
                </div>
                
                <div class="grid grid-cols-2 gap-3 pt-2">
                    <div class="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                        <label class="block text-[10px] font-black text-green-600 mb-1" data-i18n="lbl_natural">Khách Offline</label>
                        <input type="number" id="traffic_natural" class="w-full bg-transparent text-2xl font-black text-green-700 outline-none text-center" placeholder="0">
                    </div>
                    <div class="bg-purple-50 p-3 rounded-xl border border-purple-100 text-center">
                        <label class="block text-[10px] font-black text-purple-600 mb-1" data-i18n="lbl_leads">Khách Online</label>
                        <input type="number" id="traffic_leads" class="w-full bg-transparent text-2xl font-black text-purple-700 outline-none text-center" placeholder="0">
                    </div>
                </div>

                <div class="p-4 bg-orange-50 border border-orange-200 rounded-xl mt-2 text-center shadow-sm flex flex-col justify-center">
                    <label class="form-label text-orange-700 mb-1" data-i18n="lbl_total_so">TỔNG XE BÁN (S.O)</label>
                    <input type="text" id="sold_quantity" readonly class="w-full bg-transparent text-center text-4xl font-black text-orange-600 outline-none mb-2" placeholder="0">
                    <div class="border-t border-orange-200 pt-2 mt-auto">
                        <p class="text-[10px] font-black text-orange-500 uppercase" data-i18n="lbl_est_revenue">Ước tính Doanh Thu</p>
                        <p id="total_so_revenue" class="text-lg font-black text-orange-800">0đ</p>
                    </div>
                </div>
            </div>
        </div>

        <div class="xl:col-span-3 bg-white p-5 rounded-2xl shadow-sm border border-orange-200 xl:h-full relative">
            <div id="editBanner" class="hidden absolute -top-3 right-4 bg-[#F97316] text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase shadow">Đang chỉnh sửa</div>
            <div class="absolute top-0 left-0 w-1 h-full bg-[#F97316] rounded-l-2xl"></div>
            
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 gap-2 pl-2">
                <div>
                    <h3 class="text-lg font-black text-slate-800 uppercase flex items-center gap-2">
                        <i class="fa-solid fa-list-ol text-orange-600"></i> <span data-i18n="lbl_detail">Chi Tiết</span>
                    </h3>
                    <p class="text-[11px] text-gray-500 uppercase font-bold tracking-wide" data-i18n="msg_click_add">Nhấn nút bên dưới để thêm xe.</p>
                </div>
            </div>

            <div class="bg-slate-50 rounded-xl border border-gray-200 p-3 min-h-[200px]">
                <div id="salesDetailContainer" class="flex flex-col gap-3 mb-4"></div>
                <button type="button" onclick="addCustomSaleRow()" class="w-full bg-white text-orange-600 border-2 border-dashed border-orange-300 py-4 rounded-xl font-black uppercase hover:border-orange-500 transition flex items-center justify-center gap-2">
                    <i class="fa-solid fa-plus-circle text-xl"></i> <span data-i18n="btn_add_model">THÊM MẪU XE</span>
                </button>
            </div>

            <div class="mt-6 flex gap-2">
                <button type="button" onclick="submitDailySO()" id="btnSubmitSO" class="flex-1 bg-[#F97316] text-white py-4 rounded-xl font-black text-sm shadow-xl flex items-center justify-center gap-2 uppercase tracking-widest">
                    <i class="fa-solid fa-paper-plane text-lg"></i> <span id="btnSubmitText" data-i18n="btn_submit_report">GỬI BÁO CÁO</span>
                </button>
                <button type="button" id="btnCancelEdit" onclick="cancelEdit()" class="hidden bg-gray-500 text-white px-6 py-4 rounded-xl font-black text-sm shadow-xl uppercase transition hover:bg-gray-600">
                    Hủy
                </button>
            </div>
        </div>
    </div>
</div>
`;