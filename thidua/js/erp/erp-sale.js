// ==========================================
// MODULE: ERP - TAB CÁ NHÂN SALE (CẬP NHẬT THEO THÁNG & DUAL PACE TIMELINE)
// ==========================================

window.renderErpSalePersonal = async () => {
    const container = document.getElementById('erp-tab-sale');
    if (!container) return;

    // 1. Hiển thị trạng thái đang tải
    container.innerHTML = `
        <div class="p-20 flex flex-col items-center justify-center fade-in">
            <i class="fa-solid fa-spinner fa-spin text-4xl text-[#F97316] mb-4"></i>
            <p class="text-gray-500 font-bold">Đang đồng bộ dữ liệu thị trường của bạn...</p>
        </div>
    `;

    try {
        // 2. Lấy thông tin User
        const user = window.STATE?.currentUser || { full_name: "Chưa xác định", region: "Khác", role: "Sale" };
        const saleName = user.full_name;
        const regionName = user.region || (window.STATE?.globalAssignedShops && window.STATE.globalAssignedShops[0]?.area) || 'Đông Bắc';

        // 3. Tính toán thời gian (Theo Tháng Hiện Tại)
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth() + 1;
        
        const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
        const daysPassed = Math.min(today.getDate(), daysInMonth);
        const daysLeft = Math.max(0, daysInMonth - daysPassed);

        const mStartStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        const mEndStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
        const currentMonthPrefix = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

        // 4. Fetch Dữ Liệu Từ Supabase
        const [soRes, siRes, tgtRes] = await Promise.all([
            window.sb.from('daily_so_reports').select('*').eq('sale_name', saleName).gte('report_date', mStartStr).lte('report_date', mEndStr),
            window.sb.from('game_si_reports').select('*').eq('sale_name', saleName).gte('report_date', mStartStr).lte('report_date', mEndStr),
            window.sb.from('monthly_sale_targets').select('*').eq('sale_name', saleName)
        ]);

        const soData = soRes.data || [];
        const siData = siRes.data || [];
        const tgtData = tgtRes.data || [];

        // 5. Tính toán Kế Hoạch (Target Tháng)
        let targetSO = 0, targetSI = 0, targetTT = 0;
        tgtData.forEach(t => {
            const tMonth = t.report_month || t.month;
            if (tMonth && tMonth.startsWith(currentMonthPrefix)) {
                targetSO += Number(t.target_so || 0);
                targetSI += Number(t.target_si || t.target_ph || 0);
                targetTT += Number(t.target_tt || 0);
            }
        });

        if (targetSO === 0) targetSO = 300; 
        if (targetSI === 0) targetSI = 400;
        if (targetTT === 0) targetTT = 500;

        // 6. Tính toán Thực Đạt (Actuals)
        let actualSO = 0, actualSI = 0, actualTT = 0;
        let yesterdaySO = 0, yesterdaySI = 0;
        let dYesterday = new Date(today);
        dYesterday.setDate(dYesterday.getDate() - 1);
        let yesterdayStr = `${dYesterday.getFullYear()}-${String(dYesterday.getMonth() + 1).padStart(2, '0')}-${String(dYesterday.getDate()).padStart(2, '0')}`;

        soData.forEach(r => {
            actualSO += Number(r.total_so || 0);
            if(r.report_date !== today.toISOString().split('T')[0]) yesterdaySO += Number(r.total_so || 0);
        });
        
        siData.forEach(r => {
            actualSI += Number(r.xuat_hang || 0);
            actualTT += Number(r.thanh_toan || 0);
            if(r.report_date !== today.toISOString().split('T')[0]) yesterdaySI += Number(r.xuat_hang || 0);
        });

        // 7. Xử lý Chỉ số Hiệu Suất, Áp Lực & DỰ BÁO (Forecast)
        const missingSI = Math.max(0, targetSI - actualSI);
        const missingSO = Math.max(0, targetSO - actualSO);
        
        const pctSI = Math.min(100, Math.round((actualSI / targetSI) * 100));
        const pctSO = Math.min(100, Math.round((actualSO / targetSO) * 100));
        const pctTT = Math.min(100, Math.round((actualTT / targetTT) * 100));

        const avgPaceSI = (actualSI / daysPassed).toFixed(1);
        const avgPaceSO = (actualSO / daysPassed).toFixed(1);
        
        const avgPaceYesterdaySI = daysPassed > 1 ? (yesterdaySI / (daysPassed - 1)).toFixed(1) : 0;
        const avgPaceYesterdaySO = daysPassed > 1 ? (yesterdaySO / (daysPassed - 1)).toFixed(1) : 0;

        const reqPaceSI = daysLeft > 0 ? (missingSI / daysLeft).toFixed(1) : missingSI;
        const reqPaceSO = daysLeft > 0 ? (missingSO / daysLeft).toFixed(1) : missingSO;

        const diffPaceSI = (reqPaceSI - avgPaceYesterdaySI).toFixed(1);
        const diffPaceSO = (reqPaceSO - avgPaceYesterdaySO).toFixed(1);

        const pendingSI = Math.max(0, actualTT - actualSI); 

        const maxPaceSI = targetSI / 10;
        const pressurePctSI = Math.min(100, Math.max(0, (reqPaceSI / maxPaceSI) * 100));
        const maxPaceSO = targetSO / 10;
        const pressurePctSO = Math.min(100, Math.max(0, (reqPaceSO / maxPaceSO) * 100));

        // TÍNH TOÁN DỰ BÁO DỰA TRÊN NHỊP ĐỘ HIỆN TẠI (RUN-RATE)
        const forecastSI = daysPassed > 0 ? Math.round((actualSI / daysPassed) * daysInMonth) : 0;
        const forecastPctSI = targetSI > 0 ? Math.round((forecastSI / targetSI) * 100) : 0;

        const forecastSO = daysPassed > 0 ? Math.round((actualSO / daysPassed) * daysInMonth) : 0;
        const forecastPctSO = targetSO > 0 ? Math.round((forecastSO / targetSO) * 100) : 0;

        // 8. Chuẩn bị dữ liệu cho Chart (MIXED: Line + Column)
        let chartCategories = [];
        let cumPlanSI = [], cumActSI = [], dailyActSI = [];
        let cumPlanSO = [], cumActSO = [], dailyActSO = [];
        let runActSI = 0, runActSO = 0;
        
        let dailyTargetSI = targetSI / daysInMonth;
        let dailyTargetSO = targetSO / daysInMonth;

        for (let i = 1; i <= daysInMonth; i++) {
            chartCategories.push(String(i).padStart(2, '0'));
            let dStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            // Kế hoạch tịnh tiến
            cumPlanSI.push(Math.round(dailyTargetSI * i));
            cumPlanSO.push(Math.round(dailyTargetSO * i));

            // Thực tế
            if (i <= daysPassed) {
                let d_si = siData.filter(r => r.report_date === dStr).reduce((sum, r) => sum + Number(r.xuat_hang || 0), 0);
                let d_so = soData.filter(r => r.report_date === dStr).reduce((sum, r) => sum + Number(r.total_so || 0), 0);
                
                runActSI += d_si;
                runActSO += d_so;
                
                cumActSI.push(runActSI);
                cumActSO.push(runActSO);
                dailyActSI.push(d_si); 
                dailyActSO.push(d_so);
            } else {
                cumActSI.push(null); 
                cumActSO.push(null);
                dailyActSI.push(null);
                dailyActSO.push(null);
            }
        }

        // 9. Lấy 7 Ngày Gần Nhất
        let last7DaysHtml = '';
        for (let i = 0; i < 7; i++) {
            let d = new Date();
            d.setDate(d.getDate() - i);
            let dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            let displayDate = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
            
            let d_so = soData.filter(r => r.report_date === dateStr).reduce((sum, r) => sum + Number(r.total_so || 0), 0);
            
            let daySiRecords = siData.filter(r => r.report_date === dateStr);
            let d_tt = daySiRecords.reduce((sum, r) => sum + Number(r.thanh_toan || 0), 0);
            let d_si = daySiRecords.reduce((sum, r) => sum + Number(r.xuat_hang || 0), 0);
            
            let statusIcon = '<i class="fa-solid fa-circle-exclamation text-yellow-500"></i>';
            if (d_so > 0 && d_si > 0) statusIcon = '<i class="fa-solid fa-circle-check text-green-500"></i>';
            else if (d_so === 0 && d_si === 0 && i !== 0) statusIcon = '<i class="fa-solid fa-circle-xmark text-red-500"></i>';

            last7DaysHtml += `
                <tr>
                    <td class="py-2.5">${displayDate}</td>
                    <td class="py-2.5">${d_tt}</td>
                    <td class="py-2.5 text-blue-600">${d_si}</td>
                    <td class="py-2.5 text-green-600">${d_so}</td>
                    <td class="py-2.5">${statusIcon}</td>
                </tr>
            `;
        }

        // 10. RENDER GIAO DIỆN HTML
        container.innerHTML = `
            <div class="w-full bg-white pb-28 font-sans max-w-5xl mx-auto fade-in shadow-xl rounded-t-3xl overflow-hidden mt-6 border border-gray-200">
                <!-- HEADER CÁ NHÂN -->
                <div class="flex justify-between items-center p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center border border-orange-200 shrink-0">
                            <img src="https://xcfnmqnwbydohlopmcaa.supabase.co/storage/v1/object/public/website-assets/logo%20YADEA.png" class="w-6 object-contain">
                        </div>
                        <div>
                            <h2 class="text-sm text-slate-600">Xin chào, <span class="font-black text-lg text-slate-800">${saleName} 👋</span></h2>
                            <p class="text-[11px] text-gray-500 font-medium">${user.role} - Khu vực: <span class="font-bold text-slate-700">${regionName}</span></p>
                        </div>
                    </div>
                    <div class="flex gap-3 items-center">
                        <div class="relative cursor-pointer hover:bg-gray-100 p-2 rounded-full transition border border-gray-200 bg-gray-50">
                            <i class="fa-regular fa-bell text-lg text-slate-600"></i>
                            <span class="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-bold flex items-center justify-center rounded-full border border-white">3</span>
                        </div>
                        <div class="cursor-pointer hover:bg-gray-100 p-2 rounded-full transition border border-gray-200 bg-gray-50">
                            <i class="fa-regular fa-calendar text-lg text-slate-600"></i>
                        </div>
                    </div>
                </div>

                <!-- BANNER MỤC TIÊU -->
                <div class="px-5 mt-5">
                    <div class="bg-orange-50 border border-orange-200 rounded-xl p-3 flex justify-between items-center text-orange-600 shadow-sm">
                        <div class="flex items-center gap-2 text-sm font-bold">
                            <i class="fa-solid fa-bullseye"></i> Mục tiêu: Tháng ${currentMonth}/${currentYear} (01/${String(currentMonth).padStart(2,'0')} - ${daysInMonth}/${String(currentMonth).padStart(2,'0')})
                        </div>
                        <div class="text-sm font-bold bg-white px-3 py-1 rounded-lg border border-orange-100 shadow-sm">Còn ${daysLeft} ngày</div>
                    </div>
                </div>

                <div class="px-5 mt-6 space-y-6">
                    <!-- SECTION 1: HIỆU SUẤT YÊU CẦU HÔM NAY -->
                    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 relative">
                        <div class="flex justify-between items-center border-b border-gray-100 pb-3 mb-5">
                            <h3 class="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                                <span class="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px]">1</span> 
                                HIỆU SUẤT YÊU CẦU HÔM NAY
                            </h3>
                            <span class="text-[10px] text-gray-400 font-medium hidden md:block">
                                Được tính theo mục tiêu Tháng ${currentMonth} và số ngày còn lại <i class="fa-solid fa-circle-info ml-1"></i>
                            </span>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <!-- Card Sellin -->
                            <div class="border border-gray-200 rounded-xl p-5 relative overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                                <h4 class="text-blue-600 font-black text-sm mb-4">SELLIN (PHÁT HÀNG)</h4>
                                <div class="flex justify-between items-center mb-6">
                                    <div class="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-500 border border-blue-100 shrink-0 shadow-inner">
                                        <i class="fa-solid fa-truck text-2xl"></i>
                                    </div>
                                    <div class="text-center flex-1 border-r border-gray-100 px-2">
                                        <div class="text-[10px] text-gray-500 font-bold mb-1">Hiệu suất yêu cầu</div>
                                        <div class="text-4xl font-black text-blue-600 leading-none">${reqPaceSI}</div>
                                        <div class="text-[10px] text-gray-400 font-bold mt-1">xe/ngày</div>
                                    </div>
                                    <div class="text-center flex-1 px-2">
                                        <div class="text-[10px] text-gray-500 font-bold mb-1">So với hôm qua</div>
                                        <div class="text-lg font-black ${diffPaceSI <= 0 ? 'text-green-500' : 'text-red-500'} flex items-center justify-center gap-1">
                                            <i class="fa-solid ${diffPaceSI <= 0 ? 'fa-arrow-down' : 'fa-arrow-up'} text-sm"></i> ${diffPaceSI}
                                        </div>
                                        <div class="text-[9px] font-medium text-gray-400 mt-1">Hôm qua: <span class="font-bold">${avgPaceYesterdaySI}</span></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-[10px] font-bold text-gray-500 mb-2">
                                        <span>Mức áp lực</span>
                                        <span class="${reqPaceSI > avgPaceSI ? 'text-red-500' : 'text-green-500'}">${reqPaceSI > avgPaceSI ? 'Cần tăng tốc' : 'Đang ổn định'}</span>
                                    </div>
                                    <div class="flex gap-1 h-2 relative">
                                        <div class="w-1/3 bg-green-500 rounded-l-full"></div>
                                        <div class="w-1/3 bg-yellow-400"></div>
                                        <div class="w-1/3 bg-red-500 rounded-r-full relative"></div>
                                        <div class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-slate-700 rounded-full shadow-md transition-all duration-500" style="left: calc(${pressurePctSI}% - 8px);"></div>
                                    </div>
                                </div>
                            </div>

                            <!-- Card Sellout -->
                            <div class="border border-gray-200 rounded-xl p-5 relative overflow-hidden bg-white shadow-sm hover:shadow-md transition">
                                <h4 class="text-green-600 font-black text-sm mb-4">SELLOUT (BÁN RA)</h4>
                                <div class="flex justify-between items-center mb-6">
                                    <div class="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center text-green-600 border border-green-100 shrink-0 shadow-inner">
                                        <i class="fa-solid fa-cart-shopping text-2xl"></i>
                                    </div>
                                    <div class="text-center flex-1 border-r border-gray-100 px-2">
                                        <div class="text-[10px] text-gray-500 font-bold mb-1">Hiệu suất yêu cầu</div>
                                        <div class="text-4xl font-black text-green-600 leading-none">${reqPaceSO}</div>
                                        <div class="text-[10px] text-gray-400 font-bold mt-1">xe/ngày</div>
                                    </div>
                                    <div class="text-center flex-1 px-2">
                                        <div class="text-[10px] text-gray-500 font-bold mb-1">So với hôm qua</div>
                                        <div class="text-lg font-black ${diffPaceSO <= 0 ? 'text-green-500' : 'text-red-500'} flex items-center justify-center gap-1">
                                            <i class="fa-solid ${diffPaceSO <= 0 ? 'fa-arrow-down' : 'fa-arrow-up'} text-sm"></i> ${diffPaceSO}
                                        </div>
                                        <div class="text-[9px] font-medium text-gray-400 mt-1">Hôm qua: <span class="font-bold">${avgPaceYesterdaySO}</span></div>
                                    </div>
                                </div>
                                <div>
                                    <div class="flex justify-between text-[10px] font-bold text-gray-500 mb-2">
                                        <span>Mức áp lực</span>
                                        <span class="${reqPaceSO > avgPaceSO ? 'text-red-500' : 'text-green-500'}">${reqPaceSO > avgPaceSO ? 'Cần tăng tốc' : 'Đang ổn định'}</span>
                                    </div>
                                    <div class="flex gap-1 h-2 relative">
                                        <div class="w-1/3 bg-green-500 rounded-l-full"></div>
                                        <div class="w-1/3 bg-yellow-400"></div>
                                        <div class="w-1/3 bg-red-500 rounded-r-full relative"></div>
                                        <div class="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white border-[3px] border-slate-700 rounded-full shadow-md transition-all duration-500" style="left: calc(${pressurePctSO}% - 8px);"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="mt-5 flex items-center justify-center gap-2 text-[11px] font-bold text-blue-700 bg-blue-50 py-2.5 rounded-lg border border-blue-100">
                            <i class="fa-regular fa-lightbulb"></i> Đây là sản lượng cần hoàn thành trong hôm nay để vẫn đạt mục tiêu Tháng.
                        </div>
                    </div>

                    <!-- SECTION 2: TIẾN ĐỘ THÁNG -->
                    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                        <h3 class="text-sm font-black text-slate-800 uppercase flex items-center gap-2 border-b border-gray-100 pb-3 mb-5">
                            <span class="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px]">2</span> 
                            TIẾN ĐỘ THÁNG ${currentMonth} <span class="text-[10px] font-bold text-gray-400 ml-1">(01/${String(currentMonth).padStart(2,'0')} - ${String(daysInMonth).padStart(2,'0')}/${String(currentMonth).padStart(2,'0')})</span>
                        </h3>

                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <!-- Sellin Progress -->
                            <div class="border border-gray-200 rounded-xl p-5 bg-slate-50/50">
                                <h4 class="text-blue-600 font-black text-sm mb-4">SELLIN (PHÁT HÀNG)</h4>
                                <div class="flex justify-between text-xs mb-3">
                                    <div class="text-gray-500 font-bold">Mục tiêu<br><span class="text-xl font-black text-slate-800">${targetSI.toLocaleString('vi-VN')} <span class="text-[10px]">xe</span></span></div>
                                    <div class="text-gray-500 font-bold text-center">Đã đạt<br><span class="text-xl font-black text-blue-600">${actualSI.toLocaleString('vi-VN')} <span class="text-[10px]">xe</span></span></div>
                                    <div class="text-gray-500 font-bold text-right">Còn thiếu<br><span class="text-xl font-black text-red-500">${missingSI.toLocaleString('vi-VN')} <span class="text-[10px]">xe</span></span></div>
                                </div>
                                <div class="relative pt-1 mb-5">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-[10px] font-bold text-gray-400">Tiến độ HT</span>
                                        <span class="text-sm font-black text-blue-600">${pctSI}%</span>
                                    </div>
                                    <div class="overflow-hidden h-3 flex rounded-full bg-blue-100 shadow-inner">
                                        <div style="width: ${pctSI}%" class="shadow-none flex flex-col justify-center bg-blue-600 rounded-full transition-all duration-1000"></div>
                                    </div>
                                </div>
                                <div class="flex justify-between text-center pt-4 border-t border-gray-200">
                                    <div><div class="text-[9px] text-gray-500 font-bold uppercase mb-1">Số ngày còn lại</div><div class="text-sm font-black text-slate-800">${daysLeft} ngày</div></div>
                                    <div><div class="text-[9px] text-gray-500 font-bold uppercase mb-1">Hiệu suất bình quân</div><div class="text-sm font-black text-slate-800">${avgPaceSI} <span class="text-[9px] font-bold">xe/ngày</span></div></div>
                                    <div><div class="text-[9px] text-gray-500 font-bold uppercase mb-1">Hiệu suất yêu cầu</div><div class="text-sm font-black text-red-500">${reqPaceSI} <span class="text-[9px] font-bold">xe/ngày</span></div></div>
                                </div>
                            </div>

                            <!-- Sellout Progress -->
                            <div class="border border-gray-200 rounded-xl p-5 bg-slate-50/50">
                                <h4 class="text-green-600 font-black text-sm mb-4">SELLOUT (BÁN RA)</h4>
                                <div class="flex justify-between text-xs mb-3">
                                    <div class="text-gray-500 font-bold">Mục tiêu<br><span class="text-xl font-black text-slate-800">${targetSO.toLocaleString('vi-VN')} <span class="text-[10px]">xe</span></span></div>
                                    <div class="text-gray-500 font-bold text-center">Đã đạt<br><span class="text-xl font-black text-green-600">${actualSO.toLocaleString('vi-VN')} <span class="text-[10px]">xe</span></span></div>
                                    <div class="text-gray-500 font-bold text-right">Còn thiếu<br><span class="text-xl font-black text-red-500">${missingSO.toLocaleString('vi-VN')} <span class="text-[10px]">xe</span></span></div>
                                </div>
                                <div class="relative pt-1 mb-5">
                                    <div class="flex items-center justify-between mb-1">
                                        <span class="text-[10px] font-bold text-gray-400">Tiến độ HT</span>
                                        <span class="text-sm font-black text-green-600">${pctSO}%</span>
                                    </div>
                                    <div class="overflow-hidden h-3 flex rounded-full bg-green-100 shadow-inner">
                                        <div style="width: ${pctSO}%" class="shadow-none flex flex-col justify-center bg-green-600 rounded-full transition-all duration-1000"></div>
                                    </div>
                                </div>
                                <div class="flex justify-between text-center pt-4 border-t border-gray-200">
                                    <div><div class="text-[9px] text-gray-500 font-bold uppercase mb-1">Số ngày còn lại</div><div class="text-sm font-black text-slate-800">${daysLeft} ngày</div></div>
                                    <div><div class="text-[9px] text-gray-500 font-bold uppercase mb-1">Hiệu suất bình quân</div><div class="text-sm font-black text-slate-800">${avgPaceSO} <span class="text-[9px] font-bold">xe/ngày</span></div></div>
                                    <div><div class="text-[9px] text-gray-500 font-bold uppercase mb-1">Hiệu suất yêu cầu</div><div class="text-sm font-black text-red-500">${reqPaceSO} <span class="text-[9px] font-bold">xe/ngày</span></div></div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 3: DUAL PACE TIMELINE (BIỂU ĐỒ) -->
                    <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 md:p-5">
                        <h3 class="text-sm font-black text-slate-800 uppercase flex items-center gap-2 border-b border-gray-100 pb-3 mb-4">
                            <span class="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px]">3</span> 
                            NHỊP ĐỘ CHI TIẾT THEO NGÀY (DUAL PACE TIMELINE)
                        </h3>
                        
                        <!-- Chú thích (Legend) cập nhật cho biểu đồ kết hợp -->
                        <div class="flex flex-wrap gap-5 items-center justify-center text-[11px] font-bold text-slate-600 mb-6 bg-slate-50 py-2.5 px-4 rounded-xl border border-slate-100">
                            <div class="flex items-center gap-1.5"><div class="w-5 border-b-2 border-dashed border-gray-400"></div> Kế hoạch lũy kế</div>
                            <div class="flex items-center gap-1.5"><div class="w-5 border-b-[3px] border-blue-600"></div> Lũy kế (SI)</div>
                            <div class="flex items-center gap-1.5"><div class="w-3 h-3 bg-blue-300 rounded-[3px]"></div> Nhập ngày (SI)</div>
                            <div class="flex items-center gap-1.5"><div class="w-5 border-b-[3px] border-green-600"></div> Lũy kế (SO)</div>
                            <div class="flex items-center gap-1.5"><div class="w-3 h-3 bg-green-300 rounded-[3px]"></div> Nhập ngày (SO)</div>
                            <div class="flex items-center gap-1.5"><div class="w-2.5 h-2.5 rotate-45 bg-red-500"></div> Hôm nay</div>
                        </div>

                        <!-- SI Chart Row -->
                        <div class="flex flex-col md:flex-row items-center border-b border-gray-100 border-dashed pb-6 mb-6">
                            <!-- Left Column: Icon + Forecast Card -->
                            <div class="w-full md:w-32 flex flex-col items-center justify-center shrink-0 mb-4 md:mb-0 space-y-4 pr-2">
                                <div class="flex flex-col items-center">
                                    <div class="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center text-xl border border-blue-100 mb-2 shadow-sm"><i class="fa-solid fa-truck"></i></div>
                                    <div class="text-[10px] font-black text-blue-600 uppercase text-center">SELLIN<br>(PHÁT HÀNG)</div>
                                </div>
                                <div class="flex flex-col w-full text-center border border-blue-100 rounded-lg overflow-hidden shadow-sm bg-white">
                                    <div class="bg-slate-50 p-1.5 border-b border-blue-100">
                                        <div class="text-[9px] text-gray-500 font-medium">Mục tiêu</div>
                                        <div class="text-[11px] font-black text-slate-800">${targetSI.toLocaleString('vi-VN')} xe</div>
                                    </div>
                                    <div class="p-1.5">
                                        <div class="text-[9px] text-blue-600 font-bold leading-tight mb-0.5">Dự báo nếu giữ<br>nhịp hiện tại</div>
                                        <div class="text-[11px] font-black text-blue-700">${forecastSI.toLocaleString('vi-VN')} xe <span class="text-[9px]">(${forecastPctSI}%)</span></div>
                                    </div>
                                </div>
                            </div>
                            <!-- Right Column: Chart -->
                            <div class="flex-1 w-full min-w-0">
                                <div id="sale_chart_si" class="w-full h-[220px]"></div>
                            </div>
                        </div>

                        <!-- SO Chart Row -->
                        <div class="flex flex-col md:flex-row items-center">
                            <!-- Left Column: Icon + Forecast Card -->
                            <div class="w-full md:w-32 flex flex-col items-center justify-center shrink-0 mb-4 md:mb-0 space-y-4 pr-2">
                                <div class="flex flex-col items-center">
                                    <div class="w-12 h-12 rounded-full bg-green-50 text-green-600 flex items-center justify-center text-xl border border-green-100 mb-2 shadow-sm"><i class="fa-solid fa-cart-shopping"></i></div>
                                    <div class="text-[10px] font-black text-green-600 uppercase text-center">SELLOUT<br>(BÁN RA)</div>
                                </div>
                                <div class="flex flex-col w-full text-center border border-green-100 rounded-lg overflow-hidden shadow-sm bg-white">
                                    <div class="bg-slate-50 p-1.5 border-b border-green-100">
                                        <div class="text-[9px] text-gray-500 font-medium">Mục tiêu</div>
                                        <div class="text-[11px] font-black text-slate-800">${targetSO.toLocaleString('vi-VN')} xe</div>
                                    </div>
                                    <div class="p-1.5">
                                        <div class="text-[9px] text-green-600 font-bold leading-tight mb-0.5">Dự báo nếu giữ<br>nhịp hiện tại</div>
                                        <div class="text-[11px] font-black text-green-700">${forecastSO.toLocaleString('vi-VN')} xe <span class="text-[9px]">(${forecastPctSO}%)</span></div>
                                    </div>
                                </div>
                            </div>
                            <!-- Right Column: Chart -->
                            <div class="flex-1 w-full min-w-0">
                                <div id="sale_chart_so" class="w-full h-[220px]"></div>
                            </div>
                        </div>
                    </div>

                    <!-- SECTION 4: CHUỖI VẬN HÀNH & KẾT QUẢ 7 NGÀY -->
                    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <!-- Chuỗi vận hành -->
                        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <h3 class="text-sm font-black text-slate-800 uppercase mb-5 border-b border-gray-100 pb-3 flex items-center gap-2">
                                <span class="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px]">4</span> 
                                CHUỖI VẬN HÀNH
                            </h3>
                            <div class="flex items-center justify-between text-center mt-4 px-2 relative">
                                <div class="absolute top-[20px] left-0 right-0 h-[2px] bg-gray-100 -z-10"></div>
                                
                                <div class="flex flex-col items-center bg-white px-1">
                                    <div class="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-2 shadow-sm border border-purple-100"><i class="fa-solid fa-clipboard-check text-xl"></i></div>
                                    <div class="text-[10px] font-black uppercase mb-2 text-slate-800">ĐƠN TT</div>
                                    <div class="text-[9px] text-gray-400 font-medium">Mục tiêu<br><span class="font-bold text-slate-800">${targetTT.toLocaleString('vi-VN')} xe</span></div>
                                    <div class="text-[9px] text-gray-400 font-medium mt-1.5">Đã đạt<br><span class="font-bold text-slate-800">${actualTT.toLocaleString('vi-VN')} xe</span></div>
                                    <div class="text-xs font-black text-purple-600 mt-1 bg-purple-50 px-2 py-0.5 rounded">${pctTT}%</div>
                                </div>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-sm bg-white"></i>
                                
                                <div class="flex flex-col items-center bg-white px-1">
                                    <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-2 shadow-sm border border-blue-100"><i class="fa-solid fa-truck text-xl"></i></div>
                                    <div class="text-[10px] font-black uppercase mb-2 text-slate-800">SELLIN</div>
                                    <div class="text-[9px] text-gray-400 font-medium">Mục tiêu<br><span class="font-bold text-slate-800">${targetSI.toLocaleString('vi-VN')} xe</span></div>
                                    <div class="text-[9px] text-gray-400 font-medium mt-1.5">Đã đạt<br><span class="font-bold text-slate-800">${actualSI.toLocaleString('vi-VN')} xe</span></div>
                                    <div class="text-xs font-black text-blue-600 mt-1 bg-blue-50 px-2 py-0.5 rounded">${pctSI}%</div>
                                </div>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-sm bg-white"></i>
                                
                                <div class="flex flex-col items-center bg-white px-1">
                                    <div class="w-12 h-12 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-2 shadow-sm border border-green-100"><i class="fa-solid fa-cart-shopping text-xl"></i></div>
                                    <div class="text-[10px] font-black uppercase mb-2 text-slate-800">SELLOUT</div>
                                    <div class="text-[9px] text-gray-400 font-medium">Mục tiêu<br><span class="font-bold text-slate-800">${targetSO.toLocaleString('vi-VN')} xe</span></div>
                                    <div class="text-[9px] text-gray-400 font-medium mt-1.5">Đã đạt<br><span class="font-bold text-slate-800">${actualSO.toLocaleString('vi-VN')} xe</span></div>
                                    <div class="text-xs font-black text-green-600 mt-1 bg-green-50 px-2 py-0.5 rounded">${pctSO}%</div>
                                </div>
                                <i class="fa-solid fa-chevron-right text-gray-300 text-sm bg-white"></i>
                                
                                <div class="flex flex-col items-center bg-white px-1">
                                    <div class="w-12 h-12 bg-orange-50 text-orange-500 rounded-xl flex items-center justify-center mb-2 shadow-sm border border-orange-100"><i class="fa-solid fa-box-open text-xl"></i></div>
                                    <div class="text-[10px] font-black uppercase mb-2 text-orange-500">HÀNG CHƯA<br>PHÁT</div>
                                    <div class="text-[9px] text-gray-400 font-medium mt-3">Hiện tại<br><span class="font-black text-slate-800 text-sm">${pendingSI.toLocaleString('vi-VN')} xe</span></div>
                                </div>
                            </div>
                        </div>

                        <!-- Bảng kết quả 7 ngày -->
                        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                            <div class="flex justify-between items-center mb-4 border-b border-gray-100 pb-3">
                                <h3 class="text-sm font-black text-slate-800 uppercase flex items-center gap-2">
                                    <span class="w-5 h-5 bg-orange-500 text-white rounded-full flex items-center justify-center text-[10px]">5</span> 
                                    KẾT QUẢ 7 NGÀY GẦN NHẤT
                                </h3>
                                <button onclick="window.switchErpTab('market')" class="text-[11px] font-bold text-blue-500 hover:underline outline-none bg-blue-50 px-2 py-1 rounded">Xem chi tiết <i class="fa-solid fa-chevron-right text-[9px] ml-0.5"></i></button>
                            </div>
                            <div class="overflow-x-auto">
                                <table class="w-full text-center text-[11px] whitespace-nowrap">
                                    <thead class="text-gray-400 font-medium bg-gray-50/50">
                                        <tr>
                                            <th class="py-2 border-b border-gray-100">Ngày</th>
                                            <th class="py-2 text-purple-600 font-bold border-b border-gray-100">Đơn TT</th>
                                            <th class="py-2 text-blue-600 font-bold border-b border-gray-100">Sellin</th>
                                            <th class="py-2 text-green-600 font-bold border-b border-gray-100">Sellout</th>
                                            <th class="py-2 border-b border-gray-100">Trạng thái</th>
                                        </tr>
                                    </thead>
                                    <tbody class="text-slate-700 font-bold divide-y divide-gray-50">
                                        ${last7DaysHtml}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- THANH CÔNG CỤ BOTTOM STICKY BAR -->
                <div class="fixed bottom-0 left-0 right-0 z-50 md:left-64">
                    <div class="bg-[#F97316] p-3 md:p-4 flex justify-between items-center shadow-[0_-5px_15px_rgba(0,0,0,0.15)] rounded-t-2xl md:rounded-none">
                        <div class="flex items-center gap-3">
                            <div class="hidden md:flex w-10 h-10 bg-white/20 rounded-lg items-center justify-center text-white">
                                <i class="fa-solid fa-pen-to-square text-xl"></i>
                            </div>
                            <div>
                                <h3 class="text-white font-black text-sm md:text-base uppercase tracking-tight">BÁO CÁO KẾT QUẢ HÔM NAY</h3>
                                <p class="text-white/80 text-[10px] md:text-xs font-medium">Nhập kết quả cuối ngày để hệ thống cập nhật hiệu suất yêu cầu ngày mai</p>
                            </div>
                        </div>
                        <button onclick="window.customSwitchView('sellout')" class="bg-white text-[#F97316] px-5 py-2.5 rounded-full font-black text-xs md:text-sm shadow-md hover:scale-105 hover:bg-orange-50 transition uppercase whitespace-nowrap outline-none">
                            BÁO CÁO NGAY <i class="fa-solid fa-chevron-right ml-1"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;

        // 11. KHỞI TẠO BIỂU ĐỒ BẰNG APEXCHARTS
        setTimeout(() => {
            if (typeof ApexCharts !== 'undefined') {
                const commonOptions = {
                    chart: { type: 'line', height: 250, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Roboto, sans-serif' },
                    stroke: { width: [2, 3, 0], dashArray: [4, 0, 0], curve: 'straight' },
                    markers: { size: [0, 5, 0], hover: { size: 7 } },
                    plotOptions: { bar: { columnWidth: '40%', borderRadius: 2 } },
                    xaxis: { 
                        categories: chartCategories, 
                        labels: { style: { colors: '#9ca3af', fontSize: '9px', fontWeight: 600 } },
                        tooltip: { enabled: false },
                        axisBorder: { show: false },
                        axisTicks: { show: false }
                    },
                    yaxis: { 
                        labels: { style: { colors: '#9ca3af', fontSize: '9px', fontWeight: 600 } },
                        min: 0
                    },
                    grid: { borderColor: '#f1f5f9', strokeDashArray: 4, padding: { left: 10, right: 10 } },
                    legend: { show: false },
                    tooltip: {
                        theme: 'light',
                        shared: true,
                        intersect: false,
                        y: { formatter: function (val) { return val !== null && val !== undefined ? val + " xe" : "0 xe" } }
                    }
                };

                // ======= BIỂU ĐỒ S.I =======
                const optionsSI = {
                    ...commonOptions,
                    colors: ['#cbd5e1', '#2563eb', '#93c5fd'], 
                    series: [
                        { name: 'Kế hoạch lũy kế (SI)', type: 'line', data: cumPlanSI },
                        { name: 'Thực đạt lũy kế (SI)', type: 'line', data: cumActSI },
                        { name: 'Phát sinh trong ngày (SI)', type: 'column', data: dailyActSI }
                    ],
                    dataLabels: {
                        enabled: true,
                        enabledOnSeries: [1, 2],
                        style: { fontSize: '9px', fontWeight: 800 },
                        background: { enabled: true, foreColor: '#fff', borderRadius: 2, padding: 3, opacity: 1, borderWidth: 0 },
                        offsetY: -5,
                        formatter: function (val) { 
                            if (val === null || val === undefined || val === 0) return '';
                            return val; 
                        }
                    },
                    annotations: {
                        xaxis: [{
                            x: String(daysPassed).padStart(2, '0'),
                            borderColor: '#ef4444',
                            strokeDashArray: 0,
                            label: { text: 'Hôm nay', style: { color: '#fff', background: '#ef4444', fontSize: '9px', fontWeight: 'bold', padding: { left: 4, right: 4, top: 2, bottom: 2 } }, orientation: 'horizontal' }
                        }]
                    }
                };
                new ApexCharts(document.querySelector("#sale_chart_si"), optionsSI).render();

                // ======= BIỂU ĐỒ S.O =======
                const optionsSO = {
                    ...commonOptions,
                    colors: ['#cbd5e1', '#16a34a', '#86efac'], 
                    series: [
                        { name: 'Kế hoạch lũy kế (SO)', type: 'line', data: cumPlanSO },
                        { name: 'Thực đạt lũy kế (SO)', type: 'line', data: cumActSO },
                        { name: 'Phát sinh trong ngày (SO)', type: 'column', data: dailyActSO }
                    ],
                    dataLabels: {
                        enabled: true,
                        enabledOnSeries: [1, 2], 
                        style: { fontSize: '9px', fontWeight: 800 },
                        background: { enabled: true, foreColor: '#fff', borderRadius: 2, padding: 3, opacity: 1, borderWidth: 0 },
                        offsetY: -5,
                        formatter: function (val) { 
                            if (val === null || val === undefined || val === 0) return '';
                            return val; 
                        }
                    },
                    annotations: {
                        xaxis: [{
                            x: String(daysPassed).padStart(2, '0'),
                            borderColor: '#ef4444',
                            strokeDashArray: 0,
                            label: { text: 'Hôm nay', style: { color: '#fff', background: '#ef4444', fontSize: '9px', fontWeight: 'bold', padding: { left: 4, right: 4, top: 2, bottom: 2 } }, orientation: 'horizontal' }
                        }]
                    }
                };
                new ApexCharts(document.querySelector("#sale_chart_so"), optionsSO).render();
            }
        }, 100);

    } catch (err) {
        console.error("Lỗi khi kết xuất Cá Nhân Sale:", err);
        container.innerHTML = `
            <div class="p-10 text-center">
                <i class="fa-solid fa-circle-exclamation text-3xl text-red-500"></i>
                <p class="mt-4 text-red-500 font-bold">Lỗi tải dữ liệu: ${err.message}</p>
            </div>
        `;
    }
};

const originalSwitchErpTab = window.switchErpTab;
window.switchErpTab = (tabId) => {
    if (typeof originalSwitchErpTab === 'function') {
        originalSwitchErpTab(tabId);
    }
    
    if (tabId === 'sale') {
        window.renderErpSalePersonal();
    }
};