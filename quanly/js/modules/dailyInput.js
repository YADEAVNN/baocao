import { $, fmn, safeVal } from '../core/utils.js';
import { sb } from '../core/supabase.js';
import { checkUserScopePermission } from './dashboard.js';

window.currentDailyInputData = [];

export async function loadDailyInputData() {
    let startDate = $('di_start_date').value;
    let endDate = $('di_end_date').value;

    // Nếu chưa chọn ngày, tự động tính tuần hiện tại làm mặc định
    if (!startDate || !endDate) {
        const today = new Date();
        let dayOfWeek = today.getDay(); 
        let distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        
        let monday = new Date(today);
        monday.setDate(today.getDate() + distanceToMonday);
        let sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);

        startDate = monday.toISOString().split('T')[0];
        endDate = sunday.toISOString().split('T')[0];
        
        $('di_start_date').value = startDate;
        $('di_end_date').value = endDate;
    }

    // Cập nhật dòng text hiển thị báo cáo đang chọn
    if($('week_label')) {
        if (startDate === endDate) {
            $('week_label').innerText = `Dữ liệu ngày ${startDate.split('-').reverse().join('/')}`;
        } else {
            $('week_label').innerText = `Tuần từ ${startDate.split('-').reverse().join('/')} đến ${endDate.split('-').reverse().join('/')}`;
        }
    }

    // Xử lý múi giờ Việt Nam (UTC+7) cho việc truy vấn dữ liệu CRM (được lưu bằng timestamp)
    const startOfDayUTC = new Date(`${startDate}T00:00:00+07:00`).toISOString();
    const endOfDayUTC = new Date(`${endDate}T23:59:59+07:00`).toISOString();

    try {
        // Lấy toàn bộ dữ liệu báo cáo trong khoảng thời gian (Từ ngày - Đến ngày)
        const [filteredSORes, filteredMediaRes, crmRes] = await Promise.all([
            sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', endDate),
            sb.from('media_reports').select('*').gte('report_date', startDate).lte('report_date', endDate),
            sb.from('crm_customers').select('shop_code').gte('created_at', startOfDayUTC).lte('created_at', endOfDayUTC)
        ]);

        const rangeReports = filteredSORes.data || [];
        const mediaReports = filteredMediaRes.data || [];
        const crmData = crmRes.data || []; 

        const shops = Object.values(window.globalAdminShopMap || {}).filter(s => checkUserScopePermission(s.shop_code));

        window.currentDailyInputData = shops.map(s => {
            const shopRangeReps = rangeReports.filter(r => r.shop_code === s.shop_code);
            const shopMediaReps = mediaReports.filter(r => r.shop_code === s.shop_code);
            
            // Tính tổng S.O và Traffic theo khoảng ngày
            const so = shopRangeReps.reduce((sum, r) => sum + safeVal(r.total_so), 0);
            const online_traffic = shopRangeReps.reduce((sum, r) => sum + safeVal(r.traffic_leads), 0);
            const offline_traffic = shopRangeReps.reduce((sum, r) => sum + safeVal(r.traffic_natural), 0);
            const total_traffic = online_traffic + offline_traffic;
            
            // Tính số lượng CRM và Media theo khoảng ngày
            const crm_count = crmData.filter(c => c.shop_code === s.shop_code).length;
            const video_count = shopMediaReps.reduce((sum, r) => sum + safeVal(r.tiktok_videos), 0);
            const live_hours = shopMediaReps.reduce((sum, r) => sum + safeVal(r.livestreams), 0);

            // Xác định xem có số liệu nào được nhập hay không
            const hasData = shopRangeReps.length > 0 || shopMediaReps.length > 0 || crm_count > 0;

            // Tỉ lệ chốt (Hit Rate) - Trả về #DIV/0! nếu tổng khách bằng 0
            const hit_rate = total_traffic > 0 ? ((so / total_traffic) * 100).toFixed(1) + '%' : (hasData ? '0.0%' : '#DIV/0!');

            return {
                shop_code: s.shop_code,
                shop_name: s.shop_name,
                hasData,
                so: hasData ? so : '',
                online_traffic: hasData ? online_traffic : '',
                offline_traffic: hasData ? offline_traffic : '',
                crm_count: hasData ? crm_count : '',
                video_count: hasData ? video_count : '',
                live_hours: hasData ? live_hours : '',
                hit_rate
            };
        });

        renderDailyInputTableFiltered();

    } catch (err) {
        console.error("Lỗi đồng bộ dữ liệu theo khoảng ngày:", err);
        alert("Không thể kết nối máy chủ để tải dữ liệu.");
    }
}

export function renderDailyInputTableFiltered() {
    const kw = $('di_search')?.value.toLowerCase().trim() || "";
    const tbody = $('dailyInputBody');
    if (!tbody) return;

    const filtered = window.currentDailyInputData.filter(d => {
        return d.shop_code.toLowerCase().includes(kw) || d.shop_name.toLowerCase().includes(kw);
    });

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="p-6 text-center text-gray-500 italic border">Không tìm thấy thông tin cửa hàng.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(d => {
        return `
            <tr class="hover:bg-slate-50 text-xs border">
                <td class="p-3 text-left border">
                    <div class="font-bold text-slate-800">${d.shop_name}</div>
                    <div class="text-[10px] text-gray-400 font-mono mt-0.5">${d.shop_code}</div>
                </td>
                <td class="p-2 border font-black ${d.so > 0 ? 'text-orange-600' : 'text-gray-400'}">${d.so}</td>
                <td class="p-2 border font-bold text-blue-700">${d.online_traffic}</td>
                <td class="p-2 border font-bold text-blue-700">${d.offline_traffic}</td>
                <td class="p-2 border font-bold text-purple-700">${d.crm_count}</td>
                <td class="p-2 border text-slate-500">${d.video_count}</td>
                <td class="p-2 border text-slate-500">${d.live_hours}</td>
                <td class="p-2 border font-bold ${d.hit_rate === '#DIV/0!' ? 'text-gray-400' : 'text-green-700'}">${d.hit_rate}</td>
            </tr>
        `;
    }).join('');
}

export function exportDailyInputExcel() {
    if (!window.currentDailyInputData || window.currentDailyInputData.length === 0) {
        return alert("Không có dữ liệu để xuất!");
    }

    const startDate = $('di_start_date').value;
    const endDate = $('di_end_date').value;

    const headerRow1 = [
        "Cửa Hàng (Mã DVN)", 
        "S.O", 
        "Lưu lượng khách", "", "", 
        "Vận hành online", "", 
        "Tỉ lệ chốt đơn"
    ];
    
    const headerRow2 = [
        "", "", 
        "Lượng khách online", "Lượng khách offline", "Lượng data thu thập",
        "Lượng video gửi", "Livestream", 
        ""
    ];

    const kw = $('di_search')?.value.toLowerCase().trim() || "";
    const filtered = window.currentDailyInputData.filter(d => 
        d.shop_code.toLowerCase().includes(kw) || d.shop_name.toLowerCase().includes(kw)
    );

    const rows = filtered.map(d => [
        `${d.shop_name} (${d.shop_code})`,
        d.so,
        d.online_traffic,
        d.offline_traffic,
        d.crm_count,
        d.video_count,
        d.live_hours,
        d.hit_rate
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([headerRow1, headerRow2, ...rows]);
    
    if(!ws['!merges']) ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 1, c: 0 } }); 
    ws['!merges'].push({ s: { r: 0, c: 1 }, e: { r: 1, c: 1 } }); 
    ws['!merges'].push({ s: { r: 0, c: 2 }, e: { r: 0, c: 4 } }); 
    ws['!merges'].push({ s: { r: 0, c: 5 }, e: { r: 0, c: 6 } }); 
    ws['!merges'].push({ s: { r: 0, c: 7 }, e: { r: 1, c: 7 } }); 

    let fileName = startDate === endDate ? `BaoCao_Ngay_${startDate}` : `BaoCao_Tu_${startDate}_Den_${endDate}`;

    XLSX.utils.book_append_sheet(wb, ws, "BaoCao");
    XLSX.writeFile(wb, `${fileName}_YADEA.xlsx`);
}