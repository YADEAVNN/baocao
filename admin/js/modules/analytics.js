import { $, fmn, safeVal } from '../core/utils.js';
import { sb } from '../core/supabase.js';
import { calcKPI } from '../core/calculator.js';

let fullChartInstances = {};
let cachedAnalyticsData = [];

export function initFilterChain() { 
    const directors = [...new Set(Object.values(window.globalAdminShopMap).map(s => s.director_name).filter(n => n))].sort();
    $('ana_director').innerHTML = `<option value="">-- Tất cả --</option>` + directors.map(d => `<option value="${d}">${d}</option>`).join(''); 
    updateFilterChain('director');
}

export const updateFilterChain = (level) => { 
    const selDir = $('ana_director').value; 
    const selSale = $('ana_sale').value;
    const selSVN = $('ana_svn').value; 
    
    let filtered = Object.values(window.globalAdminShopMap); 
    if(selDir) filtered = filtered.filter(s => s.director_name === selDir);
    
    if(level === 'director') { 
        const sales = [...new Set(filtered.map(s => s.sale_name).filter(n => n))].sort();
        $('ana_sale').innerHTML = `<option value="">-- Tất cả --</option>` + sales.map(s => `<option value="${s}">${s}</option>`).join(''); 
        $('ana_sale').value = "";
    } 
    
    if($('ana_sale').value) filtered = filtered.filter(s => s.sale_name === $('ana_sale').value); 
    
    if(level === 'director' || level === 'sale') { 
        const svns = [...new Set(filtered.map(s => s.svn_code).filter(n => n))].sort();
        $('ana_svn').innerHTML = `<option value="">-- Tất cả --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join(''); 
        $('ana_svn').value = "";
    } 
    
    if($('ana_svn').value) filtered = filtered.filter(s => s.svn_code === $('ana_svn').value); 
    
    const dvns = filtered.sort((a,b) => a.shop_code.localeCompare(b.shop_code));
    $('ana_dvn').innerHTML = `<option value="">-- Tất cả Shop (${dvns.length}) --</option>` + dvns.map(s => `<option value="${s.shop_code}">${s.shop_code} - ${s.shop_name}</option>`).join('');
}

export const resetFilters = () => { 
    $('ana_director').value = ""; 
    updateFilterChain('director');
}

// --- MAIN ANALYTICS LOGIC ---
export async function loadAnalyticsFull() {
    const monthInput = $('ana_month').value;
    if(!monthInput) return alert("Chưa chọn tháng!");
    
    const trendRange = parseInt($('ana_trend_range').value) || 6; 
    const selDVN = $('ana_dvn').value;
    const selectedFullDate = monthInput + "-01";
    
    $('ana_loading').classList.remove('hidden'); 
    $('ana_content').classList.add('hidden');
    
    let monthsToFetch = []; 
    let d = new Date(selectedFullDate);
    for(let i=0; i<trendRange; i++) { 
        let y = d.getFullYear(); 
        let m = String(d.getMonth()+1).padStart(2,'0'); 
        monthsToFetch.push(`${y}-${m}-01`); 
        d.setMonth(d.getMonth() - 1); 
    } 
    monthsToFetch.reverse();
    
    const { data: reports, error } = await sb.from('financial_reports').select('*').in('report_month', monthsToFetch).eq('status', 'approved');
    $('ana_loading').classList.add('hidden'); 
    $('ana_content').classList.remove('hidden'); 
    
    if(error) return alert("Lỗi: " + error.message);
    
    cachedAnalyticsData = (reports||[]).map(r => ({ ...r, ...(window.globalAdminShopMap[r.shop_code] || {}) })); 
    const richReports = cachedAnalyticsData;
    
    renderNationalLevel(richReports, selectedFullDate, monthsToFetch);
    
    let regionReports = richReports; 
    let regionLabel = "Toàn quốc"; 
    
    if($('ana_director').value) { 
        regionReports = regionReports.filter(r => r.director_name === $('ana_director').value);
        regionLabel = $('ana_director').value; 
    } else if($('ana_sale').value) { 
        regionReports = regionReports.filter(r => r.sale_name === $('ana_sale').value); 
        regionLabel = $('ana_sale').value;
    } else if($('ana_svn').value) { 
        regionReports = regionReports.filter(r => r.svn_code === $('ana_svn').value); 
        regionLabel = $('ana_svn').value; 
    } 
    
    $('lbl_Director_Name').innerText = regionLabel;
    renderRegionalLevel(regionReports, selectedFullDate, monthsToFetch);
    
    if(selDVN) { 
        const shopReports = richReports.filter(r => r.shop_code === selDVN); 
        const shopInfo = window.globalAdminShopMap[selDVN];
        $('lbl_Shop_Name').innerText = `${shopInfo?.shop_name} (${selDVN})`; 
        $('shop_analysis_content').classList.remove('hidden'); 
        $('shop_analysis_empty').classList.add('hidden'); 
        renderShopLevel(shopReports, selectedFullDate, monthsToFetch, selDVN); 
        switchSubTab('shop'); 
    } else { 
        $('lbl_Shop_Name').innerText = "---"; 
        $('shop_analysis_content').classList.add('hidden'); 
        $('shop_analysis_empty').classList.remove('hidden');
        if($('ana_director').value) switchSubTab('regional'); else switchSubTab('national'); 
    }
}

export const switchSubTab = (subTab) => { 
    ['national', 'regional', 'shop'].forEach(t => { 
        $(`ana-tab-${t}`).classList.add('hidden'); 
        $(`btn-tab-${t}`).classList.remove('active'); 
    });
    $(`ana-tab-${subTab}`).classList.remove('hidden'); 
    $(`btn-tab-${subTab}`).classList.add('active'); 
}

// --- HELPER RENDER FUNCTIONS ---
function renderChart(type, id, data, options={}) { 
    const ctx = $(id).getContext('2d'); 
    if(fullChartInstances[id]) fullChartInstances[id].destroy();
    fullChartInstances[id] = new Chart(ctx, { 
        type, data, 
        options: { 
            responsive: true, maintainAspectRatio: false, 
            plugins: { 
                legend: {position:'bottom', labels:{boxWidth:10, font:{size:10}}}, 
                datalabels: { color: '#fff', font:{weight:'bold', size:9}, formatter: (v) => type==='pie'||type==='doughnut'||type==='bar'? (v>0?fmn(v):'') : '', display: type==='pie'||type==='doughnut' }, 
                tooltip: { callbacks: { label: c => ` ${c.dataset.label}: ${fmn(c.raw.y||c.raw)}` } }, 
                ...options.plugins 
            }, 
            scales: options.scales || {}, ...options 
        } 
    });
}

function renderNationalLevel(data, curMonth, months) {
    // ... Copy logic từ code cũ hàm renderNationalLevel ...
    // DO CODE QUÁ DÀI, BẠN COPY HÀM renderNationalLevel TỪ FILE GỐC VÀO ĐÂY VÀ SỬA calcKPI => calcKPI(r) (Đã import)
    const curData = data.filter(r => r.report_month === curMonth);
    let totRev = 0, totNet = 0, profitCount = 0; curData.forEach(r => { const k=calcKPI(r); totRev+=k.rev; totNet+=k.net; if(k.net>0) profitCount++; });
    $('nat_rev').innerText = fmn(totRev); $('nat_profit').innerText = fmn(totNet); $('nat_pct').innerText = curData.length ? Math.round((profitCount/curData.length)*100)+"%" : "0%"; $('nat_risk').innerText = (curData.length - profitCount);
    const trendRev = months.map(m => data.filter(r=>r.report_month===m).reduce((s,r)=>s+calcKPI(r).rev,0)); const trendNet = months.map(m => data.filter(r=>r.report_month===m).reduce((s,r)=>s+calcKPI(r).net,0));
    renderChart('line', 'chart_A2_Trend', { labels:months, datasets: [{ label:'Doanh Thu', data:trendRev, borderColor:'#2563eb' }, { label:'Lợi Nhuận', data:trendNet, borderColor:'#16a34a' }] });
    const agg = { op:0, log:0, mkt:0, other:0 }; curData.forEach(r => { const k=calcKPI(r); agg.op+=k.op; agg.log+=k.log; agg.mkt+=k.mkt; agg.other+=k.other; });
    renderChart('doughnut', 'chart_A3_Cost', { labels:['Vận hành','Logistic','Marketing','Khác'], datasets:[{data:[agg.op, agg.log, agg.mkt, agg.other], backgroundColor:['#64748b','#3b82f6','#f97316','#a8a29e']}] }); const top10 = curData.map(r=>({name:r.shop_name, net:calcKPI(r).net})).sort((a,b)=>b.net-a.net).slice(0,10);
    renderChart('bar', 'chart_A4_Top10', { labels:top10.map(x=>x.name.substring(0,15)), datasets:[{label:'Lợi Nhuận', data:top10.map(x=>x.net), backgroundColor:'#16a34a'}] }); const provMap = {};
    curData.forEach(r => { const p = r.province || "Unknown"; if(!provMap[p]) provMap[p]=0; provMap[p]+=calcKPI(r).net; }); const sortedProv = Object.entries(provMap).sort((a,b)=>b[1]-a[1]).slice(0,12);
    renderChart('bar', 'chart_A6_Map', { labels:sortedProv.map(x=>x[0]), datasets:[{label:'Lợi nhuận theo Tỉnh', data:sortedProv.map(x=>x[1]), backgroundColor:'#059669'}] }, {indexAxis:'y'}); const shopHistory = {};
    data.forEach(r => { if(!shopHistory[r.shop_code]) shopHistory[r.shop_code]=[]; shopHistory[r.shop_code].push(r); }); let risks = [];
    Object.keys(shopHistory).forEach(code => { const hist = shopHistory[code].sort((a,b)=>a.report_month.localeCompare(b.report_month)); const recent = hist.slice(-3); if(recent.length >= 2 && recent.every(x => calcKPI(x).net < 0)) { risks.push({ code, name: window.globalAdminShopMap[code]?.shop_name, months: recent.length, totalLoss: recent.reduce((s,x)=>s+calcKPI(x).net,0) }); } });
    $('body_A5_Risk').innerHTML = risks.sort((a,b)=>a.totalLoss - b.totalLoss).map(r => `<tr class="border-b hover:bg-red-50"><td class="p-2 font-bold">${r.code}</td><td class="p-2">${r.name}</td><td class="p-2 text-center text-red-600 font-bold">${r.months}</td><td class="p-2 text-right text-red-600 font-mono">${fmn(r.totalLoss)}</td></tr>`).join('') ||
    `<tr><td colspan="4" class="p-4 text-center text-green-600">Tuyệt vời! Không có shop nào lỗ liên tiếp.</td></tr>`;
}

function renderRegionalLevel(data, curMonth, months) {
     const curData = data.filter(r => r.report_month === curMonth);
    const sorted = curData.map(r=>({name:r.shop_code, net:calcKPI(r).net})).sort((a,b)=>b.net-a.net).slice(0,20); renderChart('bar', 'chart_B2_Rank', { labels: sorted.map(x=>x.name), datasets:[{label:'Lợi nhuận', data:sorted.map(x=>x.net), backgroundColor: sorted.map(x=>x.net>=0?'#16a34a':'#ef4444')}] });
    $('body_B3_Heatmap').innerHTML = curData.map(r => { const k = calcKPI(r); const margin = k.rev? (k.net/k.rev)*100 : 0; const mktPct = k.rev? (k.mkt/k.rev)*100 : 0; return `<tr class="border-b hover:bg-gray-50"><td class="p-2 font-bold">${r.shop_name}</td><td class="p-2 text-right font-mono text-blue-600">${fmn(k.rev)}</td><td class="p-2 text-right font-black ${k.net>=0?'text-green-600':'text-red-600'}">${fmn(k.net)}</td><td class="p-2 text-center font-bold ${margin<0?'bg-red-100 text-red-600':'bg-green-100 text-green-600'}">${margin.toFixed(1)}%</td><td class="p-2 text-center">${r.sold_quantity||0}</td><td class="p-2 text-center text-xs">${mktPct.toFixed(1)}%</td></tr>`; }).join('');
    const regTrendRev = months.map(m => data.filter(r=>r.report_month===m).reduce((s,r)=>s+calcKPI(r).rev,0)); const regTrendNet = months.map(m => data.filter(r=>r.report_month===m).reduce((s,r)=>s+calcKPI(r).net,0));
    renderChart('line', 'chart_B4_Trend', { labels:months, datasets: [{ label:'Doanh Thu Vùng', data:regTrendRev, borderColor:'#8b5cf6' }, { label:'Lợi Nhuận Vùng', data:regTrendNet, borderColor:'#10b981' }] });
    const mktData = curData.map(r=>({name:r.shop_code, mkt:calcKPI(r).mkt, rev:calcKPI(r).rev})).sort((a,b)=>b.mkt-a.mkt).slice(0,15); renderChart('bar', 'chart_B5_Mkt', { labels:mktData.map(d=>d.name), datasets:[{label:'Chi phí MKT', data:mktData.map(d=>d.mkt), backgroundColor:'#ef4444'}, {type:'line', label:'Doanh thu', data:mktData.map(d=>d.rev), borderColor:'#3b82f6', yAxisID:'y1'}]}, {scales:{y:{display:true}, y1:{display:true, position:'right', grid:{drawOnChartArea:false}}}});
    const scatterData = curData.map(r => ({ x: calcKPI(r).rev, y: calcKPI(r).totalExp, shop: r.shop_code })); const maxV = Math.max(...scatterData.map(d=>d.x), ...scatterData.map(d=>d.y), 10000);
    renderChart('scatter', 'chart_B6_Scatter', { datasets:[{label:'Shop', data:scatterData, backgroundColor:'#f97316'}] }, { plugins: { annotation: { annotations: { line1: { type:'line', scaleID:'x', value:0, endValue:maxV, scaleID:'y', value:0, endValue:maxV, borderColor:'gray', borderDash:[5,5] } } } } });
}

function renderShopLevel(data, curMonth, months, code) {
    const r = data.find(x => x.report_month === curMonth); if(!r) return;
    const k = calcKPI(r); let totalSI = 0; let details = [];
    try{details = typeof r.sales_detail_json==='string'?JSON.parse(r.sales_detail_json):r.sales_detail_json||[];}catch(e){} if(details.length) { details.forEach(d => totalSI += (d.qty_si || 0)); } const openStock = safeVal(r.opening_stock);
    const totalSO = r.sold_quantity || 0; const endStock = openStock + totalSI - totalSO; const stockDiff = totalSI - totalSO;
    $('shop_kpi_inventory').innerHTML = `<div class="bg-white p-4 rounded-xl shadow-sm border-b-4 border-gray-400"><p class="text-[10px] font-black text-gray-400 uppercase">Tồn Đầu (Khai báo)</p><h4 class="text-3xl font-black text-slate-600 mt-1">${openStock} <span class="text-sm font-medium text-gray-400">xe</span></h4></div><div class="bg-white p-4 rounded-xl shadow-sm border-b-4 border-blue-500"><p class="text-[10px] font-black text-gray-400 uppercase">S.I (Nhập)</p><h4 class="text-3xl font-black text-blue-600 mt-1">${totalSI} <span class="text-sm font-medium text-gray-400">xe</span></h4></div><div class="bg-white p-4 rounded-xl shadow-sm border-b-4 border-green-500"><p class="text-[10px] font-black text-gray-400 uppercase">S.O (Bán)</p><h4 class="text-3xl font-black text-green-600 mt-1">${totalSO} <span class="text-sm font-medium text-gray-400">xe</span></h4></div><div class="bg-white p-4 rounded-xl shadow-sm border-b-4 ${endStock<5?'border-red-500':'border-purple-500'}"><p class="text-[10px] font-black text-gray-400 uppercase">Tồn Cuối (Real)</p><h4 class="text-3xl font-black ${endStock<5?'text-red-600':'text-purple-600'} mt-1">${endStock} <span class="text-sm font-medium text-gray-400">xe</span></h4></div>`;
    renderChart('bar', 'chart_C1_Waterfall', { labels: ['Doanh Thu', 'Giá Vốn', 'Vận Hành', 'Logistic', 'Marketing', 'Khác', 'LỢI NHUẬN'], datasets: [{ data: [k.rev, -k.cogs, -k.op, -k.log, -k.mkt, -k.other, k.net], backgroundColor: ['#3b82f6', '#ef4444', '#ef4444', '#ef4444', '#ef4444', '#ef4444', k.net>=0?'#16a34a':'#b91c1c'] }] }, {plugins:{legend:{display:false}}});
    renderChart('doughnut', 'chart_C2_Donut', { labels:['Vận hành','Logistic','MKT','Khác'], datasets:[{data:[k.op, k.log, k.mkt, k.other], backgroundColor:['#64748b','#3b82f6','#f97316','#a8a29e']}]});
    const sRev = months.map(m => { const x=data.find(d=>d.report_month===m); return x?calcKPI(x).rev:0; });
    const sNet = months.map(m => { const x=data.find(d=>d.report_month===m); return x?calcKPI(x).net:0; });
    renderChart('line', 'chart_C3_Trend', {labels:months, datasets:[{label:'Doanh Thu', data:sRev, borderColor:'#2563eb'}, {label:'Lợi Nhuận', data:sNet, borderColor:'#16a34a'}]});
    if(totalSO > 0) { const fixed = k.op + k.mkt + k.other; const varUnit = (k.cogs + k.log) / totalSO;
    const asp = k.rev / totalSO; const contrib = asp - varUnit; const bep = contrib>0 ? Math.ceil(fixed/contrib) : 0;
    $('txt_C4_BEP').innerText = bep>0 ? `~${bep} xe` : "Lỗ gộp"; const maxQ = Math.max(totalSO*1.5, bep*1.5, 20); const pts=[], dRev=[], dCost=[];
    for(let i=0; i<=maxQ; i+=Math.ceil(maxQ/10)) { pts.push(i); dRev.push(i*asp); dCost.push(fixed + i*varUnit);
    } renderChart('line', 'chart_C4_BEP', {labels:pts, datasets:[{label:'Doanh Thu', data:dRev, borderColor:'#16a34a'}, {label:'Tổng Chi Phí', data:dCost, borderColor:'#ef4444'}]}, {plugins:{annotation:{annotations:{pt:{type:'point', xValue:bep, yValue:bep*asp, backgroundColor:'orange', radius:6}}}}});
    } else $('txt_C4_BEP').innerText = "Chưa bán hàng"; if(details.length) { details.sort((a,b)=>(b.qty_so||0)-(a.qty_so||0));
    $('div_C5_Model').innerHTML = `<table class="w-full text-xs text-left" id="table_C5_Model"><thead class="bg-gray-100 font-bold sticky top-0"><tr><th class="p-2">Model</th><th class="p-2 text-center">SL Bán</th><th class="p-2 text-right">Doanh Thu</th></tr></thead><tbody>${details.map(d => `<tr class="border-b"><td class="p-2">${d.model}</td><td class="p-2 text-center font-bold">${d.qty_so||0}</td><td class="p-2 text-right font-mono">${fmn((d.qty_so||0)*(d.so||0))}</td></tr>`).join('')}</tbody></table>`;
    renderChart('bar', 'chart_C6_Stack', { labels: details.map(d=>d.model), datasets: [{label:'Bán (S.O)', data:details.map(d=>d.qty_so||0), backgroundColor:'#3b82f6'}, {label:'Nhập (S.I)', data:details.map(d=>d.qty_si||0), backgroundColor:'#f97316'}] }, {scales:{x:{stacked:true}, y:{stacked:true}}});
    } else { $('div_C5_Model').innerHTML="<p class='p-4 text-gray-400 italic'>Chưa có dữ liệu model</p>";
    } 
}

export const exportAnalyticsExcel = () => { 
    if(!cachedAnalyticsData || cachedAnalyticsData.length === 0) return alert("Chưa có dữ liệu! Vui lòng bấm 'Tải Dashboard' trước.");
    const wsDataAgg = [["Mã Shop", "Tên Shop", "Giám Đốc", "Khu Vực", "Doanh Thu", "Lợi Nhuận", "Tổng Chi Phí", "Margin %", "SL Bán", "Chi Phí MKT"]];
    cachedAnalyticsData.forEach(r => { const k = calcKPI(r); const margin = k.rev > 0 ? (k.net/k.rev)*100 : 0; wsDataAgg.push([r.shop_code, r.shop_name, r.director_name, r.area, k.rev, k.net, k.totalExp, margin.toFixed(2), r.sold_quantity, k.mkt]); });
    const wsDataDetail = [["Tháng", "Mã Shop", "Tên Shop", "Doanh Thu", "Giá Vốn", "Lợi Nhuận Gộp", "Vận Hành", "Logistic", "Marketing", "Khác", "Lợi Nhuận Ròng"]];
    cachedAnalyticsData.forEach(r => { const k = calcKPI(r); wsDataDetail.push([r.report_month, r.shop_code, r.shop_name, k.rev, k.cogs, k.rev-k.cogs, k.op, k.log, k.mkt, k.other, k.net]); });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsDataAgg), "Tong_Hop_Vung"); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsDataDetail), "Chi_Tiet_PL"); XLSX.writeFile(wb, `Bao_Cao_Phan_Tich_${$('ana_month').value}.xlsx`);
}