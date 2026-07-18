// File: view-sellin.js
export const sellinHTML = `
<div class="p-4 md:p-6 fade-in w-full mx-auto max-w-[1500px]">
    <div id="sellin_access_denied" class="hidden text-center mt-32">
        <div class="w-24 h-24 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
            <i class="fa-solid fa-lock text-4xl"></i>
        </div>
        <h2 class="text-2xl font-black text-slate-800 uppercase tracking-tight">Khu vực bảo mật</h2>
        <p class="text-sm font-bold text-gray-500 mt-2">Chỉ Quản trị viên (Admin) mới có quyền truy cập module Sell-in.</p>
    </div>

    <div id="sellin_admin_panel" class="hidden">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
                <h1 class="text-2xl md:text-3xl font-black text-slate-800 uppercase tracking-tight">TIẾN ĐỘ SELL-IN & THI ĐUA</h1>
                <p class="text-sm font-bold text-blue-600 mt-1 uppercase">Báo cáo Thanh toán & Xuất hàng (12 Khu vực)</p>
            </div>
            
            <!-- Chuyển đổi giữa Dashboard và Ma Trận -->
            <div class="flex bg-slate-200 p-1 rounded-xl shadow-inner">
                <button onclick="window.toggleSellinView('dashboard')" id="btnTab_sellinDashboard" class="px-6 py-2.5 rounded-lg font-black text-sm uppercase transition bg-white text-blue-600 shadow-sm">
                    <i class="fa-solid fa-chart-column mr-2"></i> Dashboard Xếp Hạng
                </button>
                <button onclick="window.toggleSellinView('matrix')" id="btnTab_sellinMatrix" class="px-6 py-2.5 rounded-lg font-black text-sm uppercase transition text-slate-500 hover:text-slate-700">
                    <i class="fa-solid fa-table-cells mr-2"></i> Ma Trận Nhập Liệu
                </button>
            </div>
        </div>

        <div class="flex flex-wrap items-center gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <div>
                <label class="text-xs font-black text-slate-500 uppercase mb-1 block">Chọn Tháng</label>
                <input type="month" id="sellin_month" onchange="window.loadSellinData()" class="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-black text-slate-800 outline-none focus:border-blue-500 cursor-pointer">
            </div>
            <div class="ml-auto flex gap-2">
                <button onclick="window.loadSellinData()" class="bg-blue-100 text-blue-600 px-4 py-2 rounded-xl font-black text-sm uppercase hover:bg-blue-200 transition">
                    <i class="fa-solid fa-rotate-right"></i> Làm mới
                </button>
            </div>
        </div>

        <!-- MÀN HÌNH 1: DASHBOARD XẾP HẠNG THI ĐUA -->
        <div id="sellinView_dashboard" class="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden fade-in">
            <div class="overflow-x-auto">
                <table class="w-full text-center border-collapse">
                    <thead>
                        <tr class="bg-blue-50 border-b border-blue-100 text-[11px] font-black text-slate-600 uppercase">
                            <th class="border-r border-blue-100 p-4 w-12">STT</th>
                            <th class="border-r border-blue-100 p-4 w-40 text-left">GĐ Khu Vực</th>
                            <th class="border-r border-blue-100 p-4 w-32 text-left">Khu Vực</th>
                            <th class="border-r border-blue-200 p-4 w-24 bg-blue-100/50">Target Tháng</th>
                            <th class="border-r border-blue-100 p-4 w-24 bg-gray-50">Đã thanh toán<br>(Lũy kế)</th>
                            <th class="border-r border-blue-100 p-4 w-24 bg-yellow-50 text-yellow-700 shadow-inner">Xuất thực tế<br>(Lũy kế)</th>
                            <th class="border-r border-blue-100 p-4 w-24 bg-red-50 text-red-600">Số lượng<br>chưa xuất</th>
                            <th class="border-r border-blue-100 p-4 w-24">Tỷ lệ <br>Thanh toán</th>
                            <th class="border-r border-blue-100 p-4 w-24 bg-green-50 text-green-700">Tỷ lệ hoàn thành<br>Xuất Hàng</th>
                            <th class="p-4 w-20 bg-indigo-50 text-indigo-600">Xếp Hạng<br>Xuất Hàng</th>
                        </tr>
                    </thead>
                    <tbody id="sellin_dashboard_body" class="divide-y divide-gray-100 text-sm font-bold text-slate-800">
                        <!-- Data render bằng JS -->
                    </tbody>
                    <tfoot id="sellin_dashboard_foot" class="bg-slate-800 font-black text-white text-sm">
                        <!-- Footer tổng render bằng JS -->
                    </tfoot>
                </table>
            </div>
        </div>

        <!-- MÀN HÌNH 2: MA TRẬN NHẬP LIỆU -->
        <div id="sellinView_matrix" class="hidden bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden fade-in relative">
            <p class="text-[11px] text-gray-500 font-bold p-3 bg-gray-50 border-b border-gray-200 italic">
                💡 Bấm vào ô của ngày tương ứng để nhập/sửa số liệu THANH TOÁN và XUẤT HÀNG. Số lớn hiển thị là <span class="text-orange-600">Xuất Hàng</span>.
            </p>
            <div class="overflow-x-auto" id="sellin_matrix_container">
                <!-- Ma trận render bằng JS -->
            </div>
        </div>
    </div>

    <!-- MODAL NHẬP LIỆU S.I -->
    <div id="modal_sellinInput" class="fixed inset-0 z-[100] bg-gray-900/80 hidden items-center justify-center p-4 backdrop-blur-sm">
        <div class="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden fade-in">
            <div class="p-5 border-b border-gray-100 flex justify-between items-center bg-blue-50">
                <h3 class="text-lg font-black text-blue-800 uppercase" id="modal_sellin_title">Cập nhật số liệu</h3>
                <button onclick="window.closeSellinModal()" class="text-gray-400 hover:text-red-500 transition"><i class="fa-solid fa-xmark text-xl"></i></button>
            </div>
            <div class="p-6 space-y-5">
                <input type="hidden" id="modal_sellin_region">
                <input type="hidden" id="modal_sellin_date">
                
                <div>
                    <label class="text-xs font-black text-slate-500 uppercase mb-2 block">1. Số xe Đã Thanh Toán (Ngày)</label>
                    <input type="number" id="modal_val_paid" class="w-full bg-slate-50 border-2 border-slate-200 rounded-xl p-4 text-xl font-black text-slate-800 outline-none focus:border-blue-500 text-center" placeholder="0">
                </div>
                <div>
                    <label class="text-xs font-black text-slate-500 uppercase mb-2 block">2. Số xe Đã Xuất Hàng (Ngày)</label>
                    <input type="number" id="modal_val_shipped" class="w-full bg-orange-50 border-2 border-orange-200 rounded-xl p-4 text-xl font-black text-orange-600 outline-none focus:border-orange-500 text-center" placeholder="0">
                </div>
            </div>
            <div class="p-4 border-t border-gray-100 bg-gray-50 flex gap-3">
                <button onclick="window.saveSellinInput()" id="btnSaveSellinModal" class="w-full bg-blue-600 text-white py-4 rounded-xl font-black text-sm uppercase shadow-lg hover:bg-blue-700 transition">
                    <i class="fa-solid fa-check mr-2"></i> Lưu Số Liệu
                </button>
            </div>
        </div>
    </div>
</div>
`;