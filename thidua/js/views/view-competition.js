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
            <!-- Bộ lọc đã được thêm sự kiện onchange -->
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

// ==========================================
// LOGIC XỬ LÝ BẢNG XẾP HẠNG THI ĐUA
// ==========================================

// Hàm mồi được gọi từ main.js khi click vào menu "Bảng xếp hạng"
window.loadCompetitionData = () => {
    window.renderSaleLeaderboard();
};

// Hàm lấy dữ liệu và render giao diện bảng vàng
window.renderSaleLeaderboard = async () => {
    const tbody = document.getElementById('sale_leaderboard_body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-sm text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu...</td></tr>';

    try {
        // Lấy tháng hiện tại để lọc SO
        const today = new Date();
        const currentMonthStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;

        // Gọi đồng thời database (SO và Target)
        const [resSO, resTarget] = await Promise.all([
            window.sb.from('daily_so_reports').select('*'),
            window.sb.from('monthly_sale_targets').select('*')
        ]);

        const soReports = resSO.data || [];
        const targetData = resTarget.data || [];

        let saleStats = {};

        // 1. Tính tổng Kế Hoạch (Mục tiêu) của từng người
        targetData.forEach(row => {
            const name = row.sale_name ? row.sale_name.trim() : null;
            if (name) {
                if (!saleStats[name]) saleStats[name] = { name: name, target: 0, actual: 0 };
                saleStats[name].target += Number(row.target_so || 0);
            }
        });

        // 2. Tính tổng Thực Đạt S.O của từng người trong tháng
        soReports.forEach(row => {
            // Lọc chỉ lấy báo cáo của tháng hiện tại
            if (row.report_date && !row.report_date.startsWith(currentMonthStr)) return;

            const name = row.sale_name ? row.sale_name.trim() : null;
            const val = Number(row.total_so || row.so_luong || row.ban_ra || 0);

            if (name) {
                if (!saleStats[name]) saleStats[name] = { name: name, target: 0, actual: 0 };
                saleStats[name].actual += val;
            }
        });

        // 3. Chuyển thành Mảng và Tính % KPI Hoàn Thành
        let sortedData = Object.values(saleStats).map(s => {
            s.kpi = s.target > 0 ? (s.actual / s.target) * 100 : (s.actual > 0 ? 100 : 0);
            return s;
        });

        // 4. Sắp xếp giảm dần theo tiến độ KPI (nếu KPI bằng thì ưu tiên số Thực đạt cao hơn)
        sortedData.sort((a, b) => {
            if (b.kpi !== a.kpi) return b.kpi - a.kpi;
            return b.actual - a.actual;
        });

        // 5. CẮT DỮ LIỆU DỰA THEO LỰA CHỌN TRÊN BỘ LỌC
        const filterVal = document.getElementById('leaderboard_filter')?.value || 'top10';
        if (filterVal === 'top10') {
            sortedData = sortedData.slice(0, 10); // Chỉ lấy 10 người đứng đầu
        } 
        // Nếu chọn "all" (Hiển thị Tất Cả Sale) thì không cắt mảng

        // 6. Xử lý hiển thị
        if (sortedData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-sm text-gray-500 font-bold">Chưa có dữ liệu thi đua trong tháng này</td></tr>';
            return;
        }

        const formatNum = (num) => Number(num).toLocaleString('vi-VN');

        tbody.innerHTML = sortedData.map((row, index) => {
            // Biểu tượng cho 3 người đứng đầu
            let rankIcon = `<span class="font-bold text-slate-400">${index + 1}</span>`;
            if (index === 0) rankIcon = '<i class="fa-solid fa-crown text-yellow-500 text-2xl drop-shadow-md"></i>';
            else if (index === 1) rankIcon = '<i class="fa-solid fa-medal text-slate-300 text-xl drop-shadow-md"></i>';
            else if (index === 2) rankIcon = '<i class="fa-solid fa-medal text-amber-600 text-xl drop-shadow-md"></i>';

            const kpiColor = row.kpi >= 100 ? 'text-green-600' : 'text-slate-700';
            
            return `
                <tr class="hover:bg-orange-50/50 transition-colors">
                    <td class="p-4 text-center">${rankIcon}</td>
                    <td class="p-4 font-black text-slate-800">${row.name}</td>
                    <td class="p-4 text-center font-bold text-slate-500">${formatNum(row.target)}</td>
                    <td class="p-4 text-center font-black text-orange-600">${formatNum(row.actual)}</td>
                    <td class="p-4">
                        <div class="flex items-center gap-3 w-full">
                            <div class="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div class="bg-gradient-to-r from-orange-400 to-red-500 h-2.5 rounded-full" style="width: ${Math.min(row.kpi, 100)}%"></div>
                            </div>
                            <span class="text-xs font-black ${kpiColor} w-14 text-right">${row.kpi.toFixed(1)}%</span>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error("Lỗi khi tải Bảng xếp hạng:", err);
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-sm text-red-500 font-bold">Có lỗi xảy ra khi lấy dữ liệu xếp hạng!</td></tr>';
    }
};