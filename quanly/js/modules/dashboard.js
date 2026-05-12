import { $, fmn, safeVal, toggleModal } from '../core/utils.js';
import { sb } from '../core/supabase.js';

let chartInstances = {};
let cachedSOReportsFiltered = []; 
let cachedSOReportsAll13M = [];   
let cachedMediaData = [];
window.currentPacingData = []; 

// ==========================================
// 1. KHỞI TẠO BỘ LỌC & NGÀY THÁNG
// ==========================================
export function initDateFilters() {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    if($('f_date_end')) $('f_date_end').value = today.toISOString().split('T')[0];
    if($('f_date_start')) $('f_date_start').value = lastWeek.toISOString().split('T')[0];

    if($('db_director')) {
        const directors = [...new Set(Object.values(window.globalAdminShopMap).map(s => s.director_name).filter(n => n))].sort();
        $('db_director').innerHTML = `<option value="">-- Tất cả GĐ --</option>` + directors.map(d => `<option value="${d}">${d}</option>`).join('');
    }
}

export const updateDashboardFilterChain = (level) => {
    let filtered = Object.values(window.globalAdminShopMap);
    const selDir = $('db_director')?.value;
    const selSale = $('db_sale')?.value;
    const selSVN = $('db_svn')?.value;

    if(selDir) filtered = filtered.filter(s => s.director_name === selDir);

    if(level === 'director' && $('db_sale')) {
        const sales = [...new Set(filtered.map(s => s.sale_name).filter(n => n))].sort();
        $('db_sale').innerHTML = `<option value="">-- Tất cả Sale --</option>` + sales.map(s => `<option value="${s}">${s}</option>`).join('');
        $('db_sale').value = "";
    }

    if(selSale) filtered = filtered.filter(s => s.sale_name === selSale);

    if((level === 'director' || level === 'sale') && $('db_svn')) {
        const svns = [...new Set(filtered.map(s => s.svn_code).filter(n => n))].sort();
        $('db_svn').innerHTML = `<option value="">-- Tất cả SVN --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join('');
        $('db_svn').value = "";
    }

    if(selSVN) filtered = filtered.filter(s => s.svn_code === selSVN);

    if($('db_dvn')) {
        const dvns = filtered.sort((a,b) => a.shop_code.localeCompare(b.shop_code));
        $('db_dvn').innerHTML = `<option value="">-- Tất cả Shop --</option>` + dvns.map(s => `<option value="${s.shop_code}">${s.shop_code} - ${s.shop_name}</option>`).join('');
    }
    
    if(cachedSOReportsAll13M.length > 0) applyDashboardFilters();
}

export const resetDashboardFilters = () => {
    if($('db_director')) $('db_director').value = "";
    if($('db_sale')) $('db_sale').value = "";
    if($('db_svn')) $('db_svn').value = "";
    if($('db_dvn')) $('db_dvn').value = "";
    initDateFilters(); 
    updateDashboardFilterChain('director');
    loadDashboardSO(); 
}

function renderChart(type, id, data, options = {}) { 
    const canvas = $(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); 
    if(chartInstances[id]) chartInstances[id].destroy();
    chartInstances[id] = new Chart(ctx, { 
        type, 
        data, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
                datalabels: { display: false } 
            },
            ...options 
        } 
    });
}

// ==========================================
// 2. TẢI DỮ LIỆU TỪ DATABASE
// ==========================================
export async function loadDashboardSO() {
    const start = $('f_date_start').value;
    const end = $('f_date_end').value;

    if(!start || !end) return alert("Vui lòng chọn khoảng thời gian.");

    let endD = new Date(end);
    let start13M = new Date(endD.getFullYear(), endD.getMonth() - 12, 1);
    let start13MStr = `${start13M.getFullYear()}-${String(start13M.getMonth()+1).padStart(2,'0')}-01`;

    try {
        const [soRes, mediaRes, priceRes] = await Promise.all([
            sb.from('daily_so_reports').select('*').gte('report_date', start13MStr).lte('report_date', end),
            sb.from('media_reports').select('*').gte('report_date', start).lte('report_date', end),
            sb.from('monthly_product_prices').select('model, selling_price, report_month')
        ]);

        if (soRes.error) throw soRes.error;

        cachedSOReportsAll13M = soRes.data || [];
        cachedMediaData = mediaRes.data || [];
        
        cachedSOReportsAll13M.forEach(r => {
            let details = [];
            try { details = typeof r.models_detail === 'string' ? JSON.parse(r.models_detail) : r.models_detail || []; } catch(e) {}
            const reportMonth = r.report_date?.substring(0, 7);
            let dailyRev = 0;
            
            details.forEach(d => {
                const rawModel = (d.model || '').toLowerCase().trim();
                let matched = priceRes.data.find(p => p.model.toLowerCase().trim() === rawModel && p.report_month === reportMonth);
                if (!matched) matched = priceRes.data.find(p => p.model.toLowerCase().trim() === rawModel);
                
                const count = safeVal(d.qty_so) || safeVal(d.qty) || safeVal(d.quantity) || 0;
                dailyRev += count * (matched ? safeVal(matched.selling_price) : 0);
            });
            r.calculated_revenue = dailyRev;
        });

        applyDashboardFilters();

    } catch (err) {
        console.error("Lỗi Dashboard:", err);
        alert("Không thể tải dữ liệu Dashboard. Vui lòng kiểm tra kết nối.");
    }
}

// ==========================================
// 3. XỬ LÝ BIỂU ĐỒ CHIẾN THUẬT & KPI
// ==========================================
function applyDashboardFilters() {
    const start = $('f_date_start').value;
    const end = $('f_date_end').value;

    const selDir = $('db_director')?.value;
    const selSale = $('db_sale')?.value;
    const selSVN = $('db_svn')?.value;
    const selDVN = $('db_dvn')?.value;

    const filterFn = (r) => {
        const shop = window.globalAdminShopMap[r.shop_code] || {};
        if(selDir && shop.director_name !== selDir) return false;
        if(selSale && shop.sale_name !== selSale) return false;
        if(selSVN && shop.svn_code !== selSVN) return false;
        if(selDVN && r.shop_code !== selDVN) return false;
        return true;
    };

    const fSO = cachedSOReportsAll13M.filter(filterFn).filter(r => r.report_date >= start && r.report_date <= end);
    cachedSOReportsFiltered = fSO; 
    const fMedia = cachedMediaData.filter(filterFn);

    let totalSO = 0, totalNat = 0, totalExp = 0, totalRev = 0;
    fSO.forEach(r => {
        totalSO += safeVal(r.total_so);
        totalNat += safeVal(r.traffic_natural); 
        totalExp += safeVal(r.traffic_leads);   
        totalRev += safeVal(r.calculated_revenue);
    });

    const totalTraf = totalNat + totalExp;
    if($('kpi_total_revenue')) $('kpi_total_revenue').innerText = fmn(totalRev) + 'đ';
    if($('kpi_total_so')) $('kpi_total_so').innerText = fmn(totalSO);
    if($('kpi_traffic_natural')) $('kpi_traffic_natural').innerText = fmn(totalNat);
    if($('kpi_traffic_exploit')) $('kpi_traffic_exploit').innerText = fmn(totalExp);
    if($('kpi_hit_rate')) $('kpi_hit_rate').innerText = totalTraf > 0 ? ((totalSO/totalTraf)*100).toFixed(1) + "%" : "0%";

    let endD = new Date($('f_date_end').value);
    let months13 = [];
    for(let i=12; i>=0; i--) {
        let d = new Date(endD.getFullYear(), endD.getMonth() - i, 1);
        months13.push(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`);
    }
    
    let soByMonth = months13.map(m => {
        return cachedSOReportsAll13M.filter(filterFn).filter(r => r.report_date.startsWith(m)).reduce((s, r) => s + safeVal(r.total_so), 0);
    });

    let labels12M = months13.slice(1).map(m => { let p = m.split('-'); return `T${p[1]}/${p[0].substring(2)}`; });
    let data12MSO = soByMonth.slice(1);
    let data12MPct = [];
    
    for(let i=1; i<=12; i++) {
        let prev = soByMonth[i-1];
        let curr = soByMonth[i];
        let pct = prev === 0 ? (curr > 0 ? 100 : 0) : ((curr - prev) / prev) * 100;
        data12MPct.push(pct.toFixed(1));
    }

    renderChart('bar', 'chart_db_trend', {
        labels: labels12M,
        datasets: [
            { type: 'bar', label: 'Sản lượng S.O', data: data12MSO, backgroundColor: '#f97316', borderRadius: 4, yAxisID: 'y' },
            { type: 'line', label: '% Tăng trưởng MoM', data: data12MPct, borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 2, tension: 0.1, yAxisID: 'y1', datalabels: { display: true, formatter: v => v + '%', color: '#047857', align: 'top', font: {weight: 'bold', size: 10} } }
        ]
    }, {
        scales: { 
            y: { type: 'linear', position: 'left', title: {display:true, text:'Xe'} }, 
            y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false }, ticks: { callback: v => v + '%' } } 
        }
    });

    const modelData = {};
    fSO.forEach(r => {
        let details = [];
        try { details = typeof r.models_detail === 'string' ? JSON.parse(r.models_detail) : r.models_detail || []; } catch(e) {}
        details.forEach(d => {
            const m = d.model || 'Khác';
            modelData[m] = (modelData[m] || 0) + (safeVal(d.qty_so) || safeVal(d.qty) || safeVal(d.quantity) || 0);
        });
    });
    const top5Models = Object.entries(modelData).sort((a,b) => b[1] - a[1]).slice(0, 5);
    renderChart('bar', 'chart_db_models', {
        labels: top5Models.map(m => m[0]),
        datasets: [{ label: 'Số lượng xe', data: top5Models.map(m => m[1]), backgroundColor: '#10b981', borderRadius: 4 }]
    }, {
        plugins: { datalabels: { display: true, anchor: 'end', align: 'top', color: '#047857', font: {weight: '900', size: 12} } }
    });

    const shopSO = {};
    fSO.forEach(r => { shopSO[r.shop_code] = (shopSO[r.shop_code] || 0) + safeVal(r.total_so); });
    const topShops = Object.entries(shopSO).sort((a,b) => b[1] - a[1]).slice(0, 5);
    renderChart('bar', 'chart_db_top_shop', {
        labels: topShops.map(s => window.globalAdminShopMap[s[0]]?.shop_name?.substring(0, 15) || s[0]),
        datasets: [{ label: 'Xe (S.O)', data: topShops.map(s => s[1]), backgroundColor: '#f59e0b', borderRadius: 4 }]
    }, { 
        indexAxis: 'y', 
        plugins: { datalabels: { display: true, align: 'right', font: {weight: 'bold'} } } 
    }); 

    const mediaCompareData = topShops.map(s => {
        const c = s[0];
        const so = s[1];
        const med = fMedia.filter(r => r.shop_code === c).reduce((sum, r) => sum + safeVal(r.livestreams) + safeVal(r.tiktok_videos), 0);
        return { code: c, name: window.globalAdminShopMap[c]?.shop_name?.substring(0, 10) || c, so, med };
    });
    renderChart('bar', 'chart_db_media', {
        labels: mediaCompareData.map(d => d.name),
        datasets: [
            { label: 'Sản lượng S.O', data: mediaCompareData.map(d => d.so), backgroundColor: '#FF4500' },
            { label: 'Cường độ Media', data: mediaCompareData.map(d => d.med), backgroundColor: '#8b5cf6' }
        ]
    });

    const areaData = {};
    fSO.forEach(r => {
        const dir = window.globalAdminShopMap[r.shop_code]?.director_name || 'Khác';
        areaData[dir] = (areaData[dir] || 0) + safeVal(r.total_so);
    });
    renderChart('doughnut', 'chart_db_pie_area', {
        labels: Object.keys(areaData),
        datasets: [{ data: Object.values(areaData), backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#64748b'] }]
    }, { plugins: { legend: { position: 'right' } } });
}

// ==========================================
// 4. XUẤT EXCEL & BÁO CÁO TIẾN ĐỘ (PACING)
// ==========================================
export function exportDashboardExcel() {
    if(!cachedSOReportsFiltered.length) return alert("Không có dữ liệu để xuất!");
    const header = ["Ngày", "Mã DVN", "Tên Shop", "Khu Vực", "Giám Đốc", "Sale", "Tổng Khách", "Khách Tự Nhiên", "Khách Khai Thác", "Tổng S.O", "Doanh Thu"];
    const rows = cachedSOReportsFiltered.map(r => {
        const shop = window.globalAdminShopMap[r.shop_code] || {};
        return [r.report_date, r.shop_code, shop.shop_name, shop.area, shop.director_name, shop.sale_name, safeVal(r.traffic_natural)+safeVal(r.traffic_leads), r.traffic_natural, r.traffic_leads, r.total_so, r.calculated_revenue];
    });
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "SO_Report");
    XLSX.writeFile(wb, `BaoCao_TongQuan_${$('f_date_start').value}.xlsx`);
}

export async function loadPacingReport() {
    const inputDate = $('pacing_date').value;
    if(!inputDate) return alert("Vui lòng chọn ngày!");

    $('pacingBody').innerHTML = `<tr><td colspan="14" class="p-6 text-center text-orange-500 font-bold"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tính toán Run-rate...</td></tr>`;
    window.currentPacingData = []; 

    const selectedDateObj = new Date(inputDate);
    const monthStr = `${selectedDateObj.getFullYear()}-${String(selectedDateObj.getMonth() + 1).padStart(2, '0')}`;
    const currentDay = selectedDateObj.getDate();
    const totalDays = new Date(selectedDateObj.getFullYear(), selectedDateObj.getMonth() + 1, 0).getDate();
    const ratio = currentDay / totalDays; 

    try {
        const [targetRes, soRes] = await Promise.all([
            sb.from('monthly_shop_targets').select('*').eq('report_month', monthStr),
            sb.from('daily_so_reports').select('*').gte('report_date', monthStr + "-01").lte('report_date', inputDate)
        ]);

        const targets = targetRes.data || [];
        const actualsByShop = {};
        
        (soRes.data || []).forEach(r => {
            const sc = r.shop_code;
            if(!actualsByShop[sc]) actualsByShop[sc] = { so: 0, traffic: 0 };
            actualsByShop[sc].so += safeVal(r.total_so);
            actualsByShop[sc].traffic += (safeVal(r.traffic_natural) + safeVal(r.traffic_leads));
        });

        const shops = Object.values(window.globalAdminShopMap || {}).sort((a,b) => (a.area||'').localeCompare(b.area||''));
        
        window.currentPacingData = shops.map(s => {
            const t = targets.find(t => t.shop_code === s.shop_code) || {};
            const a = actualsByShop[s.shop_code] || { so: 0, traffic: 0 };
            const t_so_m = t.target_so || 0;
            const t_traf_m = t.target_traffic || 0; 

            return {
                area: s.area || '-', shop_code: s.shop_code, shop_name: s.shop_name,
                t_so_m, pct_m_so: t_so_m > 0 ? Math.round((a.so/t_so_m)*100) : 0,
                timePct: Math.round(ratio * 100),
                t_so_td: Math.round(t_so_m * ratio), a_so: a.so,
                t_traf_td: Math.round(t_traf_m * ratio), a_traf: a.traffic,
                hit_rate: a.traffic > 0 ? Math.round((a.so/a.traffic)*100) : 0,
                t_traf_m 
            };
        });

        $('pacingBody').innerHTML = window.currentPacingData.map(d => {
            const pctSO = d.t_so_td > 0 ? Math.round((d.a_so/d.t_so_td)*100) : 0;
            const pctTraf = d.t_traf_td > 0 ? Math.round((d.a_traf/d.t_traf_td)*100) : 0;
            const getColor = (p) => p < 80 ? "bg-red-100 text-red-700 animate-pulse" : (p < 100 ? "bg-yellow-50 text-orange-600" : "bg-green-50 text-green-700");
            
            return `<tr class="border-b text-xs">
                <td class="p-2 font-bold">${d.area}</td>
                <td class="p-2 font-mono">${d.shop_code}</td>
                <td class="p-2 font-bold">${d.shop_name}</td>
                <td class="p-2 font-bold text-orange-600 bg-orange-50/20">${d.t_so_m}</td>
                <td class="p-2 text-center">${d.pct_m_so}%</td>
                <td class="p-2 font-black text-blue-700 bg-blue-50">${d.timePct}%</td>
                <td class="p-2 text-gray-400">${d.t_so_td}</td>
                <td class="p-2 font-bold">${d.a_so}</td>
                <td class="p-2 font-black ${getColor(pctSO)}">${pctSO}%</td>
                <td class="p-2 font-bold text-indigo-600 bg-indigo-50/20">${d.t_traf_m}</td>
                <td class="p-2 text-gray-400">${d.t_traf_td}</td>
                <td class="p-2 font-bold">${d.a_traf}</td>
                <td class="p-2 font-black ${getColor(pctTraf)}">${pctTraf}%</td>
                <td class="p-2 font-black text-orange-600 bg-orange-50/50">${d.hit_rate}%</td>
            </tr>`;
        }).join('');
    } catch (err) { console.error(err); }
}

export function exportPacingExcel() {
    if (!window.currentPacingData.length) return alert("Bấm 'Tải Báo Cáo' trước!");
    const header = ["Khu Vực", "Mã Shop", "Tên Shop", "Target Tháng", "% Đạt Tháng", "Tiến Độ TG", "Mục Tiêu Nay", "Thực Đạt Nay", "% Hoàn Thành S.O", "Target Khách", "Mục Tiêu Khách Nay", "Thực Đạt Khách", "% Hoàn Thành Khách", "Tỷ Lệ Chốt"];
    const rows = window.currentPacingData.map(d => {
        const pctSO = d.t_so_td > 0 ? Math.round((d.a_so/d.t_so_td)*100) : 0;
        const pctTraf = d.t_traf_td > 0 ? Math.round((d.a_traf/d.t_traf_td)*100) : 0;
        return [d.area, d.shop_code, d.shop_name, d.t_so_m, d.pct_m_so, d.timePct, d.t_so_td, d.a_so, pctSO, d.t_traf_m, d.t_traf_td, d.a_traf, pctTraf, d.hit_rate];
    });
    const wb = XLSX.utils.book_new(); 
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Pacing");
    XLSX.writeFile(wb, `Pacing_${$('pacing_date').value}.xlsx`);
}

export const openDetailModal = (id) => {}