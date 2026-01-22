// js/ui.js
import { STATE } from './config.js';
import { fmn, parseNumber, safeVal, calcKPI } from './utils.js';
import { loadOverviewDashboard, loadCharts } from './charts.js';
import { api_loadSaleHistory, api_submitReport, api_deleteReport, api_getReportById, api_loadMonthlyModels } from './api.js';

// ... (Các hàm switchView, toggleSidebar, ui_showMsg... giữ nguyên) ...

export function switchView(view) {
    ['view-sales', 'view-costs', 'view-history', 'view-charts'].forEach(v => document.getElementById(v).classList.add('hidden'));
    ['nav-sales', 'nav-costs', 'nav-history', 'nav-charts'].forEach(n => document.getElementById(n).classList.remove('active'));
    document.getElementById(`view-${view}`).classList.remove('hidden');
    document.getElementById(`nav-${view}`).classList.add('active');
    if (window.innerWidth < 768) toggleSidebar();
    if (view === 'costs') updateCostSummary();
    if (view === 'history') api_loadSaleHistory();
    if (view === 'charts') { initChartFilter(); loadOverviewDashboard(); }
}

export function switchChartTab(tab) {
    ['chart-tab-overview', 'chart-tab-detail'].forEach(t => document.getElementById(t).classList.add('hidden'));
    ['btn-tab-overview', 'btn-tab-detail'].forEach(b => document.getElementById(b).classList.remove('active'));
    document.getElementById(`chart-tab-${tab}`).classList.remove('hidden');
    document.getElementById(`btn-tab-${tab}`).classList.add('active');
    if(tab === 'overview') loadOverviewDashboard();
}

export function toggleSidebar() {
    const sb = document.getElementById('sidebarMobile');
    sb.classList.toggle('-translate-x-full');
}

export function ui_showMsg(txt, color) {
    const el = document.getElementById('msg');
    el.className = `text-center text-xs font-bold mt-4 h-5 text-${color}-500`;
    el.innerText = txt;
}

export function ui_updateSVNOptions() {
    const selProv = document.getElementById('f_province').value;
    const svnSelect = document.getElementById('f_svn');
    const shopSelect = document.getElementById('shop_code');
    svnSelect.innerHTML = '<option value="">-- Tất cả SVN --</option>';
    shopSelect.innerHTML = '<option value="">-- Chọn Shop --</option>';
    svnSelect.disabled = true; shopSelect.disabled = true;
    if (selProv) {
        const relevantShops = STATE.globalAssignedShops.filter(s => s.province === selProv);
        const svns = [...new Set(relevantShops.map(s => s.svn_code).filter(n => n))].sort();
        svnSelect.innerHTML = `<option value="">-- Tất cả SVN (${svns.length}) --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join('');
        svnSelect.disabled = false;
        shopSelect.innerHTML = `<option value="">-- Chọn Shop (${relevantShops.length}) --</option>` + relevantShops.map(s => `<option value="${s.shop_code}">${s.shop_code} - ${s.shop_name}</option>`).join('');
        shopSelect.disabled = false;
    }
}

export function ui_updateDVNOptions() {
    const selProv = document.getElementById('f_province').value;
    const selSVN = document.getElementById('f_svn').value;
    const shopSelect = document.getElementById('shop_code');
    if (selProv) {
        let relevantShops = STATE.globalAssignedShops.filter(s => s.province === selProv);
        if (selSVN) relevantShops = relevantShops.filter(s => s.svn_code === selSVN);
        shopSelect.innerHTML = `<option value="">-- Chọn Shop (${relevantShops.length}) --</option>` + relevantShops.map(s => `<option value="${s.shop_code}">${s.shop_code} - ${s.shop_name}</option>`).join('');
        shopSelect.disabled = false;
    }
}

export function ui_updateShopInfo() {
    const val = document.getElementById('shop_code').value;
    const disp = document.getElementById('shop_info_display');
    if (!val) { disp.classList.add('hidden'); return; }
    const shopData = STATE.globalShopMap[val];
    if (shopData) {
        disp.classList.remove('hidden');
        disp.innerHTML = `<div class="font-black text-sm uppercase text-green-800">${shopData.shop_name}</div><div class="text-[10px] text-green-600 font-bold mt-1">Giám Đốc: ${shopData.director_name || '---'}</div>`;
    }
}

export function getModelOptionsHtml(selectedModel = "") {
    if (!STATE.currentAdminPrices.length) return `<option value="">-- Bấm Tải Bảng Giá --</option>`;
    return `<option value="">-- Chọn xe --</option>` + STATE.currentAdminPrices.map(p => {
        const isSel = p.model === selectedModel ? 'selected' : '';
        return `<option value="${p.model}" data-si="${p.import_price}" data-so="${p.selling_price}" ${isSel}>${p.model}</option>`;
    }).join('');
}

export function ui_renderModelOptionsAll() {
    document.querySelectorAll('.model-select').forEach(sel => {
        const curr = sel.value;
        sel.innerHTML = getModelOptionsHtml(curr);
        sel.value = curr;
    });
}

export function ui_addSaleRow(data = {}) {
    const tr = document.createElement('tr');
    tr.className = "bg-white border-b border-gray-100 hover:bg-gray-50 transition";
    tr.innerHTML = `<td class="p-2"><select class="model-select w-full bg-white border border-gray-200 rounded p-1.5 text-xs font-bold outline-none" onchange="onModelChange(this)">${getModelOptionsHtml(data.model)}</select></td><td class="p-2 border-l border-orange-100"><input type="text" class="qty-si-input w-full text-center border border-orange-200 rounded p-1.5 text-xs font-bold text-orange-700 bg-orange-50" value="${data.qty_si || 0}" oninput="formatInput(this)"></td><td class="p-2 border-l border-blue-100"><input type="text" class="qty-so-input w-full text-center border border-blue-200 rounded p-1.5 text-xs font-bold text-blue-700 bg-blue-50" value="${data.qty_so || 0}" oninput="formatInput(this)"></td><td class="p-2"><input type="text" class="si-input w-full text-right text-gray-400 bg-transparent border-none text-xs" value="${fmn(data.si || 0)}" readonly></td><td class="p-2"><input type="text" class="so-input w-full text-right border border-gray-200 text-gray-700 rounded p-1.5 text-xs font-bold" value="${fmn(data.so || 0)}" oninput="formatInput(this)"></td><td class="p-2 text-right font-bold text-orange-600 bg-orange-50/50 text-xs total-si-row border-l border-orange-100">0</td><td class="p-2 text-right font-bold text-blue-600 bg-blue-50/50 text-xs total-so-row border-l border-blue-100">0</td><td class="p-2 text-center"><button type="button" onclick="this.closest('tr').remove(); calcAll();" class="text-gray-400 hover:text-red-500"><i class="fa-solid fa-trash"></i></button></td>`;
    document.getElementById('salesDetailBody').appendChild(tr);
    if (data.model) calcRow(tr.querySelector('input'));
}

export function calcRow(el) {
    const row = el.closest('tr');
    const qtySI = parseNumber(row.querySelector('.qty-si-input').value);
    const qtySO = parseNumber(row.querySelector('.qty-so-input').value);
    const so = parseNumber(row.querySelector('.so-input').value);
    const si = parseNumber(row.querySelector('.si-input').value);
    row.querySelector('.si-input').value = fmn(si);
    row.querySelector('.total-si-row').innerText = fmn(qtySI * si);
    row.querySelector('.total-so-row').innerText = fmn(qtySO * so);
    calcAll();
}

export function calcAll() {
    let totalRev = 0, totalImportVal = 0, totalSoldQty = 0, totalCOGS_Real = 0;
    document.querySelectorAll('#salesDetailBody tr').forEach(tr => {
        const qtySI = parseNumber(tr.querySelector('.qty-si-input').value);
        const qtySO = parseNumber(tr.querySelector('.qty-so-input').value);
        const so = parseNumber(tr.querySelector('.so-input').value);
        const si = parseNumber(tr.querySelector('.si-input').value);
        totalImportVal += (qtySI * si);
        totalRev += (qtySO * so);
        totalCOGS_Real += (qtySO * si);
        totalSoldQty += qtySO;
    });
    if (document.getElementById('total_cal_import_val')) document.getElementById('total_cal_import_val').innerText = fmn(totalImportVal);
    if (document.getElementById('total_cal_rev')) document.getElementById('total_cal_rev').innerText = fmn(totalRev);
    document.getElementById('actual_revenue').value = fmn(totalRev);
    document.getElementById('cost_goods').value = fmn(totalCOGS_Real);
    document.getElementById('sold_quantity').value = fmn(totalSoldQty);
}

// --- HISTORY & EXCEL ---
export function ui_renderHistoryTable(reports) {
    // 🔥 LẤY ROLE HIỆN TẠI
    const userRole = STATE.currentUser?.role || ""; 
    const isDirector = userRole === 'Giám Đốc' || userRole === 'Admin';

    document.getElementById('historyBody').innerHTML = (reports || []).map(r => {
        const isPending = r.status === 'submitted';
        
        // Badge trạng thái
        const statusBadge = isPending 
            ? `<span class="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[10px] font-bold border border-orange-200">⏳ CHỜ DUYỆT</span>` 
            : `<span class="bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px] font-bold border border-blue-200">✅ ĐÃ DUYỆT</span>`;

        // Logic nút hành động
        let actions = "";
        
        if (isPending) {
            // Nút Sửa & Xóa (Ai cũng thấy nếu báo cáo chưa duyệt)
            actions += `
                <button onclick="window.editReport('${r.report_id}')" class="text-blue-500 hover:bg-blue-100 p-2 rounded mx-1" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="window.deleteReport('${r.report_id}')" class="text-red-500 hover:bg-red-100 p-2 rounded mx-1" title="Xóa"><i class="fa-solid fa-trash"></i></button>
            `;

            // 🔥 NÚT DUYỆT & XEM CHI TIẾT (CHỈ GIÁM ĐỐC/ADMIN) 🔥
            if (isDirector) {
                // Thêm nút Xem (Mắt thần)
                actions += `
                    <button onclick="window.viewReportDetail('${r.report_id}')" class="text-purple-600 hover:bg-purple-100 p-2 rounded mx-1 border border-purple-200 shadow-sm" title="Xem Chi Tiết P&L">
                        <i class="fa-solid fa-eye"></i>
                    </button>
                `;
            }
        } else {
            // Đã duyệt thì khóa, nhưng Giám đốc vẫn xem được chi tiết
            if (isDirector) {
                actions = `<button onclick="window.viewReportDetail('${r.report_id}')" class="text-gray-500 hover:bg-gray-100 p-2 rounded mx-1" title="Xem lại"><i class="fa-solid fa-eye"></i></button>`;
            }
            actions += `<span class="text-gray-300 p-2"><i class="fa-solid fa-lock"></i></span>`;
        }

        const shopInfo = STATE.globalShopMap[r.shop_code] || {};
        
        return `
            <tr class="hover:bg-gray-50 border-b transition">
                <td class="p-4 font-bold text-xs whitespace-nowrap">${r.report_month}</td>
                <td class="p-4 text-xs font-bold text-purple-600">${shopInfo.area || "---"}</td>
                <td class="p-4 text-xs font-bold text-slate-800 uppercase">
                    ${shopInfo.shop_name || r.shop_code}
                    <div class="text-[9px] text-gray-400 font-normal">${r.shop_code}</div>
                </td>
                <td class="p-4 text-xs font-black text-orange-600 text-center">${r.sold_quantity || 0}</td>
                <td class="p-4 text-right font-mono font-bold text-blue-600 text-xs">${fmn(r.actual_revenue)}</td>
                <td class="p-4 text-center">${statusBadge}</td>
                <td class="p-4 text-center whitespace-nowrap flex justify-center items-center">
                    ${actions}
                </td>
            </tr>`;
    }).join('');
}

export function exportDirectorExcel() {
    if (!STATE.cachedDirectorData || STATE.cachedDirectorData.length === 0) return alert("Chưa có dữ liệu!");
    const wsDataAgg = [["Mã Shop", "Tên Shop", "Tháng", "Doanh Thu", "Lợi Nhuận", "Tổng Chi Phí", "Margin %", "SL Bán", "Chi Phí MKT"]];
    STATE.cachedDirectorData.forEach(r => {
        const k = calcKPI(r); const margin = k.rev > 0 ? (k.net / k.rev) * 100 : 0;
        wsDataAgg.push([r.shop_code, STATE.globalShopMap[r.shop_code]?.shop_name, r.report_month, k.rev, k.net, k.totalExp, margin.toFixed(2), r.sold_quantity, k.mkt]);
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsDataAgg), "Tong_Hop");
    XLSX.writeFile(wb, `Bao_Cao_Giam_Doc_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function updateCostSummary() {
    const shopSel = document.getElementById('shop_code');
    const shopName = shopSel.options[shopSel.selectedIndex]?.text || "Chưa chọn Shop";
    document.getElementById('summary_shop_name').innerText = shopName;
    document.getElementById('summary_rev').innerText = document.getElementById('actual_revenue').value + " VNĐ";
}

export function initChartFilter() {
    if (!STATE.currentUser) return;
    const sales = [...new Set(STATE.globalAssignedShops.map(s => s.sale_name).filter(n => n))].sort();
    const saleSel = document.getElementById('chart_sale');
    saleSel.innerHTML = `<option value="">-- Tất cả Sale --</option>` + sales.map(s => `<option value="${s}">${s}</option>`).join('');
    
    if (STATE.currentUser.role !== 'Giám Đốc' && STATE.currentUser.role !== 'Admin') {
        saleSel.value = STATE.currentUser.full_name;
        saleSel.disabled = true;
    }
    updateChartFilters('sale');
}

export function updateChartFilters(level) {
    const selSale = document.getElementById('chart_sale').value;
    let filtered = STATE.globalAssignedShops;
    if (selSale) filtered = filtered.filter(s => s.sale_name === selSale);
    if (level === 'sale') {
        const svns = [...new Set(filtered.map(s => s.svn_code).filter(n => n))].sort();
        document.getElementById('chart_svn').innerHTML = `<option value="">-- Tất cả SVN --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join('');
    }
    if (document.getElementById('chart_svn').value) filtered = filtered.filter(s => s.svn_code === document.getElementById('chart_svn').value);
    const dvns = filtered.sort((a, b) => a.shop_code.localeCompare(b.shop_code));
    document.getElementById('chart_dvn').innerHTML = `<option value="">-- Chọn Shop --</option>` + dvns.map(s => `<option value="${s.shop_code}">${s.shop_code} - ${s.shop_name}</option>`).join('');
    if (dvns.length > 0) document.getElementById('chart_dvn').value = dvns[0].shop_code;
}