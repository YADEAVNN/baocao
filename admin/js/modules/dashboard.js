import { $, fmn, safeVal, toggleModal } from '../core/utils.js';
import { sb } from '../core/supabase.js';
import { calcKPI } from '../core/calculator.js';

let pendingReportsCache = [];
let isLossFilterActive = false;

// --- INITIALIZATION ---
export function initDashFilters() { 
    const directors = [...new Set(Object.values(window.globalAdminShopMap).map(s => s.director_name).filter(n => n))].sort();
    $('dash_director').innerHTML = `<option value="">-- Tất cả --</option>` + directors.map(d => `<option value="${d}">${d}</option>`).join(''); 
    updateDashChain('director');
}

// --- LOGIC LOAD DATA ---
export async function loadDashboard() { 
    const month = $('f_month').value + "-01";
    const { data: allReports, error } = await sb.from('financial_reports').select('*').eq('report_month', month).order('created_at', {ascending: false});
    if(error) return console.error(error);
    pendingReportsCache = allReports || [];
    filterDashboardData(); 
}

// --- FILTER CHAIN ---
export const updateDashChain = (level) => { 
    const selDir = $('dash_director').value; 
    const selSale = $('dash_sale').value;
    const selSVN = $('dash_svn').value; 
    
    let filtered = Object.values(window.globalAdminShopMap); 
    if(selDir) filtered = filtered.filter(s => s.director_name === selDir);
    
    if(level === 'director') { 
        const sales = [...new Set(filtered.map(s => s.sale_name).filter(n => n))].sort();
        $('dash_sale').innerHTML = `<option value="">-- Tất cả --</option>` + sales.map(s => `<option value="${s}">${s}</option>`).join(''); 
        $('dash_sale').value = "";
    } 
    
    if($('dash_sale').value) filtered = filtered.filter(s => s.sale_name === $('dash_sale').value); 
    
    if(level === 'director' || level === 'sale') { 
        const svns = [...new Set(filtered.map(s => s.svn_code).filter(n => n))].sort();
        $('dash_svn').innerHTML = `<option value="">-- Tất cả --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join(''); 
        $('dash_svn').value = "";
    } 
    
    if($('dash_svn').value) filtered = filtered.filter(s => s.svn_code === $('dash_svn').value); 
    
    const dvns = filtered.sort((a,b) => a.shop_code.localeCompare(b.shop_code));
    $('dash_dvn').innerHTML = `<option value="">-- Tất cả Shop (${dvns.length}) --</option>` + dvns.map(s => `<option value="${s.shop_code}">${s.shop_code} - ${s.shop_name}</option>`).join(''); 
    
    filterDashboardData();
}

export const resetDashFilters = () => { 
    $('dash_director').value = ""; 
    $('dash_status').value = ""; 
    updateDashChain('director');
}

export const filterDashboardData = () => { 
    const selDir = $('dash_director').value; 
    const selSale = $('dash_sale').value;
    const selSVN = $('dash_svn').value; 
    const selDVN = $('dash_dvn').value; 
    const selStatus = $('dash_status').value; 
    
    let filteredData = [...pendingReportsCache];
    if(selDir || selSale || selSVN || selDVN) { 
        filteredData = filteredData.filter(r => { 
            const shop = window.globalAdminShopMap[r.shop_code] || {}; 
            const matchDir = selDir ? shop.director_name === selDir : true; 
            const matchSale = selSale ? shop.sale_name === selSale : true; 
            const matchSVN = selSVN ? shop.svn_code === selSVN : true; 
            const matchDVN = selDVN ? r.shop_code === selDVN : true; 
            return matchDir && matchSale && matchSVN && matchDVN; 
        });
    } 
    if(selStatus) { filteredData = filteredData.filter(r => r.status === selStatus); } 
    
    const totalRev = filteredData.reduce((s,r)=>s+safeVal(r.actual_revenue),0); 
    let totalProfit = 0;
    filteredData.forEach(r => totalProfit += calcKPI(r).net); 
    
    $('kpi_rev').innerText = fmn(totalRev); 
    $('kpi_profit').innerText = fmn(totalProfit); 
    $('submittedCount').innerText = `${filteredData.length} SHOP`; 
    
    renderTable(filteredData);
}

// --- RENDER & ACTIONS ---
function renderTable(data) {
    $('pendingBody').innerHTML = data.map((r, i) => { 
        const shop = window.globalAdminShopMap[r.shop_code] || {}; 
        const statusBadge = r.status === 'approved' ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-bold border border-green-200">ĐÃ DUYỆT</span>` : `<span class="bg-orange-100 text-orange-700 px-2 py-1 rounded text-xs font-bold border border-orange-200">CHỜ DUYỆT</span>`;
        const k = calcKPI(r); 
        const margin = k.rev > 0 ? (k.net/k.rev)*100 : 0;
        const profitColor = k.net >= 0 ? "text-green-600" : "text-red-600 font-black";
        const marginColor = margin >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
        return `<tr class="hover:bg-gray-50 border-b transition">
            <td class="p-3 text-xs font-bold text-gray-500">${r.report_month}</td>
            <td class="p-3 font-bold text-slate-800 text-sm">${shop.shop_name || r.shop_code}<div class="text-[10px] text-gray-400 font-normal">SVN: ${shop.svn_code || '-'}</div></td>
            <td class="p-3 text-center font-bold text-orange-600">${r.sold_quantity || 0}</td>
            <td class="p-3 text-right font-mono font-bold text-blue-600">${fmn(r.actual_revenue)}</td>
            <td class="p-3 text-right font-mono font-bold ${profitColor}">${fmn(k.net)}</td>
            <td class="p-3 text-center font-bold text-xs ${marginColor} rounded">${margin.toFixed(1)}%</td>
            <td class="p-3 text-center">${statusBadge}</td>
            <td class="p-3 text-center"><button class="bg-gray-100 text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 mx-auto" onclick="openDetailModal('${r.report_id}')"><i class="fa-solid fa-eye"></i></button></td>
            <td class="p-3 text-center flex justify-center gap-2">${r.status !== 'approved' ? `<button class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition" onclick="approve('${r.report_id}')">DUYỆT</button>` : ''}<button class="bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-md transition" onclick="deleteReport('${r.report_id}')"><i class="fa-solid fa-trash"></i></button></td>
        </tr>` 
    }).join('');
}

export const toggleLossFilter = () => { 
    isLossFilterActive = !isLossFilterActive; 
    const btn = document.getElementById('btnLossFilter');
    if(isLossFilterActive) { 
        btn.className = "w-full md:w-auto bg-red-600 text-white px-3 py-2 rounded-lg text-xs font-bold transition shadow-lg flex items-center justify-center gap-1";
        btn.innerHTML = `<i class="fa-solid fa-circle-xmark"></i> Hủy lọc`; 
        const lossShops = pendingReportsCache.filter(r => calcKPI(r).net < 0).sort((a,b) => calcKPI(a).net - calcKPI(b).net); 
        renderTable(lossShops);
    } else { 
        btn.className = "w-full md:w-auto bg-white border border-red-200 text-red-500 hover:bg-red-50 px-3 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1";
        btn.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Xem Shop Báo Động (Lỗ)`; 
        filterDashboardData();
    } 
}

export const sortPendingByProfit = () => { 
    const sorted = [...pendingReportsCache].sort((a,b) => calcKPI(a).net - calcKPI(b).net); 
    renderTable(sorted);
}

export const deleteReport = async (id) => { 
    if(confirm("CẢNH BÁO: Xóa dữ liệu này sẽ mất vĩnh viễn. Tiếp tục?")) { 
        await sb.from('financial_reports').delete().eq('report_id', id);
        loadDashboard(); 
    } 
}

export const approve = async (id) => { 
    if(confirm("Duyệt?")) await sb.from('financial_reports').update({status:'approved'}).eq('report_id', id);
    loadDashboard(); 
}

export const openDetailModal = (id) => { 
    const r = pendingReportsCache.find(x => String(x.report_id) === String(id));
    if(!r) return; 
    const shop = window.globalAdminShopMap[r.shop_code] || {}; 
    $('modalShopName').innerText = `${shop.shop_name || ''} (${r.shop_code})`; 
    $('modalProvince').innerText = shop.province || 'Chưa cập nhật'; 
    $('btnModalApprove').onclick = () => { approve(id); toggleModal('detailModal'); }; 
    
    let details = [];
    try { details = typeof r.sales_detail_json === 'string' ? JSON.parse(r.sales_detail_json) : r.sales_detail_json || []; } catch(e){} 
    
    $('modalDetailBody').innerHTML = details.length === 0 ? `<tr><td colspan="6" class="p-6 text-center text-gray-400 bg-gray-50 rounded-lg italic">Không có dữ liệu chi tiết xe.</td></tr>` : details.map(d => `<tr class="border-b border-gray-50"><td class="p-3 font-bold text-slate-700">${d.model}</td><td class="p-3 text-center text-orange-600 font-bold bg-orange-50/30">${d.qty_si || 0}</td><td class="p-3 text-center text-blue-600 font-bold bg-blue-50/30">${d.qty_so || 0}</td><td class="p-3 text-right text-gray-400 text-xs">${fmn(d.si)}</td><td class="p-3 text-right text-gray-400 text-xs">${fmn(d.so)}</td><td class="p-3 text-right font-mono font-bold text-blue-700 bg-blue-50/30">${fmn((d.qty_so||0) * (d.so||0))}</td></tr>`).join('');
    
    $('modalTotalRev').innerText = fmn(safeVal(r.actual_revenue)) + " VNĐ"; 
    
    const k = calcKPI(r);
    $('modalMainRev').innerText = fmn(safeVal(r.actual_revenue) + safeVal(r.revenue_support));
    $('modalMainCOGS').innerText = fmn(k.cogs); 
    const totalGross = (safeVal(r.actual_revenue) + safeVal(r.revenue_support)) - k.cogs;
    $('modalMainGross').innerText = fmn(totalGross); 
    $('modalMainGross').className = `text-2xl font-black mt-1 ${totalGross >= 0 ? 'text-green-600' : 'text-red-600'}`;
    
    $('modalCostOp').innerText = fmn(k.op); 
    $('modalCostLog').innerText = fmn(k.log); 
    $('modalCostMkt').innerText = fmn(k.mkt); 
    $('modalCostOther').innerText = fmn(k.other); 
    $('modalTotalExpense').innerText = fmn(k.totalExp); 
    $('modalNetProfit').innerText = fmn(k.net);
    $('modalNetProfit').className = `text-3xl font-black ${k.net >= 0 ? 'text-green-400' : 'text-red-400'}`; 
    
    let totalSI = 0;
    if(details.length) details.forEach(d => totalSI += (d.qty_si || 0)); 
    const opStock = safeVal(r.opening_stock); 
    $('modalOpenStock').innerText = opStock; 
    $('modalNetFlow').innerText = (totalSI - (r.sold_quantity||0));
    $('modalEndStock').innerText = (opStock + totalSI - (r.sold_quantity||0)); 
    
    toggleModal('detailModal'); 
}