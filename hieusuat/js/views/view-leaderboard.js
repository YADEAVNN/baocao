export const leaderboardHTML = `
<div class="p-4 md:p-8 fade-in max-w-[1600px] mx-auto space-y-6">
    <div class="flex items-center gap-3 mb-6">
        <div class="w-10 h-10 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center text-xl shadow-sm">
            <i class="fa-solid fa-medal"></i>
        </div>
        <h1 class="text-xl md:text-2xl font-black text-slate-800 uppercase">
            BẢNG XẾP HẠNG VINH DANH ĐẠI LÝ
        </h1>
    </div>

    <div class="flex flex-col md:flex-row items-start md:items-center gap-4 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 w-fit">
        <div class="flex items-center gap-2">
            <label class="text-xs font-black text-slate-500 uppercase tracking-wide">Tháng:</label>
            <input type="month" id="ld_filter_month" onchange="window.loadLeaderboard()" class="form-input py-1.5 px-3 font-bold bg-white border border-gray-200 text-[#F97316] rounded-lg w-40 cursor-pointer uppercase outline-none focus:border-orange-500 transition shadow-sm">
        </div>
        
        <div class="hidden md:block w-px h-8 bg-gray-200"></div> <div class="flex items-center gap-2">
            <label class="text-xs font-black text-slate-500 uppercase tracking-wide">Hiển thị:</label>
            <select id="ld_global_filter" onchange="window.applyGlobalLeaderboardFilter()" class="form-input py-1.5 px-3 font-bold bg-slate-50 border border-gray-200 text-slate-700 rounded-lg cursor-pointer outline-none focus:border-blue-500 transition shadow-sm w-48">
                <option value="top">🏆 Top 10 Tốt Nhất</option>
                <option value="bottom">⚠️ 10 Tệ Nhất</option>
                <option value="all">📋 Tất Cả Cửa Hàng</option>
            </select>
        </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        <div class="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-t-[#F97316] border-x border-b border-gray-100">
            <h3 class="text-lg font-black text-[#F97316] uppercase flex items-center gap-2 mb-5">
                <i class="fa-solid fa-crown text-xl"></i> BẢNG VÀNG DOANH THU THÁNG
            </h3>
            
            <div id="ld_rev_content" class="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"></div>
        </div>

        <div class="bg-white p-6 rounded-2xl shadow-sm border-t-4 border-t-emerald-500 border-x border-b border-gray-100">
            <h3 class="text-lg font-black text-emerald-600 uppercase flex items-center gap-2 mb-5">
                <i class="fa-solid fa-circle-check text-xl"></i> TOP KỶ LUẬT BÁO CÁO TOÀN DIỆN
            </h3>
            
            <div id="ld_disc_content" class="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar"></div>
        </div>
    </div>
</div>
<style>
    .custom-scrollbar::-webkit-scrollbar { width: 5px; }
    .custom-scrollbar::-webkit-scrollbar-track { background: #f1f5f9; border-radius: 5px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 5px; }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
</style>
`;