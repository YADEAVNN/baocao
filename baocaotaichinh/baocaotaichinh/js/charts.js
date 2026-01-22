// js/charts.js
import { sb, STATE } from './config.js';
import { fmn, calcKPI, safeVal } from './utils.js';

// Đăng ký Plugin
try {
    if (typeof Chart !== 'undefined') {
        if (typeof ChartDataLabels !== 'undefined') Chart.register(ChartDataLabels);
        if (window['chartjs-plugin-annotation']) Chart.register(window['chartjs-plugin-annotation']);
    }
} catch (e) { console.warn("Lỗi đăng ký Plugin Chart:", e); }

// --- HÀM RENDER CHART CHUNG ---
export function renderChart(type, id, data, options = {}) {
    const canvas = document.getElementById(id);
    if (!canvas) return; 
    
    const ctx = canvas.getContext('2d');
    if (STATE.chartInstances[id]) STATE.chartInstances[id].destroy();

    // Logic rút gọn tên thông minh
    const smartTruncateCallback = function(value) {
        const label = this.getLabelForValue(value);
        if (typeof label === 'string' && label.length > 12) return label.substring(0, 10) + '...';
        return label;
    };

    const defaultOptions = {
        responsive: true,
        maintainAspectRatio: false,
        layout: { padding: { top: 15, bottom: 5, left: 5, right: 10 } },
        plugins: {
            legend: { 
                position: 'bottom', 
                labels: { usePointStyle: true, boxWidth: 8, font: { size: 11, family: "'Roboto', sans-serif" } } 
            },
            datalabels: {
                color: '#fff',
                font: { weight: 'bold', size: 10 },
                formatter: (v) => (type === 'pie' || type === 'doughnut') ? (v > 0 ? fmn(v) : '') : '',
                display: (context) => type === 'pie' || type === 'doughnut'
            },
            tooltip: { 
                backgroundColor: 'rgba(17, 24, 39, 0.95)',
                padding: 12,
                cornerRadius: 6,
                titleFont: { size: 13, weight: 'bold' },
                bodyFont: { size: 13 },
                callbacks: { 
                    title: (items) => {
                        if(items[0].label && items[0].label.includes('...')) 
                             return items[0].chart.data.labels[items[0].dataIndex]; // Lấy tên full từ mảng labels gốc
                        return items[0].label;
                    },
                    label: c => ` ${c.dataset.label}: ${fmn(c.raw.y || c.raw)}` 
                } 
            },
            ...options.plugins
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: {
                    maxRotation: 0, // 🔥 ÉP CHỮ KHÔNG NGHIÊNG
                    minRotation: 0,
                    autoSkip: true, 
                    font: { size: 10, weight: '600' },
                    callback: smartTruncateCallback // Rút gọn tên dài
                },
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

// --- 1. LOGIC TỔNG QUAN ---
let currentOverviewMonths = [];

export async function loadOverviewDashboard() {
    if (STATE.assignedShopCodes.length === 0) return;

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

    const { data: reports } = await sb.from('financial_reports')
        .select('*')
        .in('shop_code', STATE.assignedShopCodes)
        .in('report_month', monthsToFetch)
        .eq('status', 'approved')
        .order('report_month', { ascending: true });

    if (!reports || reports.length === 0) {
        ['ov_rev', 'ov_profit', 'ov_vol', 'ov_rate'].forEach(id => {
            if(document.getElementById(id)) document.getElementById(id).innerText = "0";
        });
        return;
    }

    STATE.cachedDirectorData = reports; 

    // --- POPULATE BỘ LỌC TỈNH & SALE ---
    const saleSet = new Set();
    const provSet = new Set();
    
    reports.forEach(r => {
        const s = STATE.globalShopMap[r.shop_code];
        if(s) {
            if(s.sale_name) saleSet.add(s.sale_name);
            if(s.province) provSet.add(s.province);
        }
    });

    // Lọc Tỉnh
    const provs = [...provSet].sort();
    const filterProv = document.getElementById('ov_filter_province');
    if(filterProv) {
        filterProv.innerHTML = `<option value="">-- Tất cả Tỉnh (${provs.length}) --</option>` + 
            provs.map(p => `<option value="${p}">${p}</option>`).join('');
    }

    // Lọc Sale
    const sales = [...saleSet].sort();
    const filterSale = document.getElementById('ov_filter_sale');
    if(filterSale) {
        filterSale.innerHTML = `<option value="">-- Tất cả Sale (${sales.length}) --</option>` + 
            sales.map(s => `<option value="${s}">${s}</option>`).join('');
    }

    renderOverviewVisuals(reports, monthsToFetch);
}

// --- HÀM LỌC CHUNG (Unified Filter) ---
window.filterOverview = () => {
    const selSale = document.getElementById('ov_filter_sale').value;
    const selProv = document.getElementById('ov_filter_province').value;
    
    let filteredReports = STATE.cachedDirectorData;

    // Lọc theo Tỉnh
    if (selProv) {
        filteredReports = filteredReports.filter(r => {
            const shop = STATE.globalShopMap[r.shop_code];
            return shop && shop.province === selProv;
        });
    }

    // Lọc theo Sale
    if (selSale) {
        filteredReports = filteredReports.filter(r => {
            const shop = STATE.globalShopMap[r.shop_code];
            return shop && shop.sale_name === selSale;
        });
    }

    renderOverviewVisuals(filteredReports, currentOverviewMonths);
};

function renderOverviewVisuals(reports, months) {
    // KPI Cards Logic (Giữ nguyên)
    let totRev = 0, totProfit = 0, totVol = 0;
    reports.forEach(r => {
        const k = calcKPI(r);
        totRev += k.rev; totProfit += k.net; totVol += (r.sold_quantity || 0);
    });

    const availableMonths = [...new Set(reports.map(r => r.report_month))].sort();
    const latestMonth = availableMonths[availableMonths.length - 1];
    const currentReports = reports.filter(r => r.report_month === latestMonth);
    let profitableShops = 0;
    currentReports.forEach(r => { if (calcKPI(r).net > 0) profitableShops++; });

    document.getElementById('ov_rev').innerText = fmn(totRev);
    document.getElementById('ov_profit').innerText = fmn(totProfit);
    document.getElementById('ov_vol').innerText = fmn(totVol);
    if(document.getElementById('lbl_kpi_time')) document.getElementById('lbl_kpi_time').innerText = "(12T)";
    document.getElementById('ov_rate').innerText = currentReports.length ? Math.round((profitableShops / currentReports.length) * 100) + "%" : "0%";

    // --- 🔥 B4 (FIXED): XU HƯỚNG VÙNG (COMBO CHART) ---
    const trendRev = [], trendNet = [];
    // Format label tháng ngắn gọn: "2025-02-01" -> "T2/25"
    const niceLabels = months.map(m => {
        const parts = m.split('-');
        return `T${parseInt(parts[1])}/${parts[0].slice(2)}`;
    });

    months.forEach(m => {
        const monthlyReports = reports.filter(r => r.report_month === m);
        let mRev = 0, mNet = 0;
        monthlyReports.forEach(r => { const k = calcKPI(r); mRev += k.rev; mNet += k.net; });
        trendRev.push(mRev); trendNet.push(mNet);
    });

    renderChart('bar', 'chart_B4_Trend', {
        labels: niceLabels, // Dùng nhãn tháng ngắn
        datasets: [
            { 
                type: 'bar', // Cột cho Doanh Thu (Tạo độ lớn)
                label: 'Tổng Doanh Thu', 
                data: trendRev, 
                backgroundColor: 'rgba(59, 130, 246, 0.7)', 
                borderRadius: 4,
                order: 2
            },
            { 
                type: 'line', // Đường cho Lợi Nhuận (So sánh xu hướng)
                label: 'Tổng Lợi Nhuận', 
                data: trendNet, 
                borderColor: '#10b981', 
                backgroundColor: '#10b981', 
                borderWidth: 2,
                pointRadius: 4,
                tension: 0.3,
                order: 1 
            }
        ]
    });

    const shopAgg = {};
    reports.forEach(r => {
        const sName = STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code;
        if (!shopAgg[r.shop_code]) shopAgg[r.shop_code] = { net: 0, rev: 0, mkt: 0, exp: 0, name: sName };
        const k = calcKPI(r);
        shopAgg[r.shop_code].net += k.net; shopAgg[r.shop_code].rev += k.rev;
        shopAgg[r.shop_code].mkt += k.mkt; shopAgg[r.shop_code].exp += k.totalExp;
    });

    // B2: Xếp hạng (Bar Ngang)
    const sortedShops = Object.values(shopAgg).sort((a, b) => b.net - a.net).slice(0, 10);
    renderChart('bar', 'chart_B2_Rank', {
        labels: sortedShops.map(s => s.name), 
        datasets: [{ 
            label: 'Lợi Nhuận (12T)', 
            data: sortedShops.map(s => s.net), 
            backgroundColor: sortedShops.map(s => s.net >= 0 ? '#16a34a' : '#ef4444'),
            borderRadius: 4, barThickness: 15
        }]
    }, { indexAxis: 'y', plugins: { datalabels: { display: false } }, scales: { x: { grid: { display: true, borderDash: [2,2] } } } });

    // --- 🔥 B5 (FIXED): MARKETING (CHỮ NGANG, CẮT TÊN) ---
    const mktData = Object.values(shopAgg).sort((a, b) => b.mkt - a.mkt).slice(0, 10);
    renderChart('bar', 'chart_B5_Mkt', {
        labels: mktData.map(d => d.name), // Truyền tên full, để plugin tự cắt
        datasets: [
            { label: 'Chi phí MKT', data: mktData.map(d => d.mkt), backgroundColor: '#ef4444', borderRadius: 4, order: 2 }, 
            { type: 'line', label: 'Doanh thu', data: mktData.map(d => d.rev), borderColor: '#3b82f6', borderWidth: 2, pointBackgroundColor: 'white', order: 1, yAxisID: 'y1' }
        ]
    }, { 
        scales: { 
            x: { 
                ticks: { maxRotation: 0, minRotation: 0 } // Bắt buộc chữ ngang
            },
            y: { display: true }, 
            y1: { display: true, position: 'right', grid: { drawOnChartArea: false } } 
        } 
    });

    // B6: Ma trận (Giữ nguyên - Đã OK)
    const scatterData = currentReports.map(r => {
        const k = calcKPI(r);
        const margin = k.rev > 0 ? (k.net / k.rev) * 100 : 0;
        return { x: k.rev, y: margin, shop: STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code, net: k.net };
    });
    renderChart('scatter', 'chart_B6_Scatter', { 
        datasets:[{ label: 'Shop', data: scatterData, backgroundColor: ctx => (ctx.raw && ctx.raw.y>=0) ? '#16a34a' : '#dc2626', pointRadius: 6 }] 
    }, { 
        plugins: { legend: {display:false}, datalabels:{display:false}, tooltip: { callbacks: { label: c=>c.raw.shop, afterLabel: c=>`DT: ${fmn(c.raw.x)} | MG: ${c.raw.y.toFixed(1)}%` } }, annotation: { annotations: { line1: { type:'line', yMin:0, yMax:0, borderColor:'#666', borderWidth:2, borderDash:[5,5] } } } },
        scales: { x: {title:{display:true,text:'Doanh Thu'}}, y: {title:{display:true,text:'Margin (%)'}} }
    });

    // B3: Heatmap Table
    document.getElementById('body_B3_Heatmap').innerHTML = currentReports.map(r => {
        const k = calcKPI(r);
        const margin = k.rev ? (k.net / k.rev) * 100 : 0;
        const mktPct = k.rev ? (k.mkt / k.rev) * 100 : 0;
        const shopName = STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code;
        return `<tr class="border-b hover:bg-gray-50"><td class="p-3 font-bold text-slate-700">${shopName}</td><td class="p-3 text-right font-mono text-blue-600">${fmn(k.rev)}</td><td class="p-3 text-right font-black ${k.net >= 0 ? 'text-green-600' : 'text-red-600'}">${fmn(k.net)}</td><td class="p-3 text-center font-bold ${margin < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} rounded">${margin.toFixed(1)}%</td><td class="p-3 text-center font-bold text-orange-600">${r.sold_quantity || 0}</td><td class="p-3 text-center text-xs text-gray-500">${mktPct.toFixed(1)}%</td></tr>`;
    }).join('');

    // Top Model & Stock
    const modelAgg = {};
    reports.forEach(r => {
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

// --- 2. CHI TIẾT SHOP (Giữ nguyên phần này) ---
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