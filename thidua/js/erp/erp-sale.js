// ==========================================
// FILE: js/erp/erp-sale.js
// QUẢN LÝ TAB: CÁ NHÂN SALE
// ==========================================

window.initErpSale = async function() {
    const container = document.getElementById('erp-tab-sale');
    if (!container) return;

    if (container.innerHTML.trim() === '') {
        container.innerHTML = `
            <div class="px-6 py-6 space-y-6 max-w-5xl mx-auto">
                <!-- Thông tin Sale -->
                <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-orange-500 text-white rounded-full flex items-center justify-center text-2xl font-black shadow-md"><i class="fa-solid fa-user"></i></div>
                        <div>
                            <h2 class="text-2xl font-black text-slate-800">Xin chào, <span id="sale-tab-name">Nguyễn Văn Thành</span> 👋</h2>
                            <p class="text-sm font-bold text-gray-500 uppercase mt-1">Sale - Khu vực: <span id="sale-tab-region" class="text-orange-600">Đông Bắc</span></p>
                        </div>
                    </div>
                    <div class="bg-orange-50 text-orange-600 px-4 py-2 rounded-xl font-bold text-sm border border-orange-100">
                        <i class="fa-regular fa-clock"></i> Mục tiêu Quý 3: Còn 72 ngày
                    </div>
                </div>

                <!-- Hiệu Suất Yêu Cầu Hôm Nay -->
                <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <h3 class="text-sm font-black text-orange-600 uppercase mb-4 flex items-center gap-2"><i class="fa-solid fa-bolt text-lg"></i> HIỆU SUẤT YÊU CẦU HÔM NAY</h3>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <!-- SELLIN -->
                        <div class="border border-blue-100 bg-blue-50/30 p-5 rounded-xl">
                            <h4 class="text-xs font-bold text-blue-600 uppercase mb-3">SELLIN (PHÁT HÀNG)</h4>
                            <div class="flex justify-between items-end">
                                <div>
                                    <div class="text-gray-400 text-[10px] font-bold uppercase">Hiệu suất yêu cầu</div>
                                    <div class="text-4xl font-black text-blue-600" id="sale-pace-si">12 <span class="text-sm font-medium">xe/ngày</span></div>
                                </div>
                                <div class="text-right">
                                    <div class="text-gray-400 text-[10px] font-bold uppercase mb-1">So với hôm qua</div>
                                    <div class="text-red-500 font-black text-lg bg-red-50 px-2 py-1 rounded"><i class="fa-solid fa-arrow-down text-sm"></i> -0.6</div>
                                </div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-blue-100 flex items-center justify-between">
                                <span class="text-xs font-bold text-gray-500">Mức áp lực:</span>
                                <div class="flex gap-1 w-2/3">
                                    <div class="h-2 w-1/3 bg-green-500 rounded-full"></div>
                                    <div class="h-2 w-1/3 bg-orange-400 rounded-full opacity-30"></div>
                                    <div class="h-2 w-1/3 bg-red-500 rounded-full opacity-30"></div>
                                </div>
                            </div>
                        </div>

                        <!-- SELLOUT -->
                        <div class="border border-green-100 bg-green-50/30 p-5 rounded-xl">
                            <h4 class="text-xs font-bold text-green-600 uppercase mb-3">SELLOUT (BÁN RA)</h4>
                            <div class="flex justify-between items-end">
                                <div>
                                    <div class="text-gray-400 text-[10px] font-bold uppercase">Hiệu suất yêu cầu</div>
                                    <div class="text-4xl font-black text-green-600" id="sale-pace-so">8 <span class="text-sm font-medium">xe/ngày</span></div>
                                </div>
                                <div class="text-right">
                                    <div class="text-gray-400 text-[10px] font-bold uppercase mb-1">So với hôm qua</div>
                                    <div class="text-red-500 font-black text-lg bg-red-50 px-2 py-1 rounded"><i class="fa-solid fa-arrow-down text-sm"></i> -0.3</div>
                                </div>
                            </div>
                            <div class="mt-4 pt-4 border-t border-green-100 flex items-center justify-between">
                                <span class="text-xs font-bold text-gray-500">Mức áp lực:</span>
                                <div class="flex gap-1 w-2/3">
                                    <div class="h-2 w-1/3 bg-green-500 rounded-full opacity-30"></div>
                                    <div class="h-2 w-1/3 bg-orange-400 rounded-full opacity-30"></div>
                                    <div class="h-2 w-1/3 bg-red-500 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tiến Độ Quý & Kết quả 7 ngày -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 class="text-sm font-black text-slate-700 uppercase mb-4"><i class="fa-solid fa-chart-line text-orange-500"></i> TIẾN ĐỘ QUÝ 3</h3>
                        <!-- Các bar chart tiến độ SI, SO (Sẽ render = JS) -->
                    </div>
                    <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                        <h3 class="text-sm font-black text-slate-700 uppercase mb-4 flex justify-between">
                            <span><i class="fa-solid fa-calendar-week text-blue-500"></i> KẾT QUẢ 7 NGÀY GẦN NHẤT</span>
                            <a href="#" class="text-blue-500 text-xs font-bold hover:underline">Xem chi tiết ></a>
                        </h3>
                        <table class="w-full text-center text-xs">
                            <thead class="text-gray-400 font-bold border-b border-gray-100">
                                <tr>
                                    <th class="pb-2">Ngày</th>
                                    <th class="pb-2">Đơn TT</th>
                                    <th class="pb-2 text-blue-600">Sellin</th>
                                    <th class="pb-2 text-green-600">Sellout</th>
                                </tr>
                            </thead>
                            <tbody id="sale-7days-body" class="divide-y divide-gray-50 font-bold text-slate-700">
                                <!-- JS Data -->
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        `;
    }

    await window.loadDataSaleTab();
};

window.loadDataSaleTab = async function() {
    console.log("Fetching Sale Personal Data...");
    // TODO: Lấy profile currentUser và filter dữ liệu riêng cho 1 Sale
};