import { sb, STATE } from './config.js';
import { fmn } from './utils.js';

try {
    if (typeof Chart !== 'undefined') {
        if (typeof ChartDataLabels !== 'undefined') Chart.register(ChartDataLabels);
    }
} catch (e) { console.warn("Lỗi đăng ký Plugin Chart:", e); }

export function renderChart(type, id, data, options = {}) {
    const canvas = document.getElementById(id);
    if (!canvas) return; 
    const ctx = canvas.getContext('2d');
    if (STATE.chartInstances[id]) STATE.chartInstances[id].destroy();

    const defaultOptions = {
        responsive: true, maintainAspectRatio: false,
        layout: { padding: { top: 25, bottom: 5, left: 5, right: 10 } },
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, font: { size: 11 } } },
            datalabels: { color: '#fff', font: { weight: 'bold', size: 10 }, formatter: (v) => (type === 'pie' || type === 'doughnut') ? (v > 0 ? v : '') : '', display: (context) => type === 'pie' || type === 'doughnut' },
        },
        ...options
    };
    STATE.chartInstances[id] = new Chart(ctx, { type, data, options: defaultOptions });
}

let currentSOReports = [];

export async function loadOverviewDashboard() {
    if (STATE.assignedShopCodes.length === 0) return;

    const { data: prices } = await sb.from('monthly_product_prices').select('model, selling_price');
    STATE.priceMap = {};
    if (prices) prices.forEach(p => STATE.priceMap[p.model] = p.selling_price || 0);

    const { data: reports } = await sb.from('daily_so_reports')
        .select('*')
        .in('shop_code', STATE.assignedShopCodes)
        .order('report_date', { ascending: true });

    if (!reports || reports.length === 0) {
        ['ov_so', 'ov_natural', 'ov_leads', 'ov_traffic', 'ov_rate'].forEach(id => {
            if(document.getElementById(id)) document.getElementById(id).innerText = "0";
        });
        if(document.getElementById('ov_rev')) document.getElementById('ov_rev').innerText = "0đ";
        return;
    }

    currentSOReports = reports;
    window.updateOVFilters('init');
}

window.updateOVFilters = (level) => {
    const dir = document.getElementById('ov_filter_director')?.value || '';
    const sale = document.getElementById('ov_filter_sale')?.value || '';
    const svn = document.getElementById('ov_filter_svn')?.value || '';
    let shops = STATE.globalAssignedShops;

    if (level === 'init') {
        let directors = [...new Set(shops.map(x => x.director_name).filter(Boolean))].sort();
        document.getElementById('ov_filter_director').innerHTML = `<option value="">-- 1. Tất cả GĐ --</option>` + directors.map(x => `<option value="${x}">${x}</option>`).join('');
    }
    if (level === 'init' || level === 'director') {
        let sales = [...new Set(shops.filter(x => !dir || x.director_name === dir).map(x => x.sale_name).filter(Boolean))].sort();
        document.getElementById('ov_filter_sale').innerHTML = `<option value="">-- 2. Tất cả Sale --</option>` + sales.map(x => `<option value="${x}">${x}</option>`).join('');
        if(level === 'director') document.getElementById('ov_filter_sale').value = '';
    }
    if (level === 'init' || level === 'director' || level === 'sale') {
        let svns = [...new Set(shops.filter(x => (!dir || x.director_name === dir) && (!sale || x.sale_name === sale)).map(x => x.svn_code).filter(Boolean))].sort();
        document.getElementById('ov_filter_svn').innerHTML = `<option value="">-- 3. Tất cả SVN --</option>` + svns.map(x => `<option value="${x}">${x}</option>`).join('');
        if(level !== 'init') document.getElementById('ov_filter_svn').value = '';
    }
    let finalShops = shops.filter(x => (!dir || x.director_name === dir) && (!document.getElementById('ov_filter_sale')?.value || x.sale_name === document.getElementById('ov_filter_sale').value) && (!document.getElementById('ov_filter_svn')?.value || x.svn_code === document.getElementById('ov_filter_svn').value));
    document.getElementById('ov_filter_shop').innerHTML = `<option value="">-- 4. Tất cả DVN (Shop) --</option>` + finalShops.map(x => `<option value="${x.shop_code}">${x.shop_code} - ${x.shop_name}</option>`).join('');
    if (level !== 'init') window.filterOverview();
};

window.filterOverview = () => {
    const selDir = document.getElementById('ov_filter_director')?.value || '';
    const selSale = document.getElementById('ov_filter_sale')?.value || '';
    const selSVN = document.getElementById('ov_filter_svn')?.value || '';
    const selShop = document.getElementById('ov_filter_shop')?.value || '';
    const selDateFrom = document.getElementById('ov_filter_date_from')?.value || '';
    const selDateTo = document.getElementById('ov_filter_date_to')?.value || ''; 
    
    let baseReports = currentSOReports;
    if (selDir) baseReports = baseReports.filter(r => STATE.globalShopMap[r.shop_code]?.director_name === selDir);
    if (selSale) baseReports = baseReports.filter(r => STATE.globalShopMap[r.shop_code]?.sale_name === selSale);
    if (selSVN) baseReports = baseReports.filter(r => STATE.globalShopMap[r.shop_code]?.svn_code === selSVN);
    if (selShop) baseReports = baseReports.filter(r => r.shop_code === selShop);

    let filteredReports = baseReports;
    if (selDateFrom) filteredReports = filteredReports.filter(r => r.report_date >= selDateFrom);
    if (selDateTo) filteredReports = filteredReports.filter(r => r.report_date <= selDateTo);

    renderOverviewVisuals(filteredReports, baseReports);
};

function renderOverviewVisuals(reports, baseReports) {
    let totSO = 0, totNat = 0, totLead = 0, totRev = 0;
    const shopAgg = {}, modelAgg = {};

    reports.forEach(r => {
        totSO += (r.total_so || 0); totNat += (r.traffic_natural || 0); totLead += (r.traffic_leads || 0);
        let reportRev = 0; let details = [];
        try { details = typeof r.models_detail === 'string' ? JSON.parse(r.models_detail) : (r.models_detail || []); } catch(e) {}
        
        details.forEach(d => {
            if (!modelAgg[d.model]) modelAgg[d.model] = { qty: 0, rev: 0 };
            modelAgg[d.model].qty += (d.qty_so || 0);
            const price = STATE.priceMap[d.model] || 0;
            const lineRev = (d.qty_so || 0) * price;
            modelAgg[d.model].rev += lineRev; reportRev += lineRev;
        });
        totRev += reportRev;
        if (!shopAgg[r.shop_code]) shopAgg[r.shop_code] = { so: 0, nat: 0, lead: 0, rev: 0, name: STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code };
        shopAgg[r.shop_code].so += (r.total_so || 0); shopAgg[r.shop_code].nat += (r.traffic_natural || 0); shopAgg[r.shop_code].lead += (r.traffic_leads || 0); shopAgg[r.shop_code].rev += reportRev;
    });

    const totTraffic = totNat + totLead;
    const rate = totTraffic > 0 ? ((totSO / totTraffic) * 100).toFixed(1) : 0;

    if(document.getElementById('ov_rev')) document.getElementById('ov_rev').innerText = fmn(totRev) + 'đ';
    if(document.getElementById('ov_so')) document.getElementById('ov_so').innerText = totSO;
    if(document.getElementById('ov_natural')) document.getElementById('ov_natural').innerText = totNat;
    if(document.getElementById('ov_leads')) document.getElementById('ov_leads').innerText = totLead;
    if(document.getElementById('ov_traffic')) document.getElementById('ov_traffic').innerText = totTraffic;
    if(document.getElementById('ov_rate')) document.getElementById('ov_rate').innerText = rate + '%';

    const monthAgg = {};
    baseReports.forEach(r => {
        const monthKey = r.report_date.slice(0, 7);
        if (!monthAgg[monthKey]) monthAgg[monthKey] = 0;
        monthAgg[monthKey] += (r.total_so || 0);
    });

    const sortedMonths = Object.keys(monthAgg).sort();
    const trendData = [], growthData = [], trendLabels = [];
    sortedMonths.forEach((m, index) => {
        trendLabels.push('T' + m.split('-')[1] + '/' + m.split('-')[0]); 
        const currentSO = monthAgg[m]; trendData.push(currentSO);
        if (index === 0) growthData.push(0); 
        else {
            const prevSO = monthAgg[sortedMonths[index - 1]];
            if (prevSO === 0) growthData.push(currentSO > 0 ? 100 : 0);
            else growthData.push(((currentSO - prevSO) / prevSO) * 100);
        }
    });

    renderChart('bar', 'chart_TrendSO', {
        labels: trendLabels, 
        datasets: [
            { type: 'line', label: '% Tăng trưởng', data: growthData, borderColor: '#10b981', borderWidth: 2, tension: 0.3, pointRadius: 4, pointBackgroundColor: '#fff', yAxisID: 'y1', datalabels: { display: true, align: 'top', anchor: 'end', formatter: (v) => v===0 ? '' : `${v>0?'▲':'▼'} ${Math.abs(v).toFixed(1)}%`, color: (ctx) => growthData[ctx.dataIndex] >= 0 ? '#16a34a' : '#ef4444', font: { size: 10, weight: 'bold' } }, order: 1 },
            { type: 'bar', label: 'Tổng Xe Bán (S.O)', data: trendData, backgroundColor: '#F97316', borderRadius: 4, yAxisID: 'y', order: 2 }
        ]
    }, { scales: { x: { grid: { display: false } }, y: { type: 'linear', display: true, position: 'left', beginAtZero: true }, y1: { type: 'linear', display: false, position: 'right', grid: { drawOnChartArea: false } } } });

    const sortedShops = Object.values(shopAgg).sort((a, b) => b.rev - a.rev).slice(0, 10);
    renderChart('bar', 'chart_TopShop', { labels: sortedShops.map(s => s.name), datasets: [{ label: 'Doanh Thu (VNĐ)', data: sortedShops.map(s => s.rev), backgroundColor: '#3b82f6', borderRadius: 4 }] }, { indexAxis: 'y', plugins: { tooltip: { callbacks: { label: c => ` Doanh Thu: ${fmn(c.raw)}đ` } }, datalabels: { display: false } } });
    renderChart('doughnut', 'chart_TrafficSource', { labels: ['Khách Tự Nhiên', 'Khách Khai Thác'], datasets: [{ data: [totNat, totLead], backgroundColor: ['#22c55e', '#a855f7'] }] });

    const sortedModelsByRev = Object.entries(modelAgg).sort((a, b) => b[1].rev - a[1].rev).slice(0, 10);
    renderChart('bar', 'chart_TopModels', { labels: sortedModelsByRev.map(m => m[0]), datasets: [{ label: 'Doanh Thu (VNĐ)', data: sortedModelsByRev.map(m => m[1].rev), backgroundColor: '#ef4444', borderRadius: 4 }] }, { plugins: { tooltip: { callbacks: { label: c => ` Doanh Thu: ${fmn(c.raw)}đ` } }, datalabels: { display: false } } });

    const sortedModelsByQty = Object.entries(modelAgg).sort((a, b) => b[1].qty - a[1].qty).slice(0, 10);
    renderChart('bar', 'chart_TopModelsQty', { labels: sortedModelsByQty.map(m => m[0]), datasets: [{ label: 'Số Lượng Bán (S.O)', data: sortedModelsByQty.map(m => m[1].qty), backgroundColor: '#f59e0b', borderRadius: 4 }] }, { plugins: { datalabels: { color: '#000', anchor: 'end', align: 'top', formatter: (v) => v > 0 ? v : '' } } });

    if(document.getElementById('body_HeatmapSO')) {
        document.getElementById('body_HeatmapSO').innerHTML = Object.values(shopAgg).sort((a,b)=>b.rev - a.rev).map(s => {
            const trf = s.nat + s.lead; const r = trf > 0 ? ((s.so/trf)*100).toFixed(1) : 0;
            return `<tr class="border-b hover:bg-gray-50">
                <td class="p-3 font-bold text-slate-700">${s.name}</td>
                <td class="p-3 text-right font-black text-red-600">${fmn(s.rev)}đ</td>
                <td class="p-3 text-center font-black text-[#F97316]">${s.so}</td>
                <td class="p-3 text-center text-green-600 font-bold">${s.nat}</td>
                <td class="p-3 text-center text-purple-600 font-bold">${s.lead}</td>
                <td class="p-3 text-center text-blue-600 font-bold">${trf}</td>
                <td class="p-3 text-center font-bold ${r >= 20 ? 'text-teal-600' : 'text-gray-500'}">${r}%</td>
            </tr>`;
        }).join('');
    }
}

// ==========================================
// TAB 6: HOÀN THÀNH TIẾN ĐỘ TARGET (BẢN ĐÃ FIX ĐỒNG BỘ BẢNG ADMIN)
// ==========================================
let tgtDataState = { targets: [], soReports: [], mediaReports: [] };

window.updateTGTFilters = (level) => {
    if (level === 'init') {
        ['tgt_filter_director', 'tgt_filter_sale', 'tgt_filter_svn', 'tgt_filter_shop'].forEach(id => {
            if(document.getElementById(id)) document.getElementById(id).value = '';
        });
        document.getElementById('tgt_filter_month').value = new Date().toISOString().slice(0, 7);
    }

    const dir = document.getElementById('tgt_filter_director')?.value || '';
    const sale = document.getElementById('tgt_filter_sale')?.value || '';
    const svn = document.getElementById('tgt_filter_svn')?.value || '';
    let shops = STATE.globalAssignedShops;

    if (level === 'init') {
        let directors = [...new Set(shops.map(x => x.director_name).filter(Boolean))].sort();
        document.getElementById('tgt_filter_director').innerHTML = `<option value="">-- Tất cả GĐ --</option>` + directors.map(x => `<option value="${x}">${x}</option>`).join('');
    }
    if (level === 'init' || level === 'director') {
        let sales = [...new Set(shops.filter(x => !dir || x.director_name === dir).map(x => x.sale_name).filter(Boolean))].sort();
        document.getElementById('tgt_filter_sale').innerHTML = `<option value="">-- Tất cả Sale --</option>` + sales.map(x => `<option value="${x}">${x}</option>`).join('');
        if(level === 'director') document.getElementById('tgt_filter_sale').value = '';
    }
    if (level === 'init' || level === 'director' || level === 'sale') {
        let svns = [...new Set(shops.filter(x => (!dir || x.director_name === dir) && (!sale || x.sale_name === sale)).map(x => x.svn_code).filter(Boolean))].sort();
        document.getElementById('tgt_filter_svn').innerHTML = `<option value="">-- Tất cả SVN --</option>` + svns.map(x => `<option value="${x}">${x}</option>`).join('');
        if(level !== 'init') document.getElementById('tgt_filter_svn').value = '';
    }

    let finalShops = shops.filter(x => 
        (!dir || x.director_name === dir) && 
        (!document.getElementById('tgt_filter_sale')?.value || x.sale_name === document.getElementById('tgt_filter_sale').value) && 
        (!document.getElementById('tgt_filter_svn')?.value || x.svn_code === document.getElementById('tgt_filter_svn').value)
    );
    document.getElementById('tgt_filter_shop').innerHTML = `<option value="">-- Tất cả DVN --</option>` + finalShops.map(x => `<option value="${x.shop_code}">${x.shop_code} - ${x.shop_name}</option>`).join('');

    if(level !== 'init') window.filterTargetDashboard();
};

export async function loadTargetDashboard(action) {
    if (action === 'init') window.updateTGTFilters('init');

    if (STATE.assignedShopCodes.length === 0) return;
    const btnLoad = document.querySelector('button[onclick="window.loadTargetDashboard()"]');
    if(btnLoad) btnLoad.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...`;

    try {
        const month = document.getElementById('tgt_filter_month').value || new Date().toISOString().slice(0, 7);
        const y = parseInt(month.split('-')[0]); 
        const m = parseInt(month.split('-')[1]);
        const startOfMonth = `${month}-01`;
        const endOfMonth = `${month}-${new Date(y, m, 0).getDate().toString().padStart(2, '0')}`;

        // --- BƯỚC 1: LẤY TARGET TỪ BẢNG CHUẨN CỦA ADMIN ---
        // Sửa lại thành bảng "monthly_shop_targets" và truy vấn bằng cột "report_month"
        const { data: rawTargets } = await sb.from('monthly_shop_targets')
            .select('*')
            .eq('report_month', month)
            .in('shop_code', STATE.assignedShopCodes);

        tgtDataState.targets = rawTargets || [];

        // --- BƯỚC 2 & 3: Lấy báo cáo SO và Media ---
        const { data: soData } = await sb.from('daily_so_reports')
            .select('shop_code, report_date, total_so, traffic_natural, traffic_leads')
            .in('shop_code', STATE.assignedShopCodes)
            .gte('report_date', startOfMonth)
            .lte('report_date', endOfMonth);
        tgtDataState.soReports = soData || [];

        const { data: mediaData } = await sb.from('media_reports')
            .select('shop_code, tiktok_videos, livestreams')
            .in('shop_code', STATE.assignedShopCodes)
            .gte('report_date', startOfMonth)
            .lte('report_date', endOfMonth);
        tgtDataState.mediaReports = mediaData || [];

        window.filterTargetDashboard();
    } catch(err) { console.error("Lỗi tải target:", err); }
    finally { if(btnLoad) btnLoad.innerHTML = `<i class="fa-solid fa-bolt text-yellow-400"></i> TẢI TIẾN ĐỘ`; }
}
window.loadTargetDashboard = loadTargetDashboard;

window.filterTargetDashboard = () => {
    const dir = document.getElementById('tgt_filter_director')?.value || '';
    const sale = document.getElementById('tgt_filter_sale')?.value || '';
    const svn = document.getElementById('tgt_filter_svn')?.value || '';
    const shop = document.getElementById('tgt_filter_shop')?.value || '';

    const displayShops = STATE.globalAssignedShops.filter(x => 
        (!dir || x.director_name === dir) && 
        (!sale || x.sale_name === sale) && 
        (!svn || x.svn_code === svn) &&
        (!shop || x.shop_code === shop)
    );

    renderTargetDashboard(displayShops);
};

function renderTargetDashboard(shops) {
    const monthStr = document.getElementById('tgt_filter_month').value;
    const y = parseInt(monthStr.split('-')[0]); const m = parseInt(monthStr.split('-')[1]);
    const daysInMonth = new Date(y, m, 0).getDate();
    
    let now = new Date();
    let elapsedDays = (now.getFullYear() === y && (now.getMonth() + 1) === m) ? now.getDate() : daysInMonth;

    const tgtMap = {}; 
    const trfTgtMap = {};
    const vidTgtMap = {};
    const liveTgtMap = {};

    // Gán dữ liệu Target theo đúng chuẩn tên cột Admin
    tgtDataState.targets.forEach(t => {
        const code = t.shop_code;
        if(code) {
            tgtMap[code] = parseInt(t.target_so) || 0;
            trfTgtMap[code] = parseInt(t.target_traffic) || 0;
            vidTgtMap[code] = parseInt(t.target_video) || 0;
            liveTgtMap[code] = parseInt(t.target_livestream) || 0;
        }
    });

    const actualMap = {}, trafficMap = {}, daysMap = {};
    tgtDataState.soReports.forEach(r => {
        if(!actualMap[r.shop_code]) { actualMap[r.shop_code]=0; trafficMap[r.shop_code]=0; daysMap[r.shop_code] = new Set(); }
        actualMap[r.shop_code] += (r.total_so || 0);
        trafficMap[r.shop_code] += (r.traffic_natural || 0) + (r.traffic_leads || 0);
        daysMap[r.shop_code].add(r.report_date);
    });

    const mediaMap = {};
    tgtDataState.mediaReports.forEach(r => {
        if(!mediaMap[r.shop_code]) mediaMap[r.shop_code] = {vid: 0, live: 0};
        mediaMap[r.shop_code].vid += (r.tiktok_videos || 0);
        mediaMap[r.shop_code].live += (r.livestreams || 0);
    });

    let sumTarget = 0, sumActual = 0, sumTraffic = 0, sumDigital = 0;

    const htmlRows = shops.map(s => {
        const sCode = s.shop_code;
        
        const tgt = tgtMap[sCode] || 0;
        const act = actualMap[sCode] || 0;
        const trf = trafficMap[sCode] || 0;
        const rptDays = daysMap[sCode] ? daysMap[sCode].size : 0;
        const vid = mediaMap[sCode]?.vid || 0;
        const live = mediaMap[sCode]?.live || 0;

        sumTarget += tgt; sumActual += act; sumTraffic += trf; sumDigital += (vid + live);

        const pct = tgt > 0 ? Math.round((act/tgt)*100) : (act > 0 ? 100 : 0);
        const rptPct = Math.round((rptDays / elapsedDays)*100);
        
        let pColor = 'bg-gray-200';
        if (pct > 0) pColor = pct >= 100 ? 'bg-green-500' : (pct >= 50 ? 'bg-[#F97316]' : 'bg-red-500');

        let statusBadge = `<span class="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase"><i class="fa-solid fa-triangle-exclamation"></i> Chậm tiến độ</span>`;
        if (pct >= 80) statusBadge = `<span class="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-black uppercase"><i class="fa-solid fa-check-double"></i> Ổn định</span>`;

        const tgtTrf = trfTgtMap[sCode] > 0 ? trfTgtMap[sCode] : (tgt * 5); // Tỷ lệ chốt 20%
        const trfPct = tgtTrf > 0 ? Math.round((trf/tgtTrf)*100) : 0;
        
        const tgtVid = vidTgtMap[sCode] > 0 ? vidTgtMap[sCode] : 8; // Mặc định 8 Video/tháng
        const tgtLive = liveTgtMap[sCode] > 0 ? liveTgtMap[sCode] : 0;

        return `
        <tr class="border-b border-gray-100 hover:bg-slate-50 transition">
            <td class="p-4">
                <h4 class="font-black text-slate-800 text-sm">${s.shop_name || s.shop_code}</h4>
                <p class="text-[10px] text-gray-400 font-mono mt-0.5">${s.shop_code}</p>
            </td>
            <td class="p-4 text-center font-bold text-gray-500">${tgt}</td>
            <td class="p-4 text-center font-black text-blue-600">${act}</td>
            <td class="p-4">
                <div class="flex items-center justify-between mb-1">
                    <div class="w-full bg-gray-200 rounded-full h-1.5 mr-3">
                        <div class="${pColor} h-1.5 rounded-full" style="width: ${Math.min(pct, 100)}%"></div>
                    </div>
                    <span class="text-xs font-black text-slate-700">${pct}%</span>
                </div>
            </td>
            <td class="p-4 text-center">
                <p class="text-[11px] font-bold ${rptDays < elapsedDays ? 'text-red-500' : 'text-green-600'}">${rptDays} / ${elapsedDays} ngày</p>
                <p class="text-[10px] text-gray-400 font-bold">${rptPct}%</p>
            </td>
            <td class="p-4">
                <div class="flex items-center justify-between text-[11px] font-bold mb-1">
                    <span class="text-slate-700">${trf} / ${tgtTrf}</span>
                    <span class="text-blue-500">${trfPct}%</span>
                </div>
                <div class="w-full bg-gray-100 rounded-full h-1"><div class="bg-blue-400 h-1 rounded-full" style="width: ${Math.min(trfPct, 100)}%"></div></div>
            </td>
            <td class="p-4 text-center text-[10px] font-bold">
                <p class="text-pink-500">Video: ${vid}/${tgtVid}</p>
                <p class="text-purple-500 mt-0.5">Live: ${live}h / ${tgtLive}h</p>
            </td>
            <td class="p-4 text-center">${statusBadge}</td>
        </tr>`;
    }).join('');

    document.getElementById('body_TargetDashboard').innerHTML = htmlRows || '<tr><td colspan="8" class="text-center p-8 text-sm text-gray-400">Không có dữ liệu hiển thị.</td></tr>';

    const sumPct = sumTarget > 0 ? Math.round((sumActual/sumTarget)*100) : 0;
    document.getElementById('tgt_sum_target').innerText = sumTarget;
    document.getElementById('tgt_sum_actual').innerText = sumActual;
    document.getElementById('tgt_sum_percent').innerText = sumPct + '%';
    document.getElementById('tgt_sum_percent').className = `text-3xl md:text-4xl font-black ${sumPct >= 80 ? 'text-green-500' : (sumPct >= 50 ? 'text-[#F97316]' : 'text-red-500')}`;
    document.getElementById('tgt_sum_traffic').innerText = sumTraffic;
    document.getElementById('tgt_sum_digital').innerText = sumDigital;
}

window.exportOverviewExcel = () => { 
    const tableBody = document.getElementById('body_HeatmapSO');
    if (!tableBody || tableBody.children.length === 0) return alert("Không có dữ liệu để xuất!");
    const data = [["Cửa Hàng (Shop)", "Doanh Thu (VNĐ)", "Tổng S.O", "Khách Tự Nhiên", "Khách Khai Thác", "Tổng Lượt Khách", "Tỷ Lệ Chốt"]];
    Array.from(tableBody.querySelectorAll('tr')).forEach(tr => {
        const cols = tr.querySelectorAll('td');
        data.push([cols[0].innerText, parseInt(cols[1].innerText.replace(/đ|\./g, '')) || 0, parseInt(cols[2].innerText) || 0, parseInt(cols[3].innerText) || 0, parseInt(cols[4].innerText) || 0, parseInt(cols[5].innerText) || 0, cols[6].innerText]);
    });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Bao_Cao_Hieu_Suat");
    XLSX.writeFile(wb, `Hieu_Suat_Cua_Hang.xlsx`);
};

window.exportTargetExcel = () => {
    const tableBody = document.getElementById('body_TargetDashboard');
    if (!tableBody || tableBody.children.length === 0 || tableBody.innerText.includes('Không có dữ liệu')) return alert("Không có dữ liệu để xuất!");
    const data = [["Cửa Hàng", "Mã DVN", "Mục Tiêu SO", "Thực Đạt", "Tiến Độ (%)", "Ngày Báo Cáo", "Lượt Khách", "Video", "Livestream (h)"]];
    
    Array.from(tableBody.querySelectorAll('tr')).forEach(tr => {
        const cols = tr.querySelectorAll('td');
        const shopInfo = cols[0].innerText.split('\n');
        const name = shopInfo[0].trim(); const code = shopInfo[1] ? shopInfo[1].trim() : '';
        const tgt = parseInt(cols[1].innerText) || 0;
        const act = parseInt(cols[2].innerText) || 0;
        const pct = cols[3].innerText.replace('%', '').trim();
        const rpt = cols[4].innerText.split('\n')[0].trim();
        const trf = cols[5].innerText.split('\n')[0].split('/')[0].trim();
        const digital = cols[6].innerText.split('\n');
        const vid = digital[0] ? digital[0].replace('Video: ', '').split('/')[0].trim() : 0;
        const live = digital[1] ? digital[1].replace('Live: ', '').replace('h', '').split('/')[0].trim() : 0;

        data.push([name, code, tgt, act, pct, rpt, trf, vid, live]);
    });
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(data), "Tien_Do_Hoan_Thanh");
    XLSX.writeFile(wb, `Tien_Do_Hoan_Thanh_${document.getElementById('tgt_filter_month').value}.xlsx`);
};