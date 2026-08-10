// File: js/views/view-fund.js

export const fundHTML = `
<div class="p-4 md:p-6 fade-in max-w-[1200px] mx-auto bg-[#F8FAFC] min-h-screen pb-10">
    <!-- HEADER -->
    <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4 border-b border-gray-200 pb-4">
        <div>
            <h1 class="text-2xl font-black text-blue-800 uppercase tracking-tight flex items-center gap-3">
                <i class="fa-solid fa-piggy-bank text-blue-600"></i> QUẢN LÝ QUỸ ĐÓNG GÓP
            </h1>
            <p class="text-sm font-bold text-gray-500 mt-1 ml-9">Theo dõi và gạch nợ quỹ thi đua hàng tháng</p>
        </div>
        <div class="flex items-center gap-3">
            <div class="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-sm">
                <i class="fa-regular fa-calendar text-gray-400"></i>
                <input type="month" id="fund_month_filter" onchange="window.loadFundData()" class="bg-transparent border-none font-bold text-slate-700 outline-none cursor-pointer text-sm">
            </div>
            <button onclick="window.loadFundData()" class="bg-white text-gray-500 hover:text-blue-600 px-3 py-2 rounded-lg border border-gray-200 shadow-sm transition">
                <i class="fa-solid fa-rotate-right"></i> Làm mới
            </button>
        </div>
    </div>

    <!-- TABS -->
    <div class="flex justify-center gap-3 mb-6 relative z-20 px-2">
        <button onclick="window.switchFundTab('GAME01')" id="btn_fund_g1" class="flex-1 md:flex-none px-8 py-3 rounded-xl font-black uppercase transition-all bg-orange-500 text-white shadow-lg shadow-orange-500/30 text-xs md:text-sm border border-transparent">
            GAME 01 - SOLO
        </button>
        <button onclick="window.switchFundTab('GAME02')" id="btn_fund_g2" class="flex-1 md:flex-none px-8 py-3 rounded-xl font-black uppercase transition-all bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 shadow-sm text-xs md:text-sm">
            GAME 02 - KHU VỰC
        </button>
    </div>

    <!-- MAIN TABLE -->
    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
        <div class="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h2 class="text-sm font-black text-slate-800 uppercase flex items-center gap-2" id="fund_table_title">
                DANH SÁCH CẦN ĐÓNG QUỸ - GAME 01
            </h2>
            <div class="text-[10px] font-bold text-gray-500 italic bg-white px-3 py-1.5 rounded-lg border border-gray-200">
                <i class="fa-solid fa-circle-info text-blue-500 mr-1"></i> Chỉ Admin mới có quyền "Xác nhận thu"
            </div>
        </div>
        <div class="overflow-x-auto flex-1 custom-scrollbar">
            <table class="w-full text-center whitespace-nowrap text-sm border-collapse">
                <thead class="bg-[#0b2447] text-white font-bold text-[10px] uppercase">
                    <tr>
                        <th class="py-3 px-3 border border-slate-600 w-10">STT</th>
                        <th class="py-3 px-4 text-left border border-slate-600" id="fund_col_name">THÀNH VIÊN (NVKD)</th>
                        <th class="py-3 px-3 border border-slate-600">TỔNG NỢ KỲ NÀY</th>
                        <th class="py-3 px-3 border border-slate-600 text-green-400">ĐÃ ĐÓNG</th>
                        <th class="py-3 px-3 border border-slate-600 text-orange-400 font-black">CÒN LẠI (THỰC NỢ)</th>
                        <th class="py-3 px-3 border border-slate-600 w-32">THAO TÁC</th>
                    </tr>
                </thead>
                <tbody id="fund_table_body" class="divide-y divide-gray-100 text-slate-700 font-medium">
                    <tr><td colspan="6" class="p-10 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</div>
`;

window.fundState = { tab: 'GAME01' };

window.switchFundTab = (tab) => {
    window.fundState.tab = tab;
    const btnG1 = document.getElementById('btn_fund_g1');
    const btnG2 = document.getElementById('btn_fund_g2');
    const title = document.getElementById('fund_table_title');
    const colName = document.getElementById('fund_col_name');

    if (tab === 'GAME01') {
        btnG1.className = "flex-1 md:flex-none px-8 py-3 rounded-xl font-black uppercase transition-all bg-orange-500 text-white shadow-lg shadow-orange-500/30 text-xs md:text-sm border border-transparent";
        btnG2.className = "flex-1 md:flex-none px-8 py-3 rounded-xl font-black uppercase transition-all bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 shadow-sm text-xs md:text-sm";
        title.innerText = "DANH SÁCH CẦN ĐÓNG QUỸ - GAME 01 (SOLO)";
        colName.innerText = "THÀNH VIÊN (NVKD)";
    } else {
        btnG2.className = "flex-1 md:flex-none px-8 py-3 rounded-xl font-black uppercase transition-all bg-red-600 text-white shadow-lg shadow-red-500/30 text-xs md:text-sm border border-transparent";
        btnG1.className = "flex-1 md:flex-none px-8 py-3 rounded-xl font-black uppercase transition-all bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 shadow-sm text-xs md:text-sm";
        title.innerText = "DANH SÁCH TÀI TRỢ PICKLEBALL - GAME 02 (KHU VỰC)";
        colName.innerText = "KHU VỰC (ĐỨNG CUỐI BẢNG)";
    }
    window.loadFundData();
};

window.loadFundData = async () => {
    const tbody = document.getElementById('fund_table_body');
    tbody.innerHTML = '<tr><td colspan="6" class="p-10 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải và tính toán công nợ...</td></tr>';

    const monthInput = document.getElementById('fund_month_filter');
    if (!monthInput.value) {
        const today = new Date();
        monthInput.value = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    }
    const [year, month] = monthInput.value.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${month}-01`;
    const endDate = `${year}-${month}-${String(daysInMonth).padStart(2, '0')}`;

    try {
        const [shopsRes, targetRes, soRes, paymentRes] = await Promise.all([
            window.sb.from('master_shop_list').select('*'),
            window.sb.from('monthly_sale_targets').select('*').like('report_month', `${year}-${month}%`),
            window.sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', endDate),
            window.sb.from('fund_payments').select('*').eq('report_month', `${year}-${month}`).eq('game_type', window.fundState.tab)
        ]);

        const shops = shopsRes.data || [];
        const targets = targetRes.data || [];
        const soData = soRes.data || [];
        const payments = paymentRes.data || [];

        const normalize = (name) => name ? name.trim().toLowerCase().replace(/\s+/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : null;
        const isAdmin = window.STATE?.currentUser?.role === 'Admin';
        const fmt = n => Math.round(Number(n)).toLocaleString('vi-VN');

        let fundList = [];

        // =====================================
        // LOGIC TÍNH NỢ QUỸ GAME 01 (Solo)
        // =====================================
        if (window.fundState.tab === 'GAME01') {
            let validSalesMap = {};
            shops.forEach(s => {
                const sName = normalize(s.sale_name);
                if (sName) validSalesMap[sName] = normalize(s.director_name) || 'Chưa rõ';
            });

            let saleStatsMap = {};
            Object.keys(validSalesMap).forEach(sName => {
                const tgtRow = targets.find(t => normalize(t.sale_name) === sName);
                const targetMonth = tgtRow ? Number(tgtRow.target_so || 0) : 0;
                const targetDay = targetMonth > 0 ? Math.ceil(targetMonth / daysInMonth) : 0;
                if (targetDay > 0) {
                    saleStatsMap[sName] = { name: sName, director: validSalesMap[sName], targetDay: targetDay, accumDebt: 0 };
                }
            });

            const today = new Date();
            let currentDayNum = daysInMonth;
            if (parseInt(year) === today.getFullYear() && parseInt(month) === today.getMonth() + 1) {
                currentDayNum = today.getDate();
            } else if (parseInt(year) > today.getFullYear() || (parseInt(year) === today.getFullYear() && parseInt(month) > today.getMonth() + 1)) {
                currentDayNum = 0;
            }

            // Tính số lượt hụt (Có kiểm tra giờ Deadline y như Game 01)
            for (let d = 1; d <= currentDayNum; d++) {
                const dDateStr = `${year}-${month}-${String(d).padStart(2, '0')}`;
                const dailyReports = soData.filter(r => r.report_date === dDateStr);

                Object.keys(saleStatsMap).forEach(sName => {
                    let actualForGame = 0;
                    dailyReports.filter(r => normalize(r.sale_name) === sName).forEach(r => {
                        if (r.status !== 'approved') return;
                        
                        let createdStr = r.created_at || r.inserted_at;
                        if (createdStr) {
                            let createdDateObj = new Date(createdStr);
                            let [rY, rM, rD] = dDateStr.split('-').map(Number);
                            let deadlineMs = Date.UTC(rY, rM - 1, rD + 1, 5, 0, 0); 
                            if (createdDateObj.getTime() <= deadlineMs) {
                                actualForGame += Number(r.total_so || 0);
                            }
                        } else {
                            actualForGame += Number(r.total_so || 0);
                        }
                    });
                    
                    if (actualForGame < saleStatsMap[sName].targetDay) {
                        saleStatsMap[sName].accumDebt += 50000;
                    }
                });
            }

            // Gộp với lịch sử đã thanh toán
            fundList = Object.values(saleStatsMap).map(s => {
                const paid = payments.filter(p => p.sale_name === s.name).reduce((sum, p) => sum + Number(p.paid_amount), 0);
                return { ...s, paidAmount: paid, remaining: s.accumDebt - paid };
            }).filter(s => s.accumDebt > 0); 
        } 
        
        // =====================================
        // LOGIC TÍNH NỢ QUỸ GAME 02 (Khu vực)
        // =====================================
        else {
            const validRegions = ["Hà Nội", "Đông Bắc", "Bắc Trung Bộ", "Hồng Hà", "Tây Bắc", "Trung Trung Bộ"];
            const regionStats = {};
            validRegions.forEach(r => { regionStats[r] = { name: r, target: 0, actualCurrent: 0 }; });

            targets.forEach(t => {
                let reg = validRegions.find(r => normalize(t.khu_vuc || t.area || t.region_name)?.includes(normalize(r)));
                if (!reg && normalize(t.area)?.includes("tây bắc")) reg = "Tây Bắc";
                if (reg && regionStats[reg]) regionStats[reg].target += Number(t.target_so || 0);
            });

            soData.forEach(r => {
                let reg = validRegions.find(v => normalize(r.khu_vuc || r.region_name)?.includes(normalize(v)));
                if (!reg && normalize(r.khu_vuc)?.includes("tây bắc")) reg = "Tây Bắc";
                if (reg && regionStats[reg]) regionStats[reg].actualCurrent += Number(r.total_so || 0);
            });

            // Xếp hạng tính đến hiện tại
            let currentRankData = Object.values(regionStats).map(r => {
                r.pct = r.target > 0 ? (r.actualCurrent / r.target) * 100 : 0;
                return r;
            }).sort((a, b) => b.pct - a.pct);

            const bottom2 = currentRankData.slice(-2);
            
            fundList = bottom2.map(r => {
                const paid = payments.filter(p => p.sale_name === r.name).reduce((sum, p) => sum + Number(p.paid_amount), 0);
                return { name: r.name, director: 'Giám đốc khu vực', accumDebt: 1500000, paidAmount: paid, remaining: 1500000 - paid };
            });
        }

        if (fundList.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-gray-400 font-bold">Chưa có phát sinh công nợ trong kỳ này.</td></tr>`;
            return;
        }

        fundList.sort((a, b) => b.remaining - a.remaining);

        tbody.innerHTML = fundList.map((s, i) => {
            let actionHtml = '';
            
            if (s.remaining > 0) {
                if (isAdmin) {
                    actionHtml = `
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="window.markFundPaid('${s.name}', '${window.fundState.tab}', ${s.remaining})" class="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-sm transition whitespace-nowrap"><i class="fa-solid fa-check mr-1"></i> Xác nhận thu</button>
                        ${s.paidAmount > 0 ? `<button onclick="window.undoFundPaid('${s.name}', '${window.fundState.tab}')" class="text-red-500 hover:bg-red-100 px-2 py-1.5 rounded transition" title="Hoàn tác đóng quỹ"><i class="fa-solid fa-rotate-left"></i></button>` : ''}
                    </div>`;
                } else {
                    actionHtml = `<span class="text-orange-500 font-bold text-[11px] bg-orange-50 px-3 py-1.5 rounded border border-orange-200"><i class="fa-regular fa-clock"></i> Chờ thu</span>`;
                }
            } else {
                if (isAdmin) {
                    actionHtml = `
                    <div class="flex items-center justify-center gap-2">
                        <span class="text-green-600 font-bold text-[11px] bg-green-50 px-3 py-1.5 rounded border border-green-200"><i class="fa-solid fa-check-double"></i> Đã hoàn tất</span>
                        <button onclick="window.undoFundPaid('${s.name}', '${window.fundState.tab}')" class="text-red-500 hover:bg-red-100 px-2 py-1.5 rounded transition" title="Hoàn tác đóng quỹ"><i class="fa-solid fa-rotate-left"></i></button>
                    </div>`;
                } else {
                    actionHtml = `<span class="text-green-600 font-bold text-[11px] bg-green-50 px-3 py-1.5 rounded border border-green-200"><i class="fa-solid fa-check-double"></i> Đã hoàn tất</span>`;
                }
            }

            return `
                <tr class="hover:bg-slate-50 transition border-b border-gray-100">
                    <td class="py-3 px-3 text-center border border-gray-100 font-bold text-gray-400">${i+1}</td>
                    <td class="py-3 px-4 text-left border border-gray-100">
                        <p class="font-black text-slate-800">${s.name}</p>
                        <p class="text-[10px] font-bold text-gray-400">${s.director}</p>
                    </td>
                    <td class="py-3 px-3 text-center border border-gray-100 font-bold text-slate-600">${fmt(s.accumDebt)}đ</td>
                    <td class="py-3 px-3 text-center border border-gray-100 font-bold text-green-500">${fmt(s.paidAmount)}đ</td>
                    <td class="py-3 px-3 text-center border border-gray-100 font-black text-orange-600 text-base bg-orange-50/30">${fmt(s.remaining)}đ</td>
                    <td class="py-3 px-3 text-center border border-gray-100 bg-slate-50/50">${actionHtml}</td>
                </tr>
            `;
        }).join('');

    } catch (err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="6" class="p-10 text-red-500 font-bold">Lỗi tải dữ liệu: ${err.message}</td></tr>`;
    }
};

window.markFundPaid = async (name, gameType, amount) => {
    if (!confirm(`Xác nhận đã thu ${amount.toLocaleString('vi-VN')}đ từ [${name}]? Hành động này không thể hoàn tác.`)) return;

    try {
        const month = document.getElementById('fund_month_filter').value;
        const payload = {
            sale_name: name,
            game_type: gameType,
            report_month: month,
            paid_amount: amount
        };

        const { error } = await window.sb.from('fund_payments').insert([payload]);
        if (error) throw error;

        alert('✅ Đã xác nhận thu tiền thành công!');
        window.loadFundData(); 
    } catch (err) {
        alert('❌ Lỗi hệ thống: ' + err.message);
    }
};

window.undoFundPaid = async (name, gameType) => {
    if (!confirm(`⚠️ Bạn có chắc chắn muốn HOÀN TÁC (Xóa) toàn bộ dữ liệu đóng quỹ tháng này của [${name}]?`)) return;

    try {
        const month = document.getElementById('fund_month_filter').value;
        
        const { error } = await window.sb.from('fund_payments')
            .delete()
            .eq('sale_name', name)
            .eq('game_type', gameType)
            .eq('report_month', month);

        if (error) throw error;

        alert('✅ Đã hoàn tác! Số tiền đã đóng được reset về 0đ.');
        window.loadFundData(); 
    } catch (err) {
        alert('❌ Lỗi hệ thống khi hoàn tác: ' + err.message);
    }
};