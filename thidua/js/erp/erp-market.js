// ==========================================
// TRUNG TÂM ĐIỀU HÀNH ERP - DATA DRIVEN
// ĐỒNG BỘ LOGIC KẾT HỢP DỮ LIỆU ĐIỀU HÀNH (ADMIN) & THI ĐUA (SALE)
// ĐÃ TỐI ƯU GIAO DIỆN MOBILE (RESPONSIVE SCROLL)
// ==========================================

const fmt = (num) => Math.round(Number(num || 0)).toLocaleString('vi-VN');
const safeDiv = (a, b) => (b === 0 ? 0 : a / b);

let erpCharts = {}; 

window.initErpMarket = async function(forceRefresh = false) {
    const mainContent = document.getElementById('erp-main-content');
    if (!mainContent) return;

    if (forceRefresh) {
        mainContent.style.opacity = '0.5';
        document.getElementById('btn-erp-refresh').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...';
    }

    try {
        await setupErpFilters();
        await fetchAndRenderErpDashboard();
    } catch (err) {
        console.error("Lỗi ERP Dashboard:", err);
        alert("Lỗi tải dữ liệu ERP: " + err.message);
    } finally {
        mainContent.style.opacity = '1';
        const btn = document.getElementById('btn-erp-refresh');
        if(btn) btn.innerHTML = '<i class="fa-solid fa-rotate"></i> Làm mới dữ liệu';
        
        const now = new Date();
        document.getElementById('erp-last-update').innerText = `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')} | ${String(now.getDate()).padStart(2,'0')}/${String(now.getMonth()+1).padStart(2,'0')}/${now.getFullYear()}`;
    }
};

let isErpFiltersSetup = false;
async function setupErpFilters() {
    if (isErpFiltersSetup) return;

    const dStart = document.getElementById('erp-date-start');
    const dEnd = document.getElementById('erp-date-end');
    const rFilter = document.getElementById('erp-region-filter');

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    
    dStart.value = `${yyyy}-${mm}-01`;
    dEnd.value = `${yyyy}-${mm}-${dd}`;

    const defaultRegions = ['Tây Bắc', 'Hà Nội', 'Đông Bắc', 'Hồng Hà', 'Bắc Trung Bộ', 'Trung Trung Bộ', 'Nam Trung Bộ', 'Tây Nguyên', 'Đông Nam', 'Hồ Chí Minh', 'Tây Nam', 'Sông Cửu Long'];
    rFilter.innerHTML = '<option value="ALL">Toàn quốc</option>' + defaultRegions.map(r => `<option value="${r}">${r}</option>`).join('');

    const reRender = debounce(() => fetchAndRenderErpDashboard(), 500);
    dStart.addEventListener('change', reRender);
    dEnd.addEventListener('change', reRender);
    rFilter.addEventListener('change', reRender);

    isErpFiltersSetup = true;
}

async function fetchAndRenderErpDashboard() {
    const start = document.getElementById('erp-date-start').value;
    const end = document.getElementById('erp-date-end').value;
    const region = document.getElementById('erp-region-filter').value;

    if (!start || !end || start > end) return alert("Khoảng thời gian không hợp lệ!");

    const [resSI, resSO, resTarget, resShops, resGameSI] = await Promise.all([
        window.sb.from('daily_si_reports').select('*').gte('report_date', start).lte('report_date', end),
        window.sb.from('daily_so_reports').select('*').gte('report_date', start).lte('report_date', end),
        window.sb.from('monthly_sale_targets').select('*'),
        window.sb.from('master_shop_list').select('*'),
        window.sb.from('game_si_reports').select('*').gte('report_date', start).lte('report_date', end)
    ]);

    let dataSI = resSI.data || [];
    let dataSO = resSO.data || [];
    let shops = resShops.data || [];
    let dataGameSI = resGameSI.data || [];

    const startMonth = start.substring(0, 7);
    let dataTarget = (resTarget.data || []).filter(r => r.report_month && r.report_month.startsWith(startMonth));

    const saleToRegionMap = {};
    shops.forEach(s => { 
        const sName = s.sale_name || s.sale || s.nhan_vien || s.ten_nvkd || s.nvkd;
        if (sName) saleToRegionMap[sName.trim().toLowerCase()] = s.area || s.khu_vuc || s.region || 'Khác'; 
    });
    
    if (region !== 'ALL') {
        dataSI = dataSI.filter(r => (r.region_name || '').includes(region));
        dataGameSI = dataGameSI.filter(r => {
            const sName = r.sale_name ? r.sale_name.trim().toLowerCase() : '';
            const mappedReg = saleToRegionMap[sName] || r.region_name || r.khu_vuc || '';
            return mappedReg.includes(region);
        });
        dataSO = dataSO.filter(r => {
            const sName = r.sale_name ? r.sale_name.trim().toLowerCase() : '';
            const mappedReg = saleToRegionMap[sName] || r.region_name || r.khu_vuc || '';
            return mappedReg.includes(region);
        });
        dataTarget = dataTarget.filter(t => {
            const sName = t.sale_name ? t.sale_name.trim().toLowerCase() : '';
            const mappedReg = saleToRegionMap[sName] || t.area || t.khu_vuc || '';
            return mappedReg.includes(region);
        });
    }

    const agg = calculateAggregations(dataSI, dataSO, dataTarget, start, end, saleToRegionMap, dataGameSI);

    renderCards(agg);
    renderGauges(agg);
    renderRegionTable(agg);
    renderTopSales(agg.sales);
    render12RegionSIChart(agg.regions);
    renderLineCharts(agg.daily, start, end);

    const rawData = { si: dataSI, so: dataSO, target: dataTarget, gameSi: dataGameSI };
    if (typeof window.buildDashboardAlerts === 'function') {
        const alerts = window.buildDashboardAlerts({
            summary: agg,
            regions: agg.regions,
            sales: agg.sales,
            dailyData: agg.daily,
            rawData: rawData,
            selectedFilters: { start, end, region }
        });
        window.renderDashboardAlerts(alerts);
    }
}

function calculateAggregations(dataSI, dataSO, dataTarget, start, end, saleToRegionMap, dataGameSI) {
    const todayStr = end; 
    let prevDate = new Date(todayStr); prevDate.setDate(prevDate.getDate() - 1);
    const yesterdayStr = prevDate.toISOString().split('T')[0];
    
    const baseDateSI = start.substring(0, 7) + '-01'; 

    const startD = new Date(start);
    const endD = new Date(end);
    const daysPassed = Math.max(1, Math.floor((endD - startD) / (1000 * 60 * 60 * 24)) + 1);
    
    const eom = new Date(endD.getFullYear(), endD.getMonth() + 1, 0);
    let daysLeft = Math.floor((eom - endD) / (1000 * 60 * 60 * 24));
    if (daysLeft < 1) daysLeft = 1; 

    let res = {
        si_total: 0, si_today: 0, si_yest: 0, si_target: 0,
        so_total: 0, so_today: 0, so_yest: 0, so_target: 0,
        daysPassed: daysPassed, daysLeft: daysLeft,
        regions: {}, sales: {}, daily: {}
    };

    const safeNum = (v) => {
        if (!v) return 0;
        if (typeof v === 'number') return Math.round(v);
        const parsed = parseInt(String(v).replace(/[\.,]/g, ''));
        return isNaN(parsed) ? 0 : parsed;
    };

    const norm = (str) => str ? str.toString().trim().toLowerCase() : "";
    const soRegions = ["Tây Bắc", "Hà Nội", "Đông Bắc", "Hồng Hà", "Bắc Trung Bộ", "Trung Trung Bộ"];
    const siRegions = ["Tây Bắc", "Hà Nội", "Đông Bắc", "Hồng Hà", "Bắc Trung Bộ", "Trung Trung Bộ", "Nam Trung Bộ", "Tây Nguyên", "Đông Nam", "Hồ Chí Minh", "Tây Nam", "Sông Cửu Long"];

    function getNormalizedRegion(rawReg) {
        const nReg = norm(rawReg);
        if(nReg.includes("tây bắc bộ")) return "Tây Bắc";
        if(nReg.includes("sông cửu long") || nReg.includes("đông bằng scl") || nReg.includes("scl")) return "Sông Cửu Long";
        if(nReg.includes("hồ chí minh") || nReg.includes("hcm")) return "Hồ Chí Minh";
        
        for (const reg of siRegions) {
            const nSO = norm(reg);
            if (nReg.includes(nSO)) return reg;
        }
        return rawReg;
    }

    siRegions.forEach(reg => {
        if (!res.regions[reg]) {
            res.regions[reg] = { name: reg, si_act: 0, so_act: 0, si_tar: 0, so_tar: 0, si_paid: 0, si_game_act: 0 };
        }
    });

    dataTarget.forEach(t => {
        const sName = norm(t.sale_name);
        const rawReg = saleToRegionMap[sName] || t.area || t.khu_vuc || t.region_name || 'Khác';
        const regAll = getNormalizedRegion(rawReg); 
        const tSO = safeNum(t.target_so);

        if (!res.regions[regAll]) res.regions[regAll] = { name: regAll, si_act: 0, so_act: 0, si_tar: 0, so_tar: 0, si_paid: 0, si_game_act: 0 };
        res.regions[regAll].so_tar += tSO;

        if (soRegions.includes(regAll)) {
            res.so_target += tSO;
        }

        if (t.sale_name) {
            if (!res.sales[t.sale_name]) res.sales[t.sale_name] = { name: t.sale_name, si_act: 0, so_act: 0, si_tar: 0, so_tar: 0, si_paid: 0 };
            res.sales[t.sale_name].si_tar += safeNum(t.target_si); 
            res.sales[t.sale_name].so_tar += tSO;
        }
    });

    dataSI.forEach(r => {
        const val = safeNum(r.xuat_hang); 
        const paidVal = safeNum(r.thanh_toan);
        const isBaseDate = r.report_date === baseDateSI;
        
        const sName = norm(r.sale_name);
        const rawReg = saleToRegionMap[sName] || r.region_name || r.khu_vuc || 'Khác';
        const regAll = getNormalizedRegion(rawReg);

        if (!res.regions[regAll]) res.regions[regAll] = { name: regAll, si_act: 0, so_act: 0, si_tar: 0, so_tar: 0, si_paid: 0, si_game_act: 0 };
        res.regions[regAll].si_act += val; 
        res.regions[regAll].si_paid += paidVal;
        
        if (isBaseDate && r.target_ph) {
            res.regions[regAll].si_tar += safeNum(r.target_ph);
        }

        if (!res.daily[r.report_date]) res.daily[r.report_date] = { date: r.report_date, si: 0, so: 0 };
        res.daily[r.report_date].si += val; 

        if (soRegions.includes(regAll)) {
            res.si_total += val;
            if (r.report_date === todayStr) res.si_today += val;
            if (r.report_date === yesterdayStr) res.si_yest += val;
            if (isBaseDate && r.target_ph) res.si_target += safeNum(r.target_ph);
        }
    });

    dataGameSI.forEach(r => {
        const val = safeNum(r.xuat_hang); 
        const sName = norm(r.sale_name);
        const rawReg = saleToRegionMap[sName] || r.region_name || r.khu_vuc || 'Khác';
        const regAll = getNormalizedRegion(rawReg);

        if (!res.regions[regAll]) res.regions[regAll] = { name: regAll, si_act: 0, so_act: 0, si_tar: 0, so_tar: 0, si_paid: 0, si_game_act: 0 };
        res.regions[regAll].si_game_act += val;

        if (r.sale_name) {
            if (!res.sales[r.sale_name]) res.sales[r.sale_name] = { name: r.sale_name, si_act: 0, so_act: 0, si_tar: 0, so_tar: 0, si_paid: 0 };
            res.sales[r.sale_name].si_act += val;
        }
    });

    dataSO.forEach(r => {
        const val = safeNum(r.total_so || r.so_luong || r.ban_ra);
        const sName = norm(r.sale_name);
        const rawReg = saleToRegionMap[sName] || r.region_name || r.khu_vuc || 'Khác';
        const regAll = getNormalizedRegion(rawReg);

        if (!res.regions[regAll]) res.regions[regAll] = { name: regAll, si_act: 0, so_act: 0, si_tar: 0, so_tar: 0, si_paid: 0, si_game_act: 0 };
        res.regions[regAll].so_act += val;

        if (!res.daily[r.report_date]) res.daily[r.report_date] = { date: r.report_date, si: 0, so: 0 };
        res.daily[r.report_date].so += val;

        if (soRegions.includes(regAll)) {
            res.so_total += val;
            if (r.report_date === todayStr) res.so_today += val;
            if (r.report_date === yesterdayStr) res.so_yest += val;
        }

        if (r.sale_name) {
            if (!res.sales[r.sale_name]) res.sales[r.sale_name] = { name: r.sale_name, si_act: 0, so_act: 0, si_tar: 0, so_tar: 0, si_paid: 0 };
            res.sales[r.sale_name].so_act += val;
        }
    });

    return res;
}

// --- RENDERS ---

function renderCards(agg) {
    let siTodayTarget = Math.round(agg.si_target / 30); 
    document.getElementById('kpi-si-today-val').innerText = fmt(agg.si_today);
    document.getElementById('kpi-si-today-target').innerText = fmt(siTodayTarget);
    
    let si_today_diff = agg.si_yest === 0 ? (agg.si_today > 0 ? 100 : 0) : safeDiv(agg.si_today - agg.si_yest, agg.si_yest) * 100;
    let si_today_color = si_today_diff >= 0 ? 'text-emerald-500' : 'text-rose-500';
    let si_today_icon = si_today_diff >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    // Thêm whitespace-nowrap để không rớt chữ xuống dòng trên mobile
    document.getElementById('kpi-si-today-diff').innerHTML = `
        <span class="${si_today_color} font-black text-sm tracking-tight flex items-center gap-1 whitespace-nowrap">
            <i class="fa-solid ${si_today_icon} text-[10px]"></i> ${Math.round(Math.abs(si_today_diff))}%
        </span> 
        <span class="text-slate-400 text-xs font-medium ml-1.5 whitespace-nowrap">vs hôm qua (${fmt(agg.si_yest)})</span>
    `;

    let siTodayPct = safeDiv(agg.si_today, siTodayTarget) * 100;
    renderRadial('radial-kpi-1', siTodayPct, '#3b82f6');

    document.getElementById('kpi-si-accum-val').innerText = fmt(agg.si_total);
    document.getElementById('kpi-si-accum-target').innerText = fmt(agg.si_target);
    
    let paceSI = safeDiv(agg.si_total, (agg.si_target / 30) * agg.daysPassed) * 100 - 100;
    let si_acc_color = paceSI >= 0 ? 'text-emerald-500' : 'text-rose-500';
    let si_acc_icon = paceSI >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    document.getElementById('kpi-si-accum-diff').innerHTML = `
        <span class="${si_acc_color} font-black text-sm tracking-tight flex items-center gap-1 whitespace-nowrap">
            <i class="fa-solid ${si_acc_icon} text-[10px]"></i> ${Math.round(Math.abs(paceSI))}%
        </span> 
        <span class="text-slate-400 text-xs font-medium ml-1.5 whitespace-nowrap">vs tiến độ chuẩn</span>
    `;

    let siPct = safeDiv(agg.si_total, agg.si_target) * 100;
    renderRadial('radial-kpi-2', siPct, '#2563eb');

    let soTodayTarget = Math.round(agg.so_target / 30);
    document.getElementById('kpi-so-today-val').innerText = fmt(agg.so_today);
    document.getElementById('kpi-so-today-target').innerText = fmt(soTodayTarget);
    
    let so_today_diff = agg.so_yest === 0 ? (agg.so_today > 0 ? 100 : 0) : safeDiv(agg.so_today - agg.so_yest, agg.so_yest) * 100;
    let so_today_color = so_today_diff >= 0 ? 'text-emerald-500' : 'text-rose-500';
    let so_today_icon = so_today_diff >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    document.getElementById('kpi-so-today-diff').innerHTML = `
        <span class="${so_today_color} font-black text-sm tracking-tight flex items-center gap-1 whitespace-nowrap">
            <i class="fa-solid ${so_today_icon} text-[10px]"></i> ${Math.round(Math.abs(so_today_diff))}%
        </span> 
        <span class="text-slate-400 text-xs font-medium ml-1.5 whitespace-nowrap">vs hôm qua (${fmt(agg.so_yest)})</span>
    `;

    let soTodayPct = safeDiv(agg.so_today, soTodayTarget) * 100;
    renderRadial('radial-kpi-3', soTodayPct, '#10b981');

    document.getElementById('kpi-so-accum-val').innerText = fmt(agg.so_total);
    document.getElementById('kpi-so-accum-target').innerText = fmt(agg.so_target);
    
    let paceSO = safeDiv(agg.so_total, (agg.so_target / 30) * agg.daysPassed) * 100 - 100;
    let so_acc_color = paceSO >= 0 ? 'text-emerald-500' : 'text-rose-500';
    let so_acc_icon = paceSO >= 0 ? 'fa-arrow-up' : 'fa-arrow-down';
    
    document.getElementById('kpi-so-accum-diff').innerHTML = `
        <span class="${so_acc_color} font-black text-sm tracking-tight flex items-center gap-1 whitespace-nowrap">
            <i class="fa-solid ${so_acc_icon} text-[10px]"></i> ${Math.round(Math.abs(paceSO))}%
        </span> 
        <span class="text-slate-400 text-xs font-medium ml-1.5 whitespace-nowrap">vs tiến độ chuẩn</span>
    `;

    let soPct = safeDiv(agg.so_total, agg.so_target) * 100;
    renderRadial('radial-kpi-4', soPct, '#059669');
}

function renderRadial(id, val, color) {
    if(erpCharts[id]) erpCharts[id].destroy();
    
    let safeVal = isNaN(val) ? 0 : Math.round(val);
    let displayVal = safeVal > 100 ? 100 : safeVal; 

    const opts = { 
        chart: { 
            type: 'radialBar', 
            width: 110, 
            height: 150, 
            fontFamily: 'Inter, system-ui, sans-serif', 
            sparkline: { enabled: true } 
        }, 
        series: [displayVal], 
        colors: [color], 
        plotOptions: { 
            radialBar: { 
                hollow: { size: '65%' }, 
                track: { background: '#f8fafc', strokeWidth: '100%' }, 
                dataLabels: { 
                    name: { 
                        show: true, 
                        fontSize: '10px', 
                        fontWeight: 700, 
                        color: '#94a3b8', 
                        offsetY: 22 
                    }, 
                    value: { 
                        show: true, 
                        fontSize: '22px', 
                        fontWeight: 900, 
                        color: '#0f172a', 
                        offsetY: -6, 
                        formatter: function () { return safeVal + "%" } 
                    } 
                } 
            } 
        },
        labels: ['Hoàn thành']
    };
    
    erpCharts[id] = new ApexCharts(document.querySelector(`#${id}`), opts); 
    erpCharts[id].render();
}

function renderGauges(agg) {
    let siPct = safeDiv(agg.si_total, agg.si_target) * 100;
    let soPct = safeDiv(agg.so_total, agg.so_target) * 100;

    document.getElementById('g-si-target').innerText = fmt(agg.si_target) + ' xe';
    document.getElementById('g-si-actual').innerText = fmt(agg.si_total) + ' xe';
    const siMissing = Math.max(0, agg.si_target - agg.si_total);
    document.getElementById('g-si-missing').innerText = fmt(siMissing) + ' xe';

    document.getElementById('g-so-target').innerText = fmt(agg.so_target) + ' xe';
    document.getElementById('g-so-actual').innerText = fmt(agg.so_total) + ' xe';
    const soMissing = Math.max(0, agg.so_target - agg.so_total);
    document.getElementById('g-so-missing').innerText = fmt(soMissing) + ' xe';

    const dLeft = agg.daysLeft;
    const dPass = agg.daysPassed;
    
    const siPaceNeed = Math.ceil(siMissing / dLeft);
    const siPaceAct = Math.ceil(agg.si_total / dPass);
    const siPaceDiff = siPaceAct - siPaceNeed;

    const soPaceNeed = Math.ceil(soMissing / dLeft);
    const soPaceAct = Math.ceil(agg.so_total / dPass);
    const soPaceDiff = soPaceAct - soPaceNeed;

    document.getElementById('g-si-days-left').innerText = dLeft;
    document.getElementById('g-si-pace-need').innerText = fmt(siPaceNeed);
    document.getElementById('g-si-pace-act').innerText = fmt(siPaceAct);
    const elSiDiff = document.getElementById('g-si-pace-diff');
    elSiDiff.innerText = (siPaceDiff > 0 ? '+' : '') + fmt(siPaceDiff) + ' xe/ngày';
    elSiDiff.className = siPaceDiff >= 0 ? "text-sm font-black text-emerald-500 whitespace-nowrap" : "text-sm font-black text-rose-500 whitespace-nowrap";

    document.getElementById('g-so-days-left').innerText = dLeft;
    document.getElementById('g-so-pace-need').innerText = fmt(soPaceNeed);
    document.getElementById('g-so-pace-act').innerText = fmt(soPaceAct);
    const elSoDiff = document.getElementById('g-so-pace-diff');
    elSoDiff.innerText = (soPaceDiff > 0 ? '+' : '') + fmt(soPaceDiff) + ' xe/ngày';
    elSoDiff.className = soPaceDiff >= 0 ? "text-sm font-black text-emerald-500 whitespace-nowrap" : "text-sm font-black text-rose-500 whitespace-nowrap";

    renderMainGaugeChart('gauge-si', siPct, '#3b82f6');
    renderMainGaugeChart('gauge-so', soPct, '#22c55e');
}

function renderMainGaugeChart(id, val, color) {
    if(erpCharts[id]) erpCharts[id].destroy();
    let safeVal = isNaN(val) ? 0 : Math.round(val);
    
    const opts = { 
        chart: { type: 'radialBar', height: 260, offsetY: -10, fontFamily: 'Inter, system-ui, sans-serif' }, 
        series: [safeVal > 100 ? 100 : safeVal], 
        colors: [color], 
        plotOptions: { 
            radialBar: { 
                startAngle: -90, endAngle: 90, hollow: { size: '65%' }, track: { background: '#e2e8f0', strokeWidth: '97%' }, 
                dataLabels: { 
                    name: { show: true, fontSize: '11px', fontWeight: 700, color: '#64748b', offsetY: 25 }, 
                    value: { show: true, fontSize: '32px', fontWeight: 900, color: '#0f172a', offsetY: -5, formatter: () => safeVal + "%" } 
                } 
            } 
        },
        labels: ['Hoàn thành']
    };
    erpCharts[id] = new ApexCharts(document.querySelector(`#${id}`), opts); 
    erpCharts[id].render();
}

function autoScrollTable(tbodyId) {
    const tbody = document.getElementById(tbodyId);
    if(tbody) {
        const table = tbody.closest('table');
        if(table) {
            table.classList.add('min-w-max', 'whitespace-nowrap');
            if (table.parentElement && !table.parentElement.classList.contains('overflow-x-auto')) {
                table.parentElement.classList.add('overflow-x-auto', 'w-full', 'custom-scrollbar');
            }
        }
    }
}

function renderRegionTable(agg) {
    const tbody = document.getElementById('erp-region-table-body');
    if(!tbody) return;
    
    const regionsObj = agg.regions;
    const dLeft = agg.daysLeft;
    const dPass = agg.daysPassed;
    
    const soRegionsOrder = ["Tây Bắc", "Hà Nội", "Đông Bắc", "Hồng Hà", "Bắc Trung Bộ", "Trung Trung Bộ"];

    const regions = Object.values(regionsObj)
        .filter(r => soRegionsOrder.includes(r.name))
        .sort((a,b) => soRegionsOrder.indexOf(a.name) - soRegionsOrder.indexOf(b.name));
    
    tbody.innerHTML = regions.map((r, i) => {
        let siPct = Math.round(safeDiv(r.si_act, r.si_tar) * 100);
        let soPct = Math.round(safeDiv(r.so_act, r.so_tar) * 100);

        let siMissing = Math.max(0, r.si_tar - r.si_act);
        let siPaceNeed = Math.ceil(siMissing / dLeft);
        let siPaceAct = Math.ceil(r.si_act / dPass);
        let siPaceDiff = siPaceAct - siPaceNeed;

        let soMissing = Math.max(0, r.so_tar - r.so_act);
        let soPaceNeed = Math.ceil(soMissing / dLeft);
        let soPaceAct = Math.ceil(r.so_act / dPass);
        let soPaceDiff = soPaceAct - soPaceNeed;
        
        let status = 'Tốt', badge = 'bg-green-100 text-green-700 border border-green-200';
        if (soPct < 65) { status = 'YẾU'; badge = 'bg-red-100 text-red-600 border border-red-200'; }
        else if (soPct < 85) { status = 'TB'; badge = 'bg-orange-100 text-orange-600 border border-orange-200'; }

        let siPctColor = siPct >= 100 ? 'text-emerald-600' : (siPct >= 75 ? 'text-orange-500' : 'text-rose-600');
        let soPctColor = soPct >= 100 ? 'text-emerald-600' : (soPct >= 75 ? 'text-orange-500' : 'text-rose-600');

        return `
        <tr class="hover:bg-slate-50 transition border-b border-gray-100">
            <td class="py-3 px-3 font-bold flex items-center gap-2 sticky left-0 bg-white shadow-[1px_0_0_0_#f1f5f9] whitespace-nowrap z-10 min-w-[130px]"><span class="text-gray-400 font-medium">${i+1}</span> <span class="text-slate-700">${r.name}</span></td>
            
            <td class="py-3 px-2 text-center text-gray-500 font-medium whitespace-nowrap">${fmt(r.si_tar)}</td>
            <td class="py-3 px-2 text-center text-slate-800 font-bold whitespace-nowrap">${fmt(r.si_act)}</td>
            <td class="py-3 px-2 text-center font-black ${siPctColor} whitespace-nowrap">${siPct}%</td>
            <td class="py-3 px-2 text-center text-gray-600 font-medium whitespace-nowrap">${fmt(siPaceNeed)}</td>
            <td class="py-3 px-2 text-center text-gray-800 font-bold whitespace-nowrap">${fmt(siPaceAct)}</td>
            <td class="py-3 px-2 text-center font-bold ${siPaceDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'} whitespace-nowrap">${siPaceDiff > 0 ? '+' : ''}${siPaceDiff}</td>
            
            <td class="py-3 px-2 text-center text-gray-500 font-medium border-l border-gray-100 whitespace-nowrap">${fmt(r.so_tar)}</td>
            <td class="py-3 px-2 text-center text-slate-800 font-bold whitespace-nowrap">${fmt(r.so_act)}</td>
            <td class="py-3 px-2 text-center font-black ${soPctColor} whitespace-nowrap">${soPct}%</td>
            <td class="py-3 px-2 text-center text-gray-600 font-medium whitespace-nowrap">${fmt(soPaceNeed)}</td>
            <td class="py-3 px-2 text-center text-gray-800 font-bold whitespace-nowrap">${fmt(soPaceAct)}</td>
            <td class="py-3 px-2 text-center font-bold ${soPaceDiff >= 0 ? 'text-emerald-500' : 'text-rose-500'} whitespace-nowrap">${soPaceDiff > 0 ? '+' : ''}${soPaceDiff}</td>
            
            <td class="py-3 px-3 text-center align-middle whitespace-nowrap"><span class="${badge} px-3 py-1 rounded text-[10px] font-black uppercase">${status}</span></td>
        </tr>`;
    }).join('') || '<tr><td colspan="14" class="text-center py-8 text-gray-500">Chưa có dữ liệu vùng</td></tr>';

    autoScrollTable('erp-region-table-body');
}

function renderTopSales(salesObj) {
    const sales = Object.values(salesObj);
    
    sales.forEach(s => {
        s.si_pct = safeDiv(s.si_act || 0, s.si_tar) * 100;
        s.so_pct = safeDiv(s.so_act || 0, s.so_tar) * 100;
    });

    const siSales = [...sales]
        .filter(s => s.si_tar > 0 || (s.si_act && s.si_act > 0))
        .sort((a,b) => b.si_pct - a.si_pct);

    const soSales = [...sales]
        .filter(s => s.so_tar > 0 || s.so_act > 0)
        .sort((a,b) => b.so_pct - a.so_pct);

    const renderRowSI = (arr) => arr.map((s, i) => {
        let rankClass = i < 3 ? 'text-blue-600' : 'text-slate-400';
        let pctClass = s.si_pct >= 100 ? 'text-emerald-600' : (s.si_pct >= 75 ? 'text-orange-500' : 'text-rose-500');
        return `
        <tr class="hover:bg-blue-50/50 transition border-b border-gray-50">
            <td class="py-2.5 px-3 font-black ${rankClass} sticky left-0 bg-white shadow-[1px_0_0_0_#f8fafc] whitespace-nowrap z-10">${i+1}</td>
            <td class="py-2.5 px-2 font-bold text-slate-700 whitespace-nowrap min-w-[120px]">${s.name}</td>
            <td class="py-2.5 px-2 text-center font-medium text-gray-500 whitespace-nowrap">${fmt(s.si_tar)}</td>
            <td class="py-2.5 px-2 text-center font-bold text-blue-600 bg-blue-50/50 whitespace-nowrap">${fmt(s.si_act || 0)}</td>
            <td class="py-2.5 px-3 text-right font-black ${pctClass} whitespace-nowrap">${Math.round(s.si_pct)}%</td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" class="text-center py-8 text-gray-400">Không có dữ liệu</td></tr>';

    const renderRowSO = (arr) => arr.map((s, i) => {
        let rankClass = i < 3 ? 'text-green-600' : 'text-slate-400';
        let pctClass = s.so_pct >= 100 ? 'text-emerald-600' : (s.so_pct >= 75 ? 'text-orange-500' : 'text-rose-500');
        return `
        <tr class="hover:bg-green-50/50 transition border-b border-gray-50">
            <td class="py-2.5 px-3 font-black ${rankClass} sticky left-0 bg-white shadow-[1px_0_0_0_#f8fafc] whitespace-nowrap z-10">${i+1}</td>
            <td class="py-2.5 px-2 font-bold text-slate-700 whitespace-nowrap min-w-[120px]">${s.name}</td>
            <td class="py-2.5 px-2 text-center font-medium text-gray-500 whitespace-nowrap">${fmt(s.so_tar)}</td>
            <td class="py-2.5 px-2 text-center font-bold text-green-600 bg-green-50/50 whitespace-nowrap">${fmt(s.so_act)}</td>
            <td class="py-2.5 px-3 text-right font-black ${pctClass} whitespace-nowrap">${Math.round(s.so_pct)}%</td>
        </tr>`;
    }).join('') || '<tr><td colspan="5" class="text-center py-8 text-gray-400">Không có dữ liệu</td></tr>';

    document.getElementById('erp-top-si-body').innerHTML = renderRowSI(siSales);
    document.getElementById('erp-top-so-body').innerHTML = renderRowSO(soSales);

    autoScrollTable('erp-top-si-body');
    autoScrollTable('erp-top-so-body');
}

function render12RegionSIChart(regionsObj) {
    const tbody = document.getElementById('erp-12-region-si-body');
    if(!tbody) return;

    const siRegionsOrder = ["Tây Bắc", "Hà Nội", "Đông Bắc", "Hồng Hà", "Bắc Trung Bộ", "Trung Trung Bộ", "Nam Trung Bộ", "Tây Nguyên", "Đông Nam", "Hồ Chí Minh", "Tây Nam", "Sông Cửu Long"];
    
    const regions = Object.values(regionsObj)
        .filter(r => siRegionsOrder.includes(r.name))
        .map(r => {
            r.pct = safeDiv(r.si_act, r.si_tar) * 100;
            r.missing = Math.max(0, r.si_tar - (r.si_act || 0));
            return r;
        })
        .sort((a,b) => siRegionsOrder.indexOf(a.name) - siRegionsOrder.indexOf(b.name));

    tbody.innerHTML = regions.map((r, i) => {
        let barWidth = r.pct > 100 ? 100 : r.pct;
        let rankClass = i < 3 ? 'text-blue-600' : 'text-gray-400';
        
        return `
        <tr class="hover:bg-blue-50/50 transition border-b border-gray-50">
            <td class="py-2.5 px-1 text-center font-black ${rankClass} whitespace-nowrap">${i+1}</td>
            <td class="py-2.5 px-2 font-bold text-slate-700 whitespace-nowrap min-w-[100px]">${r.name}</td>
            <td class="py-2.5 px-2 text-center font-black text-blue-600 whitespace-nowrap">${fmt(r.si_act || 0)}</td>
            <td class="py-2.5 px-4 min-w-[130px]">
                <div class="flex items-center gap-3">
                    <div class="relative w-full h-[14px] bg-slate-100 rounded-sm flex items-center shadow-inner">
                        <div class="absolute top-0 left-0 h-full bg-blue-500 rounded-sm z-10 transition-all duration-700" style="width: ${barWidth}%"></div>
                        <div class="absolute top-[-3px] bottom-[-3px] border-l border-dashed border-orange-500 z-20" style="left: 100%;"></div>
                    </div>
                    <span class="text-[10px] font-black text-slate-700 w-12 text-right whitespace-nowrap">${Math.round(r.pct)}%</span>
                </div>
            </td>
            <td class="py-2.5 px-2 text-right font-black ${r.missing > 0 ? 'text-rose-500' : 'text-emerald-500'} whitespace-nowrap">${r.missing > 0 ? fmt(r.missing) : '0'}</td>
        </tr>
        `;
    }).join('') || '<tr><td colspan="5" class="text-center py-6 text-gray-400">Không có dữ liệu khu vực</td></tr>';

    autoScrollTable('erp-12-region-si-body');
}

function renderLineCharts(dailyObj, startStr, endStr) {
    const dates = [];
    const siData = []; const soData = [];
    
    let curr = new Date(startStr); const end = new Date(endStr);
    while(curr <= end) {
        const dStr = curr.toISOString().split('T')[0];
        dates.push(dStr.slice(5).replace('-', '/'));
        siData.push(dailyObj[dStr] ? dailyObj[dStr].si : 0);
        soData.push(dailyObj[dStr] ? dailyObj[dStr].so : 0);
        curr.setDate(curr.getDate() + 1);
    }

    const baseOpts = {
        chart: { type: 'line', height: 210, toolbar: { show: false }, fontFamily: 'Inter, system-ui, sans-serif' },
        stroke: { curve: 'smooth', width: 2.5 },
        markers: { size: 3, colors: ['#fff'], strokeWidth: 2, hover: { size: 5 } },
        dataLabels: { 
            enabled: true, 
            offsetY: -5,
            style: { fontSize: '9px', fontWeight: 800 },
            background: { enabled: true, foreColor: '#fff', borderRadius: 2, padding: 3, opacity: 1, borderWidth: 0 },
            formatter: function(val) { return val > 0 ? fmt(val) : ''; } 
        },
        xaxis: { categories: dates, labels: { style: { fontSize: '9px', colors: '#94a3b8' } }, tickAmount: Math.min(10, dates.length) },
        yaxis: { labels: { style: { fontSize: '9px', colors: '#94a3b8' } } },
        grid: { borderColor: '#f1f5f9', strokeDashArray: 4 }
    };

    if(erpCharts['lineSI']) erpCharts['lineSI'].destroy();
    erpCharts['lineSI'] = new ApexCharts(document.querySelector("#line-si"), { 
        ...baseOpts, 
        series: [{ name: 'Thực tế', data: siData }], 
        colors: ['#3b82f6'] 
    });
    erpCharts['lineSI'].render();

    if(erpCharts['lineSO']) erpCharts['lineSO'].destroy();
    erpCharts['lineSO'] = new ApexCharts(document.querySelector("#line-so"), { 
        ...baseOpts, 
        series: [{ name: 'Thực tế', data: soData }], 
        colors: ['#22c55e'] 
    });
    erpCharts['lineSO'].render();
}

function debounce(func, timeout = 300) { let timer; return (...args) => { clearTimeout(timer); timer = setTimeout(() => { func.apply(this, args); }, timeout); }; }

// ==========================================
// TRUNG TÂM CẢNH BÁO TỰ ĐỘNG (SMART ALERTS)
// ==========================================

const ALERT_THRESHOLDS = {
    lowRegionRate: 10,           
    lowSaleRate: 60,             
    targetReachedRate: 100,      
    anomalyRateGap: 50,          
    severeAnomalyRateGap: 100,   
    abnormalCompletionRate: 300, 
    maxVisibleAlerts: 7          
};

const fmtNum = (num) => isNaN(num) ? '0' : Math.round(Number(num)).toLocaleString('vi-VN');
const fmtPct = (num) => isNaN(num) ? '0%' : Math.round(Number(num)).toLocaleString('vi-VN') + '%';
const genId = () => 'alert_' + Math.random().toString(36).substr(2, 9);

window.currentDashboardAlerts = [];

function createOverallProgressAlert(agg, selectedRegion) {
    if (agg.si_target <= 0) return null;

    const sellinRate = (agg.si_total / agg.si_target) * 100;
    const sellinRemaining = Math.max(agg.si_target - agg.si_total, 0);
    
    const sellinRequiredPerDay = agg.daysLeft > 0 ? sellinRemaining / agg.daysLeft : sellinRemaining;
    const sellinActualPerDay = agg.daysPassed > 0 ? agg.si_total / agg.daysPassed : 0;
    const sellinPaceGap = sellinActualPerDay - sellinRequiredPerDay;

    const forecast = agg.si_total + (sellinActualPerDay * agg.daysLeft);
    const forecastRate = (forecast / agg.si_target) * 100;

    let level, priority;
    if (forecastRate < 80) { level = 'critical'; priority = 1; }
    else if (forecastRate < 95) { level = 'warning'; priority = 2; }
    else if (sellinRate >= 100) { level = 'success'; priority = 3; }
    else { return null; }

    const regionNameText = selectedRegion === 'ALL' ? 'toàn miền' : selectedRegion;

    if (sellinPaceGap < 0) {
        return {
            id: genId(), level, category: 'progress', priority,
            title: `Tiến độ Sell-in ${regionNameText} đang chậm`,
            message: `Sell-in ${regionNameText} mới đạt <b>${fmtPct(sellinRate)}</b>, thiếu nhịp độ <b>${fmtNum(Math.abs(sellinPaceGap))} xe/ngày</b>.`,
            details: {
                type: 'progress',
                actual: agg.si_total, target: agg.si_target,
                reqPace: sellinRequiredPerDay, actPace: sellinActualPerDay, forecast: forecastRate
            }
        };
    }
    return null;
}

function createWeakRegionAlert(agg) {
    const regions = Object.values(agg.regions).filter(r => r.si_tar > 0);
    if (regions.length === 0) return null;

    const weakRegions = regions.map(r => ({
        name: r.name,
        actual: r.si_act,
        target: r.si_tar,
        rate: (r.si_act / r.si_tar) * 100
    })).filter(r => r.rate < ALERT_THRESHOLDS.lowRegionRate);

    if (weakRegions.length === 0) return null;

    const weakRatio = weakRegions.length / regions.length;
    let level = weakRatio >= 0.5 ? 'critical' : (weakRatio >= 0.2 ? 'warning' : 'info');
    let priority = weakRatio >= 0.5 ? 1 : 2;

    return {
        id: genId(), level, category: 'region', priority,
        title: `Nhiều khu vực có tỷ lệ Sell-in thấp`,
        message: `<b>${weakRegions.length}/${regions.length} khu vực</b> có Sell-in dưới ${ALERT_THRESHOLDS.lowRegionRate}% mục tiêu.`,
        details: { type: 'table_region', columns: ['Khu vực', 'Thực đạt', 'Mục tiêu', 'Tỷ lệ HT'], data: weakRegions.sort((a,b)=>a.rate-b.rate) }
    };
}

function createLowSaleAlert(agg) {
    const sales = Object.values(agg.sales).filter(s => s.so_tar > 0);
    if (sales.length === 0) return null;

    const lowSales = sales.map(s => ({
        name: s.name,
        actual: s.so_act,
        target: s.so_tar,
        rate: (s.so_act / s.so_tar) * 100
    })).filter(s => s.rate < ALERT_THRESHOLDS.lowSaleRate);

    const zeroSales = lowSales.filter(s => s.actual === 0);

    if (lowSales.length === 0) return null;

    const lowRatio = lowSales.length / sales.length;
    let level = lowRatio >= 0.5 ? 'critical' : (lowRatio >= 0.2 ? 'warning' : 'info');
    
    return {
        id: genId(), level, category: 'sale', priority: 2,
        title: `Báo động hiệu suất Sale`,
        message: `<b>${lowSales.length} Sale</b> có hiệu suất dưới ${ALERT_THRESHOLDS.lowSaleRate}%, trong đó <b>${zeroSales.length} Sale</b> chưa phát sinh.`,
        details: { type: 'table_sale', columns: ['Sale', 'Thực đạt S.O', 'Mục tiêu S.O', 'Tỷ lệ HT'], data: lowSales.sort((a,b)=>a.rate-b.rate) }
    };
}

function createSellinSelloutAnomalyAlert(agg) {
    const regions = Object.values(agg.regions).filter(r => r.si_tar > 0 && r.so_tar > 0);
    const anomalies = [];

    regions.forEach(r => {
        const siRate = (r.si_act / r.si_tar) * 100;
        const soRate = (r.so_act / r.so_tar) * 100;
        const rateGap = Math.abs(soRate - siRate);

        if (rateGap >= ALERT_THRESHOLDS.anomalyRateGap || (soRate >= 100 && siRate < 20) || (siRate >= 100 && soRate < 20)) {
            anomalies.push({ name: r.name, siRate, soRate, gap: rateGap });
        }
    });

    if (anomalies.length === 0) return null;
    anomalies.sort((a, b) => b.gap - a.gap);

    const isSevere = anomalies.some(a => a.gap >= ALERT_THRESHOLDS.severeAnomalyRateGap);
    const names = anomalies.slice(0, 3).map(a => a.name).join(', ');
    const extra = anomalies.length > 3 ? ` và ${anomalies.length - 3} khu vực khác` : '';

    return {
        id: genId(), level: isSevere ? 'critical' : 'warning', category: 'anomaly', priority: 1,
        title: `Chênh lệch bất thường S.I và S.O`,
        message: `<b>${names}</b>${extra} có chênh lệch bất thường giữa Sell-in và Sell-out.`,
        details: { type: 'table_anomaly', columns: ['Khu vực', 'Tiến độ S.I', 'Tiến độ S.O', 'Độ lệch'], data: anomalies }
    };
}

function createStaleSIAlert(agg, rawData, filters) {
    const vnTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    const currentHour = vnTime.getHours();
    const isToday = filters.end === vnTime.toISOString().split('T')[0];

    let level = 'info';
    if (isToday) {
        if (currentHour < 10) return null; 
        else if (currentHour >= 15 && currentHour < 18) level = 'warning';
        else if (currentHour >= 18) level = 'critical';
    } else {
        level = 'warning'; 
    }

    const reportedSales = new Set();
    (rawData.gameSi || []).forEach(r => { if (r.report_date === filters.end) reportedSales.add(r.sale_name); });

    const activeSales = Object.values(agg.sales).filter(s => s.si_tar > 0);
    const missingSales = activeSales.filter(s => !reportedSales.has(s.name)).map(s => ({ name: s.name, target: s.si_tar }));

    if (missingSales.length === 0) return null;

    const missingRatio = missingSales.length / activeSales.length;
    if (missingRatio > 0.3) level = 'critical';

    return {
        id: genId(), level, category: 'data_si', priority: 2,
        title: `Nhắc nhở nộp báo cáo Sell-in`,
        message: `<b>${missingSales.length} Sale</b> chưa nộp báo cáo <b>Sell-in</b> gần nhất.`,
        details: { type: 'table_missing', columns: ['Sale chưa nộp Sell-in', 'Mục tiêu S.I Tháng'], data: missingSales }
    };
}

function createStaleSOAlert(agg, rawData, filters) {
    const vnTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    const currentHour = vnTime.getHours();
    const isToday = filters.end === vnTime.toISOString().split('T')[0];

    let level = 'info';
    if (isToday) {
        if (currentHour < 10) return null; 
        else if (currentHour >= 15 && currentHour < 18) level = 'warning';
        else if (currentHour >= 18) level = 'critical';
    } else {
        level = 'warning'; 
    }

    const reportedSales = new Set();
    (rawData.so || []).forEach(r => { if (r.report_date === filters.end) reportedSales.add(r.sale_name); });

    const activeSales = Object.values(agg.sales).filter(s => s.so_tar > 0);
    const missingSales = activeSales.filter(s => !reportedSales.has(s.name)).map(s => ({ name: s.name, target: s.so_tar }));

    if (missingSales.length === 0) return null;

    const missingRatio = missingSales.length / activeSales.length;
    if (missingRatio > 0.3) level = 'critical';

    return {
        id: genId(), level, category: 'data_so', priority: 2,
        title: `Nhắc nhở nộp báo cáo Sell-out`,
        message: `<b>${missingSales.length} Sale</b> chưa nộp báo cáo <b>Sell-out</b> gần nhất.`,
        details: { type: 'table_missing', columns: ['Sale chưa nộp Sell-out', 'Mục tiêu S.O Tháng'], data: missingSales }
    };
}

function createOverTargetAlert(agg) {
    const regions = Object.values(agg.regions).filter(r => r.so_tar > 0);
    const overRegions = regions.map(r => ({ name: r.name, rate: (r.so_act / r.so_tar) * 100, actual: r.so_act, target: r.so_tar }))
                               .filter(r => r.rate >= ALERT_THRESHOLDS.targetReachedRate)
                               .sort((a,b) => b.rate - a.rate);

    if (overRegions.length === 0) return null;

    const names = overRegions.slice(0, 3).map(r => r.name).join(', ');
    const extra = overRegions.length > 3 ? ` và ${overRegions.length - 3} khu vực khác` : '';

    return {
        id: genId(), level: 'success', category: 'progress', priority: 4,
        title: `Vượt mục tiêu Sell-out`,
        message: `<b>${names}</b>${extra} đã vượt mục tiêu Sell-out.`,
        details: { type: 'table_success', columns: ['Khu vực', 'Thực đạt S.O', 'Mục tiêu S.O', 'Tỷ lệ HT'], data: overRegions }
    };
}

window.buildDashboardAlerts = function({ summary, regions, sales, dailyData, rawData, selectedFilters }) {
    let alerts = [];

    const progressAlert = createOverallProgressAlert(summary, selectedFilters.region);
    if(progressAlert) alerts.push(progressAlert);

    const weakRegAlert = createWeakRegionAlert(summary);
    if(weakRegAlert) alerts.push(weakRegAlert);

    const lowSaleAlert = createLowSaleAlert(summary);
    if(lowSaleAlert) alerts.push(lowSaleAlert);

    const anomalyAlert = createSellinSelloutAnomalyAlert(summary);
    if(anomalyAlert) alerts.push(anomalyAlert);

    const staleSIAlert = createStaleSIAlert(summary, rawData, selectedFilters);
    if(staleSIAlert) alerts.push(staleSIAlert);

    const staleSOAlert = createStaleSOAlert(summary, rawData, selectedFilters);
    if(staleSOAlert) alerts.push(staleSOAlert);

    const overAlert = createOverTargetAlert(summary);
    if(overAlert) alerts.push(overAlert);

    const levelScore = { 'critical': 1, 'warning': 2, 'success': 3, 'info': 4 };
    alerts.sort((a, b) => {
        if (levelScore[a.level] !== levelScore[b.level]) return levelScore[a.level] - levelScore[b.level];
        return a.priority - b.priority;
    });

    window.currentDashboardAlerts = alerts.slice(0, ALERT_THRESHOLDS.maxVisibleAlerts);
    return window.currentDashboardAlerts;
};

window.renderDashboardAlerts = function(alerts) {
    const container = document.getElementById('erp-warnings-container');
    if (!container) return;

    if (!alerts || alerts.length === 0) {
        container.innerHTML = `
            <div class="flex flex-col items-center justify-center h-full text-center py-6 opacity-70">
                <i class="fa-solid fa-shield-check text-4xl text-green-500 mb-3"></i>
                <p class="text-gray-600 font-bold">Các chỉ số hiện tại đang hoạt động bình thường.</p>
                <p class="text-xs text-gray-400 mt-1">Không phát hiện điểm nóng nào.</p>
            </div>`;
        return;
    }

    const levelStyles = {
        'critical': { bg: 'bg-red-50', text: 'text-red-700', icon: 'fa-triangle-exclamation text-red-500' },
        'warning': { bg: 'bg-orange-50', text: 'text-orange-700', icon: 'fa-circle-exclamation text-orange-500' },
        'success': { bg: 'bg-green-50', text: 'text-green-700', icon: 'fa-circle-check text-green-500' },
        'info': { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'fa-circle-info text-blue-500' }
    };

    container.innerHTML = alerts.map(al => {
        const style = levelStyles[al.level];
        return `
            <div class="${style.bg} border border-white rounded-xl p-3 shadow-sm hover:shadow transition group flex gap-3 items-start cursor-pointer" onclick="window.showDashboardAlertDetails('${al.id}')">
                <div class="mt-0.5 shrink-0"><i class="fa-solid ${style.icon} text-lg"></i></div>
                <div class="flex-1">
                    <p class="${style.text} text-[13px] leading-relaxed">${al.message}</p>
                    <p class="text-[10px] text-gray-500 mt-1 font-semibold group-hover:text-blue-600 transition"><i class="fa-solid fa-magnifying-glass mr-1"></i> Bấm để xem chi tiết</p>
                </div>
            </div>
        `;
    }).join('');

    const critCount = alerts.filter(a => a.level === 'critical').length;
    const headerTitle = document.getElementById('erp-alert-header-title');
    if (headerTitle) {
        headerTitle.innerHTML = `<i class="fa-regular fa-bell"></i> TRUNG TÂM CẢNH BÁO ${critCount > 0 ? `<span class="ml-2 bg-red-500 text-white px-2 py-0.5 rounded-full text-[10px]">${critCount} nghiêm trọng</span>` : ''}`;
    }
};

window.showDashboardAlertDetails = function(alertId) {
    const alertData = window.currentDashboardAlerts.find(a => a.id === alertId);
    if (!alertData) return;

    const modal = document.getElementById('alert-details-modal');
    const content = document.getElementById('alert-details-content');
    const title = document.getElementById('alert-details-title');

    if (!modal || !content || !title) return;

    title.innerText = alertData.title;

    let tableHtml = '';
    const d = alertData.details;

    if (d && d.data && d.data.length > 0) {
        tableHtml += `<table class="w-full text-left text-xs whitespace-nowrap min-w-max border-collapse">`;
        tableHtml += `<thead class="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]"><tr>`;
        d.columns.forEach(col => { tableHtml += `<th class="py-2 px-3 border-b border-gray-200">${col}</th>`; });
        tableHtml += `</tr></thead><tbody class="divide-y divide-gray-100 text-slate-700">`;

        d.data.forEach((row, i) => {
            tableHtml += `<tr class="${i%2===0?'bg-white':'bg-slate-50'}">`;
            if (d.type === 'table_region' || d.type === 'table_sale' || d.type === 'table_success') {
                tableHtml += `<td class="py-2.5 px-3 font-bold whitespace-nowrap">${row.name}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-black text-blue-600 whitespace-nowrap">${fmtNum(row.actual)}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-medium text-gray-500 whitespace-nowrap">${fmtNum(row.target)}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-bold text-orange-600 whitespace-nowrap">${fmtPct(row.rate)}</td>`;
            } else if (d.type === 'table_anomaly') {
                tableHtml += `<td class="py-2.5 px-3 font-bold whitespace-nowrap">${row.name}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-bold text-blue-600 whitespace-nowrap">${fmtPct(row.siRate)}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-bold text-green-600 whitespace-nowrap">${fmtPct(row.soRate)}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-black text-red-500 whitespace-nowrap">${fmtPct(row.gap)}</td>`;
            } else if (d.type === 'table_missing') {
                tableHtml += `<td class="py-2.5 px-3 font-bold text-red-600 whitespace-nowrap">${row.name}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-medium text-gray-500 whitespace-nowrap">${fmtNum(row.target)}</td>`;
            }
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table>`;
    } else if (d.type === 'progress') {
        tableHtml = `
            <div class="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
                <div><span class="text-gray-500">Thực đạt:</span> <span class="font-black text-blue-600 whitespace-nowrap">${fmtNum(d.actual)}</span></div>
                <div><span class="text-gray-500">Mục tiêu:</span> <span class="font-black text-slate-800 whitespace-nowrap">${fmtNum(d.target)}</span></div>
                <div><span class="text-gray-500">Nhịp độ cần đạt:</span> <span class="font-black text-orange-500 whitespace-nowrap">${fmtNum(Math.ceil(d.reqPace))} xe/ngày</span></div>
                <div><span class="text-gray-500">Nhịp độ thực tế:</span> <span class="font-black ${d.actPace >= d.reqPace ? 'text-green-500' : 'text-red-500'} whitespace-nowrap">${fmtNum(Math.ceil(d.actPace))} xe/ngày</span></div>
                <div class="col-span-2 pt-2 border-t border-gray-200 mt-2">
                    <span class="text-gray-500">Dự báo cuối kỳ đạt:</span> <span class="font-black ${d.forecast >= 100 ? 'text-green-500' : 'text-red-500'} whitespace-nowrap">${fmtPct(d.forecast)}</span>
                </div>
            </div>`;
    } else {
        tableHtml = `<p class="text-sm text-gray-500 italic">Không có dữ liệu chi tiết.</p>`;
    }

    content.innerHTML = `<p class="text-sm font-medium text-gray-700 mb-4 bg-blue-50/50 p-3 rounded-lg border border-blue-100">${alertData.message}</p>
                         <div class="overflow-x-auto border border-gray-200 rounded-xl max-h-[50vh] custom-scrollbar">${tableHtml}</div>`;
    
    modal.classList.remove('hidden');
    modal.classList.add('flex');
};

window.closeDashboardAlertModal = function() {
    const modal = document.getElementById('alert-details-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};