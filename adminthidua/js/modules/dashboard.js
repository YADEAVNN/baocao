import { $, fmn, safeVal, toggleModal } from '../core/utils.js';
import { sb } from '../core/supabase.js';

// KÍCH HOẠT PLUGIN HIỂN THỊ SỐ LIỆU TRÊN BIỂU ĐỒ (BẮT BUỘC)
if (typeof ChartDataLabels !== 'undefined') {
    Chart.register(ChartDataLabels);
}

let chartInstances = {};
let cachedSOReportsFiltered = []; 
let cachedSOReportsAll13M = [];   
let cachedMediaData = [];
window.currentPacingData = []; 

export function checkUserScopePermission(shopCode) {
    const user = window.currentUserProfile;
    if (!user || user.role === 'Admin') return true; 
    
    const shop = window.globalAdminShopMap[shopCode];
    if (!shop) return false;

    if (user.role === 'Cửa hàng') {
        return user.full_name === shopCode || user.email.toLowerCase().includes(shopCode.toLowerCase());
    }
    if (user.role === 'Sale') {
        return shop.sale_name && shop.sale_name.trim().toLowerCase() === user.full_name.trim().toLowerCase();
    }
    if (user.role === 'Giám Đốc') {
        return shop.director_name && shop.director_name.trim().toLowerCase() === user.full_name.trim().toLowerCase();
    }
    if (user.role === 'Giám đốc Miền') {
        return shop.regional_director && shop.regional_director.trim().toLowerCase() === user.full_name.trim().toLowerCase();
    }
    return false;
}

export function initDateFilters() {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    if($('f_date_end')) $('f_date_end').value = today.toISOString().split('T')[0];
    if($('f_date_start')) $('f_date_start').value = lastWeek.toISOString().split('T')[0];

    // Nạp danh sách Giám đốc Miền vào ô lọc đầu tiên
    if($('db_regional_director')) {
        const regionals = [...new Set(Object.values(window.globalAdminShopMap).filter(s => checkUserScopePermission(s.shop_code)).map(s => s.regional_director).filter(n => n))].sort();
        $('db_regional_director').innerHTML = `<option value="">-- Tất cả GĐ Miền --</option>` + regionals.map(r => `<option value="${r}">${r}</option>`).join('');
    }
    updateDashboardFilterChain('regional_director');
}

export const updateDashboardFilterChain = (level) => {
    let filtered = Object.values(window.globalAdminShopMap).filter(s => checkUserScopePermission(s.shop_code));
    
    const selRegion = $('db_regional_director')?.value;
    const selDir = $('db_director')?.value;
    const selSale = $('db_sale')?.value;
    const selSVN = $('db_svn')?.value;

    if(selRegion) filtered = filtered.filter(s => s.regional_director === selRegion);

    if(level === 'regional_director' && $('db_director')) {
        const directors = [...new Set(filtered.map(s => s.director_name).filter(n => n))].sort();
        $('db_director').innerHTML = `<option value="">-- Tất cả GĐ Vùng --</option>` + directors.map(d => `<option value="${d}">${d}</option>`).join('');
        $('db_director').value = "";
    }

    if(selDir) filtered = filtered.filter(s => s.director_name === selDir);

    if((level === 'regional_director' || level === 'director') && $('db_sale')) {
        const sales = [...new Set(filtered.map(s => s.sale_name).filter(n => n))].sort();
        $('db_sale').innerHTML = `<option value="">-- Tất cả Sale --</option>` + sales.map(s => `<option value="${s}">${s}</option>`).join('');
        $('db_sale').value = "";
    }

    if(selSale) filtered = filtered.filter(s => s.sale_name === selSale);

    if((level === 'regional_director' || level === 'director' || level === 'sale') && $('db_svn')) {
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
    if($('db_regional_director')) $('db_regional_director').value = "";
    if($('db_director')) $('db_director').value = "";
    if($('db_sale')) $('db_sale').value = "";
    if($('db_svn')) $('db_svn').value = "";
    if($('db_dvn')) $('db_dvn').value = "";
    initDateFilters(); 
    loadDashboardSO(); 
}

function renderChart(type, id, data, options = {}) { 
    const canvas = $(id);
    if (!canvas) return;
    const ctx = canvas.getContext('2d'); 
    if(chartInstances[id]) chartInstances[id].destroy();

    const isHorizontal = options.indexAxis === 'y';
    const customPlugins = options.plugins || {};

    const mergedPlugins = {
        legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } }, ...(customPlugins.legend || {}) },
        datalabels: { 
            display: function(context) {
                if (context.dataset.type === 'line') return false; 
                return context.dataset.data[context.dataIndex] > 0; 
            },
            color: type === 'doughnut' ? '#ffffff' : '#475569',
            anchor: type === 'doughnut' ? 'center' : 'end',
            align: type === 'doughnut' ? 'center' : (isHorizontal ? 'right' : 'top'),
            font: { weight: 'bold', size: 11 },
            formatter: (value) => fmn(value), 
            ...(customPlugins.datalabels || {})
        } 
    };

    const finalOptions = { ...options };
    delete finalOptions.plugins;

    chartInstances[id] = new Chart(ctx, { 
        type, 
        data, 
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            layout: {
                padding: { 
                    top: type === 'bar' && !isHorizontal ? 25 : 0, 
                    right: isHorizontal ? 35 : 0 
                }
            },
            plugins: mergedPlugins,
            ...finalOptions 
        } 
    });
}

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
        alert("Không thể tải dữ liệu Dashboard.");
    }
}

function applyDashboardFilters() {
    const start = $('f_date_start').value;
    const end = $('f_date_end').value;
    const selRegion = $('db_regional_director')?.value;
    const selDir = $('db_director')?.value;
    const selSale = $('db_sale')?.value;
    const selSVN = $('db_svn')?.value;
    const selDVN = $('db_dvn')?.value;

    const filterFn = (r) => {
        if (!checkUserScopePermission(r.shop_code)) return false;
        const shop = window.globalAdminShopMap[r.shop_code] || {};
        if(selRegion && shop.regional_director !== selRegion) return false;
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
    
    let soByMonth = months13.map(m => cachedSOReportsAll13M.filter(filterFn).filter(r => r.report_date.startsWith(m)).reduce((s, r) => s + safeVal(r.total_so), 0));
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
            { type: 'line', label: '% Tăng trưởng MoM', data: data12MPct, borderColor: '#10b981', backgroundColor: '#10b981', borderWidth: 2, tension: 0.1, yAxisID: 'y1' }
        ]
    }, {
        scales: { y: { type: 'linear', position: 'left' }, y1: { type: 'linear', position: 'right', grid: { drawOnChartArea: false } } }
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
    });

    const shopSO = {};
    fSO.forEach(r => { shopSO[r.shop_code] = (shopSO[r.shop_code] || 0) + safeVal(r.total_so); });
    const topShops = Object.entries(shopSO).sort((a,b) => b[1] - a[1]).slice(0, 5);
    
    const formatShopName = (code) => {
        let name = window.globalAdminShopMap[code]?.shop_name || code;
        return name.replace(/Yadea Shop /gi, '').trim(); 
    };

    renderChart('bar', 'chart_db_top_shop', {
        labels: topShops.map(s => formatShopName(s[0])),
        datasets: [{ label: 'Xe (S.O)', data: topShops.map(s => s[1]), backgroundColor: '#F97316', borderRadius: 4 }]
    }, { indexAxis: 'y' }); 

    const mediaCompareData = topShops.map(s => {
        const c = s[0]; const so = s[1];
        const med = fMedia.filter(r => r.shop_code === c).reduce((sum, r) => sum + safeVal(r.livestreams) + safeVal(r.tiktok_videos), 0);
        return { code: c, name: formatShopName(c), so, med };
    });
    
    renderChart('bar', 'chart_db_media', {
        labels: mediaCompareData.map(d => d.name),
        datasets: [ { label: 'Sản lượng S.O', data: mediaCompareData.map(d => d.so), backgroundColor: '#F97316' }, { label: 'Cường độ Media', data: mediaCompareData.map(d => d.med), backgroundColor: '#8b5cf6' } ]
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

export function exportDashboardExcel() {
    if(!cachedSOReportsFiltered.length) return alert("Không có dữ liệu để xuất!");
    const header = ["Ngày", "Mã DVN", "Tên Shop", "Khu Vực", "Giám Đốc Vùng", "Sale", "Tổng Khách", "Khách Tự Nhiên", "Khách Khai Thác", "Tổng S.O", "Doanh Thu"];
    const rows = cachedSOReportsFiltered.map(r => {
        const shop = window.globalAdminShopMap[r.shop_code] || {};
        return [r.report_date, r.shop_code, shop.shop_name, shop.area, shop.director_name, shop.sale_name, safeVal(r.traffic_natural)+safeVal(r.traffic_leads), r.traffic_natural, r.traffic_leads, r.total_so, r.calculated_revenue];
    });
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, ws, "SO_Report");
    XLSX.writeFile(wb, `BaoCao_TongQuan_${$('f_date_start').value}.xlsx`);
}

// ==========================================
// PACING ENGINE REPORT - ĐÃ CẬP NHẬT TÍNH THEO KHOẢNG NGÀY
// ==========================================
export async function loadPacingReport() {
    const startDate = $('pacing_start_date').value;
    const endDate = $('pacing_date').value;
    
    if(!startDate || !endDate) return alert("Vui lòng chọn đầy đủ khoảng thời gian (Từ ngày - Đến ngày)!");

    $('pacingBody').innerHTML = `<tr><td colspan="14" class="p-6 text-center text-orange-500 font-bold"><i class="fa-solid fa-circle-notch fa-spin"></i> Đang tính toán dữ liệu tiến độ chuỗi...</td></tr>`;
    window.currentPacingData = []; 

    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    
    // Target sẽ được chốt theo tháng của Ngày kết thúc (endDate)
    const monthStr = `${endObj.getFullYear()}-${String(endObj.getMonth() + 1).padStart(2, '0')}`;
    const totalDaysInMonth = new Date(endObj.getFullYear(), endObj.getMonth() + 1, 0).getDate();

    // Tính toán số ngày trong khoảng thời gian user chọn
    const timeDiff = endObj.getTime() - startObj.getTime();
    const daysInRange = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 để bao gồm cả ngày bắt đầu
    
    // Tỷ lệ Tiến độ Thời Gian = Số ngày chọn / Tổng ngày trong tháng
    const ratio = daysInRange / totalDaysInMonth; 

    try {
        const [targetRes, soRes] = await Promise.all([
            sb.from('monthly_shop_targets').select('*').eq('report_month', monthStr),
            sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', endDate) // Chọc data từ startDate đến endDate
        ]);

        const targets = targetRes.data || [];
        const actualsByShop = {};
        
        (soRes.data || []).forEach(r => {
            const sc = r.shop_code;
            if(!actualsByShop[sc]) actualsByShop[sc] = { so: 0, traffic: 0 };
            actualsByShop[sc].so += safeVal(r.total_so);
            actualsByShop[sc].traffic += (safeVal(r.traffic_natural) + safeVal(r.traffic_leads));
        });

        const shops = Object.values(window.globalAdminShopMap || {}).filter(s => checkUserScopePermission(s.shop_code)).sort((a,b) => (a.area||'').localeCompare(b.area||''));
        
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
                hit_rate: a.traffic > 0 ? Math.round((a.so/a.traffic)*100) : 0, t_traf_m 
            };
        });

        initPacingFilters();
        renderPacingTableFiltered();

    } catch (err) { console.error(err); }
}

export function initPacingFilters() {
    if($('pc_regional_director') && $('pc_regional_director').options.length <= 1) {
        const regionals = [...new Set(Object.values(window.globalAdminShopMap || {}).filter(s => checkUserScopePermission(s.shop_code)).map(s => s.regional_director).filter(n => n))].sort();
        $('pc_regional_director').innerHTML = `<option value="">-- Tất cả GĐ Miền --</option>` + regionals.map(r => `<option value="${r}">${r}</option>`).join('');
    }
}

export function updatePacingFilterChain(level) {
    let filtered = Object.values(window.globalAdminShopMap || {}).filter(s => checkUserScopePermission(s.shop_code));
    const selRegion = $('pc_regional_director')?.value;
    const selDir = $('pc_director')?.value;

    if(selRegion) filtered = filtered.filter(s => s.regional_director === selRegion);

    if(level === 'regional_director' && $('pc_director')) {
        const directors = [...new Set(filtered.map(s => s.director_name).filter(n => n))].sort();
        $('pc_director').innerHTML = `<option value="">-- Tất cả GĐ Vùng --</option>` + directors.map(d => `<option value="${d}">${d}</option>`).join('');
        $('pc_director').value = "";
    }

    if(selDir) filtered = filtered.filter(s => s.director_name === selDir);

    if((level === 'regional_director' || level === 'director') && $('pc_sale')) {
        const sales = [...new Set(filtered.map(s => s.sale_name).filter(n => n))].sort();
        $('pc_sale').innerHTML = `<option value="">-- Tất cả Sale --</option>` + sales.map(s => `<option value="${s}">${s}</option>`).join('');
        $('pc_sale').value = "";
    }
    renderPacingTableFiltered();
}

export function resetPacingFilters() {
    if($('pc_regional_director')) $('pc_regional_director').value = "";
    if($('pc_director')) $('pc_director').value = "";
    if($('pc_sale')) $('pc_sale').value = "";
    if($('pc_search')) $('pc_search').value = "";
    updatePacingFilterChain('regional_director');
}

export function renderPacingTableFiltered() {
    if (!window.currentPacingData || window.currentPacingData.length === 0) {
        $('pacingBody').innerHTML = `<tr><td colspan="14" class="p-6 text-gray-500 italic text-center">Vui lòng chọn ngày và bấm "Tải Báo Cáo"</td></tr>`;
        return;
    }
    
    const selRegion = $('pc_regional_director')?.value;
    const selDir = $('pc_director')?.value;
    const selSale = $('pc_sale')?.value;
    const kw = $('pc_search')?.value.toLowerCase().trim();
    
    const filteredData = window.currentPacingData.filter(d => {
        const m = window.globalAdminShopMap[d.shop_code] || {};
        if (selRegion && m.regional_director !== selRegion) return false;
        if (selDir && m.director_name !== selDir) return false;
        if (selSale && m.sale_name !== selSale) return false;
        if (kw && !((d.shop_name || '').toLowerCase().includes(kw) || (d.shop_code || '').toLowerCase().includes(kw))) return false;
        return true;
    });

    if (filteredData.length === 0) {
        $('pacingBody').innerHTML = `<tr><td colspan="14" class="p-6 text-gray-500 italic text-center">Không có shop nào phù hợp điều kiện lọc.</td></tr>`;
        return;
    }

    $('pacingBody').innerHTML = filteredData.map(d => {
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
}

export function exportPacingExcel() {
    if (!window.currentPacingData.length) return alert("Bấm 'Tải Báo Cáo' trước!");
    
    const startDate = $('pacing_start_date').value;
    const endDate = $('pacing_date').value;

    const header = ["Khu Vực", "Mã Shop", "Tên Shop", "Target Tháng", "% Đạt Tháng", "Tiến Độ TG", "Mục Tiêu Chọn", "Thực Đạt Nay", "% Hoàn Thành S.O", "Target Khách", "Mục Tiêu Khách", "Thực Đạt Khách", "% Hoàn Thành Khách", "Tỷ Lệ Chốt"];
    const rows = window.currentPacingData.map(d => {
        const pctSO = d.t_so_td > 0 ? Math.round((d.a_so/d.t_so_td)*100) : 0;
        const pctTraf = d.t_traf_td > 0 ? Math.round((d.a_traf/d.t_traf_td)*100) : 0;
        return [d.area, d.shop_code, d.shop_name, d.t_so_m, d.pct_m_so, d.timePct, d.t_so_td, d.a_so, pctSO, d.t_traf_m, d.t_traf_td, d.a_traf, pctTraf, d.hit_rate];
    });
    const wb = XLSX.utils.book_new(); 
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "Pacing");
    XLSX.writeFile(wb, `Pacing_${startDate}_den_${endDate}.xlsx`);
}

export const openDetailModal = (id) => {}