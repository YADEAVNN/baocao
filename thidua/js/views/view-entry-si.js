export const entrySiHTML = `
<div class="p-4 md:p-8 max-w-3xl mx-auto fade-in pb-20">
    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="bg-blue-600 p-6 text-center">
            <h2 class="text-white font-black text-2xl uppercase">NHẬP KẾT QUẢ SELL-IN</h2>
            <p class="text-blue-100 text-sm font-semibold mt-1">QUY TRÌNH: SALE GHI NHẬN SỐ XE THANH TOÁN & XUẤT HÀNG</p>
        </div>
        <div class="p-6 md:p-10 space-y-6 bg-slate-50">
            <!-- Thông tin Sale -->
            <div class="bg-white p-4 rounded-xl flex justify-between items-center border border-gray-200 shadow-sm">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 bg-slate-800 rounded-full flex items-center justify-center text-white"><i class="fa-solid fa-user"></i></div>
                    <div>
                        <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">NHÂN VIÊN PHỤ TRÁCH</p>
                        <p id="display_sale_name_si" class="font-black text-slate-800">Đang tải...</p>
                    </div>
                </div>
            </div>

            <!-- Ngày báo cáo -->
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Ngày báo cáo</label>
                <input type="date" id="si_daily_date" class="form-input bg-white shadow-sm">
            </div>

            <!-- Nhập số liệu Thanh Toán & Xuất Hàng -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-center shadow-inner">
                    <label class="block text-xs font-black text-blue-600 uppercase mb-3">SỐ XE THANH TOÁN</label>
                    <input type="number" id="si_thanh_toan" placeholder="0" class="w-full text-center text-4xl font-black text-blue-600 bg-white border-2 border-blue-200 rounded-xl py-4 focus:border-blue-500 outline-none transition-all">
                </div>
                <div class="bg-teal-50 p-6 rounded-2xl border border-teal-100 text-center shadow-inner">
                    <label class="block text-xs font-black text-teal-600 uppercase mb-3">SỐ XE XUẤT HÀNG</label>
                    <input type="number" id="si_xuat_hang" placeholder="0" class="w-full text-center text-4xl font-black text-teal-600 bg-white border-2 border-teal-200 rounded-xl py-4 focus:border-teal-500 outline-none transition-all">
                </div>
            </div>

            <!-- Ghi chú -->
            <div>
                <label class="block text-xs font-bold text-gray-500 uppercase mb-2">Ghi chú (Tùy chọn)</label>
                <textarea id="si_note" rows="3" class="form-input bg-white shadow-sm" placeholder="Nhập ghi chú cho quản lý duyệt..."></textarea>
            </div>

            <button id="btnSubmitSI" class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-xl shadow-lg transition-all uppercase tracking-wider text-lg mt-4"><i class="fa-solid fa-check mr-2"></i> XÁC NHẬN KẾT QUẢ S.I</button>
        </div>
    </div>
</div>
`;