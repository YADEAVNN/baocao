import { STATE } from './config.js';
import { fmn, parseNumber, safeVal, calcKPI } from './utils.js';
import { loadOverviewDashboard, loadTargetDashboard } from './charts.js';
import { api_loadSaleHistory, api_submitReport, api_deleteReport, api_getReportById, api_loadMonthlyModels } from './api.js';

export function switchView(view) {
    ['view-sales', 'view-costs', 'view-history', 'view-charts', 'view-media'].forEach(v => {
        const el = document.getElementById(v);
        if(el) el.classList.add('hidden');
    });
    ['nav-sales', 'nav-costs', 'nav-history', 'nav-charts', 'nav-media'].forEach(n => {
        const el = document.getElementById(n);
        if(el) el.classList.remove('active');
    });
    const targetView = document.getElementById(`view-${view}`);
    const targetNav = document.getElementById(`nav-${view}`);
    if (targetView) targetView.classList.remove('hidden');
    if (targetNav) targetNav.classList.add('active');
    if (window.innerWidth < 768) toggleSidebar();
    
    if (view === 'history') {
        updateHistoryFilters('init');
        api_loadSaleHistory();
    }
    if (view === 'charts') { loadOverviewDashboard(); }
}

export function toggleSidebar() { 
    const sidebar = document.getElementById('sidebarMobile');
    if(sidebar) sidebar.classList.toggle('-translate-x-full'); 
}

export function ui_showMsg(txt, color) { 
    const el = document.getElementById('msg'); 
    if(el) { el.className = `text-center text-xs font-bold mt-4 h-5 text-${color}-500`; el.innerText = txt; } 
}

export function updateHistoryFilters(level) {
    const dir = document.getElementById('history_filter_director')?.value || '';
    const sale = document.getElementById('history_filter_sale')?.value || '';
    const svn = document.getElementById('history_filter_svn')?.value || '';

    let shops = STATE.globalAssignedShops;
    const role = STATE.currentUser?.role;

    if (level === 'init') {
        let directors = [...new Set(shops.map(x => x.director_name).filter(Boolean))].sort();
        const dirEl = document.getElementById('history_filter_director');
        if(dirEl) {
            dirEl.innerHTML = `<option value="">-- 1. Tất cả GĐ --</option>` + directors.map(x => `<option value="${x}">${x}</option>`).join('');
            if (directors.length <= 1 && role !== 'Admin') dirEl.classList.add('hidden');
            else dirEl.classList.remove('hidden');
        }
    }

    if (level === 'init' || level === 'director') {
        let sales = [...new Set(shops.filter(x => !dir || x.director_name === dir).map(x => x.sale_name).filter(Boolean))].sort();
        const saleEl = document.getElementById('history_filter_sale');
        if(saleEl) {
            saleEl.innerHTML = `<option value="">-- 2. Tất cả Sale --</option>` + sales.map(x => `<option value="${x}">${x}</option>`).join('');
            if(level === 'director') saleEl.value = '';
            if (sales.length <= 1 && role !== 'Admin' && role !== 'Giám Đốc') saleEl.classList.add('hidden');
            else saleEl.classList.remove('hidden');
        }
    }

    if (level === 'init' || level === 'director' || level === 'sale') {
        let svns = [...new Set(shops.filter(x => (!dir || x.director_name === dir) && (!sale || x.sale_name === sale)).map(x => x.svn_code).filter(Boolean))].sort();
        const svnEl = document.getElementById('history_filter_svn');
        if(svnEl) {
            svnEl.innerHTML = `<option value="">-- 3. Tất cả SVN --</option>` + svns.map(x => `<option value="${x}">${x}</option>`).join('');
            if(level !== 'init') svnEl.value = '';
            if (svns.length <= 1 && role === 'Cửa hàng') svnEl.classList.add('hidden');
            else svnEl.classList.remove('hidden');
        }
    }

    let finalShops = shops.filter(x =>
        (!dir || x.director_name === dir) &&
        (!document.getElementById('history_filter_sale')?.value || x.sale_name === document.getElementById('history_filter_sale').value) &&
        (!document.getElementById('history_filter_svn')?.value || x.svn_code === document.getElementById('history_filter_svn').value)
    );

    const shopEl = document.getElementById('history_filter_shop');
    if(shopEl) {
        shopEl.innerHTML = `<option value="">-- 4. Tất cả Shop --</option>` + finalShops.map(x => `<option value="${x.shop_code}">${x.shop_code} - ${x.shop_name}</option>`).join('');
        if (finalShops.length <= 1) shopEl.classList.add('hidden');
        else shopEl.classList.remove('hidden');
    }

    if (level !== 'init') applyHistoryFilter();
}

function getFilteredHistoryData(rawData) {
    const dir = document.getElementById('history_filter_director')?.value || '';
    const sale = document.getElementById('history_filter_sale')?.value || '';
    const svn = document.getElementById('history_filter_svn')?.value || '';
    const shop = document.getElementById('history_filter_shop')?.value || '';
    
    let data = rawData || [];
    
    if (dir) data = data.filter(r => STATE.globalShopMap[r.shop_code]?.director_name === dir);
    if (sale) data = data.filter(r => STATE.globalShopMap[r.shop_code]?.sale_name === sale);
    if (svn) data = data.filter(r => STATE.globalShopMap[r.shop_code]?.svn_code === svn);
    if (shop) data = data.filter(r => r.shop_code === shop);
    
    return data;
}

export function applyHistoryFilter() {
    renderFilteredSO();
    renderFilteredMedia();
    renderFilteredCRM();
}

export function ui_renderHistorySO(reports) {
    STATE.rawHistorySO = reports || [];
    renderFilteredSO();
}

export function ui_renderHistoryMedia(reports) {
    STATE.rawHistoryMedia = reports || [];
    renderFilteredMedia();
}

export function ui_renderHistoryCRM(customers) {
    STATE.rawHistoryCRM = customers || [];
    renderFilteredCRM();
}

function renderFilteredSO() {
    const tbody = document.getElementById('historyBodySO');
    if(!tbody) return;
    const filterMonth = document.getElementById('history_month_filter')?.value;
    
    let data = getFilteredHistoryData(STATE.rawHistorySO);
    if (filterMonth) data = data.filter(r => r.report_date && r.report_date.startsWith(filterMonth));
    
    tbody.innerHTML = data.map(r => {
        const shopName = STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code;
        let actions = `
            <button onclick="window.editDailySO('${r.id}')" class="text-blue-500 hover:bg-blue-100 p-2 rounded mx-1" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button>
            <button onclick="window.deleteDailySO('${r.id}')" class="text-red-500 hover:bg-red-100 p-2 rounded mx-1" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        `;

        return `<tr class="hover:bg-gray-50 border-b">
            <td class="p-4 font-bold text-xs text-blue-600">${r.report_date}</td>
            <td class="p-4 text-xs font-bold text-slate-800 uppercase">${shopName}</td>
            <td class="p-4 text-xs font-black text-green-600 text-center">${r.traffic_natural || 0}</td>
            <td class="p-4 text-xs font-black text-purple-600 text-center">${r.traffic_leads || 0}</td>
            <td class="p-4 text-xs font-black text-orange-600 text-center">${r.total_so || 0}</td>
            <td class="p-4 text-center whitespace-nowrap">${actions}</td>
        </tr>`;
    }).join('');
}

function renderFilteredMedia() {
    const tbody = document.getElementById('historyBodyMedia');
    if(!tbody) return;
    const filterMonth = document.getElementById('history_month_filter')?.value;
    
    let data = getFilteredHistoryData(STATE.rawHistoryMedia);
    if (filterMonth) data = data.filter(r => r.report_date && r.report_date.startsWith(filterMonth));

    // CỘT NỘI DUNG VIDEO ĐƯỢC HIỂN THỊ TRONG BẢNG
    tbody.innerHTML = data.map(r => {
        let actions = `
            <button onclick="window.editMediaReport('${r.id}')" class="text-blue-500 hover:bg-blue-100 p-2 rounded mx-1" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button>
            <button onclick="window.sb.from('media_reports').delete().eq('id', '${r.id}').then(()=>window.loadSaleHistory())" class="text-red-500 hover:bg-red-100 p-2 rounded mx-1" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        `;
        return `<tr class="border-b hover:bg-gray-50">
            <td class="p-4 text-xs font-bold text-slate-700">${r.report_date}</td>
            <td class="p-4 text-xs text-center font-bold text-gray-600">${r.video_content || '---'}</td>
            <td class="p-4 text-xs text-center text-blue-600 font-bold">${r.tiktok_videos || 0}</td>
            <td class="p-4 text-xs text-center text-purple-600 font-bold">${r.tiktok_views ? fmn(r.tiktok_views) : 0}</td>
            <td class="p-4 text-xs text-center text-red-500 font-bold">${r.marketing_cost ? fmn(r.marketing_cost) + 'đ' : '0đ'}</td>
            <td class="p-4 text-xs text-blue-500 truncate max-w-[150px]"><a href="${r.media_link || '#'}" target="_blank" class="hover:underline">${r.media_link ? '🔗 Xem Link' : '---'}</a></td>
            <td class="p-4 text-center whitespace-nowrap">${actions}</td>
        </tr>`;
    }).join('');
}

function renderFilteredCRM() {
    const tbody = document.getElementById('historyBodyCRM');
    if(!tbody) return;
    const filterMonth = document.getElementById('history_month_filter')?.value;
    const filterStatus = document.getElementById('history_status_filter')?.value;

    let data = getFilteredHistoryData(STATE.rawHistoryCRM);
    if (filterMonth) data = data.filter(c => c.created_at && c.created_at.startsWith(filterMonth));
    if (filterStatus) data = data.filter(c => c.status === filterStatus);

    tbody.innerHTML = data.map(c => {
        let statusBadge = '';
        if (c.status === 'Đã mua xe') statusBadge = `<span class="bg-blue-100 text-blue-600 px-2 py-1 rounded text-[10px] font-bold">✅ ĐÃ CHỐT</span>`;
        else if (c.status === 'Đang phân vân') statusBadge = `<span class="bg-orange-100 text-orange-600 px-2 py-1 rounded text-[10px] font-bold">🤔 CHƯA CHỐT</span>`;
        else statusBadge = `<span class="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-bold">❌ KHÔNG MUA</span>`;

        let actions = `
            <button onclick="window.editCRMReport('${c.id}')" class="text-blue-500 hover:bg-blue-100 p-2 rounded mx-1" title="Sửa"><i class="fa-solid fa-pen-to-square"></i></button>
            <button onclick="window.sb.from('crm_customers').delete().eq('id', '${c.id}').then(()=>window.loadSaleHistory())" class="text-red-500 hover:bg-red-100 p-2 rounded mx-1" title="Xóa"><i class="fa-solid fa-trash"></i></button>
        `;

        const noteText = c.notes ? c.notes : '---';
        const dateStr = c.created_at ? c.created_at.slice(0, 10) : '---';

        return `<tr class="border-b hover:bg-gray-50">
            <td class="p-4 text-xs font-bold text-blue-600">${dateStr}</td>
            <td class="p-4 text-xs font-bold text-slate-800">${c.customer_name}</td>
            <td class="p-4 text-xs font-mono text-gray-500">${c.phone || '---'}</td>
            <td class="p-4 text-xs font-bold text-orange-600">${c.model_interest || '---'}</td>
            <td class="p-4 text-xs text-gray-600 max-w-[200px] truncate cursor-help" title="${noteText}">${noteText}</td>
            <td class="p-4 text-center">${statusBadge}</td>
            <td class="p-4 text-center whitespace-nowrap">${actions}</td>
        </tr>`;
    }).join('');
}

export function exportHistoryExcel() {
    const activeTabEl = document.querySelector('[id^="htab-"].border-orange-500');
    const activeTab = activeTabEl ? activeTabEl.id.replace('htab-', '') : 'so';
    const filterMonth = document.getElementById('history_month_filter')?.value;
    
    const wb = XLSX.utils.book_new();

    if (activeTab === 'so') {
        let data = getFilteredHistoryData(STATE.rawHistorySO);
        if (filterMonth) data = data.filter(r => r.report_date && r.report_date.startsWith(filterMonth));
        if (data.length === 0) return alert("Không có dữ liệu S.O để xuất!");

        const wsData = [["Ngày S.O", "Mã Shop", "Tên Shop", "Khách Tự Nhiên", "Khách Khai Thác", "Tổng S.O"]];
        data.forEach(r => {
            const shopName = STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code;
            wsData.push([r.report_date, r.shop_code, shopName, r.traffic_natural, r.traffic_leads, r.total_so]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Lich_Su_SO");
        XLSX.writeFile(wb, `Lich_Su_SO_${new Date().toISOString().slice(0, 10)}.xlsx`);

    } else if (activeTab === 'crm') {
        const filterStatus = document.getElementById('history_status_filter')?.value;
        let data = getFilteredHistoryData(STATE.rawHistoryCRM);
        if (filterMonth) data = data.filter(c => c.created_at && c.created_at.startsWith(filterMonth));
        if (filterStatus) data = data.filter(c => c.status === filterStatus);
        
        if (data.length === 0) return alert("Không có dữ liệu Khách hàng để xuất!");

        const wsData = [["Ngày Tạo", "Tên Khách Hàng", "SĐT", "Địa Chỉ", "Mẫu Xe Quan Tâm", "Nguồn", "Trạng Thái", "Ghi Chú"]];
        data.forEach(c => {
            const dateStr = c.created_at ? c.created_at.slice(0, 10) : '';
            wsData.push([dateStr, c.customer_name, c.phone, c.address, c.model_interest, c.source, c.status, c.notes]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Lich_Su_CRM");
        XLSX.writeFile(wb, `Lich_Su_CRM_${new Date().toISOString().slice(0, 10)}.xlsx`);

    } else if (activeTab === 'media') {
        let data = getFilteredHistoryData(STATE.rawHistoryMedia);
        if (filterMonth) data = data.filter(r => r.report_date && r.report_date.startsWith(filterMonth));
        if (data.length === 0) return alert("Không có dữ liệu Truyền thông để xuất!");

        const wsData = [["Ngày", "Nội Dung Video", "Video TikTok", "Lượt View", "Chi Phí MKT", "Livestream (Giờ)", "Phát Tờ Rơi (Giờ)", "Link Nguồn", "Ghi Chú"]];
        data.forEach(r => {
            wsData.push([r.report_date, r.video_content, r.tiktok_videos, r.tiktok_views || 0, r.marketing_cost || 0, r.livestreams, r.offline_flyers, r.media_link, r.notes]);
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Lich_Su_Media");
        XLSX.writeFile(wb, `Lich_Su_Media_${new Date().toISOString().slice(0, 10)}.xlsx`);
    }
}

export function ui_updateSVNOptions() { }
export function ui_updateDVNOptions() { }
export function ui_updateShopInfo() { }
export function ui_renderModelOptionsAll() { }
export function ui_addSaleRow(data = {}) { }
export function calcRow(el) { }
export function calcAll() { }
export function updateChartFilters(level) { }