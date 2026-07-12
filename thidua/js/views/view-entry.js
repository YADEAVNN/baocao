export const entryHTML = `
<div class="p-4 md:p-8 fade-in max-w-[800px] mx-auto">
    <div class="text-center mb-8">
        <h1 class="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">BÁO CÁO SELL-OUT</h1>
        <p class="text-sm font-bold text-[#F97316] mt-2 uppercase">Chiến thắng chính mình mỗi ngày</p>
    </div>

    <div class="bg-white p-6 md:p-8 rounded-3xl shadow-xl border-t-4 border-t-[#F97316] space-y-6">
        <input type="hidden" id="editReportId" value="">
        
        <div>
            <label class="text-xs font-black text-slate-500 uppercase mb-2 block">Ngày Thực Hiện</label>
            <input type="date" id="so_daily_date" required class="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 font-black text-slate-800 text-lg outline-none focus:border-[#F97316]">
        </div>

        <div>
            <label class="text-xs font-black text-slate-500 uppercase mb-2 block">Đại Lý / Cửa Hàng</label>
            <div class="bg-slate-50 border border-slate-200 p-2 rounded-xl flex items-center">
                <div class="w-12 h-12 bg-slate-800 rounded-lg flex items-center justify-center text-white shrink-0">
                    <i class="fa-solid fa-store"></i>
                </div>
                <select id="select_shop_so" class="w-full bg-transparent font-black text-slate-800 text-base pl-4 outline-none cursor-pointer">
                    <option value="">-- Chọn đại lý báo cáo --</option>
                </select>
            </div>
        </div>

        <div class="bg-orange-50 p-6 rounded-2xl border border-orange-200 text-center">
            <label class="block text-sm font-black text-orange-600 mb-4 uppercase">KẾT QUẢ SELL-OUT TRONG NGÀY</label>
            <div class="flex items-center justify-center gap-4">
                <button onclick="let v = parseInt(document.getElementById('sold_quantity').value)||0; document.getElementById('sold_quantity').value = Math.max(0, v-1)" class="w-12 h-12 rounded-full bg-white text-orange-600 font-black text-2xl shadow hover:bg-orange-100">-</button>
                <input type="number" id="sold_quantity" class="w-32 bg-white border-2 border-orange-300 rounded-xl p-3 text-4xl font-black text-orange-600 outline-none text-center" value="0" min="0">
                <button onclick="let v = parseInt(document.getElementById('sold_quantity').value)||0; document.getElementById('sold_quantity').value = v+1" class="w-12 h-12 rounded-full bg-orange-500 text-white font-black text-2xl shadow hover:bg-orange-600">+</button>
            </div>
        </div>

        <button type="button" onclick="window.submitDailySO()" id="btnSubmitSO" class="w-full bg-[#F97316] text-white py-5 rounded-2xl font-black text-lg shadow-lg shadow-orange-500/30 hover:bg-orange-600 hover:-translate-y-1 transition flex items-center justify-center gap-3 uppercase tracking-widest">
            <i class="fa-solid fa-paper-plane"></i> GỬI SỐ SELL-OUT
        </button>
    </div>
</div>
`;