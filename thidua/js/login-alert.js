// ==============================================================
// TÍNH NĂNG: POPUP THÔNG BÁO TIẾN ĐỘ THÁNG KHI ĐĂNG NHẬP
// File: login-alert.js
// ==============================================================

window.checkAndShowLoginAlert = async () => {
    // 1. Kiểm tra User hiện tại (Bỏ qua Admin để tránh phiền)
    const user = window.STATE?.currentUser;
    if (!user || user.role === 'Admin') return;

    // --- TÍNH NĂNG MỚI: KHÔNG HIỂN THỊ LẠI NẾU ĐÃ BẤM "ĐÃ HIỂU" HÔM NAY ---
    const todayStr = new Date().toISOString().split('T')[0];
    const storageKey = `yadea_alert_dismissed_${user.full_name}_${todayStr}`;
    
    // Nếu hệ thống ghi nhận hôm nay đã bấm nút rồi thì dừng hàm luôn, không hiện popup
    if (localStorage.getItem(storageKey) === 'true') return;

    const role = user.role || '';
    const nameNorm = (user.full_name || '').trim().toLowerCase();
    
    // 2. Lấy thông tin thời gian tháng hiện tại
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
    const monthStr = String(month).padStart(2, '0');
    const startDate = `${year}-${monthStr}-01`;
    
    // Số ngày trong tháng và ngày kiểm tra báo cáo (Đến ngày hôm qua)
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
    
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    // Nếu hôm qua rơi vào tháng trước (tức hnay là mùng 1), thì không xét thiếu báo cáo
    const checkUntilDay = (yesterday.getMonth() + 1 === month) ? yesterday.getDate() : 0;

    try {
        // 3. Lấy danh sách Sale thuộc quyền quản lý
        let { data: shops } = await window.sb.from('master_shop_list').select('*');
        if (!shops || shops.length === 0) {
            const res = await window.sb.from('assigned_shops').select('*');
            shops = res.data || [];
        }

        let mySales = [];
        if (role === 'RSM' || role.toLowerCase().includes('giám đốc') || role.toLowerCase().includes('gđ')) {
            // Giám đốc: Quản lý nhiều Sale
            const myShops = shops.filter(s => (s.director_name || '').trim().toLowerCase().includes(nameNorm));
            mySales = [...new Set(myShops.map(s => s.sale_name).filter(Boolean))];
        } else {
            // NVKD: Chỉ bản thân
            mySales = [user.full_name];
        }

        if (mySales.length === 0) return;

        // 4. Fetch Mục tiêu (Targets)
        const { data: targets } = await window.sb.from('monthly_sale_targets')
            .select('*').in('sale_name', mySales);
            
        let totalTargetSI = 0, totalTargetSO = 0;
        targets?.forEach(t => {
            const tMonth = t.report_month || t.month;
            if (tMonth && tMonth.startsWith(`${year}-${monthStr}`)) {
                totalTargetSI += Number(t.target_si || t.target_ph || 0);
                totalTargetSO += Number(t.target_so || 0);
            }
        });

        // 5. Fetch Thực đạt (S.I và S.O)
        const [resSI, resSO] = await Promise.all([
            window.sb.from('game_si_reports').select('*').gte('report_date', startDate).lte('report_date', endDate).in('sale_name', mySales),
            window.sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', endDate).in('sale_name', mySales)
        ]);
        
        const siData = resSI.data || [];
        const soData = resSO.data || [];

        let actualSI = 0, actualSO = 0;
        siData.forEach(r => { if(r.status !== 'rejected') actualSI += Number(r.xuat_hang || 0); });
        soData.forEach(r => { if(r.status !== 'rejected') actualSO += Number(r.total_so || 0); });

        const missingSI = Math.max(0, totalTargetSI - actualSI);
        const missingSO = Math.max(0, totalTargetSO - actualSO);

        // 6. Kiểm tra các ngày quên báo cáo (Tính từ mùng 1 đến Hôm qua)
        let missingDaysSet = new Set();
        if (checkUntilDay > 0) {
            for (let d = 1; d <= checkUntilDay; d++) {
                const fullDate = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
                const displayDate = `${String(d).padStart(2, '0')}/${monthStr}`;
                
                mySales.forEach(sale => {
                    const hasSI = siData.find(r => r.report_date === fullDate && r.sale_name === sale && (Number(r.thanh_toan||0) > 0 || Number(r.xuat_hang||0) > 0));
                    const hasSO = soData.find(r => r.report_date === fullDate && r.sale_name === sale && Number(r.total_so||0) >= 0);
                    
                    if (!hasSI || !hasSO) {
                        missingDaysSet.add(displayDate);
                    }
                });
            }
        }
        
        const missingDaysArr = Array.from(missingDaysSet).sort();
        const missingDaysStr = missingDaysArr.join(', ');

        // Đánh giá hoàn thành 100% (Không thiếu Target và Không thiếu báo cáo)
        const isFullyCompleted = (missingSI === 0 && missingSO === 0 && missingDaysArr.length === 0);

        // 7. Render giao diện Popup
        const modalId = 'login-progress-modal';
        if (document.getElementById(modalId)) document.getElementById(modalId).remove();

        // Nút ĐÃ HIỂU được thêm lệnh lưu localStorage trước khi xóa modal
        const closeScript = `localStorage.setItem('${storageKey}', 'true'); document.getElementById('${modalId}').remove();`;

        let modalContent = '';
        if (isFullyCompleted) {
            modalContent = `
                <div class="text-center p-4">
                    <div class="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
                        <i class="fa-solid fa-check-double text-3xl"></i>
                    </div>
                    <h3 class="text-xl font-black text-green-600 uppercase mb-3 tracking-tight">XUẤT SẮC!</h3>
                    <p class="text-slate-600 font-medium mb-6 text-sm leading-relaxed">Bạn đã hoàn thành Target và báo cáo đầy đủ trong tháng.<br>Tiếp tục duy trì nhé – <strong class="text-orange-500 text-base">YADEA FIGHTING!</strong></p>
                    <button onclick="${closeScript}" class="w-full bg-green-600 text-white font-black py-3.5 rounded-xl hover:bg-green-700 transition shadow-lg uppercase text-sm">
                        ĐÃ HIỂU - VÀO HỆ THỐNG
                    </button>
                </div>
            `;
        } else {
            const roleTxt = role.includes('Giám đốc') ? '(Toàn Vùng)' : '(Cá Nhân)';
            modalContent = `
                <div class="p-2">
                    <div class="flex flex-col items-center justify-center gap-2 mb-6 border-b border-gray-100 pb-5 text-center">
                        <div class="w-12 h-12 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mb-1">
                            <i class="fa-solid fa-bullhorn text-2xl"></i>
                        </div>
                        <h3 class="text-lg md:text-xl font-black text-slate-800 uppercase tracking-tight">THÔNG BÁO TIẾN ĐỘ THÁNG ${month}</h3>
                    </div>
                    
                    <div class="space-y-4 mb-6">
                        <!-- Box 1: Target -->
                        <div class="bg-orange-50 border border-orange-100 p-4 rounded-2xl relative overflow-hidden">
                            <div class="absolute -right-4 -bottom-4 opacity-10 text-6xl"><i class="fa-solid fa-bullseye"></i></div>
                            <h4 class="font-black text-orange-600 text-xs md:text-sm mb-3 uppercase relative z-10">1. Tiến độ Target ${roleTxt}</h4>
                            <div class="grid grid-cols-2 gap-3 relative z-10">
                                <div class="bg-white p-3 rounded-xl border border-orange-100/50 text-center shadow-sm">
                                    <div class="text-[10px] text-gray-500 font-bold mb-1">S.I CÒN THIẾU</div>
                                    <div class="text-xl font-black text-blue-600">${missingSI.toLocaleString('vi-VN')} <span class="text-[10px] text-gray-400">xe</span></div>
                                </div>
                                <div class="bg-white p-3 rounded-xl border border-orange-100/50 text-center shadow-sm">
                                    <div class="text-[10px] text-gray-500 font-bold mb-1">S.O CÒN THIẾU</div>
                                    <div class="text-xl font-black text-green-600">${missingSO.toLocaleString('vi-VN')} <span class="text-[10px] text-gray-400">xe</span></div>
                                </div>
                            </div>
                        </div>

                        <!-- Box 2: Báo Cáo -->
                        <div class="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                            <h4 class="font-black text-slate-700 text-xs md:text-sm mb-2 uppercase"><i class="fa-regular fa-calendar-xmark text-red-500 mr-1"></i> 2. Tiến độ báo cáo</h4>
                            ${missingDaysArr.length > 0 
                                ? `<p class="text-[13px] text-slate-600 mt-2 leading-relaxed font-medium">Bạn còn thiếu báo cáo các ngày:<br><span class="font-bold text-red-500 text-sm block mt-1.5 p-2 bg-red-50 border border-red-100 rounded-lg">${missingDaysStr}</span></p>`
                                : `<p class="text-[13px] text-green-600 mt-2 font-bold flex items-center gap-2"><i class="fa-solid fa-circle-check"></i> Đã báo cáo đầy đủ các ngày qua.</p>`
                            }
                        </div>
                    </div>
                    
                    <p class="text-center text-xs font-medium text-slate-500 mb-6 italic leading-relaxed">
                        Vui lòng kiểm tra và hoàn thành đúng tiến độ.<br>
                        <span class="text-[#F97316] font-black not-italic text-base inline-block mt-1">YADEA FIGHTING!</span>
                    </p>
                    
                    <button onclick="${closeScript}" class="w-full bg-gradient-to-r from-[#F97316] to-[#ea580c] text-white font-black py-3.5 rounded-xl hover:opacity-90 transition shadow-lg shadow-orange-500/30 uppercase text-sm flex justify-center items-center gap-2">
                        ĐÃ HIỂU - VÀO HỆ THỐNG <i class="fa-solid fa-arrow-right-to-bracket"></i>
                    </button>
                </div>
            `;
        }

        const modalHTML = `
            <div id="${modalId}" class="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/80 backdrop-blur-sm px-4 fade-in">
                <div class="bg-white rounded-[24px] shadow-2xl w-full max-w-md overflow-hidden animate-slide-up border border-white/20">
                    <div class="p-5 md:p-6">
                        ${modalContent}
                    </div>
                </div>
            </div>
            <style>
                .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
                @keyframes slideUp { 0% { opacity: 0; transform: translateY(30px) scale(0.95); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
            </style>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

    } catch (err) {
        console.error("Lỗi khi tạo Popup Cảnh báo tiến độ:", err);
    }
};