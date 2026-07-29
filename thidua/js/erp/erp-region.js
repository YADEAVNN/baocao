// ==========================================
// FILE: js/erp/erp-region.js
// TẦNG 2 - PHÂN TÍCH NHỊP ĐỘ KHU VỰC & SALE
// ==========================================

const fmtRegNum = (num) => isNaN(num) ? '0' : Math.round(Number(num)).toLocaleString('vi-VN');
const safeDivR = (a, b) => (b === 0 ? 0 : a / b);

window.initErpRegion = async function() {
    const container = document.getElementById('erp-tab-region');
    if (!container) return;

    if (container.innerHTML.trim() === '') {
        container.innerHTML = `
            <div class="px-4 py-6 md:px-6 space-y-6 max-w-[1600px] mx-auto fade-in">
                
                <!-- HEADER KHU VỰC -->
                <div class="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-white p-5 rounded-2xl shadow-sm border border-gray-200 gap-4">
                    <div>
                        <h1 class="text-xl font-black text-slate-800 uppercase tracking-tight">TRUNG TÂM ĐIỀU HÀNH NHỊP ĐỘ - KHU VỰC</h1>
                        <p class="text-sm text-gray-500 font-bold uppercase tracking-widest mt-1">Tầng 2 - Phân tích khu vực</p>
                    </div>
                    
                    <div class="flex flex-wrap items-center gap-6">
                        <div class="text-center">
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Khu Vực</p>
                            <div class="relative">
                                <select id="reg-filter-region" onchange="window.loadDataRegionTab()" class="appearance-none bg-transparent text-[#F97316] font-black text-2xl outline-none cursor-pointer uppercase tracking-tight pr-6">
                                    <option value="Tây Bắc">TÂY BẮC BỘ</option>
                                    <option value="Hà Nội" selected>HÀ NỘI</option>
                                    <option value="Đông Bắc">ĐÔNG BẮC</option>
                                    <option value="Hồng Hà">HỒNG HÀ</option>
                                    <option value="Bắc Trung Bộ">BẮC TRUNG BỘ</option>
                                    <option value="Trung Trung Bộ">TRUNG TRUNG BỘ</option>
                                    <option value="Nam Trung Bộ">NAM TRUNG BỘ</option>
                                    <option value="Tây Nguyên">TÂY NGUYÊN</option>
                                    <option value="Đông Nam">ĐÔNG NAM</option>
                                    <option value="Hồ Chí Minh">HỒ CHÍ MINH</option>
                                    <option value="Tây Nam">TÂY NAM</option>
                                    <option value="Sông Cửu Long">SÔNG CỬU LONG</option>
                                </select>
                                <i class="fa-solid fa-chevron-down text-[#F97316] absolute right-0 top-1/2 -translate-y-1/2 text-sm pointer-events-none"></i>
                            </div>
                        </div>
                        
                        <div class="h-10 w-px bg-gray-200 hidden md:block"></div>
                        
                        <!-- ĐÃ FIX: CHUYỂN TỪ LỌC THÁNG SANG LỌC TỪ NGÀY ... ĐẾN NGÀY -->
                        <div class="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-2 shadow-inner">
                            <div class="flex items-center gap-2 px-2">
                                <i class="fa-regular fa-calendar text-gray-400"></i>
                                <input type="date" id="reg-filter-date-start" onchange="window.loadDataRegionTab()" class="bg-transparent border-none font-black text-slate-800 outline-none cursor-pointer text-sm w-32">
                            </div>
                            <span class="text-gray-400 font-bold">-</span>
                            <div class="flex items-center gap-2 px-2">
                                <input type="date" id="reg-filter-date-end" onchange="window.loadDataRegionTab()" class="bg-transparent border-none font-black text-slate-800 outline-none cursor-pointer text-sm w-32">
                                <i class="fa-regular fa-calendar text-gray-400"></i>
                            </div>
                        </div>

                        <div class="h-10 w-px bg-gray-200 hidden md:block"></div>

                        <div class="text-right">
                            <p class="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Cập nhật lúc</p>
                            <p class="font-black text-sm text-slate-800 flex items-center gap-2">
                                <span id="reg-last-update">--:-- --/--/----</span>
                                <button onclick="window.loadDataRegionTab()" class="text-gray-400 hover:text-blue-600 transition"><i class="fa-solid fa-rotate"></i></button>
                            </p>
                        </div>
                    </div>
                </div>

                <!-- MAIN GRID -->
                <div class="grid grid-cols-1 xl:grid-cols-3 gap-6">
                    
                    <!-- ================= CỘT TRÁI (Span 2) ================= -->
                    <div class="xl:col-span-2 space-y-6">
                        
                        <!-- 1. CHUỖI VẬN HÀNH -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                            <h3 class="text-sm font-black text-blue-800 uppercase mb-5 flex items-center gap-2">
                                <span class="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">1</span> 
                                CHUỖI VẬN HÀNH TOÀN KHU VỰC
                            </h3>
                            
                            <div class="flex flex-col md:flex-row items-center gap-3">
                                <div class="flex-1 w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 relative shadow-sm">
                                    <div class="flex items-center gap-2 text-xs font-black text-indigo-600 uppercase tracking-tight mb-3">
                                        <div class="w-8 h-8 rounded bg-indigo-100 flex items-center justify-center text-lg"><i class="fa-solid fa-clipboard-check"></i></div>
                                        ĐƠN THANH TOÁN
                                    </div>
                                    <div class="text-3xl font-black text-slate-800 mb-2" id="reg-val-tt">0 <span class="text-sm font-bold text-gray-400">xe</span></div>
                                    <div class="text-[10px] font-bold text-gray-400 uppercase mb-1">Tổng trong giai đoạn</div>
                                    <div class="absolute bottom-0 left-0 w-full h-1 bg-indigo-500 rounded-b-2xl"></div>
                                </div>
                                <div class="hidden md:block text-gray-300"><i class="fa-solid fa-arrow-right-long text-2xl"></i></div>

                                <div class="flex-1 w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 relative shadow-sm">
                                    <div class="flex items-center gap-2 text-xs font-black text-blue-600 uppercase tracking-tight mb-3">
                                        <div class="w-8 h-8 rounded bg-blue-100 flex items-center justify-center text-lg"><i class="fa-solid fa-truck-fast"></i></div>
                                        PHÁT HÀNG (SELLIN)
                                    </div>
                                    <div class="text-3xl font-black text-slate-800 mb-2" id="reg-val-si">0 <span class="text-sm font-bold text-gray-400">xe</span></div>
                                    <div class="text-[10px] font-bold text-gray-400 uppercase mb-1">Tổng trong giai đoạn</div>
                                    <div class="absolute bottom-0 left-0 w-full h-1 bg-blue-500 rounded-b-2xl"></div>
                                </div>
                                <div class="hidden md:block text-gray-300"><i class="fa-solid fa-arrow-right-long text-2xl"></i></div>

                                <div class="flex-1 w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 relative shadow-sm">
                                    <div class="flex items-center gap-2 text-xs font-black text-emerald-600 uppercase tracking-tight mb-3">
                                        <div class="w-8 h-8 rounded bg-emerald-100 flex items-center justify-center text-lg"><i class="fa-solid fa-cart-shopping"></i></div>
                                        BÁN RA (SELLOUT)
                                    </div>
                                    <div class="text-3xl font-black text-slate-800 mb-2" id="reg-val-so">0 <span class="text-sm font-bold text-gray-400">xe</span></div>
                                    <div class="text-[10px] font-bold text-gray-400 uppercase mb-1">Tổng trong giai đoạn</div>
                                    <div class="absolute bottom-0 left-0 w-full h-1 bg-emerald-500 rounded-b-2xl"></div>
                                </div>
                                <div class="hidden md:block text-gray-300"><i class="fa-solid fa-arrow-right-long text-2xl"></i></div>

                                <div class="flex-1 w-full bg-orange-50/50 p-4 rounded-2xl border border-orange-100 relative shadow-sm">
                                    <div class="flex items-center gap-2 text-xs font-black text-orange-600 uppercase tracking-tight mb-3">
                                        <div class="w-8 h-8 rounded bg-orange-100 flex items-center justify-center text-lg"><i class="fa-solid fa-box-open"></i></div>
                                        HÀNG CHƯA PHÁT
                                    </div>
                                    <div class="text-3xl font-black text-slate-800 mb-2" id="reg-val-cx">0 <span class="text-sm font-bold text-gray-400">xe</span></div>
                                    <div class="text-[10px] font-bold text-gray-400 uppercase mb-1">Tại thời điểm hiện tại</div>
                                    <div class="absolute bottom-0 left-0 w-full h-1 bg-orange-500 rounded-b-2xl"></div>
                                </div>
                            </div>
                        </div>

                        <!-- 2. NHỊP ĐỘ TỔNG QUAN -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                            <h3 class="text-sm font-black text-blue-800 uppercase mb-5 flex items-center gap-2">
                                <span class="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">2</span> 
                                NHỊP ĐỘ TỔNG QUAN (SO VỚI MỤC TIÊU THÁNG GIAO TẠI NGÀY GẦN NHẤT)
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <!-- Box SI -->
                                <div class="border border-gray-100 rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] bg-slate-50/50">
                                    <div class="flex justify-between items-center mb-4">
                                        <div class="flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase border border-blue-100">
                                            <i class="fa-solid fa-chart-pie"></i> NHỊP ĐỘ SELLIN (PHÁT HÀNG)
                                        </div>
                                    </div>
                                    <div class="flex justify-between items-end mb-2">
                                        <div>
                                            <p class="text-[10px] font-bold text-gray-400 uppercase">Thực đạt / Mục tiêu</p>
                                            <p class="text-xl font-black text-slate-800"><span id="reg-box-si-act">0</span> <span class="text-sm text-gray-400 font-bold">/ <span id="reg-box-si-tar">0</span> xe</span></p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Nhịp bám đuổi (Chuẩn)</p>
                                            <span class="font-black text-lg text-slate-800" id="reg-box-si-pace">0%</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between gap-3 mt-4">
                                        <div class="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden relative">
                                            <div id="reg-bar-si" class="bg-blue-600 h-full rounded-full transition-all duration-700" style="width: 0%"></div>
                                        </div>
                                        <span class="text-xs font-black text-blue-600" id="reg-pct-si">0%</span>
                                    </div>
                                    <div class="mt-3 text-right" id="reg-status-si">
                                        <span class="bg-gray-100 text-gray-500 px-3 py-1 rounded text-[10px] font-black uppercase shadow-sm">--</span>
                                    </div>
                                </div>

                                <!-- Box SO -->
                                <div class="border border-gray-100 rounded-xl p-4 shadow-[0_2px_10px_-3px_rgba(0,0,0,0.05)] bg-slate-50/50">
                                    <div class="flex justify-between items-center mb-4">
                                        <div class="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase border border-emerald-100">
                                            <i class="fa-solid fa-chart-pie"></i> NHỊP ĐỘ SELLOUT (BÁN RA)
                                        </div>
                                    </div>
                                    <div class="flex justify-between items-end mb-2">
                                        <div>
                                            <p class="text-[10px] font-bold text-gray-400 uppercase">Thực đạt / Mục tiêu</p>
                                            <p class="text-xl font-black text-slate-800"><span id="reg-box-so-act">0</span> <span class="text-sm text-gray-400 font-bold">/ <span id="reg-box-so-tar">0</span> xe</span></p>
                                        </div>
                                        <div class="text-right">
                                            <p class="text-[10px] font-bold text-gray-400 uppercase mb-1">Nhịp bám đuổi (Chuẩn)</p>
                                            <span class="font-black text-lg text-slate-800" id="reg-box-so-pace">0%</span>
                                        </div>
                                    </div>
                                    <div class="flex items-center justify-between gap-3 mt-4">
                                        <div class="flex-1 bg-gray-200 h-2 rounded-full overflow-hidden relative">
                                            <div id="reg-bar-so" class="bg-emerald-500 h-full rounded-full transition-all duration-700" style="width: 0%"></div>
                                        </div>
                                        <span class="text-xs font-black text-emerald-600" id="reg-pct-so">0%</span>
                                    </div>
                                    <div class="mt-3 text-right" id="reg-status-so">
                                        <span class="bg-gray-100 text-gray-500 px-3 py-1 rounded text-[10px] font-black uppercase shadow-sm">--</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- 3. DUAL PACE TIMELINE -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                            <div class="flex justify-between items-center mb-5">
                                <h3 class="text-sm font-black text-blue-800 uppercase flex items-center gap-2">
                                    <span class="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">3</span> 
                                    NHỊP ĐỘ CHI TIẾT THEO NGÀY TRONG THÁNG ĐƯỢC CHỌN
                                </h3>
                            </div>
                            
                            <!-- Chú thích Legend -->
                            <div class="flex flex-wrap gap-6 mb-4 text-[11px] font-bold text-gray-600 border-b border-gray-100 pb-3">
                                <div class="flex items-center gap-2"><span class="w-6 h-0 border-b-2 border-dashed border-gray-400"></span> Kế hoạch lũy kế</div>
                                <div class="flex items-center gap-2"><span class="w-4 h-0 border-b-2 border-blue-600"></span> Thực đạt (SI)</div>
                                <div class="flex items-center gap-2"><span class="w-4 h-0 border-b-2 border-emerald-500"></span> Thực đạt (SO)</div>
                                <div class="flex items-center gap-2 text-red-500"><i class="fa-solid fa-diamond text-[8px]"></i> Lọc hiện tại</div>
                            </div>

                            <div class="space-y-6">
                                <!-- Chart SI -->
                                <div class="flex relative">
                                    <div class="w-24 flex flex-col items-center justify-center py-4 border-r border-gray-200 pr-2">
                                        <div class="w-10 h-10 rounded-full border border-blue-200 text-blue-600 flex items-center justify-center mb-1 bg-blue-50"><i class="fa-solid fa-truck-fast"></i></div>
                                        <span class="text-[10px] font-black text-blue-600 uppercase text-center leading-tight">SELLIN<br>(Phát hàng)</span>
                                    </div>
                                    <div class="flex-1 relative pl-2 h-[220px]">
                                        <div id="reg-chart-si" class="w-full h-full"></div>
                                    </div>
                                </div>
                                
                                <div class="border-t border-dashed border-gray-200"></div>

                                <!-- Chart SO -->
                                <div class="flex relative">
                                    <div class="w-24 flex flex-col items-center justify-center py-4 border-r border-gray-200 pr-2">
                                        <div class="w-10 h-10 rounded-full border border-emerald-200 text-emerald-600 flex items-center justify-center mb-1 bg-emerald-50"><i class="fa-solid fa-cart-shopping"></i></div>
                                        <span class="text-[10px] font-black text-emerald-600 uppercase text-center leading-tight">SELLOUT<br>(Bán ra)</span>
                                    </div>
                                    <div class="flex-1 relative pl-2 h-[220px]">
                                        <div id="reg-chart-so" class="w-full h-full"></div>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>

                    <!-- ================= CỘT PHẢI (Span 1) ================= -->
                    <div class="xl:col-span-1 space-y-6">
                        
                        <!-- 4. TRUNG TÂM HÀNH ĐỘNG -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                            <h3 class="text-sm font-black text-blue-800 uppercase mb-4 flex items-center gap-2">
                                <span class="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">4</span> 
                                TRUNG TÂM HÀNH ĐỘNG
                            </h3>
                            
                            <!-- A. Hành động SI -->
                            <div class="mb-6 bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                <div class="flex items-center gap-2 bg-blue-100 text-blue-800 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase w-max mb-3 shadow-sm">
                                    <div class="w-4 h-4 bg-blue-600 text-white rounded-full flex items-center justify-center text-[9px]">A</div>
                                    HÀNH ĐỘNG VỚI SELLIN (PHÁT HÀNG)
                                </div>
                                <div class="grid grid-cols-4 gap-2 text-center mb-3">
                                    <div class="bg-white rounded-lg p-2 border border-slate-200 shadow-sm"><p class="text-[8px] font-bold text-gray-500 uppercase leading-tight mb-1">Thiếu so với<br>KH đến hôm nay</p><p class="font-black text-slate-800 text-sm" id="reg-act-si-miss">0 <span class="text-[8px] font-bold">xe</span></p></div>
                                    <div class="bg-white rounded-lg p-2 border border-slate-200 shadow-sm"><p class="text-[8px] font-bold text-gray-500 uppercase leading-tight mb-1">Nhịp KH<br>ban đầu</p><p class="font-black text-slate-800 text-sm" id="reg-act-si-need">0</p></div>
                                    <div class="bg-white rounded-lg p-2 border border-slate-200 shadow-sm"><p class="text-[8px] font-bold text-gray-500 uppercase leading-tight mb-1">Nhịp thực tế<br>hiện tại</p><p class="font-black text-slate-800 text-sm" id="reg-act-si-act">0</p></div>
                                    <div class="bg-white rounded-lg p-2 border border-slate-200 shadow-sm"><p class="text-[8px] font-bold text-gray-500 uppercase leading-tight mb-1">Nhịp cần đạt<br>từ ngày mai</p><p class="font-black text-slate-800 text-sm" id="reg-act-si-req">0</p></div>
                                </div>
                                <div class="flex justify-between items-center text-[11px] font-bold border-t border-dashed border-gray-200 pt-2">
                                    <span class="text-gray-500">Trạng thái nhịp độ:</span>
                                    <span class="text-sm font-black" id="reg-act-si-status">--</span>
                                </div>
                            </div>

                            <!-- B. Hành động SO -->
                            <div class="bg-slate-50 border border-slate-100 p-3 rounded-xl">
                                <div class="flex items-center gap-2 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg font-black text-[10px] uppercase w-max mb-3 shadow-sm">
                                    <div class="w-4 h-4 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[9px]">B</div>
                                    HÀNH ĐỘNG VỚI SELLOUT (BÁN RA)
                                </div>
                                <div class="grid grid-cols-4 gap-2 text-center mb-3">
                                    <div class="bg-white rounded-lg p-2 border border-slate-200 shadow-sm"><p class="text-[8px] font-bold text-gray-500 uppercase leading-tight mb-1">Thiếu so với<br>KH đến hôm nay</p><p class="font-black text-slate-800 text-sm" id="reg-act-so-miss">0 <span class="text-[8px] font-bold">xe</span></p></div>
                                    <div class="bg-white rounded-lg p-2 border border-slate-200 shadow-sm"><p class="text-[8px] font-bold text-gray-500 uppercase leading-tight mb-1">Nhịp KH<br>ban đầu</p><p class="font-black text-slate-800 text-sm" id="reg-act-so-need">0</p></div>
                                    <div class="bg-white rounded-lg p-2 border border-slate-200 shadow-sm"><p class="text-[8px] font-bold text-gray-500 uppercase leading-tight mb-1">Nhịp thực tế<br>hiện tại</p><p class="font-black text-slate-800 text-sm" id="reg-act-so-act">0</p></div>
                                    <div class="bg-white rounded-lg p-2 border border-slate-200 shadow-sm"><p class="text-[8px] font-bold text-gray-500 uppercase leading-tight mb-1">Nhịp cần đạt<br>từ ngày mai</p><p class="font-black text-slate-800 text-sm" id="reg-act-so-req">0</p></div>
                                </div>
                                <div class="flex justify-between items-center text-[11px] font-bold border-t border-dashed border-gray-200 pt-2">
                                    <span class="text-gray-500">Trạng thái nhịp độ:</span>
                                    <span class="text-sm font-black" id="reg-act-so-status">--</span>
                                </div>
                            </div>
                        </div>

                        <!-- 5. HIỆU SUẤT THEO SALE -->
                        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 flex flex-col overflow-hidden h-[450px]">
                            <h3 class="text-sm font-black text-blue-800 uppercase mb-4 flex items-center gap-2">
                                <span class="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">5</span> 
                                HIỆU SUẤT THEO TỪNG SALE
                            </h3>
                            <div class="overflow-y-auto flex-1 custom-scrollbar pr-1 border border-gray-100 rounded-lg">
                                <table class="w-full text-center text-[10px] whitespace-nowrap relative">
                                    <thead class="bg-gray-100 text-gray-500 font-bold uppercase sticky top-0 z-10 shadow-[0_1px_0_0_#e2e8f0]">
                                        <tr>
                                            <th rowspan="2" class="py-2 px-1 border-r border-gray-200 w-6">#</th>
                                            <th rowspan="2" class="py-2 text-left px-2 border-r border-gray-200">Tên NVKD</th>
                                            <th colspan="3" class="py-1 border-r border-gray-200 border-b">SELLIN (GAME)</th>
                                            <th colspan="3" class="py-1 border-gray-200 border-b">SELLOUT (THỰC TẾ)</th>
                                        </tr>
                                        <tr>
                                            <th class="py-1 font-medium text-gray-500 border-r border-gray-200 bg-blue-50/30">Target</th>
                                            <th class="py-1 font-medium text-blue-500 border-r border-gray-200 bg-blue-50/60">Đạt (xe)</th>
                                            <th class="py-1 font-medium text-gray-500 border-r border-gray-200 bg-blue-50/30">% HT</th>
                                            
                                            <th class="py-1 font-medium text-gray-500 border-r border-gray-200 bg-emerald-50/30">Target</th>
                                            <th class="py-1 font-medium text-emerald-600 border-r border-gray-200 bg-emerald-50/60">Đạt (xe)</th>
                                            <th class="py-1 font-medium text-gray-500 bg-emerald-50/30">% HT</th>
                                        </tr>
                                    </thead>
                                    <tbody id="reg-sale-table-body" class="divide-y divide-gray-100 font-semibold text-slate-700">
                                        <tr><td colspan="8" class="p-6 text-gray-400"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu...</td></tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        `;
        
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        
        const dStartInput = document.getElementById('reg-filter-date-start');
        const dEndInput = document.getElementById('reg-filter-date-end');
        if (dStartInput) dStartInput.value = `${yyyy}-${mm}-01`;
        if (dEndInput) dEndInput.value = `${yyyy}-${mm}-${dd}`;
    }

    await window.loadDataRegionTab();
};

window.loadDataRegionTab = async function() {
    const regionFilter = document.getElementById('reg-filter-region').value;
    const startStr = document.getElementById('reg-filter-date-start').value;
    const endStr = document.getElementById('reg-filter-date-end').value;

    if(!regionFilter || !startStr || !endStr) return;
    if(startStr > endStr) {
        alert("Khoảng thời gian không hợp lệ!");
        return;
    }

    const lastUpdate = document.getElementById('reg-last-update');
    if(lastUpdate) lastUpdate.innerHTML = '<i class="fa-solid fa-spinner fa-spin text-orange-500"></i> Đang tải...';

    // Dựa vào ngày end để lấy mục tiêu target (Giả định lấy target của tháng của ngày End)
    const [year, month] = endStr.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    // Tính toán số ngày dựa vào khoảng thời gian được lọc
    const startD = new Date(startStr);
    const endD = new Date(endStr);
    const daysPassed = Math.max(1, Math.floor((endD - startD) / (1000 * 60 * 60 * 24)) + 1);
    
    // Số ngày còn lại tính từ ngày kết thúc của filter đến cuối tháng đó
    const eom = new Date(year, month, 0);
    let daysLeft = Math.floor((eom - endD) / (1000 * 60 * 60 * 24));
    if (daysLeft < 1) daysLeft = 1;

    try {
        // Fetch đa bảng từ Supabase
        const [resSI, resSO, resTarget, resShops, resGameSI] = await Promise.all([
            window.sb.from('daily_si_reports').select('*').gte('report_date', startStr).lte('report_date', endStr),
            window.sb.from('daily_so_reports').select('*').gte('report_date', startStr).lte('report_date', endStr),
            // Target vẫn lấy theo nguyên tháng của ngày lọc
            window.sb.from('monthly_sale_targets').select('*').like('report_month', `${year}-${month}%`),
            window.sb.from('master_shop_list').select('sale_name, area, khu_vuc, region, director_name'),
            window.sb.from('game_si_reports').select('*').gte('report_date', startStr).lte('report_date', endStr)
        ]);

        const rawTarget = resTarget.data || [];
        const rawSI = resSI.data || [];
        const rawSO = resSO.data || [];
        const rawGameSI = resGameSI.data || [];
        const shops = resShops.data || [];

        // 1. Chuẩn hóa tên vùng và tạo Map
        const norm = (str) => str ? str.toString().trim().toLowerCase().replace(/\s+/g, ' ') : "";
        
        // Chuẩn hóa tên nhân sự (Title Case) để gộp trùng lặp
        const normalizeDisplayName = (name) => {
            if (!name) return null;
            return name.trim().toLowerCase().replace(/\s+/g, ' ').split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
        };

        const getNormalizedRegion = (rawReg) => {
            const nReg = norm(rawReg);
            if(nReg.includes("tây bắc") || nReg.includes("tay bac")) return "Tây Bắc";
            if(nReg.includes("sông cửu long") || nReg.includes("scl")) return "Sông Cửu Long";
            if(nReg.includes("hồ chí minh") || nReg.includes("hcm")) return "Hồ Chí Minh";
            const siRegions = ["Tây Bắc", "Hà Nội", "Đông Bắc", "Hồng Hà", "Bắc Trung Bộ", "Trung Trung Bộ", "Nam Trung Bộ", "Tây Nguyên", "Đông Nam", "Hồ Chí Minh", "Tây Nam", "Sông Cửu Long"];
            for (const reg of siRegions) {
                if (nReg.includes(norm(reg))) return reg;
            }
            return rawReg;
        };

        const regionFilterNorm = getNormalizedRegion(regionFilter);
        const saleToRegionMap = {};

        // MÃ MÓC DỮ LIỆU ĐA NGUỒN ĐỂ MAPPING SALE -> KHU VỰC
        shops.forEach(s => { 
            const sName = norm(s.sale_name);
            const reg = getNormalizedRegion(s.area || s.khu_vuc || s.region || '');
            if (sName && reg) saleToRegionMap[sName] = reg; 
        });

        rawTarget.forEach(t => {
            const sName = norm(t.sale_name);
            const reg = getNormalizedRegion(t.area || t.khu_vuc || t.region_name || '');
            if (sName && reg && !saleToRegionMap[sName]) saleToRegionMap[sName] = reg;
        });

        rawGameSI.forEach(g => {
            const sName = norm(g.sale_name);
            const reg = getNormalizedRegion(g.region_name || g.khu_vuc || '');
            if (sName && reg && !saleToRegionMap[sName]) saleToRegionMap[sName] = reg;
        });

        // 2. Lọc tất cả các Sale thuộc Khu vực đang chọn
        const salesInRegion = new Set();
        Object.keys(saleToRegionMap).forEach(sNorm => {
            if (saleToRegionMap[sNorm] === regionFilterNorm) {
                salesInRegion.add(sNorm);
            }
        });

        // 3. Lọc Báo cáo theo khu vực
        const siFiltered = rawSI.filter(r => getNormalizedRegion(r.region_name) === regionFilterNorm);

        const soFiltered = rawSO.filter(r => {
            const sNorm = norm(r.sale_name);
            if (salesInRegion.has(sNorm)) return true;
            if (getNormalizedRegion(r.region_name || r.khu_vuc) === regionFilterNorm) {
                if (sNorm) salesInRegion.add(sNorm);
                return true;
            }
            return false;
        });

        const targetFiltered = rawTarget.filter(t => {
            const sNorm = norm(t.sale_name);
            if (salesInRegion.has(sNorm)) return true;
            if (getNormalizedRegion(t.area || t.khu_vuc || t.region_name) === regionFilterNorm) {
                if (sNorm) salesInRegion.add(sNorm);
                return true;
            }
            return false;
        });

        const gameSiFiltered = rawGameSI.filter(r => {
            const sNorm = norm(r.sale_name);
            if (salesInRegion.has(sNorm)) return true;
            if (getNormalizedRegion(r.region_name || r.khu_vuc) === regionFilterNorm) {
                if (sNorm) salesInRegion.add(sNorm);
                return true;
            }
            return false;
        });

        // ===============================================
        // ĐÃ FIX: PHÂN TÁCH LOGIC BẮC/NAM CHUẨN XÁC VÀ SỬA CASE SENSITIVE
        // ===============================================
        let totalTarSI = 0, totalTarSO = 0;
        let totalActTT = 0, totalActSI = 0, totalActSO = 0;
        const saleStats = {};
        
        // Cập nhật lại Biểu đồ: Dữ liệu theo tháng của ngày End
        const chartDaysInMonth = new Date(year, month, 0).getDate();
        const dailyStats = Array.from({length: chartDaysInMonth}, (_, i) => ({ day: i+1, si: 0, so: 0 }));

        const mienBacRegions = ["tây bắc", "hà nội", "đông bắc", "hồng hà", "bắc trung bộ", "trung trung bộ"];
        const isMienBac = mienBacRegions.includes(norm(regionFilterNorm)); 

        // A. Tính tổng Admin S.I (Target luôn lấy từ Admin, Actual chỉ cộng nếu là miền Nam)
        const baseDateSI = `${year}-${month}-01`;
        // Cần fetch target bổ sung từ daily_si_reports nếu ngày baseDateSI không nằm trong khoảng lọc
        if (startStr > baseDateSI) {
             const resSITarget = await window.sb.from('daily_si_reports').select('target_ph').eq('report_date', baseDateSI).eq('region_name', regionFilterNorm);
             if (resSITarget.data && resSITarget.data.length > 0) {
                 totalTarSI = Number(resSITarget.data[0].target_ph) || 0;
             }
        }

        siFiltered.forEach(r => {
            if(r.report_date === baseDateSI) {
                totalTarSI += Number(r.target_ph) || 0;
            }

            if (!isMienBac) {
                const tt = Number(r.thanh_toan) || 0;
                const xh = Number(r.xuat_hang) || 0;

                totalActTT += tt;
                totalActSI += xh;

                const dayNum = parseInt(r.report_date.slice(-2));
                if(dayNum >= 1 && dayNum <= chartDaysInMonth) {
                    dailyStats[dayNum-1].si += xh;
                }
            }
        });

        // B. Tính tổng Sale S.O
        soFiltered.forEach(r => {
            const val = Number(r.total_so || r.so_luong || r.ban_ra || 0);
            totalActSO += val;
            
            const dayNum = parseInt(r.report_date.slice(-2));
            if(dayNum >= 1 && dayNum <= chartDaysInMonth) {
                dailyStats[dayNum-1].so += val;
            }

            const dName = normalizeDisplayName(r.sale_name);
            if (dName) {
                if (!saleStats[dName]) saleStats[dName] = { name: dName, tarSI: 0, tarSO: 0, actSI: 0, actSO: 0 };
                saleStats[dName].actSO += val;
            }
        });

        // C. Lấy Target của Sale
        targetFiltered.forEach(t => {
            const dName = normalizeDisplayName(t.sale_name);
            const tSI = Number(t.target_si) || 0;
            const tSO = Number(t.target_so) || 0;
            totalTarSO += tSO;
            
            if (dName) {
                if (!saleStats[dName]) saleStats[dName] = { name: dName, tarSI: 0, tarSO: 0, actSI: 0, actSO: 0 };
                saleStats[dName].tarSI += tSI;
                saleStats[dName].tarSO += tSO;
            }
        });

        // D. Lấy Số liệu Game S.I của Sale (Chỉ cộng vào tổng Khu vực nếu là Miền Bắc)
        gameSiFiltered.forEach(r => {
            const xh = Number(r.xuat_hang) || 0;
            const tt = Number(r.thanh_toan) || 0;
            
            const dName = normalizeDisplayName(r.sale_name);
            if (dName) {
                if (!saleStats[dName]) saleStats[dName] = { name: dName, tarSI: 0, tarSO: 0, actSI: 0, actSO: 0 };
                saleStats[dName].actSI += xh;
            }

            if (isMienBac) {
                totalActTT += tt;
                totalActSI += xh;

                const dayNum = parseInt(r.report_date.slice(-2));
                if(dayNum >= 1 && dayNum <= chartDaysInMonth) {
                    dailyStats[dayNum-1].si += xh;
                }
            }
        });

        const totalChuaPhat = Math.max(0, totalTarSI - totalActSI);

        // 5. Update UI Block 1: Chuỗi vận hành
        document.getElementById('reg-val-tt').innerHTML = `${fmtRegNum(totalActTT)} <span class="text-sm font-bold text-gray-400">xe</span>`;
        document.getElementById('reg-val-si').innerHTML = `${fmtRegNum(totalActSI)} <span class="text-sm font-bold text-gray-400">xe</span>`;
        document.getElementById('reg-val-so').innerHTML = `${fmtRegNum(totalActSO)} <span class="text-sm font-bold text-gray-400">xe</span>`;
        document.getElementById('reg-val-cx').innerHTML = `${fmtRegNum(totalChuaPhat)} <span class="text-sm font-bold text-gray-400">xe</span>`;

        // 6. Update UI Block 2: Nhịp độ tổng quan
        // Tính paceIdeal dựa trên ngày endD trong tháng đó
        const currentPassed = endD.getDate(); 
        const paceIdeal = Math.min(100, Math.round(safeDivR(currentPassed, chartDaysInMonth) * 100));
        
        // SI
        const pctSI = Math.round(safeDivR(totalActSI, totalTarSI) * 100);
        document.getElementById('reg-box-si-act').innerText = fmtRegNum(totalActSI);
        document.getElementById('reg-box-si-tar').innerText = fmtRegNum(totalTarSI);
        document.getElementById('reg-box-si-pace').innerText = paceIdeal + '%';
        document.getElementById('reg-bar-si').style.width = Math.min(100, pctSI) + '%';
        document.getElementById('reg-pct-si').innerText = pctSI + '%';
        
        const stSI = document.getElementById('reg-status-si');
        if (pctSI >= paceIdeal) { stSI.innerHTML = `<span class="bg-blue-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase shadow-sm">Đang bám nhịp</span>`; } 
        else { stSI.innerHTML = `<span class="bg-red-50 text-red-600 border border-red-200 px-3 py-1 rounded text-[10px] font-black uppercase shadow-sm">Cần tăng tốc</span>`; }

        // SO
        const pctSO = Math.round(safeDivR(totalActSO, totalTarSO) * 100);
        document.getElementById('reg-box-so-act').innerText = fmtRegNum(totalActSO);
        document.getElementById('reg-box-so-tar').innerText = fmtRegNum(totalTarSO);
        document.getElementById('reg-box-so-pace').innerText = paceIdeal + '%';
        document.getElementById('reg-bar-so').style.width = Math.min(100, pctSO) + '%';
        document.getElementById('reg-pct-so').innerText = pctSO + '%';

        const stSO = document.getElementById('reg-status-so');
        if (pctSO >= paceIdeal) { stSO.innerHTML = `<span class="bg-emerald-600 text-white px-3 py-1 rounded text-[10px] font-black uppercase shadow-sm">Đang bám nhịp</span>`; } 
        else { stSO.innerHTML = `<span class="bg-orange-50 text-orange-600 border border-orange-200 px-3 py-1 rounded text-[10px] font-black uppercase shadow-sm">Cần tăng tốc</span>`; }

        // 7. Update UI Block 4: Trung tâm hành động
        const missSI = totalActSI - (totalTarSI * safeDivR(daysPassed, daysPassed + daysLeft));
        const paceSIReq = totalTarSI > 0 ? safeDivR(totalTarSI, daysPassed + daysLeft) : 0;
        const paceSIAct = safeDivR(totalActSI, daysPassed);
        const paceSINeed = safeDivR(Math.max(0, totalTarSI - totalActSI), daysLeft);

        document.getElementById('reg-act-si-miss').innerHTML = `${missSI > 0 ? '+' : ''}${fmtRegNum(Math.round(missSI))} <span class="text-[9px] font-bold">xe</span>`;
        document.getElementById('reg-act-si-miss').className = `font-black text-sm ${missSI >= 0 ? 'text-emerald-500' : 'text-red-500'}`;
        document.getElementById('reg-act-si-need').innerHTML = `${fmtRegNum(Math.ceil(paceSIReq))} <span class="text-[9px] font-bold text-gray-400">xe/ngày</span>`;
        document.getElementById('reg-act-si-act').innerHTML = `${fmtRegNum(Math.ceil(paceSIAct))} <span class="text-[9px] font-bold text-gray-400">xe/ngày</span>`;
        document.getElementById('reg-act-si-req').innerHTML = `${fmtRegNum(Math.ceil(paceSINeed))} <span class="text-[9px] font-bold text-gray-400">xe/ngày</span>`;
        document.getElementById('reg-act-si-req').className = `font-black text-sm ${paceSINeed > paceSIAct ? 'text-red-500' : 'text-emerald-500'}`;
        document.getElementById('reg-act-si-status').innerText = missSI >= 0 ? 'TỐT' : 'CẦN TĂNG TỐC';
        document.getElementById('reg-act-si-status').className = `text-sm font-black ${missSI >= 0 ? 'text-emerald-600' : 'text-blue-600'}`;

        const missSO = totalActSO - (totalTarSO * safeDivR(daysPassed, daysPassed + daysLeft));
        const paceSOReq = totalTarSO > 0 ? safeDivR(totalTarSO, daysPassed + daysLeft) : 0;
        const paceSOAct = safeDivR(totalActSO, daysPassed);
        const paceSONeed = safeDivR(Math.max(0, totalTarSO - totalActSO), daysLeft);

        document.getElementById('reg-act-so-miss').innerHTML = `${missSO > 0 ? '+' : ''}${fmtRegNum(Math.round(missSO))} <span class="text-[9px] font-bold">xe</span>`;
        document.getElementById('reg-act-so-miss').className = `font-black text-sm ${missSO >= 0 ? 'text-emerald-500' : 'text-red-500'}`;
        document.getElementById('reg-act-so-need').innerHTML = `${fmtRegNum(Math.ceil(paceSOReq))} <span class="text-[9px] font-bold text-gray-400">xe/ngày</span>`;
        document.getElementById('reg-act-so-act').innerHTML = `${fmtRegNum(Math.ceil(paceSOAct))} <span class="text-[9px] font-bold text-gray-400">xe/ngày</span>`;
        document.getElementById('reg-act-so-req').innerHTML = `${fmtRegNum(Math.ceil(paceSONeed))} <span class="text-[9px] font-bold text-gray-400">xe/ngày</span>`;
        document.getElementById('reg-act-so-req').className = `font-black text-sm ${paceSONeed > paceSOAct ? 'text-red-500' : 'text-emerald-500'}`;
        document.getElementById('reg-act-so-status').innerText = missSO >= 0 ? 'TỐT' : 'CẦN TĂNG TỐC';
        document.getElementById('reg-act-so-status').className = `text-sm font-black ${missSO >= 0 ? 'text-emerald-600' : 'text-emerald-600'}`;

        // 8. Update UI Block 5: Bảng Sale
        const tbodySale = document.getElementById('reg-sale-table-body');
        const salesArr = Object.values(saleStats).filter(s => s.tarSO > 0 || s.actSO > 0 || s.tarSI > 0 || s.actSI > 0).sort((a,b) => b.actSO - a.actSO);
        
        if (salesArr.length === 0) {
            tbodySale.innerHTML = `<tr><td colspan="8" class="p-6 text-gray-400 text-center">Chưa tìm thấy NVKD thuộc khu vực này</td></tr>`;
        } else {
            tbodySale.innerHTML = salesArr.map((s, i) => {
                const sPctSI = Math.round(safeDivR(s.actSI, s.tarSI) * 100);
                const sPctSO = Math.round(safeDivR(s.actSO, s.tarSO) * 100);
                return `
                <tr class="hover:bg-gray-50 transition">
                    <td class="py-2 border-r border-gray-100 text-center text-gray-400 font-bold">${i+1}</td>
                    <td class="py-2 text-left px-2 border-r border-gray-100 font-bold text-slate-800">${s.name}</td>
                    
                    <td class="py-2 border-r border-gray-100 text-center text-gray-400 font-bold bg-blue-50/20">${fmtRegNum(s.tarSI)}</td>
                    <td class="py-2 border-r border-gray-100 text-center text-blue-600 font-black bg-blue-50/50">${fmtRegNum(s.actSI)}</td>
                    <td class="py-2 border-r border-gray-200 text-center ${sPctSI >= paceIdeal ? 'text-blue-500' : 'text-red-400'} font-bold bg-blue-50/10">${sPctSI}%</td>
                    
                    <td class="py-2 border-r border-gray-100 text-center text-gray-400 font-bold bg-emerald-50/20">${fmtRegNum(s.tarSO)}</td>
                    <td class="py-2 border-r border-gray-100 text-center text-emerald-600 font-black bg-emerald-50/50">${fmtRegNum(s.actSO)}</td>
                    <td class="py-2 text-center ${sPctSO >= paceIdeal ? 'text-emerald-500' : 'text-orange-400'} font-bold bg-emerald-50/10">${sPctSO}%</td>
                </tr>`;
            }).join('');
        }

        // 9. Update Chart 3: Dual Pace
        updateDualPaceChart(dailyStats, totalTarSI, totalTarSO, chartDaysInMonth, currentPassed);

        if(lastUpdate) {
            const now = new Date();
            lastUpdate.innerHTML = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()} <button onclick="window.loadDataRegionTab()" class="text-gray-400 hover:text-blue-600 transition ml-2"><i class="fa-solid fa-rotate"></i></button>`;
        }

    } catch(e) {
        console.error("Lỗi tải tab Khu vực:", e);
        if(lastUpdate) lastUpdate.innerHTML = '<span class="text-red-500">Lỗi tải dữ liệu</span>';
    }
};

function updateDualPaceChart(dailyStats, totalTarSI, totalTarSO, daysInMonth, daysPassed) {
    if (window.regChartSI) window.regChartSI.destroy();
    if (window.regChartSO) window.regChartSO.destroy();

    const cats = [];
    const planSI = [], planSO = [];
    const actSI = [], actSO = [];
    
    let cumSI = 0, cumSO = 0;
    const paceStepSI = totalTarSI / daysInMonth;
    const paceStepSO = totalTarSO / daysInMonth;

    for (let i = 0; i < daysInMonth; i++) {
        cats.push(String(i+1).padStart(2,'0'));
        planSI.push(Math.round(paceStepSI * (i+1)));
        planSO.push(Math.round(paceStepSO * (i+1)));
        
        if (i < daysPassed) {
            cumSI += dailyStats[i].si;
            cumSO += dailyStats[i].so;
            actSI.push(cumSI);
            actSO.push(cumSO);
        } else {
            actSI.push(null);
            actSO.push(null);
        }
    }

    const commonOptions = {
        chart: { height: 220, type: 'line', toolbar: { show: false }, fontFamily: 'Inter, sans-serif' },
        stroke: { width: [3, 2], curve: 'straight', dashArray: [0, 4] },
        dataLabels: {
            enabled: true,
            enabledOnSeries: [0],
            style: { fontSize: '9px', fontWeight: 'bold' },
            background: { enabled: true, opacity: 0.8, borderRadius: 2 },
            offsetY: -5,
            formatter: function (val) { return val ? val : ''; }
        },
        markers: { size: [4, 0], hover: { size: 6 } },
        xaxis: { categories: cats, labels: { style: { fontSize: '9px', colors: '#9ca3af', fontWeight: 600 } } },
        yaxis: { min: 0, tickAmount: 4, labels: { style: { fontSize: '10px', colors: '#64748b', fontWeight: 700 }, formatter: (val) => Math.round(val) } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 3, padding: { top: 0, bottom: 0, left: 10, right: 10 } },
        legend: { show: false },
        annotations: {
            xaxis: [{ x: String(daysPassed).padStart(2,'0'), strokeDashArray: 0, borderColor: '#ef4444', label: { borderColor: '#ef4444', style: { color: '#fff', background: '#ef4444', fontSize: '9px', fontWeight: 800 }, text: 'Lọc hiện tại', offsetY: 0 } }]
        }
    };

    // Chart SELLIN (Xanh dương)
    const optSI = {
        ...commonOptions,
        series: [
            { name: 'Thực đạt lũy kế (SI)', type: 'line', data: actSI },
            { name: 'Kế hoạch lũy kế (SI)', type: 'line', data: planSI }
        ],
        colors: ['#2563eb', '#9ca3af'],
        dataLabels: { ...commonOptions.dataLabels, style: { colors: ['#1e40af'] } }
    };

    // Chart SELLOUT (Xanh ngọc)
    const optSO = {
        ...commonOptions,
        series: [
            { name: 'Thực đạt lũy kế (SO)', type: 'line', data: actSO },
            { name: 'Kế hoạch lũy kế (SO)', type: 'line', data: planSO }
        ],
        colors: ['#10b981', '#9ca3af'],
        dataLabels: { ...commonOptions.dataLabels, style: { colors: ['#065f46'] } }
    };

    window.regChartSI = new ApexCharts(document.querySelector("#reg-chart-si"), optSI);
    window.regChartSI.render();

    window.regChartSO = new ApexCharts(document.querySelector("#reg-chart-so"), optSO);
    window.regChartSO.render();
}