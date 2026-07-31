import { $, safeVal } from '../core/utils.js';
import { sb } from '../core/supabase.js';

let currentPj50Data = [];
let lastRenderedPj50Data = [];
window.pj50FiltersInitialized = false;

// HÀM TẠO CHẨN ĐOÁN VÀ HÀNH ĐỘNG DỰA TRÊN SỐ LIỆU
function generateDiagnosticMessage(soBaoCao, liveHours, videoViews, score3824) {
    let messages = [];

    if (soBaoCao < 37) {
        messages.push(`🚨 S.O: Thiếu ${37 - soBaoCao} xe đạt mốc 37. Cần đẩy mạnh chốt khách.`);
    }
    if (liveHours < 16) {
        messages.push(`📹 LIVE: Đạt ${liveHours}h (thiếu ${16 - liveHours}h). Đề xuất tăng ca Live kéo 10đ thưởng.`);
    }
    if (videoViews < 50000) {
        messages.push(`📱 VIDEO: View thấp. Đề xuất quay thêm clip review gửi lên kênh.`);
    }
    if (score3824 < 80) {
        messages.push(`🧹 3824: Điểm thấp (${score3824}đ). Yêu cầu dọn dẹp, sắp xếp lại xe và nộp ảnh Before/After.`);
    }
    if (messages.length === 0) {
        return "🌟 XUẤT SẮC: Duy trì phong độ. Đề nghị quay 1 video phỏng vấn chủ shop làm Case-Study nộp Group.";
    }

    return messages.join('\n');
}

export function initPj50Filters() {
    const shops = Object.values(window.globalAdminShopMap || {}).filter(s => s.is_project_50);
    const regDirs = [...new Set(shops.map(s => s.regional_director).filter(n => n))].sort();
    if($('pj50_regional_director')) {
        $('pj50_regional_director').innerHTML = `<option value="">-- Tất cả GĐ Miền --</option>` + regDirs.map(d => `<option value="${d}">${d}</option>`).join('');
        updatePj50FilterChain('regional_director');
    }
}

export function updatePj50FilterChain(level) {
    const regDir = $('pj50_regional_director') ? $('pj50_regional_director').value : '';
    const dir = $('pj50_director') ? $('pj50_director').value : '';
    const sale = $('pj50_sale') ? $('pj50_sale').value : '';
    const svn = $('pj50_svn') ? $('pj50_svn').value : '';

    let filteredShops = Object.values(window.globalAdminShopMap || {}).filter(s => s.is_project_50);

    if (regDir) filteredShops = filteredShops.filter(s => s.regional_director === regDir);

    if (level === 'regional_director') {
        const dirs = [...new Set(filteredShops.map(s => s.director_name).filter(n => n))].sort();
        if($('pj50_director')) {
            $('pj50_director').innerHTML = `<option value="">-- Tất cả GĐ Vùng --</option>` + dirs.map(d => `<option value="${d}">${d}</option>`).join('');
            $('pj50_director').value = "";
        }
    }
    if ($('pj50_director') && $('pj50_director').value) filteredShops = filteredShops.filter(s => s.director_name === $('pj50_director').value);

    if (level === 'regional_director' || level === 'director') {
        const sales = [...new Set(filteredShops.map(s => s.sale_name).filter(n => n))].sort();
        if($('pj50_sale')) {
            $('pj50_sale').innerHTML = `<option value="">-- Tất cả Sale --</option>` + sales.map(s => `<option value="${s}">${s}</option>`).join('');
            $('pj50_sale').value = "";
        }
    }
    if ($('pj50_sale') && $('pj50_sale').value) filteredShops = filteredShops.filter(s => s.sale_name === $('pj50_sale').value);

    if (level === 'regional_director' || level === 'director' || level === 'sale') {
        const svns = [...new Set(filteredShops.map(s => s.svn_code).filter(n => n))].sort();
        if($('pj50_svn')) {
            $('pj50_svn').innerHTML = `<option value="">-- Tất cả SVN --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join('');
            $('pj50_svn').value = "";
        }
    }
    if ($('pj50_svn') && $('pj50_svn').value) filteredShops = filteredShops.filter(s => s.svn_code === $('pj50_svn').value);

    if (level === 'regional_director' || level === 'director' || level === 'sale' || level === 'svn') {
        const dvns = [...new Set(filteredShops.map(s => s.shop_code).filter(n => n))].sort();
        if($('pj50_dvn')) {
            $('pj50_dvn').innerHTML = `<option value="">-- Tất cả Shop --</option>` + dvns.map(s => {
                const shopName = window.globalAdminShopMap[s]?.shop_name || s;
                return `<option value="${s}">${shopName}</option>`;
            }).join('');
            $('pj50_dvn').value = "";
        }
    }

    renderDashboard();
}
window.updatePj50FilterChain = updatePj50FilterChain;

export function resetPj50Filters() {
    if($('pj50_regional_director')) $('pj50_regional_director').value = "";
    updatePj50FilterChain('regional_director');
}
window.resetPj50Filters = resetPj50Filters;

export async function loadProject50Data() {
    let month = $('pj50_month').value;
    if (!month) {
        const d = new Date();
        month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        $('pj50_month').value = month;
    }

    const [yyyy, mm] = month.split('-');
    const lastDayThisMonth = new Date(yyyy, parseInt(mm), 0).getDate();
    const startDate = `${month}-01`;
    const endDate = `${month}-${String(lastDayThisMonth).padStart(2, '0')}`;

    try {
        const projectShops = Object.values(window.globalAdminShopMap || {}).filter(s => s.is_project_50 === true);
        if (projectShops.length === 0) {
            $('pj50TableBody').innerHTML = `<tr><td colspan="10" class="p-6 text-center text-red-500 font-bold">Chưa có cửa hàng nào thuộc Dự án 50.</td></tr>`;
            return;
        }

        const shopCodes = projectShops.map(s => s.shop_code);

        // 1. Lấy dữ liệu Target Tháng
        const { data: targets } = await sb.from('monthly_shop_targets')
            .select('*')
            .eq('report_month', month)
            .in('shop_code', shopCodes);

        // 2. Vòng lặp lấy S.O Báo Cáo
        let dailySoData = [];
        let fromSo = 0;
        while(true) {
            const { data } = await sb.from('daily_so_reports')
                .select('shop_code, total_so')
                .gte('report_date', startDate)
                .lte('report_date', endDate)
                .in('shop_code', shopCodes)
                .range(fromSo, fromSo + 999);
            
            if(data && data.length > 0) dailySoData.push(...data);
            if(!data || data.length < 1000) break;
            fromSo += 1000;
        }

        // 3. Vòng lặp lấy Media
        let mediaData = [];
        let fromMedia = 0;
        while(true) {
            const { data } = await sb.from('media_reports')
                .select('*')
                .gte('report_date', startDate)
                .lte('report_date', endDate)
                .in('shop_code', shopCodes)
                .range(fromMedia, fromMedia + 999);
            
            if(data && data.length > 0) mediaData.push(...data);
            if(!data || data.length < 1000) break;
            fromMedia += 1000;
        }

        // 4. Gom nhóm S.O Báo cáo hàng ngày
        const reportedSoMap = {};
        dailySoData.forEach(r => {
            if (!reportedSoMap[r.shop_code]) reportedSoMap[r.shop_code] = 0;
            reportedSoMap[r.shop_code] += (parseInt(r.total_so) || 0);
        });

        currentPj50Data = projectShops.map(shop => {
            const tgt = (targets || []).find(t => t.shop_code === shop.shop_code) || {};
            const medShops = mediaData.filter(r => r.shop_code === shop.shop_code);

            // BẮT ĐẦU ĐOẠN ĐÃ SỬA LỖI ĐỂ NHẬN ĐÚNG CỘT TIKTOK_VIEWS VÀ DẤU CHẤM PHẨY
            const actLive = medShops.reduce((sum, r) => {
                let rawLive = r.livestreams || r.livestream || 0;
                return sum + (parseFloat(String(rawLive).replace(/,/g, '.')) || 0);
            }, 0);

            const actViews = medShops.reduce((sum, r) => {
                let rawView = r.tiktok_views || 0; 
                let cleanView = parseInt(String(rawView).replace(/[,.]/g, ''), 10) || 0;
                return sum + cleanView;
            }, 0);
            // KẾT THÚC ĐOẠN ĐÃ SỬA LỖI
            
            const reportedSO = reportedSoMap[shop.shop_code] || 0;
            const officialSO = tgt.official_so_this_year !== null && tgt.official_so_this_year !== undefined ? safeVal(tgt.official_so_this_year) : 0;
            const lastYearSO = tgt.official_so_last_year !== null && tgt.official_so_last_year !== undefined ? safeVal(tgt.official_so_last_year) : 0;

            const score3824 = safeVal(tgt.score_3824); 

            const bonusViews = actViews >= 50000 ? 10 : 0;
            const bonusLive = actLive >= 16 ? 10 : 0;
            const totalBonus = bonusViews + bonusLive;

            return {
                ...shop,
                reportedSO, officialSO, lastYearSO,
                score3824, actViews, actLive,
                bonusViews, bonusLive, totalBonus
            };
        });

        if (!window.pj50FiltersInitialized) {
            initPj50Filters();
            window.pj50FiltersInitialized = true;
        } else {
            renderDashboard();
        }
    } catch (error) {
        console.error(error);
        alert("Lỗi tải dữ liệu Dự án 50!");
    }
}

export function renderDashboard() {
    const regDir = $('pj50_regional_director') ? $('pj50_regional_director').value : '';
    const dir = $('pj50_director') ? $('pj50_director').value : '';
    const sale = $('pj50_sale') ? $('pj50_sale').value : '';
    const svn = $('pj50_svn') ? $('pj50_svn').value : '';
    const dvn = $('pj50_dvn') ? $('pj50_dvn').value : '';

    let filteredBaseData = currentPj50Data;

    if (regDir) filteredBaseData = filteredBaseData.filter(d => d.regional_director === regDir);
    if (dir) filteredBaseData = filteredBaseData.filter(d => d.director_name === dir);
    if (sale) filteredBaseData = filteredBaseData.filter(d => d.sale_name === sale);
    if (svn) filteredBaseData = filteredBaseData.filter(d => d.svn_code === svn);
    if (dvn) filteredBaseData = filteredBaseData.filter(d => d.shop_code === dvn);

    const calcMode = $('pj50_calc_mode') ? $('pj50_calc_mode').value : 'official';
    let totalSONow = 0, totalSOLast = 0, countQualified = 0;

    const displayData = filteredBaseData.map(d => {
        const actSO = calcMode === 'official' ? d.officialSO : d.reportedSO;
        
        let actualGrowthRate = 0;
        let isNewShop = false;

        if (d.lastYearSO > 0) {
            actualGrowthRate = actSO / d.lastYearSO;
        } else {
            isNewShop = true;
            actualGrowthRate = actSO / 37; 
        }

        let growthRate = actualGrowthRate;
        if (growthRate > 1.5) {
            growthRate = 1.5;
        }

        const actualGrowthPct = Math.round(actualGrowthRate * 100);
        const cappedGrowthPct = Math.round(growthRate * 100);
        
        const scoreSO = growthRate * 100 * 0.6; 
        const finalScore = scoreSO + (d.score3824 * 0.4) + d.totalBonus;
        const isQualified = actSO >= 37;

        return {
            ...d, actSO, actualGrowthPct, cappedGrowthPct, isNewShop, finalScore: parseFloat(finalScore.toFixed(1)), isQualified
        };
    });

    displayData.forEach(d => {
        totalSONow += d.actSO;
        totalSOLast += d.lastYearSO;
        if (d.isQualified) countQualified++;
    });

    if($('kpi_pj50_count')) $('kpi_pj50_count').innerHTML = `${displayData.length}<span class="text-sm text-gray-400 font-medium">/50</span>`;
    if($('kpi_pj50_so_now')) $('kpi_pj50_so_now').innerText = totalSONow;
    if($('kpi_pj50_so_last')) $('kpi_pj50_so_last').innerText = totalSOLast;
    if($('kpi_pj50_qualified')) $('kpi_pj50_qualified').innerText = countQualified;
    if($('kpi_label_so_now')) $('kpi_label_so_now').innerText = calcMode === 'official' ? 'Tổng S.O Kích Hoạt (Đã Lọc)' : 'Tổng S.O Báo Cáo (Đã Lọc)';

    displayData.sort((a,b) => b.finalScore - a.finalScore);
    lastRenderedPj50Data = displayData;

    if (displayData.length === 0) {
        $('pj50TableBody').innerHTML = `<tr><td colspan="10" class="p-6 text-center text-gray-500 italic">Không tìm thấy cửa hàng nào khớp với điều kiện lọc.</td></tr>`;
        return;
    }

    $('pj50TableBody').innerHTML = displayData.map((d, index) => {
        let rankHtml = `<span class="text-gray-400 font-mono font-bold w-6 inline-block">${index + 1}.</span>`;
        if (index === 0) rankHtml = `🥇`;
        if (index === 1) rankHtml = `🥈`;
        if (index === 2) rankHtml = `🥉`;

        const alertHtml = d.isQualified ? '' : `<div class="text-[9px] font-black bg-red-100 text-red-600 inline-block px-1 rounded mt-1">CẢNH BÁO: < 37 XE</div>`;
        const bgReported = calcMode === 'reported' ? 'bg-orange-100/50' : 'bg-orange-50/20';
        const bgOfficial = calcMode === 'official' ? 'bg-blue-100/50' : 'bg-blue-50/20';

        let pctNoteHtml = '';
        if (d.actualGrowthPct > 150) {
            pctNoteHtml += `<div class="text-[9px] text-gray-500 font-bold mt-1">Thực tế: ${d.actualGrowthPct}%<br/>(Đã áp trần 150%)</div>`;
        }
        if (d.isNewShop) {
            pctNoteHtml += `<div class="text-[9px] text-blue-500 font-bold mt-1">Dùng mốc 37 xe</div>`;
        }
        
        // Gọi hàm tự động chẩn đoán
        const diagnosticMsg = generateDiagnosticMessage(d.actSO, d.actLive, d.actViews, d.score3824);

        return `
            <tr class="border-b hover:bg-slate-50 transition-colors">
                <td class="px-3 py-2 border-r whitespace-nowrap">
                    <div class="font-bold text-slate-800 flex items-center gap-1.5 text-[13px]">${rankHtml} ${d.shop_name}</div>
                    <div class="text-[9px] text-gray-500 font-bold mt-0.5 ml-6"><i class="fa-solid fa-user-tie"></i> ${d.director_name || 'N/A'} - ${d.shop_code}</div>
                    <div class="ml-6">${alertHtml}</div>
                </td>
                <td class="px-2 py-2 border-r text-center bg-gray-50 text-gray-600 font-bold text-[13px]">${d.lastYearSO}</td>
                
                <td class="px-2 py-2 border-r text-center font-bold text-orange-600 text-[14px] ${bgReported}">${d.reportedSO}</td>
                <td class="px-2 py-2 border-r text-center font-black text-blue-700 text-[14px] ${bgOfficial}">${d.officialSO}</td>
                
                <td class="px-2 py-2 border-r text-center bg-green-50/20">
                    <div class="font-black text-green-700 text-[13px]">${d.cappedGrowthPct}%</div>
                    ${pctNoteHtml}
                </td>
                
                <td class="px-2 py-2 border-r text-center bg-yellow-50/20">
                    <div class="text-[13px] font-black text-yellow-700">${d.score3824}</div>
                </td>
                
                <td class="px-2 py-2 border-r text-center bg-pink-50/20">
                    <div class="text-[13px] font-bold text-pink-700">${d.actViews}</div>
                    ${d.bonusViews > 0 ? '<div class="text-[9px] font-black text-green-600 mt-0.5">+10đ</div>' : ''}
                </td>

                <td class="px-2 py-2 border-r text-center bg-purple-50/20 font-bold text-purple-700 text-[13px]">
                    ${d.actLive}h
                    ${d.bonusLive > 0 ? '<div class="text-[9px] font-black text-green-600 mt-0.5">+10đ</div>' : ''}
                </td>
                
                <td class="px-3 py-2 border-r text-center bg-slate-800">
                    <div class="font-black text-yellow-400 text-lg">${d.finalScore}</div>
                </td>
                
                <td class="px-3 py-2 bg-red-50/10">
                    <div class="text-[11px] font-medium text-slate-700 whitespace-pre-wrap leading-tight max-w-[280px]">${diagnosticMsg}</div>
                </td>
            </tr>`;
    }).join('');
}
window.renderDashboard = renderDashboard;

export function exportProject50Excel() {
    if (!lastRenderedPj50Data || lastRenderedPj50Data.length === 0) return alert("Không có dữ liệu để xuất!");
    
    // Bổ sung tiêu đề cột vào file Excel
    const header = [
        "Tên Shop", "Mã DVN", "GĐ Vùng", "S.O Cùng Kỳ", "S.O Báo Cáo Tuần", 
        "S.O Kích Hoạt Tháng", "% Tăng Trưởng (Đã áp trần)", "Điểm 3824", 
        "Lượt Xem Video", "Giờ Livestream", "Tổng Điểm", "Đạt Mức 37 Xe", 
        "Chẩn Đoán & Hành Động (Gửi Sale)"
    ];
    
    const rows = lastRenderedPj50Data.map(d => {
        // Gọi hàm phân tích khi xuất Excel
        const diagnosticMsg = generateDiagnosticMessage(d.actSO, d.actLive, d.actViews, d.score3824);
        
        return [
            d.shop_name, d.shop_code, d.director_name, 
            d.lastYearSO, d.reportedSO, d.officialSO, d.cappedGrowthPct, 
            d.score3824, d.actViews, d.actLive, d.finalScore, 
            d.isQualified ? 'ĐẠT' : 'KHÔNG ĐẠT',
            diagnosticMsg
        ];
    });
    
    const wb = XLSX.utils.book_new(); 
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([header, ...rows]), "XepHang_ThiDua");
    XLSX.writeFile(wb, `BaoCao_XepHang_DuAn50_${$('pj50_month').value}.xlsx`);
}