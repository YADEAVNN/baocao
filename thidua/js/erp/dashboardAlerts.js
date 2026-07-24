// ==========================================
// MODULE: TRUNG TÂM CẢNH BÁO TỰ ĐỘNG (DATA-DRIVEN ALERTS)
// ==========================================

const ALERT_THRESHOLDS = {
    lowRegionRate: 10,           // Dưới 10% mục tiêu là yếu
    lowSaleRate: 60,             // Sale đạt dưới 60% là yếu
    targetReachedRate: 100,      // Đạt 100% là vượt mục tiêu
    anomalyRateGap: 50,          // Chênh lệch SI và SO 50% là bất thường
    severeAnomalyRateGap: 100,   // Chênh lệch 100% là nghiêm trọng
    abnormalCompletionRate: 300, // Hoàn thành > 300% là ảo/có thể sai số liệu
    maxVisibleAlerts: 7          // Chỉ hiện 7 cảnh báo quan trọng nhất
};

// Hàm hỗ trợ format
const fmtNum = (num) => isNaN(num) ? '0' : Number(num).toLocaleString('vi-VN');
const fmtPct = (num) => isNaN(num) ? '0%' : Number(num).toLocaleString('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
const genId = () => 'alert_' + Math.random().toString(36).substr(2, 9);

window.currentDashboardAlerts = [];

// ==========================================
// CÁC HÀM TẠO CẢNH BÁO CHI TIẾT
// ==========================================

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
            message: `Sell-in ${regionNameText} mới đạt <b>${fmtPct(sellinRate)}</b>, thiếu nhịp độ <b>${fmtNum(Math.abs(sellinPaceGap))} xe/ngày</b> so với mục tiêu.`,
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
        message: `<b>${lowSales.length} Sale</b> có hiệu suất dưới ${ALERT_THRESHOLDS.lowSaleRate}%, trong đó <b>${zeroSales.length} Sale</b> chưa phát sinh doanh số.`,
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
        message: `<b>${names}</b>${extra} có chênh lệch bất thường giữa tỷ lệ Sell-in và Sell-out.`,
        details: { type: 'table_anomaly', columns: ['Khu vực', 'Tiến độ S.I', 'Tiến độ S.O', 'Độ lệch'], data: anomalies }
    };
}

function createStaleDataAlert(agg, rawData, filters) {
    const vnTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
    const currentHour = vnTime.getHours();
    const isToday = filters.end === vnTime.toISOString().split('T')[0];

    // Quy tắc thời gian nếu xem ngày hôm nay
    let level = 'info';
    if (isToday) {
        if (currentHour < 10) return null; // Sáng sớm chưa nhắc
        else if (currentHour >= 15 && currentHour < 18) level = 'warning';
        else if (currentHour >= 18) level = 'critical';
    } else {
        level = 'warning'; // Xem ngày cũ mà thiếu thì luôn là warning
    }

    // Tập hợp những người đã nộp báo cáo (Có trong game_si HOẶC daily_so)
    const reportedSales = new Set();
    (rawData.gameSi || []).forEach(r => { if (r.report_date === filters.end) reportedSales.add(r.sale_name); });
    (rawData.so || []).forEach(r => { if (r.report_date === filters.end) reportedSales.add(r.sale_name); });

    const activeSales = Object.values(agg.sales).filter(s => s.so_tar > 0 || s.si_tar > 0);
    const missingSales = activeSales.filter(s => !reportedSales.has(s.name)).map(s => ({ name: s.name, target: s.so_tar }));

    if (missingSales.length === 0) return null;

    const missingRatio = missingSales.length / activeSales.length;
    if (missingRatio > 0.3) level = 'critical';

    return {
        id: genId(), level, category: 'data', priority: 2,
        title: `Nhắc nhở cập nhật số liệu`,
        message: `<b>${missingSales.length} Sale</b> chưa cập nhật dữ liệu báo cáo cho ngày ${filters.end.slice(8,10)}/${filters.end.slice(5,7)}.`,
        details: { type: 'table_missing', columns: ['Sale chưa nộp báo cáo', 'Mục tiêu S.O Tháng'], data: missingSales }
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
        message: `<b>${names}</b>${extra} đã vượt 100% mục tiêu Sell-out tháng.`,
        details: { type: 'table_success', columns: ['Khu vực', 'Thực đạt S.O', 'Mục tiêu S.O', 'Tỷ lệ HT'], data: overRegions }
    };
}

function createDataQualityAlert(rawData) {
    let anomaliesCount = 0;
    const errors = [];

    const checkDataset = (data, sourceName, valFields) => {
        (data || []).forEach(row => {
            if (!row.sale_name || String(row.sale_name).trim() === '') {
                anomaliesCount++; errors.push({ type: 'Thiếu tên Sale', source: sourceName, date: row.report_date });
            }
            valFields.forEach(field => {
                if (Number(row[field]) < 0) {
                    anomaliesCount++; errors.push({ type: 'Số lượng âm', source: sourceName, date: row.report_date, field });
                }
            });
        });
    };

    checkDataset(rawData.si, 'Admin Sell-in', ['thanh_toan', 'xuat_hang']);
    checkDataset(rawData.gameSi, 'Sale Sell-in (Thi đua)', ['thanh_toan', 'xuat_hang']);
    checkDataset(rawData.so, 'Sale Sell-out', ['total_so']);

    if (anomaliesCount === 0) return null;

    return {
        id: genId(), level: 'critical', category: 'data', priority: 1,
        title: `Cảnh báo chất lượng dữ liệu`,
        message: `Phát hiện <b>${anomaliesCount} bản ghi</b> có dữ liệu bất thường (âm hoặc thiếu mapping) cần quản trị viên kiểm tra.`,
        details: { type: 'table_error', columns: ['Loại lỗi', 'Nguồn dữ liệu', 'Ngày báo cáo'], data: errors.slice(0, 20) } // Giới hạn 20 lỗi hiển thị
    };
}

// ==========================================
// HÀM TỔNG HỢP VÀ ĐIỀU PHỐI (MAIN EXPORT)
// ==========================================
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

    const staleAlert = createStaleDataAlert(summary, rawData, selectedFilters);
    if(staleAlert) alerts.push(staleAlert);

    const overAlert = createOverTargetAlert(summary);
    if(overAlert) alerts.push(overAlert);

    const qualityAlert = createDataQualityAlert(rawData);
    if(qualityAlert) alerts.push(qualityAlert);

    // Sắp xếp theo Level (Critical -> Warning -> Success -> Info) và Priority
    const levelScore = { 'critical': 1, 'warning': 2, 'success': 3, 'info': 4 };
    alerts.sort((a, b) => {
        if (levelScore[a.level] !== levelScore[b.level]) return levelScore[a.level] - levelScore[b.level];
        return a.priority - b.priority;
    });

    window.currentDashboardAlerts = alerts.slice(0, ALERT_THRESHOLDS.maxVisibleAlerts);
    return window.currentDashboardAlerts;
};

// ==========================================
// RENDER UI VÀ MODAL
// ==========================================
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

    // Đếm số critical để update Header Card (nếu cần)
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
        tableHtml += `<table class="w-full text-left text-xs whitespace-nowrap border-collapse">`;
        tableHtml += `<thead class="bg-gray-100 text-gray-600 font-bold uppercase text-[10px]"><tr>`;
        d.columns.forEach(col => { tableHtml += `<th class="py-2 px-3 border-b border-gray-200">${col}</th>`; });
        tableHtml += `</tr></thead><tbody class="divide-y divide-gray-100 text-slate-700">`;

        d.data.forEach((row, i) => {
            tableHtml += `<tr class="${i%2===0?'bg-white':'bg-slate-50'}">`;
            if (d.type === 'table_region' || d.type === 'table_sale' || d.type === 'table_success') {
                tableHtml += `<td class="py-2.5 px-3 font-bold">${row.name}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-black text-blue-600">${fmtNum(row.actual)}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-medium text-gray-500">${fmtNum(row.target)}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-bold text-orange-600">${fmtPct(row.rate)}</td>`;
            } else if (d.type === 'table_anomaly') {
                tableHtml += `<td class="py-2.5 px-3 font-bold">${row.name}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-bold text-blue-600">${fmtPct(row.siRate)}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-bold text-green-600">${fmtPct(row.soRate)}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-black text-red-500">${fmtPct(row.gap)}</td>`;
            } else if (d.type === 'table_missing') {
                tableHtml += `<td class="py-2.5 px-3 font-bold text-red-600">${row.name}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-medium text-gray-500">${fmtNum(row.target)}</td>`;
            } else if (d.type === 'table_error') {
                tableHtml += `<td class="py-2.5 px-3 font-bold text-red-600">${row.type}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-medium">${row.source}</td>`;
                tableHtml += `<td class="py-2.5 px-3 font-mono">${row.date || '---'}</td>`;
            }
            tableHtml += `</tr>`;
        });
        tableHtml += `</tbody></table>`;
    } else if (d.type === 'progress') {
        tableHtml = `
            <div class="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-xl">
                <div><span class="text-gray-500">Thực đạt:</span> <span class="font-black text-blue-600">${fmtNum(d.actual)}</span></div>
                <div><span class="text-gray-500">Mục tiêu:</span> <span class="font-black text-slate-800">${fmtNum(d.target)}</span></div>
                <div><span class="text-gray-500">Nhịp độ cần đạt:</span> <span class="font-black text-orange-500">${fmtNum(Math.ceil(d.reqPace))} xe/ngày</span></div>
                <div><span class="text-gray-500">Nhịp độ thực tế:</span> <span class="font-black ${d.actPace >= d.reqPace ? 'text-green-500' : 'text-red-500'}">${fmtNum(Math.ceil(d.actPace))} xe/ngày</span></div>
                <div class="col-span-2 pt-2 border-t border-gray-200 mt-2">
                    <span class="text-gray-500">Dự báo cuối kỳ đạt:</span> <span class="font-black ${d.forecast >= 100 ? 'text-green-500' : 'text-red-500'}">${fmtPct(d.forecast)}</span>
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