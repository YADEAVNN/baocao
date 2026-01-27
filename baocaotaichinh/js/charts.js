// js/charts.js
import { sb, STATE } from './config.js';
import { fmn, calcKPI, safeVal } from './utils.js';

// Đăng ký Plugin Chart.js (Kiểm tra kỹ để tránh lỗi undefined)
try {
    if (typeof Chart !== 'undefined') {
        if (typeof ChartDataLabels !== 'undefined') Chart.register(ChartDataLabels);
        if (window['chartjs-plugin-annotation']) Chart.register(window['chartjs-plugin-annotation']);
    }
} catch (e) { console.warn("Lỗi đăng ký Plugin Chart:", e); }

// --- HÀM RENDER CHART CHUNG (HELPER) ---
export function renderChart(type, id, data, options = {}) {
    const canvas = document.getElementById(id);
    if (!canvas) return; 
    
    const ctx = canvas.getContext('2d');
    
    // Hủy biểu đồ cũ nếu tồn tại để tránh vẽ chồng (memory leak)
    if (STATE.chartInstances[id]) {
        STATE.chartInstances[id].destroy();
    }

    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 25, bottom: 5, left: 5, right: 10 } },
        plugins: {
            legend: { 
                position: 'bottom', 
                labels: { usePointStyle: true, boxWidth: 8, font: { size: 11, family: "'Roboto', sans-serif" } } 
            },
            datalabels: {
                color: '#fff',
                font: { weight: 'bold', size: 10 },
                // Mặc định chỉ hiện số cho biểu đồ tròn (Pie/Doughnut)
                formatter: (v) => (type === 'pie' || type === 'doughnut') ? (v > 0 ? fmn(v) : '') : '',
                display: (context) => type === 'pie' || type === 'doughnut'
            },
            tooltip: { 
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                padding: 12,
                cornerRadius: 6,
                callbacks: { 
                    label: c => ` ${c.dataset.label}: ${fmn(c.raw.y || c.raw)}` 
                } 
            },
            ...options.plugins
        },
        scales: {
            x: { 
                grid: { display: false }, 
                ticks: { font: { size: 10, weight: '600' } }, 
                ...options.scales?.x 
            },
            y: { 
                grid: { color: '#f3f4f6', borderDash: [5, 5] }, 
                beginAtZero: true, 
                ...options.scales?.y 
            },
            ...options.scales
        },
        ...options
    };

    STATE.chartInstances[id] = new Chart(ctx, { type, data, options: defaultOptions });
}

// ============================================================
// PHẦN 1: TỔNG QUAN THỊ TRƯỜNG (TAB 1)
// ============================================================

let currentOverviewMonths = [];

export async function loadOverviewDashboard() {
    if (STATE.assignedShopCodes.length === 0) return;

    // Lấy 12 tháng gần nhất để vẽ biểu đồ xu hướng
    let monthsToFetch = [];
    let d = new Date();
    for (let i = 0; i < 12; i++) {
        let y = d.getFullYear();
        let m = String(d.getMonth() + 1).padStart(2, '0');
        monthsToFetch.push(`${y}-${m}-01`);
        d.setMonth(d.getMonth() - 1);
    }
    monthsToFetch.reverse();
    currentOverviewMonths = monthsToFetch;

    // Fetch dữ liệu báo cáo từ Supabase
    const { data: reports } = await sb.from('financial_reports')
        .select('*')
        .in('shop_code', STATE.assignedShopCodes)
        .in('report_month', monthsToFetch)
        .eq('status', 'approved')
        .order('report_month', { ascending: true });

    if (!reports || reports.length === 0) {
        // Reset về 0 nếu không có data
        ['ov_rev', 'ov_profit', 'ov_vol', 'ov_rate', 'ov_si', 'ov_stock'].forEach(id => {
            if(document.getElementById(id)) document.getElementById(id).innerText = "0";
        });
        return;
    }

    STATE.cachedDirectorData = reports; 

    // --- POPULATE BỘ LỌC (Tỉnh, Sale, Tháng) ---
    const saleSet = new Set();
    const provSet = new Set();
    const monthSet = new Set();
    
    reports.forEach(r => {
        monthSet.add(r.report_month);
        const s = STATE.globalShopMap[r.shop_code];
        if(s) {
            if(s.sale_name) saleSet.add(s.sale_name);
            if(s.province) provSet.add(s.province);
        }
    });

    const sortedMonths = [...monthSet].sort().reverse();
    const filterMonth = document.getElementById('ov_filter_month');
    if(filterMonth) {
        filterMonth.innerHTML = sortedMonths.map(m => `<option value="${m}">${m}</option>`).join('');
        if(sortedMonths.length > 0) filterMonth.value = sortedMonths[0]; 
    }

    const provs = [...provSet].sort();
    const filterProv = document.getElementById('ov_filter_province');
    if(filterProv) {
        filterProv.innerHTML = `<option value="">-- Tất cả Tỉnh (${provs.length}) --</option>` + 
            provs.map(p => `<option value="${p}">${p}</option>`).join('');
    }

    const sales = [...saleSet].sort();
    const filterSale = document.getElementById('ov_filter_sale');
    if(filterSale) {
        filterSale.innerHTML = `<option value="">-- Tất cả Sale (${sales.length}) --</option>` + 
            sales.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    // Render lần đầu
    window.filterOverview();
}

// Hàm lọc chung cho Overview
window.filterOverview = () => {
    const selSale = document.getElementById('ov_filter_sale').value;
    const selProv = document.getElementById('ov_filter_province').value;
    const selMonth = document.getElementById('ov_filter_month').value;
    
    let filteredReports = STATE.cachedDirectorData;

    if (selProv) {
        filteredReports = filteredReports.filter(r => {
            const shop = STATE.globalShopMap[r.shop_code];
            return shop && shop.province === selProv;
        });
    }

    if (selSale) {
        filteredReports = filteredReports.filter(r => {
            const shop = STATE.globalShopMap[r.shop_code];
            return shop && shop.sale_name === selSale;
        });
    }

    renderOverviewVisuals(filteredReports, currentOverviewMonths, selMonth);
};

function renderOverviewVisuals(reports, months, selectedMonth) {
    // 1. KPI Cards (Chỉ tính cho tháng được chọn)
    const currentReports = reports.filter(r => r.report_month === selectedMonth);

    let totRev = 0, totProfit = 0, totVol = 0, totSI = 0, totStock = 0;
    let profitableShops = 0;

    currentReports.forEach(r => {
        const k = calcKPI(r);
        totRev += k.rev;
        totProfit += k.net;
        totVol += (r.sold_quantity || 0);
        if (k.net > 0) profitableShops++;

        let si = 0;
        try {
            const details = typeof r.sales_detail_json === 'string' ? JSON.parse(r.sales_detail_json) : r.sales_detail_json || [];
            details.forEach(d => si += (d.qty_si || 0));
        } catch(e) {}
        totSI += si;
        
        const stock = safeVal(r.opening_stock) + si - (r.sold_quantity || 0);
        totStock += stock;
    });

    if(document.getElementById('ov_rev')) document.getElementById('ov_rev').innerText = fmn(totRev);
    if(document.getElementById('ov_profit')) document.getElementById('ov_profit').innerText = fmn(totProfit);
    if(document.getElementById('ov_vol')) document.getElementById('ov_vol').innerText = fmn(totVol);
    if(document.getElementById('ov_si')) document.getElementById('ov_si').innerText = fmn(totSI);
    if(document.getElementById('ov_stock')) document.getElementById('ov_stock').innerText = fmn(totStock);
    if(document.getElementById('ov_rate')) document.getElementById('ov_rate').innerText = `${profitableShops}/${currentReports.length}`;

    // 2. Biểu đồ Xu hướng (B4 - Luôn hiển thị 12 tháng để thấy trend)
    const trendRev = [], trendNet = [];
    const niceLabels = months.map(m => `T${parseInt(m.split('-')[1])}/${m.split('-')[0].slice(2)}`);

    months.forEach(m => {
        const monthlyReports = reports.filter(r => r.report_month === m);
        let mRev = 0, mNet = 0;
        monthlyReports.forEach(r => { const k = calcKPI(r); mRev += k.rev; mNet += k.net; });
        trendRev.push(mRev); trendNet.push(mNet);
    });

    renderChart('bar', 'chart_B4_Trend', {
        labels: niceLabels,
        datasets: [
            { type: 'bar', label: 'Tổng Doanh Thu', data: trendRev, backgroundColor: 'rgba(59, 130, 246, 0.7)', borderRadius: 4, order: 2 },
            { type: 'line', label: 'Tổng Lợi Nhuận', data: trendNet, borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 2, pointRadius: 4, tension: 0.3, order: 1 }
        ]
    });

    // 3. Các biểu đồ chi tiết khác (Xếp hạng, MKT, Scatter...)
    const shopAgg = {};
    currentReports.forEach(r => {
        const sName = STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code;
        if (!shopAgg[r.shop_code]) shopAgg[r.shop_code] = { net: 0, rev: 0, mkt: 0, exp: 0, name: sName };
        const k = calcKPI(r);
        shopAgg[r.shop_code].net += k.net; shopAgg[r.shop_code].rev += k.rev;
        shopAgg[r.shop_code].mkt += k.mkt; shopAgg[r.shop_code].exp += k.totalExp;
    });
    
    const shopList = Object.values(shopAgg);

    // B2: Xếp hạng
    const sortedShops = [...shopList].sort((a, b) => b.net - a.net).slice(0, 10);
    renderChart('bar', 'chart_B2_Rank', {
        labels: sortedShops.map(s => s.name), 
        datasets: [{ 
            label: 'Lợi Nhuận (Tháng)', 
            data: sortedShops.map(s => s.net), 
            backgroundColor: sortedShops.map(s => s.net >= 0 ? '#16a34a' : '#ef4444'),
            borderRadius: 4, barThickness: 15
        }]
    }, { indexAxis: 'y', plugins: { datalabels: { display: false } }, scales: { x: { grid: { display: true, borderDash: [2,2] } } } });

    // B5: Marketing
    const mktData = [...shopList].sort((a, b) => b.mkt - a.mkt).slice(0, 10);
    renderChart('bar', 'chart_B5_Mkt', {
        labels: mktData.map(d => d.name),
        datasets: [
            { label: 'Chi phí MKT', data: mktData.map(d => d.mkt), backgroundColor: '#ef4444', borderRadius: 4, order: 2 }, 
            { type: 'line', label: 'Doanh thu', data: mktData.map(d => d.rev), borderColor: '#3b82f6', borderWidth: 2, pointBackgroundColor: 'white', order: 1, yAxisID: 'y1' }
        ]
    }, { 
        scales: { 
            x: { ticks: { maxRotation: 0, minRotation: 0 } },
            y: { display: true }, 
            y1: { display: true, position: 'right', grid: { drawOnChartArea: false } } 
        } 
    });

    // B6: Scatter
    const scatterData = currentReports.map(r => {
        const k = calcKPI(r);
        const margin = k.rev > 0 ? (k.net / k.rev) * 100 : 0;
        return { x: k.rev, y: margin, shop: STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code, net: k.net };
    });
    renderChart('scatter', 'chart_B6_Scatter', { 
        datasets:[{ label: 'Shop', data: scatterData, backgroundColor: ctx => (ctx.raw && ctx.raw.y>=0) ? '#16a34a' : '#dc2626', pointRadius: 6 }] 
    }, { 
        plugins: { legend: {display:false}, datalabels:{display:false}, tooltip: { callbacks: { label: c=>c.raw.shop, afterLabel: c=>`DT: ${fmn(c.raw.x)} | MG: ${c.raw.y.toFixed(1)}%` } } },
        scales: { x: {title:{display:true,text:'Doanh Thu'}}, y: {title:{display:true,text:'Margin (%)'}} }
    });

    // B3: Table Heatmap
    document.getElementById('body_B3_Heatmap').innerHTML = currentReports.map(r => {
        const k = calcKPI(r);
        const margin = k.rev ? (k.net / k.rev) * 100 : 0;
        const mktPct = k.rev ? (k.mkt / k.rev) * 100 : 0;
        const shopName = STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code;
        return `<tr class="border-b hover:bg-gray-50"><td class="p-3 font-bold text-slate-700">${shopName}</td><td class="p-3 text-right font-mono text-blue-600">${fmn(k.rev)}</td><td class="p-3 text-right font-black ${k.net >= 0 ? 'text-green-600' : 'text-red-600'}">${fmn(k.net)}</td><td class="p-3 text-center font-bold ${margin < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} rounded">${margin.toFixed(1)}%</td><td class="p-3 text-center font-bold text-orange-600">${r.sold_quantity || 0}</td><td class="p-3 text-center text-xs text-gray-500">${mktPct.toFixed(1)}%</td></tr>`;
    }).join('');

    // Top Model & Stock
    const modelAgg = {};
    currentReports.forEach(r => {
        let details = [];
        try { details = typeof r.sales_detail_json === 'string' ? JSON.parse(r.sales_detail_json) : r.sales_detail_json || []; } catch (e) {}
        details.forEach(d => { const name = d.model || "Unknown"; if (!modelAgg[name]) modelAgg[name] = 0; modelAgg[name] += (d.qty_so || 0); });
    });
    const sortedModels = Object.entries(modelAgg).sort((a, b) => b[1] - a[1]).slice(0, 10);
    renderChart('bar', 'chart_Ov_TopProducts', {
        labels: sortedModels.map(m => m[0]),
        datasets: [{ label: 'Số lượng bán', data: sortedModels.map(m => m[1]), backgroundColor: '#f59e0b', borderRadius: 4 }]
    }, { indexAxis: 'y' });

    const stockData = currentReports.map(r => {
        const k = calcKPI(r);
        let totalSI = 0; try { const details = typeof r.sales_detail_json === 'string' ? JSON.parse(r.sales_detail_json) : r.sales_detail_json || []; details.forEach(d => totalSI += (d.qty_si || 0)); } catch(e){}
        const endStock = (safeVal(r.opening_stock) + totalSI) - (r.sold_quantity || 0);
        return { name: STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code, stock: endStock, sold: r.sold_quantity || 0, rev: k.rev };
    }).sort((a, b) => b.rev - a.rev).slice(0, 10);

    renderChart('bar', 'chart_Ov_StockHealth', {
        labels: stockData.map(d => d.name),
        datasets: [
            { label: 'Tồn kho hiện tại', data: stockData.map(d => d.stock), backgroundColor: '#9333ea', order: 2 },
            { type: 'line', label: 'Đã bán trong tháng', data: stockData.map(d => d.sold), borderColor: '#16a34a', borderWidth: 2, pointBackgroundColor: '#fff', pointRadius: 4, order: 1 }
        ]
    });
}

// ============================================================
// PHẦN 2: CHI TIẾT SHOP (TAB 2)
// ============================================================

export async function loadCharts() {
    const selDVN = document.getElementById('chart_dvn').value;
    if (!selDVN) return;
    const { data: reports } = await sb.from('financial_reports').select('*').eq('shop_code', selDVN).eq('status', 'approved').order('report_month', { ascending: true });
    if (!reports || reports.length === 0) { document.getElementById('shop-charts-container').classList.add('hidden'); return; }
    document.getElementById('shop-charts-container').classList.remove('hidden');
    renderShopLevel(reports[reports.length - 1], reports);
}

function renderShopLevel(r, allReports) {
    const k = calcKPI(r);
    let totalSI = 0; let details = [];
    try { details = typeof r.sales_detail_json === 'string' ? JSON.parse(r.sales_detail_json) : r.sales_detail_json || []; } catch (e) { }
    if (details.length) details.forEach(d => totalSI += (d.qty_si || 0));
    const openStock = safeVal(r.opening_stock);
    const totalSO = r.sold_quantity || 0;
    const endStock = openStock + totalSI - totalSO;

    document.getElementById('chart_kpi_cards').innerHTML = `<div class="bg-white p-4 rounded-xl shadow-sm border-b-4 border-blue-500 text-center"><p class="text-[10px] font-black uppercase">S.I (Nhập)</p><h4 class="text-3xl font-black text-blue-600">${totalSI}</h4></div><div class="bg-white p-4 rounded-xl shadow-sm border-b-4 border-green-500 text-center"><p class="text-[10px] font-black uppercase">S.O (Bán)</p><h4 class="text-3xl font-black text-green-600">${totalSO}</h4></div><div class="bg-white p-4 rounded-xl shadow-sm border-b-4 ${endStock < 0 ? 'border-red-500' : 'border-purple-500'} text-center"><p class="text-[10px] font-black uppercase">Tồn Cuối</p><h4 class="text-3xl font-black ${endStock < 0 ? 'text-red-600' : 'text-purple-600'}">${endStock}</h4></div>`;
    renderChart('bar', 'chartWaterfall', { labels: ['Doanh Thu', 'Giá Vốn', 'Vận Hành', 'Logistic', 'Marketing', 'Khác', 'LỢI NHUẬN'], datasets: [{ data: [k.rev, -k.cogs, -k.op, -k.log, -k.mkt, -k.other, k.net], backgroundColor: ['#3b82f6', '#ef4444', '#ef4444', '#ef4444', '#ef4444', '#ef4444', k.net >= 0 ? '#16a34a' : '#b91c1c'] }] }, { plugins: { legend: { display: false }, datalabels: { display: true } } });

    if (totalSO > 0) {
        const fixed = k.op + k.mkt + k.other; const varUnit = (k.cogs + k.log) / totalSO; const asp = k.rev / totalSO; const contrib = asp - varUnit; 
        let bepRevenue = 0; let bepQty = 0;
        if (contrib > 0) { bepQty = Math.ceil(fixed / contrib); bepRevenue = bepQty * asp; }
        document.getElementById('txt_breakeven').innerText = bepQty > 0 ? `Cần bán ~${bepQty} xe` : "Lỗ gộp";
        const isSafe = k.rev >= bepRevenue; const percent = bepRevenue > 0 ? Math.round((k.rev / bepRevenue) * 100) : 0;
        renderChart('bar', 'chartBreakeven', { labels: ['Mốc Hòa Vốn', 'Thực Đạt'], datasets: [{ label: 'Doanh Thu', data: [bepRevenue, k.rev], backgroundColor: ['#e5e7eb', isSafe ? '#16a34a' : '#dc2626'], borderRadius: 4, barThickness: 30 }] }, { indexAxis: 'y', plugins: { title: { display: true, text: `Đã đạt ${percent}% điểm hòa vốn`, font: { size: 14 } }, legend: { display: false }, datalabels: { anchor: 'end', align: 'end', color: '#333', formatter: (v) => fmn(v) } }, scales: { x: { display: false, max: Math.max(bepRevenue, k.rev) * 1.2 } } });
    } else { document.getElementById('txt_breakeven').innerText = "Chưa có doanh thu"; renderChart('bar', 'chartBreakeven', { labels: [], datasets: [] }); }

    renderChart('doughnut', 'chart_C2_Donut', { labels: ['Vận hành', 'Logistic', 'MKT', 'Khác'], datasets: [{ data: [k.op, k.log, k.mkt, k.other], backgroundColor: ['#64748b', '#3b82f6', '#f97316', '#a8a29e'] }] });
    const trendLabels = allReports.map(x => x.report_month); const trendRev = allReports.map(x => calcKPI(x).rev); const trendNet = allReports.map(x => calcKPI(x).net);
    renderChart('line', 'chart_C3_Trend', { labels: trendLabels, datasets: [{ label: 'Doanh Thu', data: trendRev, borderColor: '#2563eb' }, { label: 'Lợi Nhuận', data: trendNet, borderColor: '#16a34a' }] });

    if (details.length) { details.sort((a, b) => (b.qty_so || 0) - (a.qty_so || 0)); document.getElementById('div_C5_Model').innerHTML = `<table class="w-full text-xs text-left"><thead class="bg-gray-100 font-bold sticky top-0"><tr><th class="p-2">Model</th><th class="p-2 text-center">SL Bán</th><th class="p-2 text-right">Doanh Thu</th></tr></thead><tbody class="divide-y divide-gray-100">${details.map(d => `<tr class="hover:bg-gray-50"><td class="p-2 font-medium">${d.model}</td><td class="p-2 text-center font-bold text-blue-600">${d.qty_so||0}</td><td class="p-2 text-right font-mono text-gray-500">${fmn((d.qty_so||0)*(d.so||0))}</td></tr>`).join('')}</tbody></table>`; renderChart('bar', 'chart_C6_Stack', { labels: details.map(d => d.model), datasets: [ { label: 'Bán (S.O)', data: details.map(d => d.qty_so || 0), backgroundColor: '#3b82f6' }, { label: 'Nhập (S.I)', data: details.map(d => d.qty_si || 0), backgroundColor: '#f97316' } ] }, { scales: { x: { stacked: true }, y: { stacked: true } } }); } else { document.getElementById('div_C5_Model').innerHTML = "<p class='p-4 text-center text-gray-400 italic'>Chưa có dữ liệu chi tiết xe</p>"; }
}

// ============================================================
// PHẦN 3: TIẾN ĐỘ TARGET & TĂNG TRƯỞNG (TAB 3 - MỚI)
// ============================================================

export async function loadTargetDashboard() {
    // 1. Lấy bộ lọc
    const selYear = document.getElementById('tg_filter_year');
    const selProv = document.getElementById('tg_filter_province');
    const selSVN = document.getElementById('tg_filter_svn');
    const selDVN = document.getElementById('tg_filter_dvn');

    // Populate Filters nếu chưa có
    if (selProv && selProv.options.length <= 1) {
        const provs = [...new Set(STATE.globalAssignedShops.map(s => s.province).filter(n => n))].sort();
        const svns = [...new Set(STATE.globalAssignedShops.map(s => s.svn_code).filter(n => n))].sort();
        const shops = STATE.globalAssignedShops.sort((a,b) => a.shop_code.localeCompare(b.shop_code));

        selProv.innerHTML = `<option value="">-- Tất cả Tỉnh --</option>` + provs.map(p => `<option value="${p}">${p}</option>`).join('');
        selSVN.innerHTML = `<option value="">-- Tất cả SVN --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join('');
        selDVN.innerHTML = `<option value="">-- Tất cả Shop --</option>` + shops.map(s => `<option value="${s.shop_code}">${s.shop_code} - ${s.shop_name}</option>`).join('');
    }

    // 2. Xác định danh sách Shop để lấy Actual
    let targetShopCodes = [];
    if (selDVN.value) {
        targetShopCodes = [selDVN.value];
    } else {
        let filtered = STATE.globalAssignedShops;
        if (selProv.value) filtered = filtered.filter(s => s.province === selProv.value);
        if (selSVN.value) filtered = filtered.filter(s => s.svn_code === selSVN.value);
        targetShopCodes = filtered.map(s => s.shop_code);
    }
    if (targetShopCodes.length === 0) return;

    // 3. Chuẩn bị tham số
    const year = selYear.value || new Date().getFullYear();
    const startYear = `${year}-01-01`;
    const endYear = `${year}-12-31`;
    const currentUser = STATE.currentUser;

    // Xác định logic lấy Target dựa trên Role
    let targetPromise;
    
    if (currentUser.role === 'Admin') {
        // Admin: Xem hết
        targetPromise = sb.from('kpi_targets')
            .select('*')
            .eq('scope', 'SALE_AGENT') 
            .gte('target_month', `${year}-01`)
            .lte('target_month', `${year}-12`);
            
    } else if (currentUser.role === 'Giám Đốc') {
        // Giám Đốc: Xem Sale của mình
        const mySales = [...new Set(STATE.globalAssignedShops.map(s => s.sale_name).filter(n => n))];
        targetPromise = sb.from('kpi_targets')
            .select('*')
            .eq('scope', 'SALE_AGENT')
            .in('reference_code', mySales) 
            .gte('target_month', `${year}-01`)
            .lte('target_month', `${year}-12`);

    } else {
        // Sale: Xem của mình
        targetPromise = sb.from('kpi_targets')
            .select('*')
            .eq('scope', 'SALE_AGENT') 
            .eq('reference_code', currentUser.full_name)
            .gte('target_month', `${year}-01`)
            .lte('target_month', `${year}-12`);
    }

    // 4. Gọi API
    const [ { data: actualData }, { data: targetData } ] = await Promise.all([
        sb.from('financial_reports')
            .select('report_month, shop_code, sold_quantity, sales_detail_json, activity_quantity')
            .in('shop_code', targetShopCodes)
            .gte('report_month', startYear)
            .lte('report_month', endYear)
            .eq('status', 'approved'),
        targetPromise
    ]);

    // 5. Tổng hợp dữ liệu (Aggregation) theo từng tháng
    const aggregated = {}; 
    const months = [];
    for(let i=1; i<=12; i++) {
        const mKey = `${year}-${String(i).padStart(2,'0')}`; 
        months.push(mKey);
        aggregated[mKey] = { target_si: 0, target_so: 0, target_act: 0, act_si: 0, act_so: 0, act_act: 0 };
    }

    // Map Target vào từng tháng
    if(targetData) targetData.forEach(t => {
        if(aggregated[t.target_month]) {
            aggregated[t.target_month].target_si += (t.target_si || 0);
            aggregated[t.target_month].target_so += (t.target_so || 0);
            aggregated[t.target_month].target_act += (t.target_activity || 0); // Đã thêm Target Act
        }
    });

    // Map Actual vào từng tháng
    if(actualData) actualData.forEach(r => {
        const mKey = r.report_month.slice(0, 7);
        if(aggregated[mKey]) {
            let si = 0;
            try {
                const details = typeof r.sales_detail_json === 'string' ? JSON.parse(r.sales_detail_json) : r.sales_detail_json || [];
                details.forEach(d => si += (d.qty_si || 0));
            } catch(e) {}
            aggregated[mKey].act_si += si;
            aggregated[mKey].act_so += (r.sold_quantity || 0);
            aggregated[mKey].act_act += (r.activity_quantity || 0); // Đã thêm Actual Act
        }
    });

    // 6. Tính toán KPI hiển thị Card (CÓ ÁP DỤNG BỘ LỌC THÁNG)
    let sumT_SI = 0, sumA_SI = 0, sumT_SO = 0, sumA_SO = 0, sumT_Act = 0, sumA_Act = 0;
    
    // Lấy giá trị lọc tháng (ví dụ: "02" hoặc "")
    const filterMonthVal = document.getElementById('tg_filter_month').value; 

    Object.entries(aggregated).forEach(([key, v]) => {
        const mPart = key.split('-')[1]; // Lấy phần tháng "01", "02" từ key "2026-01"

        // 🔥 FIX QUAN TRỌNG: Chỉ cộng dồn nếu KHÔNG lọc tháng hoặc tháng trùng khớp
        if (!filterMonthVal || filterMonthVal === mPart) {
            sumT_SI += v.target_si; sumA_SI += v.act_si;
            sumT_SO += v.target_so; sumA_SO += v.act_so;
            sumT_Act += v.target_act; sumA_Act += v.act_act;
        }
    });

    // Tính % (Tránh chia cho 0)
    const pctSI = sumT_SI > 0 ? Math.round((sumA_SI / sumT_SI) * 100) : 0;
    const pctSO = sumT_SO > 0 ? Math.round((sumA_SO / sumT_SO) * 100) : 0;
    const pctAct = sumT_Act > 0 ? Math.round((sumA_Act / sumT_Act) * 100) : 0;

    // Update DOM: S.I
    document.getElementById('tg_card_si_percent').innerText = `${pctSI}%`;
    document.getElementById('tg_val_si_act').innerText = fmn(sumA_SI);
    document.getElementById('tg_val_si_target').innerText = fmn(sumT_SI);
    document.getElementById('tg_progress_si').style.width = `${Math.min(pctSI, 100)}%`;

    // Update DOM: S.O
    document.getElementById('tg_card_so_percent').innerText = `${pctSO}%`;
    document.getElementById('tg_val_so_act').innerText = fmn(sumA_SO);
    document.getElementById('tg_val_so_target').innerText = fmn(sumT_SO);
    document.getElementById('tg_progress_so').style.width = `${Math.min(pctSO, 100)}%`;

    // Update DOM: Activity (Kiểm tra null đề phòng user chưa update HTML)
    if(document.getElementById('tg_card_act_percent')) {
        document.getElementById('tg_card_act_percent').innerText = `${pctAct}%`;
        document.getElementById('tg_val_act_act').innerText = fmn(sumA_Act);
        document.getElementById('tg_val_act_target').innerText = fmn(sumT_Act);
        document.getElementById('tg_progress_act').style.width = `${Math.min(pctAct, 100)}%`;
    }

    // 7. Vẽ biểu đồ (Tăng trưởng - Luôn vẽ cả năm để thấy xu hướng)
    const labels = months.map(m => `T${m.split('-')[1]}`);
    
    // Helper: Tính % tăng trưởng so với tháng trước
    const getGrowthData = (dataArr) => {
        return dataArr.map((val, idx) => {
            if (idx === 0) return 0; // Tháng 1 chưa có tăng trưởng
            const prev = dataArr[idx - 1];
            // Nếu tháng trước = 0, coi như 0% để tránh chia cho 0
            return prev === 0 ? 0 : ((val - prev) / prev) * 100;
        });
    };

    const dataActSI = months.map(m => aggregated[m].act_si);
    const dataTgtSI = months.map(m => aggregated[m].target_si);
    const dataGrowthSI = getGrowthData(dataActSI);

    // --- CHART S.I (NHẬP) ---
    renderChart('bar', 'chart_Target_SI', {
        labels: labels,
        datasets: [
            { 
                type: 'line', 
                label: '% Tăng trưởng', 
                data: dataActSI,
                borderColor: '#16a34a', // Xanh lá
                borderWidth: 2, 
                tension: 0.3, 
                pointRadius: 4, 
                pointBackgroundColor: '#fff',
                datalabels: {
                    display: true, 
                    align: 'top', 
                    anchor: 'end',
                    formatter: (value, ctx) => {
                        const growth = dataGrowthSI[ctx.dataIndex];
                        if (ctx.dataIndex === 0 || growth === 0) return '';
                        const icon = growth > 0 ? '▲' : '▼';
                        return `${icon} ${Math.abs(growth).toFixed(1)}%`;
                    },
                    color: (ctx) => dataGrowthSI[ctx.dataIndex] >= 0 ? '#16a34a' : '#ef4444',
                    font: { size: 10, weight: 'bold' }
                },
                order: 1
            },
            { label: 'Thực Tế', data: dataActSI, backgroundColor: '#f97316', order: 2 }, // Cam đậm
            { label: 'Mục Tiêu', data: dataTgtSI, backgroundColor: '#ffedd5', order: 3 } // Cam nhạt
        ]
    }, { scales: { y: { beginAtZero: true } } });

    // --- CHART S.O (BÁN) ---
    const dataActSO = months.map(m => aggregated[m].act_so);
    const dataTgtSO = months.map(m => aggregated[m].target_so);
    const dataGrowthSO = getGrowthData(dataActSO);

    renderChart('bar', 'chart_Target_SO', {
        labels: labels,
        datasets: [
            { 
                type: 'line', 
                label: '% Tăng trưởng', 
                data: dataActSO, 
                borderColor: '#2563eb', // Xanh dương
                borderWidth: 2, 
                tension: 0.3, 
                pointRadius: 4, 
                pointBackgroundColor: '#fff',
                datalabels: {
                    display: true, 
                    align: 'top', 
                    anchor: 'end',
                    formatter: (value, ctx) => {
                        const growth = dataGrowthSO[ctx.dataIndex];
                        if (ctx.dataIndex === 0 || growth === 0) return '';
                        const icon = growth > 0 ? '▲' : '▼';
                        return `${icon} ${Math.abs(growth).toFixed(1)}%`;
                    },
                    color: (ctx) => dataGrowthSO[ctx.dataIndex] >= 0 ? '#16a34a' : '#ef4444',
                    font: { size: 10, weight: 'bold' }
                },
                order: 1
            },
            { label: 'Thực Tế', data: dataActSO, backgroundColor: '#3b82f6', order: 2 }, // Xanh đậm
            { label: 'Mục Tiêu', data: dataTgtSO, backgroundColor: '#dbeafe', order: 3 } // Xanh nhạt
        ]
    });
}
