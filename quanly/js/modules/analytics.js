import { $, fmn, safeVal } from '../core/utils.js';
import { sb } from '../core/supabase.js';

let cachedProgressData = [];

export function initFilterChain() { 
    const directors = [...new Set(Object.values(window.globalAdminShopMap).map(s => s.director_name).filter(n => n))].sort();
    $('ana_director').innerHTML = `<option value="">-- 1. Chọn Giám Đốc --</option>` + directors.map(d => `<option value="${d}">${d}</option>`).join(''); 
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
        $('ana_sale').innerHTML = `<option value="">-- 2. Chọn Sale --</option>` + sales.map(s => `<option value="${s}">${s}</option>`).join(''); 
        $('ana_sale').value = "";
    } 
    if($('ana_sale').value) filtered = filtered.filter(s => s.sale_name === $('ana_sale').value); 
    if(level === 'director' || level === 'sale') { 
        const svns = [...new Set(filtered.map(s => s.svn_code).filter(n => n))].sort();
        $('ana_svn').innerHTML = `<option value="">-- 3. Chọn SVN --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join(''); 
        $('ana_svn').value = "";
    } 
    renderProgressTable();
}

export const resetFilters = () => { $('ana_director').value = ""; $('ana_search').value = ""; updateFilterChain('director'); }

export async function loadAnalyticsFull() {
    const month = $('ana_month').value; 
    if(!month) return alert("Vui lòng chọn tháng để xem tiến độ!");
    $('ana_loading').classList.remove('hidden'); 
    $('ana_content').classList.add('hidden');
    const startDate = `${month}-01`;
    const endDate = `${month}-31`;
    try {
        const [targetRes, soRes, mediaRes] = await Promise.all([
            sb.from('monthly_shop_targets').select('*').eq('report_month', month),
            sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', endDate),
            sb.from('media_reports').select('*').gte('report_date', startDate).lte('report_date', endDate)
        ]);
        const today = new Date();
        const selDate = new Date(month + "-01");
        const lastDayInMonth = new Date(selDate.getFullYear(), selDate.getMonth() + 1, 0).getDate();
        let daysPassed = lastDayInMonth;
        if (today.getFullYear() === selDate.getFullYear() && today.getMonth() === selDate.getMonth()) {
            daysPassed = today.getDate();
        }
        let timeRatio = daysPassed / lastDayInMonth;
        const shops = Object.values(window.globalAdminShopMap);
        cachedProgressData = shops.map(s => {
            const tgt = targetRes.data?.find(t => t.shop_code === s.shop_code) || {};
            const soShops = soRes.data?.filter(r => r.shop_code === s.shop_code) || [];
            const medShops = mediaRes.data?.filter(r => r.shop_code === s.shop_code) || [];
            const uniqueReportDays = [...new Set(soShops.map(r => r.report_date))].length;
            const reportCompliance = daysPassed > 0 ? Math.round((uniqueReportDays / daysPassed) * 100) : 0;
            const actSO = soShops.reduce((sum, r) => sum + safeVal(r.total_so), 0);
            const actTraf = soShops.reduce((sum, r) => sum + safeVal(r.traffic_natural) + safeVal(r.traffic_leads), 0);
            const actVideo = medShops.reduce((sum, r) => sum + safeVal(r.tiktok_videos), 0);
            const actLive = medShops.reduce((sum, r) => sum + safeVal(r.livestreams), 0);
            return {
                ...s, timeRatio, daysPassed, reportDays: uniqueReportDays, reportCompliance,
                targets: { so: tgt.target_so || 0, traffic: tgt.target_traffic || 0, video: tgt.target_video || 0, live: tgt.target_livestream || 0 },
                actuals: { so: actSO, traffic: actTraf, video: actVideo, live: actLive }
            };
        });
        $('ana_loading').classList.add('hidden'); 
        $('ana_content').classList.remove('hidden');
        renderProgressTable();
    } catch (err) { alert(err.message); $('ana_loading').classList.add('hidden'); }
}

function renderProgressTable() {
    const selDir = $('ana_director').value;
    const selSale = $('ana_sale').value;
    const selSVN = $('ana_svn').value;
    const kw = $('ana_search').value.toLowerCase().trim();
    const filtered = cachedProgressData.filter(d => {
        if(selDir && d.director_name !== selDir) return false;
        if(selSale && d.sale_name !== selSale) return false;
        if(selSVN && d.svn_code !== selSVN) return false;
        if(kw && !(d.shop_name.toLowerCase().includes(kw) || d.shop_code.toLowerCase().includes(kw))) return false;
        return true;
    });
    const totalTgt = filtered.reduce((s, d) => s + d.targets.so, 0);
    const totalAct = filtered.reduce((s, d) => s + d.actuals.so, 0);
    const avgCompletion = totalTgt > 0 ? Math.round((totalAct / totalTgt) * 100) : 0;
    if($('kpi_ana_target_so')) $('kpi_ana_target_so').innerText = fmn(totalTgt);
    if($('kpi_ana_so')) $('kpi_ana_so').innerText = fmn(totalAct);
    if($('kpi_ana_hitrate')) $('kpi_ana_hitrate').innerText = avgCompletion + "%";
    if($('kpi_ana_traffic')) $('kpi_ana_traffic').innerText = fmn(filtered.reduce((s, d) => s + d.actuals.traffic, 0));
    if($('kpi_ana_media')) $('kpi_ana_media').innerText = fmn(filtered.reduce((s, d) => s + d.actuals.video + d.actuals.live, 0));

    $('progressTableBody').innerHTML = filtered.map(d => {
        const soPct = d.targets.so > 0 ? Math.round((d.actuals.so / d.targets.so) * 100) : 0;
        const trafPct = d.targets.traffic > 0 ? Math.round((d.actuals.traffic / d.targets.traffic) * 100) : 0;
        const runRateRequired = Math.round(d.timeRatio * 100);
        const isAlert = (runRateRequired - soPct > 15) && d.targets.so > 0;
        const reportColor = d.reportCompliance >= 90 ? 'text-green-600' : (d.reportCompliance >= 70 ? 'text-orange-500' : 'text-red-600');
        return `
            <tr class="hover:bg-slate-50 border-b text-xs">
                <td class="p-4"><div class="font-bold text-slate-800">${d.shop_name}</div><div class="text-[10px] text-gray-400 font-mono">${d.shop_code}</div></td>
                <td class="p-4 text-center font-bold text-slate-500 bg-slate-50/50">${d.targets.so}</td>
                <td class="p-4 text-center font-black text-blue-700">${d.actuals.so}</td>
                <td class="p-4"><div class="flex items-center gap-2"><div class="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden shadow-inner"><div class="${isAlert ? 'bg-red-500' : 'bg-green-500'} h-full" style="width: ${Math.min(soPct, 100)}%"></div></div><span class="font-black ${isAlert ? 'text-red-600 animate-pulse' : 'text-slate-700'}">${soPct}%</span></div></td>
                <td class="p-4 bg-slate-50/50"><div class="font-black text-center ${reportColor}">${d.reportDays} <span class="text-gray-400 font-normal">/ ${d.daysPassed} ngày</span></div><div class="text-[10px] font-bold text-center mt-1 ${reportColor}">${d.reportCompliance}%</div></td>
                <td class="p-4"><div class="font-bold text-slate-700 text-center">${d.actuals.traffic} <span class="text-gray-400 font-normal">/ ${d.targets.traffic}</span></div><div class="flex items-center gap-2 mt-1"><div class="flex-1 bg-gray-200 rounded-full h-1.5 overflow-hidden"><div class="bg-indigo-500 h-full" style="width: ${Math.min(trafPct, 100)}%"></div></div><span class="text-[10px] font-black text-indigo-600">${trafPct}%</span></div></td>
                <td class="p-4 text-center"><div class="text-[10px] font-bold text-pink-600">Video: ${d.actuals.video}/${d.targets.video}</div><div class="text-[10px] font-bold text-purple-600">Live: ${d.actuals.live}h / ${d.targets.live}h</div></td>
                <td class="p-4 text-center">${isAlert ? '<span class="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase shadow-sm">⚠️ Chậm tiến độ</span>' : '<span class="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-black uppercase shadow-sm">✅ Ổn định</span>'}</td>
            </tr>`;
    }).join('');
}

export const exportAnalyticsExcel = () => { 
    if(cachedProgressData.length === 0) return alert("Vui lòng tải dữ liệu trước!");
    const header = [["Mã Shop", "Tên Shop", "Mục Tiêu S.O", "Thực Đạt S.O", "% Hoàn Thành S.O", "Kỷ Luật Báo Cáo (%)", "Thực Đạt Khách", "Mục Tiêu Khách", "Video Đã Gửi", "Live Đã Thực Hiện (Giờ)"]];
    const rows = cachedProgressData.map(d => [d.shop_code, d.shop_name, d.targets.so, d.actuals.so, d.targets.so > 0 ? Math.round((d.actuals.so/d.targets.so)*100) : 0, d.reportCompliance, d.actuals.traffic, d.targets.traffic, d.actuals.video, d.actuals.live]);
    const wb = XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([...header, ...rows]), "Tien_Do"); XLSX.writeFile(wb, `Bao_Cao_Tien_Do_${$('ana_month').value}.xlsx`);
}