export const entryHTML = `
<div class="p-4 md:p-8 fade-in max-w-[800px] mx-auto">
    <!-- Breadcrumb -->
    <div class="flex items-center gap-2 mb-8 text-sm font-bold text-gray-500">
        <span class="text-orange-500">Kinh doanh</span> 
        <i class="fa-solid fa-chevron-right text-[10px]"></i> 
        <span>Sellout</span> 
        <i class="fa-solid fa-chevron-right text-[10px]"></i> 
        <span>Nhập kết quả</span>
    </div>

    <div class="text-center mb-8">
        <h1 class="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">NHẬP KẾT QUẢ SELL-OUT</h1>
        <p class="text-sm font-bold text-[#F97316] mt-2 uppercase">Quy trình 02: Sale nhập kết quả theo ngày</p>
    </div>

    <div class="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-t-4 border-t-[#F97316] space-y-6">
        <input type="hidden" id="editReportId" value="">
        
        <!-- Thông tin NVKD Tự Động -->
        <div class="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-white shrink-0 shadow-inner">
                    <i class="fa-solid fa-user-tie"></i>
                </div>
                <div>
                    <p class="text-[10px] font-black text-slate-500 uppercase">Nhân viên phụ trách</p>
                    <h3 id="display_sale_name" class="font-black text-slate-800 text-base">Đang tải...</h3>
                </div>
            </div>
            <div class="text-right">
                <span class="bg-green-100 text-green-700 px-3 py-1.5 rounded-lg text-[11px] font-black uppercase"><i class="fa-solid fa-circle text-[8px] mr-1"></i> Đang hoạt động</span>
            </div>
        </div>

        <div>
            <label class="text-xs font-black text-slate-500 uppercase mb-2 block">Ngày Báo Cáo</label>
            <input type="date" id="so_daily_date" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-black text-slate-800 text-lg outline-none focus:border-[#F97316]">
        </div>

        <div class="bg-orange-50 p-6 rounded-2xl border border-orange-200 text-center">
            <label class="block text-sm font-black text-orange-600 mb-4 uppercase">TỔNG SELL-OUT TRONG NGÀY</label>
            <div class="flex items-center justify-center gap-4">
                <button onclick="let v = parseInt(document.getElementById('sold_quantity').value)||0; document.getElementById('sold_quantity').value = Math.max(0, v-1)" class="w-12 h-12 rounded-full bg-white text-orange-600 font-black text-2xl shadow hover:bg-orange-100 transition">-</button>
                <input type="number" id="sold_quantity" class="w-32 bg-white border-2 border-orange-300 rounded-xl p-3 text-4xl font-black text-orange-600 outline-none text-center" value="0" min="0">
                <button onclick="let v = parseInt(document.getElementById('sold_quantity').value)||0; document.getElementById('sold_quantity').value = v+1" class="w-12 h-12 rounded-full bg-orange-500 text-white font-black text-2xl shadow hover:bg-orange-600 transition">+</button>
            </div>
        </div>

        <div>
            <label class="text-xs font-black text-slate-500 uppercase mb-2 block">Ghi chú (Tùy chọn)</label>
            <textarea id="so_note" rows="2" class="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-[#F97316]" placeholder="Nhập ghi chú cho quản lý hoặc duyệt kết quả..."></textarea>
        </div>

        <button type="button" onclick="window.submitDailySO()" id="btnSubmitSO" class="w-full bg-[#F97316] text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:-translate-y-1 transition flex items-center justify-center gap-3 uppercase tracking-widest">
            <i class="fa-solid fa-check"></i> XÁC NHẬN KẾT QUẢ
        </button>
    </div>
</div>
`;