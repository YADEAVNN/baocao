export const competitionHTML = `
<div class="p-4 md:p-6 fade-in max-w-[1200px] mx-auto bg-[#F8FAFC]">
    <!-- Header Campaign -->
    <div class="bg-slate-900 rounded-3xl p-6 md:p-10 text-center relative overflow-hidden mb-6 shadow-2xl transition-all duration-300">
        <div class="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-[#F97316] rounded-full blur-3xl opacity-50 transition-all duration-300" id="lb_glow"></div>
        <img src="https://xcfnmqnwbydohlopmcaa.supabase.co/storage/v1/object/public/website-assets/logo%20YADEA.png" class="h-8 mx-auto mb-4 relative z-10">
        <h1 class="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 uppercase tracking-tighter relative z-10 transition-all duration-300" id="lb_title_text">
            BẢNG VÀNG CHIẾN BINH SALE
        </h1>
        <p class="text-white text-sm md:text-base font-bold tracking-widest mt-2 uppercase opacity-80 relative z-10" id="leaderboard_subtitle">Đường Đua Hoàn Thành Mục Tiêu Sell-Out</p>
    </div>

    <!-- TABS CHUYỂN ĐỔI S.O / S.I -->
    <div class="flex justify-center gap-3 mb-8 relative z-20 px-2">
        <button onclick="window.switchLeaderboardTab('SO')" id="btn_lb_so" class="flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-[#F97316] text-white shadow-lg shadow-orange-500/30 text-xs md:text-sm border border-transparent">
            <i class="fa-solid fa-motorcycle mr-1 md:mr-2"></i> Xếp Hạng S.O
        </button>
        <button onclick="window.switchLeaderboardTab('SI')" id="btn_lb_si" class="flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 shadow-sm text-xs md:text-sm">
            <i class="fa-solid fa-box-open mr-1 md:mr-2"></i> Xếp Hạng S.I
        </button>
    </div>

    <div class="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div id="lb_header_bg" class="bg-[#F97316] p-5 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-300">
            <h2 class="text-white font-black text-lg uppercase flex items-center gap-2">
                <i class="fa-solid fa-ranking-star"></i> XẾP HẠNG HOÀN THÀNH KPI
            </h2>
            <div class="flex flex-wrap items-center gap-2">
                <input type="month" id="lb_month_filter" onchange="window.renderSaleLeaderboard()" class="bg-white text-gray-700 font-bold py-2 px-3 rounded-xl text-sm outline-none cursor-pointer shadow-sm">
                <select id="leaderboard_filter" onchange="window.renderSaleLeaderboard()" class="bg-white text-gray-700 font-bold py-2 px-3 rounded-xl text-sm outline-none cursor-pointer shadow-sm">
                    <option value="top10">🏆 Hiển thị Top 10 Bứt Tốc</option>
                    <option value="all">📋 Hiển thị Tất Cả Sale</option>
                </select>
            </div>
        </div>
        <div class="overflow-x-auto">
            <table class="w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-gray-50/80 text-slate-500 font-bold uppercase text-[10px] border-b border-gray-200">
                    <tr id="lb_table_head">
                        <!-- Header render bằng JS -->
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
// LOGIC XỬ LÝ BẢNG XẾP HẠNG THI ĐUA ĐA TAB
// ==========================================

window.currentLbType = 'SO';

window.loadCompetitionData = () => {
    // Set mặc định giá trị cho bộ lọc Tháng
    const monthInput = document.getElementById('lb_month_filter');
    if (monthInput && !monthInput.value) {
        const today = new Date();
        monthInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }
    window.switchLeaderboardTab(window.currentLbType || 'SO');
};

window.switchLeaderboardTab = (type) => {
    window.currentLbType = type;
    
    const btnSO = document.getElementById('btn_lb_so');
    const btnSI = document.getElementById('btn_lb_si');
    const headerBg = document.getElementById('lb_header_bg');
    const subtitle = document.getElementById('leaderboard_subtitle');
    const titleText = document.getElementById('lb_title_text');
    const glow = document.getElementById('lb_glow');
    const thead = document.getElementById('lb_table_head');

    if (!btnSO || !btnSI) return;

    if (type === 'SO') {
        btnSO.className = "flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-[#F97316] text-white shadow-lg shadow-orange-500/30 text-xs md:text-sm border border-transparent";
        btnSI.className = "flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-white text-teal-600 border border-teal-200 hover:bg-teal-50 shadow-sm text-xs md:text-sm";
        headerBg.className = "bg-[#F97316] p-5 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-300";
        subtitle.innerText = "Đường Đua Hoàn Thành Mục Tiêu Sell-Out";
        titleText.className = "text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-600 uppercase tracking-tighter relative z-10 transition-all duration-300";
        glow.className = "absolute -right-10 -top-10 w-40 h-40 bg-[#F97316] rounded-full blur-3xl opacity-50 transition-all duration-300";
        
        thead.innerHTML = `
            <th class="p-4 text-center w-16">Hạng</th>
            <th class="p-4">Chiến Binh (NVKD)</th>
            <th class="p-4 text-center">Mục Tiêu S.O</th>
            <th class="p-4 text-center">Thực Đạt S.O</th>
            <th class="p-4 w-64">Tiến Độ Hoàn Thành (%)</th>
        `;
    } else {
        btnSI.className = "flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-teal-600 text-white shadow-lg shadow-teal-500/30 text-xs md:text-sm border border-transparent";
        btnSO.className = "flex-1 md:flex-none px-6 py-3 rounded-xl font-black uppercase transition-all bg-white text-[#F97316] border border-orange-200 hover:bg-orange-50 shadow-sm text-xs md:text-sm";
        headerBg.className = "bg-teal-600 p-5 flex flex-col md:flex-row justify-between items-center gap-4 transition-colors duration-300";
        subtitle.innerText = "Đường Đua Hoàn Thành Mục Tiêu Sell-In (Phát Hàng)";
        titleText.className = "text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-blue-600 uppercase tracking-tighter relative z-10 transition-all duration-300";
        glow.className = "absolute -right-10 -top-10 w-40 h-40 bg-teal-500 rounded-full blur-3xl opacity-50 transition-all duration-300";

        thead.innerHTML = `
            <th class="p-4 text-center w-16">Hạng</th>
            <th class="p-4">Chiến Binh (NVKD)</th>
            <th class="p-4 text-center">Mục Tiêu S.I</th>
            <th class="p-4 text-center">Phát Hàng S.I</th>
            <th class="p-4 w-64">Tiến Độ Hoàn Thành (%)</th>
        `;
    }
    
    window.renderSaleLeaderboard();
};

window.renderSaleLeaderboard = async () => {
    const type = window.currentLbType || 'SO';
    const tbody = document.getElementById('sale_leaderboard_body');
    if (!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-sm text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu...</td></tr>';

    try {
        // ĐÃ FIX: Lấy tháng từ Input để truy vấn chính xác
        let monthVal = document.getElementById('lb_month_filter')?.value;
        if (!monthVal) {
            const today = new Date();
            monthVal = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        }

        const [yearStr, monthStr] = monthVal.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const daysInMonth = new Date(year, month, 0).getDate();
        
        // ĐÃ FIX: Chuyển đổi truy vấn ngày từ .like() sang .gte() và .lte() để Supabase không bị lỗi
        const startDate = `${yearStr}-${monthStr}-01`;
        const endDate = `${yearStr}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;

        let reports = [];
        let targetData = [];

        if (type === 'SO') {
            const [resSO, resTarget] = await Promise.all([
                window.sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', endDate),
                window.sb.from('monthly_sale_targets').select('*')
            ]);
            reports = resSO.data || [];
            targetData = resTarget.data || [];
        } else {
            const [resSI, resTarget] = await Promise.all([
                window.sb.from('daily_si_reports').select('*').gte('report_date', startDate).lte('report_date', endDate),
                window.sb.from('monthly_sale_targets').select('*')
            ]);
            reports = resSI.data || [];
            targetData = resTarget.data || [];
        }

        let saleStats = {};

        targetData.forEach(row => {
            const name = row.sale_name ? row.sale_name.trim() : null;
            if (name) {
                if (!saleStats[name]) saleStats[name] = { name: name, target: 0, actual: 0 };
                if (type === 'SO') {
                    saleStats[name].target += Number(row.target_so || 0);
                } else {
                    saleStats[name].target += Number(row.target_si || 0);
                }
            }
        });

        reports.forEach(row => {
            const name = row.sale_name ? row.sale_name.trim() : null;
            let val = 0;
            
            if (type === 'SO') {
                val = Number(row.total_so || row.so_luong || row.ban_ra || 0);
            } else {
                val = Number(row.xuat_hang || 0);
            }

            if (name) {
                if (!saleStats[name]) saleStats[name] = { name: name, target: 0, actual: 0 };
                saleStats[name].actual += val;
            }
        });

        let sortedData = Object.values(saleStats).map(s => {
            s.kpi = s.target > 0 ? (s.actual / s.target) * 100 : (s.actual > 0 ? 100 : 0);
            return s;
        });

        sortedData.sort((a, b) => {
            if (b.kpi !== a.kpi) return b.kpi - a.kpi;
            return b.actual - a.actual;
        });

        const filterVal = document.getElementById('leaderboard_filter')?.value || 'top10';
        if (filterVal === 'top10') {
            sortedData = sortedData.slice(0, 10); 
        } 

        if (sortedData.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-sm text-gray-500 font-bold">Chưa có dữ liệu thi đua trong tháng này</td></tr>';
            return;
        }

        const formatNum = (num) => Number(num).toLocaleString('vi-VN');

        tbody.innerHTML = sortedData.map((row, index) => {
            let rankIcon = `<span class="font-bold text-slate-400">${index + 1}</span>`;
            if (index === 0) rankIcon = '<i class="fa-solid fa-crown text-yellow-500 text-2xl drop-shadow-md"></i>';
            else if (index === 1) rankIcon = '<i class="fa-solid fa-medal text-slate-300 text-xl drop-shadow-md"></i>';
            else if (index === 2) rankIcon = '<i class="fa-solid fa-medal text-amber-600 text-xl drop-shadow-md"></i>';

            const kpiColor = row.kpi >= 100 ? 'text-green-600' : 'text-slate-700';
            const actualColor = type === 'SO' ? 'text-orange-600' : 'text-teal-600';
            const barGradient = type === 'SO' ? 'from-orange-400 to-red-500' : 'from-teal-400 to-blue-500';
            
            return `
                <tr class="hover:bg-slate-50/80 transition-colors border-b border-gray-50">
                    <td class="p-4 text-center">${rankIcon}</td>
                    <td class="p-4 font-black text-slate-800">${row.name}</td>
                    <td class="p-4 text-center font-bold text-slate-500">${formatNum(row.target)}</td>
                    <td class="p-4 text-center font-black ${actualColor}">${formatNum(row.actual)}</td>
                    <td class="p-4">
                        <div class="flex items-center gap-3 w-full">
                            <div class="flex-1 bg-gray-200 rounded-full h-2.5 overflow-hidden">
                                <div class="bg-gradient-to-r ${barGradient} h-2.5 rounded-full" style="width: ${Math.min(row.kpi, 100)}%"></div>
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