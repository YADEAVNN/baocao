import { $, fmn, safeVal } from '../core/utils.js';
import { sb } from '../core/supabase.js';
import { checkUserScopePermission } from './dashboard.js';

window.currentDailyInputData = [];

export async function loadDailyInputData() {
    let chosenDate = $('di_date').value;
    if (!chosenDate) {
        chosenDate = new Date().toISOString().split('T')[0];
        $('di_date').value = chosenDate;
    }

    const selectedDateObj = new Date(chosenDate);
    const monthStr = `${selectedDateObj.getFullYear()}-${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}`;
    const totalDaysInMonth = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0).getDate();

    let dayOfWeek = selectedDateObj.getDay(); 
    let distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    let monday = new Date(selectedDateObj);
    monday.setDate(selectedDateObj.getDate() + distanceToMonday);
    let sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const mondayStr = monday.toISOString().split('T')[0];
    const sundayStr = sunday.toISOString().split('T')[0];

    // Xử lý múi giờ Việt Nam (UTC+7) để truy vấn chính xác cột created_at (timestamptz) trên Supabase
    const startOfDayUTC = new Date(`${chosenDate}T00:00:00+07:00`).toISOString();
    const endOfDayUTC = new Date(`${chosenDate}T23:59:59+07:00`).toISOString();

    try {
        const [targetRes, dailyRes, weeklyRes, crmRes] = await Promise.all([
            sb.from('monthly_shop_targets').select('*').eq('report_month', monthStr),
            sb.from('daily_so_reports').select('*').eq('report_date', chosenDate),
            sb.from('daily_so_reports').select('*').gte('report_date', mondayStr).lte('report_date', sundayStr),
            // Lấy chính xác khách hàng được tạo trong ngày (đã bù trừ múi giờ Việt Nam)
            sb.from('crm_customers').select('shop_code').gte('created_at', startOfDayUTC).lte('created_at', endOfDayUTC)
        ]);

        const targets = targetRes.data || [];
        const dailyReports = dailyRes.data || [];
        const weeklyReports = weeklyRes.data || [];
        const crmData = crmRes.data || []; 

        const shops = Object.values(window.globalAdminShopMap || {}).filter(s => checkUserScopePermission(s.shop_code));

        window.currentDailyInputData = shops.map(s => {
            const tgt = targets.find(t => t.shop_code === s.shop_code) || {};
            const dayRep = dailyReports.find(r => r.shop_code === s.shop_code);
            const shopWeeklyReps = weeklyReports.filter(r => r.shop_code === s.shop_code);

            // Đếm số lượng khách hàng thu thập được của shop này từ bảng CRM
            const shopCrmCount = crmData.filter(c => c.shop_code === s.shop_code).length;

            const targetMonthSO = tgt.target_so || 0;
            const targetTuanSO = Math.round((targetMonthSO / totalDaysInMonth) * 7);

            const weeklyActualSO = shopWeeklyReps.reduce((sum, r) => sum + safeVal(r.total_so), 0);
            const weeklyPct = targetTuanSO > 0 ? Math.round((weeklyActualSO / targetTuanSO) * 100) : 0;

            return {
                shop_code: s.shop_code,
                shop_name: s.shop_name,
                hasData: !!dayRep,
                targetTuan: targetTuanSO,
                weeklyActualSO,
                weeklyPct,
                currentDayData: {
                    report_date: chosenDate,
                    total_so: dayRep ? safeVal(dayRep.total_so) : 0,
                    traffic_total: dayRep ? (safeVal(dayRep.traffic_natural) + safeVal(dayRep.traffic_leads)) : 0,
                    crm_count: shopCrmCount // Trả về số CRM chuẩn xác
                }
            };
        });

        renderDailyInputTableFiltered();
        updateDailyInputKPIs();

    } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu ngày:", err);
        alert("Không thể kết nối máy chủ để tải dữ liệu báo cáo ngày.");
    }
}

function updateDailyInputKPIs() {
    let totalSO = 0;
    let totalTraffic = 0;
    let totalCRM = 0;
    let missingCount = 0;

    window.currentDailyInputData.forEach(d => {
        if (d.hasData) {
            totalSO += d.currentDayData.total_so;
            totalTraffic += d.currentDayData.traffic_total;
        } else {
            missingCount++;
        }
        totalCRM += d.currentDayData.crm_count; 
    });

    if ($('kpi_di_so')) $('kpi_di_so').innerText = fmn(totalSO);
    if ($('kpi_di_traffic')) $('kpi_di_traffic').innerText = fmn(totalTraffic);
    if ($('kpi_di_crm')) $('kpi_di_crm').innerText = fmn(totalCRM);
    if ($('kpi_di_missing')) $('kpi_di_missing').innerText = missingCount + " Shop";
}

export function renderDailyInputTableFiltered() {
    const kw = $('di_search')?.value.toLowerCase().trim() || "";
    const statusFilter = $('di_status_filter')?.value || "ALL"; 
    const tbody = $('dailyInputBody');
    if (!tbody) return;

    const filtered = window.currentDailyInputData.filter(d => {
        const matchKeyword = d.shop_code.toLowerCase().includes(kw) || d.shop_name.toLowerCase().includes(kw);
        let matchStatus = true;
        if (statusFilter === 'ENTERED' && !d.hasData) matchStatus = false;
        if (statusFilter === 'MISSING' && d.hasData) matchStatus = false;
        return matchKeyword && matchStatus;
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-500 italic">Không tìm thấy thông tin điểm bán tương ứng với điều kiện lọc.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(d => {
        const statusBadge = d.hasData 
            ? `<span class="bg-green-100 text-green-700 px-2 py-1 rounded text-[10px] font-black uppercase border border-green-200 shadow-sm">Đã nhập</span>`
            : `<span class="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase border border-red-200 shadow-sm animate-pulse">Không nhập</span>`;

        const progressColor = d.weeklyPct < 80 ? 'text-red-600 font-black' : (d.weeklyPct < 100 ? 'text-orange-500 font-black' : 'text-green-600 font-black');

        return `
            <tr class="hover:bg-slate-50 border-b text-xs">
                <td class="p-4">
                    <div class="font-bold text-slate-800 text-sm">${d.shop_name}</div>
                    <div class="text-[10px] text-gray-400 font-mono mt-0.5">${d.shop_code}</div>
                </td>
                <td class="p-4 text-center">${statusBadge}</td>
                <td class="p-4 text-center bg-orange-50/20 font-black text-orange-600 text-lg">${d.currentDayData.total_so}</td>
                <td class="p-4 text-center bg-blue-50/20 font-black text-blue-600 text-lg">${d.currentDayData.traffic_total}</td>
                <td class="p-4 text-center bg-purple-50/20 font-black text-purple-600 text-lg">${d.currentDayData.crm_count}</td>
                <td class="p-4 text-center font-bold text-slate-500 bg-gray-50/50">${d.targetTuan}</td>
                <td class="p-4 text-center bg-green-50/30">
                    <div class="${progressColor}">${d.weeklyPct}%</div>
                    <div class="text-[10px] text-gray-400 mt-0.5">Đã đạt: ${d.weeklyActualSO} xe</div>
                </td>
            </tr>
        `;
    }).join('');
}

export function exportDailyInputExcel() {
    if (!window.currentDailyInputData || window.currentDailyInputData.length === 0) {
        return alert("Không có dữ liệu để xuất!");
    }

    const chosenDate = $('di_date').value;
    const kw = $('di_search')?.value.toLowerCase().trim() || "";
    const statusFilter = $('di_status_filter')?.value || "ALL";

    const filtered = window.currentDailyInputData.filter(d => {
        const matchKeyword = d.shop_code.toLowerCase().includes(kw) || d.shop_name.toLowerCase().includes(kw);
        let matchStatus = true;
        if (statusFilter === 'ENTERED' && !d.hasData) matchStatus = false;
        if (statusFilter === 'MISSING' && d.hasData) matchStatus = false;
        return matchKeyword && matchStatus;
    });

    if (filtered.length === 0) {
        return alert("Không có dữ liệu phù hợp với bộ lọc hiện tại để xuất Excel!");
    }

    const header = [
        "Mã Cửa Hàng (DVN)", "Tên Cửa Hàng", "Trạng Thái Báo Cáo", 
        "S.O Ngày", "Tổng Khách Đến", "Cập Nhật CRM", 
        "Target Tuần", "Thực Đạt Tuần", "% Tiến Độ Tuần"
    ];
    
    const rows = filtered.map(d => [
        d.shop_code,
        d.shop_name,
        d.hasData ? "Đã nhập" : "Không nhập",
        d.currentDayData.total_so,
        d.currentDayData.traffic_total,
        d.currentDayData.crm_count,
        d.targetTuan,
        d.weeklyActualSO,
        d.weeklyPct + "%"
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Daily_Report");
    XLSX.writeFile(wb, `BaoCao_Ngay_${chosenDate}.xlsx`);
}