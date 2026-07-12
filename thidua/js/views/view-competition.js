export const competitionHTML = `
<div class="p-4 md:p-6 fade-in max-w-[1200px] mx-auto bg-[#F8FAFC]">
    <!-- Header Campaign -->
    <div class="bg-slate-900 rounded-3xl p-6 md:p-10 text-center relative overflow-hidden mb-8 shadow-2xl">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-[#F97316] rounded-full blur-3xl opacity-50"></div>
        <img src="https://xcfnmqnwbydohlopmcaa.supabase.co/storage/v1/object/public/website-assets/logo%20YADEA.png" class="h-8 mx-auto mb-4 relative z-10">
        <h1 class="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 uppercase tracking-tighter relative z-10">
            BẢNG VÀNG CHIẾN BINH SALE
        </h1>
        <p class="text-white text-sm md:text-base font-bold tracking-widest mt-2 uppercase opacity-80 relative z-10">Đường Đua Hoàn Thành Mục Tiêu Sell-Out</p>
    </div>

    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div class="bg-[#F97316] p-5 flex flex-col md:flex-row justify-between items-center gap-4">
            <h2 class="text-white font-black text-lg uppercase flex items-center gap-2">
                <i class="fa-solid fa-ranking-star"></i> XẾP HẠNG HOÀN THÀNH KPI
            </h2>
            <select id="leaderboard_filter" onchange="window.renderSaleLeaderboard()" class="bg-white text-orange-600 font-bold py-2 px-4 rounded-xl text-sm outline-none cursor-pointer shadow-sm">
                <option value="top10">🏆 Hiển thị Top 10 Bứt Tốc</option>
                <option value="all">📋 Hiển thị Tất Cả Sale</option>
            </select>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-gray-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr>
                        <th class="p-4 text-center w-16">Hạng</th>
                        <th class="p-4">Chiến Binh (NVKD)</th>
                        <th class="p-4 text-center">Mục Tiêu S.O</th>
                        <th class="p-4 text-center">Thực Đạt S.O</th>
                        <th class="p-4 w-64">Tiến Độ Hoàn Thành (%)</th>
                    </tr>
                </thead>
                <tbody id="sale_leaderboard_body" class="divide-y divide-gray-100">
                    <tr><td colspan="5" class="text-center p-8 text-sm text-gray-400"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải dữ liệu...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
`;