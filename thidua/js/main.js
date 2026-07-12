import { STATE, sb } from './config.js';
import { api_checkSession, api_loadShopsAndLock, api_login, api_logout, api_loadSaleHistory } from './api.js';

// Import 4 Views Thi Đua
import { entryHTML } from './views/view-entry.js';
import { historyHTML } from './views/view-history.js';
import { targetHTML } from './views/view-target.js';
import { competitionHTML } from './views/view-competition.js';

window.STATE = STATE;
window.sb = sb; 

const viewMap = {
    'entry': entryHTML,
    'history': historyHTML,
    'target': targetHTML,
    'competition': competitionHTML
};

// ==========================================
// 1. HÀM ĐIỀU HƯỚNG VÀ KHỞI TẠO (ROUTER & AUTH)
// ==========================================
window.switchView = (viewId) => {
    const appContent = document.getElementById('app-content');
    if (viewMap[viewId]) {
        appContent.innerHTML = viewMap[viewId];
    }

    // Đổ danh sách Shop vào select box ở màn hình Nhập Liệu
    if (STATE && STATE.globalAssignedShops && STATE.globalAssignedShops.length > 0) {
        const shops = STATE.globalAssignedShops;
        const options = shops.map(s => `<option value="${s.shop_code}">${s.shop_code} - ${s.shop_name}</option>`).join('');
        const el = document.getElementById('select_shop_so');
        if (el) {
            el.innerHTML = options;
            if (typeof window.changeInputShop === 'function') window.changeInputShop(shops[0].shop_code);
        }

        const dateInput = document.getElementById('so_daily_date');
        if (dateInput && !dateInput.value) { dateInput.value = new Date().toISOString().split('T')[0]; }
        
        const historyMonth = document.getElementById('history_month_filter');
        if (historyMonth && !historyMonth.value) { historyMonth.value = new Date().toISOString().slice(0, 7); }
    }

    // Active Menu
    ['nav-entry', 'nav-history', 'nav-target', 'nav-competition'].forEach(n => {
        const el = document.getElementById(n);
        if(el) el.classList.remove('active');
    });
    const targetNav = document.getElementById(`nav-${viewId}`);
    if (targetNav) targetNav.classList.add('active');

    if (window.innerWidth < 768 && typeof window.toggleSidebar === 'function') window.toggleSidebar();
    
    // Auto Load Data tùy màn hình
    if (viewId === 'history') { 
        window.updateHistoryFilters('init'); 
        window.api_loadSaleHistory(); 
    }
    if (viewId === 'target' && typeof window.loadTargetDashboard === 'function') {
        window.updateTGTFilters('init');
        window.loadTargetDashboard('init');
    }
    if (viewId === 'competition' && typeof window.loadCompetitionData === 'function') window.loadCompetitionData();
};

window.toggleSidebar = () => { 
    const sidebar = document.getElementById('sidebarMobile');
    if(sidebar) sidebar.classList.toggle('-translate-x-full'); 
};

async function init() {
    try {
        const profile = await api_checkSession();
        if (!profile) {
            document.getElementById('authContainer').classList.remove('hidden');
            document.getElementById('mainApp').classList.add('hidden');
            return;
        }

        STATE.currentUser = profile;
        document.getElementById('authContainer').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        document.getElementById('mainApp').classList.add('flex');
        
        if(document.getElementById('userDisplay')) document.getElementById('userDisplay').innerText = profile.full_name || "User";
        if(document.getElementById('roleDisplay')) document.getElementById('roleDisplay').innerText = profile.role || "SALE";

        await api_loadShopsAndLock(profile);
        window.switchView('entry'); 

    } catch (err) { alert("Có lỗi khi tải ứng dụng. Vui lòng F5."); }
}

if (document.getElementById('btnLogin')) {
    document.getElementById('btnLogin').onclick = async () => {
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value.trim();
        const msg = document.getElementById('msg');
        if (!email || !password) { msg.innerText = "Vui lòng nhập Email và Mật khẩu!"; return; }
        try {
            msg.className = "text-center text-xs font-bold mt-4 h-5 text-blue-500";
            msg.innerText = "Đang xử lý...";
            await api_login(email, password);
            msg.className = "text-center text-xs font-bold mt-4 h-5 text-green-500";
            msg.innerText = "Thành công! Đang tải dữ liệu...";
            await init(); 
        } catch (err) { 
            msg.className = "text-center text-xs font-bold mt-4 h-5 text-red-500";
            msg.innerText = "Đăng nhập thất bại: " + err.message; 
        }
    };
}
if(document.getElementById('btnLogout')) { document.getElementById('btnLogout').onclick = api_logout; }


// ==========================================
// 2. LOGIC NHẬP LIỆU SELL-OUT (MÀN HÌNH 1)
// ==========================================
window.submitDailySO = async () => {
    const btn = document.getElementById('btnSubmitSO');
    const editId = document.getElementById('editReportId').value;
    btn.disabled = true; 
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ĐANG GỬI...';
    
    const qty = parseInt(document.getElementById('sold_quantity').value) || 0;

    const payload = {
        report_date: document.getElementById('so_daily_date').value,
        shop_code: document.getElementById('select_shop_so').value,
        total_so: qty,
        models_detail: [], 
        status: 'approved',
        sale_name: window.STATE?.currentUser?.full_name || ''
    };

    try {
        if (editId) {
            const { error } = await window.sb.from('daily_so_reports').update(payload).eq('id', editId);
            if (error) throw error;
            alert("✅ Đã cập nhật thành công!");
            document.getElementById('editReportId').value = ""; 
        } else {
            const { data: existing } = await window.sb.from('daily_so_reports').select('*').eq('report_date', payload.report_date).eq('shop_code', payload.shop_code).maybeSingle();

            if (existing) {
                payload.total_so += (existing.total_so || 0);
                const { error } = await window.sb.from('daily_so_reports').update(payload).eq('id', existing.id);
                if (error) throw error;
                alert("✅ Đã cộng dồn thành công vào báo cáo hôm nay!");
            } else {
                const { error } = await window.sb.from('daily_so_reports').insert([payload]);
                if (error) throw error;
                alert("✅ Ghi nhận số lượng Sell-Out thành công!");
            }
        }
        document.getElementById('sold_quantity').value = "0"; 
        window.switchView('history');
    } catch(err) { alert("Lỗi: " + err.message); } 
    finally { 
        btn.disabled = false; 
        btn.innerHTML = '<i class="fa-solid fa-paper-plane"></i> GỬI SỐ SELL-OUT'; 
    }
};


// ==========================================
// 3. LOGIC LỊCH SỬ BÁO CÁO (MÀN HÌNH 2)
// ==========================================
window.api_loadSaleHistory = api_loadSaleHistory;

window.formatDateVN = (dateStr) => {
    if (!dateStr) return '---';
    const parts = dateStr.slice(0, 10).split('-');
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
    return dateStr;
};

window.updateHistoryFilters = (level) => {
    const dir = document.getElementById('history_filter_director')?.value || '';
    const sale = document.getElementById('history_filter_sale')?.value || '';
    
    let shops = window.STATE.globalAssignedShops || [];

    if (level === 'init') {
        let directors = [...new Set(shops.map(x => x.director_name).filter(Boolean))].sort();
        const dirEl = document.getElementById('history_filter_director');
        if(dirEl) dirEl.innerHTML = `<option value="">-- Tất cả GĐ --</option>` + directors.map(x => `<option value="${x}">${x}</option>`).join('');
    }

    if (level === 'init' || level === 'director') {
        let sales = [...new Set(shops.filter(x => !dir || x.director_name === dir).map(x => x.sale_name).filter(Boolean))].sort();
        const saleEl = document.getElementById('history_filter_sale');
        if(saleEl) {
            saleEl.innerHTML = `<option value="">-- Tất cả Sale --</option>` + sales.map(x => `<option value="${x}">${x}</option>`).join('');
            if(level === 'director') saleEl.value = '';
        }
    }

    if (level === 'init' || level === 'director' || level === 'sale') {
        let svns = [...new Set(shops.filter(x => (!dir || x.director_name === dir) && (!sale || x.sale_name === sale)).map(x => x.svn_code).filter(Boolean))].sort();
        const svnEl = document.getElementById('history_filter_svn');
        if(svnEl) {
            svnEl.innerHTML = `<option value="">-- Tất cả SVN --</option>` + svns.map(x => `<option value="${x}">${x}</option>`).join('');
            if(level !== 'init') svnEl.value = '';
        }
    }

    if (level !== 'init') window.applyHistoryFilter();
};

window.applyHistoryFilter = () => {
    const tbody = document.getElementById('historyBodySO');
    if(!tbody) return;

    const filterMonth = document.getElementById('history_month_filter')?.value;
    const dir = document.getElementById('history_filter_director')?.value || '';
    const sale = document.getElementById('history_filter_sale')?.value || '';
    const svn = document.getElementById('history_filter_svn')?.value || '';
    
    let data = window.STATE.rawHistorySO || [];
    
    if (filterMonth) data = data.filter(r => r.report_date && r.report_date.startsWith(filterMonth));
    if (dir) data = data.filter(r => window.STATE.globalShopMap[r.shop_code]?.director_name === dir);
    if (sale) data = data.filter(r => window.STATE.globalShopMap[r.shop_code]?.sale_name === sale);
    if (svn) data = data.filter(r => window.STATE.globalShopMap[r.shop_code]?.svn_code === svn);
    
    data.sort((a, b) => new Date(b.report_date) - new Date(a.report_date));
    
    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-sm font-bold text-gray-400 italic">Không có dữ liệu S.O phù hợp</td></tr>`;
        return;
    }

    tbody.innerHTML = data.map(r => {
        const shopName = window.STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code;
        return `
        <tr class="hover:bg-orange-50/50 transition border-b border-gray-100">
            <td class="p-5 font-black text-sm text-blue-600">${window.formatDateVN(r.report_date)}</td>
            <td class="p-5">
                <p class="text-sm font-black text-slate-800">${shopName}</p>
                <p class="text-[11px] text-gray-500 font-mono mt-1">${r.shop_code}</p>
            </td>
            <td class="p-5 text-2xl font-black text-[#F97316] text-center">${r.total_so || 0}</td>
            <td class="p-5 text-center">
                <button onclick="window.deleteDailySO('${r.id}')" class="text-red-500 hover:text-white hover:bg-red-500 border border-red-200 p-2.5 rounded-xl transition shadow-sm" title="Xóa báo cáo">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>`;
    }).join('');
};

window.resetHistoryFilters = () => {
    ['history_filter_director', 'history_filter_sale', 'history_filter_svn'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    const historyMonth = document.getElementById('history_month_filter');
    if (historyMonth) historyMonth.value = new Date().toISOString().slice(0, 7);
    
    window.updateHistoryFilters('init'); 
    window.applyHistoryFilter();
};

window.exportHistoryExcel = () => {
    let data = window.STATE.rawHistorySO || [];
    const filterMonth = document.getElementById('history_month_filter')?.value;
    const dir = document.getElementById('history_filter_director')?.value || '';
    const sale = document.getElementById('history_filter_sale')?.value || '';
    const svn = document.getElementById('history_filter_svn')?.value || '';
    
    if (filterMonth) data = data.filter(r => r.report_date && r.report_date.startsWith(filterMonth));
    if (dir) data = data.filter(r => window.STATE.globalShopMap[r.shop_code]?.director_name === dir);
    if (sale) data = data.filter(r => window.STATE.globalShopMap[r.shop_code]?.sale_name === sale);
    if (svn) data = data.filter(r => window.STATE.globalShopMap[r.shop_code]?.svn_code === svn);

    if (data.length === 0) return alert("Không có dữ liệu S.O để xuất!");

    const wsData = [["Ngày Thực Hiện", "Mã Cửa Hàng", "Tên Đại Lý", "Tổng Xe Bán (S.O)"]];
    data.forEach(r => {
        const shopName = window.STATE.globalShopMap[r.shop_code]?.shop_name || r.shop_code;
        wsData.push([window.formatDateVN(r.report_date), r.shop_code, shopName, r.total_so]);
    });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(wsData), "Lich_Su_SO");
    XLSX.writeFile(wb, `Lich_Su_SO_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

window.deleteDailySO = async (id) => {
    if(confirm("Lưu ý: Xóa báo cáo này sẽ ảnh hưởng tới bảng xếp hạng thi đua. Bạn có chắc chắn muốn xóa?")) {
        try {
            const { error } = await window.sb.from('daily_so_reports').delete().eq('id', id);
            if (error) throw error;
            window.api_loadSaleHistory();
        } catch(err) { alert("Lỗi khi xóa: " + err.message); }
    }
};


// ==========================================
// 4. LOGIC TIẾN ĐỘ NHẬP LIỆU & CẢNH BÁO (MÀN HÌNH 3)
// ==========================================
window.preCalculatedTargetData = [];

window.updateTGTFilters = (level) => {
    const dir = document.getElementById('tgt_filter_director')?.value || '';
    const sale = document.getElementById('tgt_filter_sale')?.value || '';
    
    let shops = window.STATE.globalAssignedShops || [];

    if (level === 'init') {
        let directors = [...new Set(shops.map(x => x.director_name).filter(Boolean))].sort();
        const dirEl = document.getElementById('tgt_filter_director');
        if(dirEl) dirEl.innerHTML = `<option value="">-- Tất cả GĐ --</option>` + directors.map(x => `<option value="${x}">${x}</option>`).join('');
        
        ['tgt_filter_sale', 'tgt_filter_svn', 'tgt_filter_status', 'tgt_filter_search'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    }

    if (level === 'init' || level === 'director') {
        let sales = [...new Set(shops.filter(x => !dir || x.director_name === dir).map(x => x.sale_name).filter(Boolean))].sort();
        const saleEl = document.getElementById('tgt_filter_sale');
        if(saleEl) {
            saleEl.innerHTML = `<option value="">-- Tất cả Sale --</option>` + sales.map(x => `<option value="${x}">${x}</option>`).join('');
            if(level === 'director') saleEl.value = '';
        }
    }

    if (level === 'init' || level === 'director' || level === 'sale') {
        let svns = [...new Set(shops.filter(x => (!dir || x.director_name === dir) && (!sale || x.sale_name === sale)).map(x => x.svn_code).filter(Boolean))].sort();
        const svnEl = document.getElementById('tgt_filter_svn');
        if(svnEl) {
            svnEl.innerHTML = `<option value="">-- Tất cả SVN --</option>` + svns.map(x => `<option value="${x}">${x}</option>`).join('');
            if(level !== 'init') svnEl.value = '';
        }
    }

    if (level !== 'init') window.filterTargetDashboard();
};

window.loadTargetDashboard = async (action) => {
    if (!window.STATE || window.STATE.assignedShopCodes.length === 0) return;

    const btnLoad = document.querySelector('button[onclick="window.loadTargetDashboard()"]');
    if(btnLoad) btnLoad.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Đang tải...`;

    try {
        const monthInput = document.getElementById('tgt_filter_month');
        const month = monthInput ? monthInput.value : new Date().toISOString().slice(0, 7);
        const y = parseInt(month.split('-')[0]);
        const m = parseInt(month.split('-')[1]);
        const startOfMonth = `${month}-01`;
        const endOfMonth = `${month}-${new Date(y, m, 0).getDate().toString().padStart(2, '0')}`;

        const { data: soReports } = await window.sb.from('daily_so_reports')
            .select('shop_code, report_date, total_so')
            .in('shop_code', window.STATE.assignedShopCodes)
            .gte('report_date', startOfMonth)
            .lte('report_date', endOfMonth);

        let targets = [];
        try {
            const res = await window.sb.from('monthly_shop_targets')
                .select('*')
                .eq('report_month', month) // Đã sửa
                .in('shop_code', window.STATE.assignedShopCodes);
            if (res.data) targets = res.data;
        } catch(e) {}

        const shopAgg = {};
        window.STATE.globalAssignedShops.forEach(s => {
            shopAgg[s.shop_code] = {
                ...s,
                tgt_so: 0,
                act_so: 0,
                days_reported: new Set()
            };
        });

        targets.forEach(t => {
            if (shopAgg[t.shop_code]) {
                shopAgg[t.shop_code].tgt_so = parseInt(t.target_so) || 0;
            }
        });

        (soReports || []).forEach(r => {
            if (shopAgg[r.shop_code]) {
                shopAgg[r.shop_code].act_so += (r.total_so || 0);
                shopAgg[r.shop_code].days_reported.add(r.report_date);
            }
        });

        window.preCalculatedTargetData = Object.values(shopAgg);
        window.filterTargetDashboard(); 

    } catch(err) { 
        console.error(err);
        alert("Lỗi tải tiến độ: " + err.message); 
    } finally { 
        if(btnLoad) btnLoad.innerHTML = `<i class="fa-solid fa-bolt text-yellow-400"></i> Tải Tiến Độ`; 
    }
};

window.filterTargetDashboard = () => {
    const tbody = document.getElementById('body_TargetDashboard');
    if (!tbody || window.preCalculatedTargetData.length === 0) return;

    const dir = document.getElementById('tgt_filter_director')?.value || '';
    const sale = document.getElementById('tgt_filter_sale')?.value || '';
    const svn = document.getElementById('tgt_filter_svn')?.value || '';
    const statusFilter = document.getElementById('tgt_filter_status')?.value || '';
    const searchInput = document.getElementById('tgt_filter_search')?.value.toLowerCase().trim() || '';

    const monthStr = document.getElementById('tgt_filter_month').value;
    const y = parseInt(monthStr.split('-')[0]); 
    const m = parseInt(monthStr.split('-')[1]);
    const daysInMonth = new Date(y, m, 0).getDate();
    
    let now = new Date();
    let elapsedDays = (now.getFullYear() === y && (now.getMonth() + 1) === m) ? now.getDate() : daysInMonth;

    let sumTarget = 0, sumActual = 0;

    const displayShops = window.preCalculatedTargetData.filter(s => {
        if (dir && s.director_name !== dir) return false;
        if (sale && s.sale_name !== sale) return false;
        if (svn && s.svn_code !== svn) return false;
        if (searchInput) {
            const searchText = `${s.shop_code} ${s.shop_name}`.toLowerCase();
            if (!searchText.includes(searchInput)) return false;
        }
        
        const rptDays = s.days_reported.size;
        if (statusFilter === 'stable' && rptDays < elapsedDays) return false;
        if (statusFilter === 'delay' && rptDays >= elapsedDays) return false;
        
        return true;
    });

    const htmlRows = displayShops.map(s => {
        sumTarget += s.tgt_so; 
        sumActual += s.act_so; 

        const pct = s.tgt_so > 0 ? Math.round((s.act_so/s.tgt_so)*100) : (s.act_so > 0 ? 100 : 0);
        const rptDays = s.days_reported.size;
        
        let pColor = pct >= 100 ? 'bg-green-500' : (pct >= 50 ? 'bg-[#F97316]' : 'bg-red-500');

        let statusBadge = `<span class="bg-red-100 text-red-600 px-2 py-1 rounded text-[10px] font-black uppercase"><i class="fa-solid fa-triangle-exclamation"></i> Thiếu báo cáo</span>`;
        if (rptDays >= elapsedDays) statusBadge = `<span class="bg-green-100 text-green-600 px-2 py-1 rounded text-[10px] font-black uppercase"><i class="fa-solid fa-check-double"></i> Đã nộp đủ</span>`;

        return `
        <tr class="border-b border-gray-100 hover:bg-slate-50 transition">
            <td class="p-4">
                <h4 class="font-black text-slate-800 text-sm">${s.shop_name || s.shop_code}</h4>
                <p class="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Sale: <span class="text-[#F97316]">${s.sale_name || 'N/A'}</span></p>
            </td>
            <td class="p-4 text-center font-bold text-gray-500">${s.tgt_so}</td>
            <td class="p-4 text-center font-black text-blue-600">${s.act_so}</td>
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
            </td>
            <td class="p-4 text-center">${statusBadge}</td>
        </tr>`;
    }).join('');

    tbody.innerHTML = htmlRows || `<tr><td colspan="6" class="text-center p-8 text-sm text-gray-400">Không tìm thấy dữ liệu.</td></tr>`;

    const sumPct = sumTarget > 0 ? Math.round((sumActual/sumTarget)*100) : 0;
    if(document.getElementById('tgt_sum_target')) document.getElementById('tgt_sum_target').innerText = sumTarget;
    if(document.getElementById('tgt_sum_actual')) document.getElementById('tgt_sum_actual').innerText = sumActual;
    
    const pctEl = document.getElementById('tgt_sum_percent');
    if(pctEl) {
        pctEl.innerText = sumPct + '%';
        pctEl.className = `text-3xl md:text-4xl font-black ${sumPct >= 80 ? 'text-green-500' : (sumPct >= 50 ? 'text-[#F97316]' : 'text-red-500')}`;
    }
};

window.showMissingReportsModal = () => {
    if (!window.preCalculatedTargetData || window.preCalculatedTargetData.length === 0) {
        alert("Vui lòng nhấn 'Tải Tiến Độ' trước khi xem cảnh báo!");
        return;
    }

    const monthStr = document.getElementById('tgt_filter_month').value;
    const y = parseInt(monthStr.split('-')[0]);
    const m = parseInt(month.split('-')[1]);
    const daysInMonth = new Date(y, m, 0).getDate();

    let now = new Date();
    let elapsedDays = (now.getFullYear() === y && (now.getMonth() + 1) === m) ? now.getDate() : daysInMonth;

    const missingBySale = {};
    let hasMissing = false;

    window.preCalculatedTargetData.forEach(s => {
        let missingDates = [];
        for (let d = 1; d <= elapsedDays; d++) {
            const dateStr = `${y}-${m.toString().padStart(2, '0')}-${d.toString().padStart(2, '0')}`;
            if (!s.days_reported.has(dateStr)) {
                missingDates.push(`${d.toString().padStart(2, '0')}/${m.toString().padStart(2, '0')}`);
            }
        }

        if (missingDates.length > 0) {
            hasMissing = true;
            const saleName = s.sale_name || "CHƯA GẮN NVKD";
            if (!missingBySale[saleName]) missingBySale[saleName] = [];
            
            missingBySale[saleName].push({
                shopName: s.shop_name || "N/A",
                shopCode: s.shop_code,
                dates: missingDates.join(', ')
            });
        }
    });

    let warningText = `🚨 *CẢNH BÁO KỶ LUẬT SELL-OUT THÁNG ${monthStr}* 🚨\n\n`;

    if (!hasMissing) {
        warningText += `✅ Tuyệt vời! Tất cả NVKD và Đại lý đều đã nộp báo cáo S.O đầy đủ!\n`;
    } else {
        warningText += `Hệ thống ghi nhận các NVKD sau chưa đốc thúc đại lý nộp báo cáo. Vui lòng cập nhật ngay để không bị trừ Quỹ Bứt Tốc:\n\n`;

        for (const [sale, shops] of Object.entries(missingBySale)) {
            warningText += `👤 *Sale phụ trách: ${sale}*\n`;
            shops.forEach(shop => {
                warningText += `  ❌ ${shop.shopName} (${shop.shopCode})\n`;
                warningText += `     -> Thiếu ngày: ${shop.dates}\n`;
            });
            warningText += `\n`;
        }
    }

    window.missingReportRawText = warningText;

    const contentEl = document.getElementById('missingReportContent');
    if(contentEl) {
        let htmlContent = warningText
            .replace(/\n/g, '<br>')
            .replace(/\*(.*?)\*/g, '<strong class="text-red-700">$1</strong>');
        contentEl.innerHTML = htmlContent;
    }

    const modal = document.getElementById('missingReportModal');
    if (modal) {
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
};

window.closeMissingReportsModal = () => {
    const modal = document.getElementById('missingReportModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
};

window.copyMissingReports = () => {
    if (window.missingReportRawText) {
        navigator.clipboard.writeText(window.missingReportRawText).then(() => {
            alert("✅ Đã copy nội dung cảnh báo. Anh có thể mở group Zalo và dán vào luôn nhé!");
        }).catch(err => {
            alert("Trình duyệt không hỗ trợ copy tự động. Lỗi: " + err);
        });
    }
};

// ==========================================
// 5. BẢNG VÀNG CHIẾN BINH SALE (MÀN HÌNH 4)
// ==========================================
window.saleLeaderboardData = [];

window.loadCompetitionData = async () => {
    const tbody = document.getElementById('sale_leaderboard_body');
    if (tbody) tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-sm text-gray-400"><i class="fa-solid fa-spinner fa-spin"></i> Đang tính toán bảng xếp hạng...</td></tr>';

    try {
        const monthInput = document.getElementById('tgt_filter_month');
        const currentMonth = monthInput ? monthInput.value : new Date().toISOString().slice(0, 7);
        const y = parseInt(currentMonth.split('-')[0]);
        const m = parseInt(currentMonth.split('-')[1]);
        const startOfMonth = `${currentMonth}-01`;
        const endOfMonth = `${currentMonth}-${new Date(y, m, 0).getDate().toString().padStart(2, '0')}`;

        // 1. Lấy dữ liệu từ database
        const [shopsRes, targetsRes, reportsRes] = await Promise.all([
            window.sb.from('master_shop_list').select('shop_code, sale_name'),
            window.sb.from('monthly_shop_targets').select('shop_code, target_so').eq('report_month', currentMonth), // Đã sửa
            window.sb.from('daily_so_reports').select('shop_code, report_date, total_so, sale_name').gte('report_date', startOfMonth).lte('report_date', endOfMonth)
        ]);

        const shops = shopsRes.data || [];
        const targets = targetsRes.data || [];
        const reports = reportsRes.data || [];

        // 2. Gom nhóm theo tên Sale
        const saleStats = {};

        // Khởi tạo danh sách Sale
        shops.forEach(s => {
            const sale = s.sale_name || 'CHƯA GẮN NVKD';
            if (!saleStats[sale]) {
                saleStats[sale] = { name: sale, tgt_so: 0, act_so: 0 };
            }
        });

        // Cộng Target của tất cả Shop thuộc Sale đó
        targets.forEach(t => {
            const shop = shops.find(s => s.shop_code === t.shop_code);
            if (shop) {
                const sale = shop.sale_name || 'CHƯA GẮN NVKD';
                saleStats[sale].tgt_so += (parseInt(t.target_so) || 0);
            }
        });

        // Cộng Số S.O Thực tế Sale đó báo cáo
        reports.forEach(r => {
            let finalSale = r.sale_name || '';
            // Nếu báo cáo thiếu tên Sale, lấy tên Sale từ thông tin Shop
            if (finalSale.trim() === '') {
                const shop = shops.find(s => s.shop_code === r.shop_code);
                finalSale = shop ? (shop.sale_name || 'CHƯA GẮN NVKD') : 'CHƯA GẮN NVKD';
            }
            
            if (saleStats[finalSale]) {
                saleStats[finalSale].act_so += (parseInt(r.total_so) || 0);
            }
        });

        // 3. Tính phần trăm và Sắp xếp
        let ranking = Object.values(saleStats).map(s => {
            const pct = s.tgt_so > 0 ? (s.act_so / s.tgt_so) * 100 : (s.act_so > 0 ? 100 : 0);
            return { ...s, pct };
        });

        // Ưu tiên xếp hạng theo % Hoàn thành, nếu bằng nhau thì ai bán nhiều xe hơn (act_so) xếp trên
        ranking.sort((a, b) => {
            if (b.pct !== a.pct) return b.pct - a.pct;
            return b.act_so - a.act_so;
        });

        // Bỏ qua các Shop chưa gắn tên NVKD khỏi bảng đua
        ranking = ranking.filter(r => r.name !== 'CHƯA GẮN NVKD' && r.name.trim() !== '');

        window.saleLeaderboardData = ranking;
        window.renderSaleLeaderboard();

    } catch (err) {
        console.error(err);
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="text-center p-8 text-sm text-red-500">Lỗi: ${err.message}</td></tr>`;
    }
};

window.renderSaleLeaderboard = () => {
    const tbody = document.getElementById('sale_leaderboard_body');
    const filter = document.getElementById('leaderboard_filter')?.value || 'top10';
    
    if (!tbody || !window.saleLeaderboardData) return;

    let displayData = window.saleLeaderboardData;
    if (filter === 'top10') {
        displayData = displayData.slice(0, 10);
    }

    if (displayData.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center p-8 text-sm text-gray-400">Chưa có dữ liệu thi đua.</td></tr>';
        return;
    }

    const html = displayData.map((s, index) => {
        const rank = index + 1;
        
        // Hiệu ứng Huy chương cho Top 3
        let rankUI = `<span class="text-gray-500 font-black">#${rank}</span>`;
        if (rank === 1) rankUI = `<i class="fa-solid fa-crown text-yellow-400 text-3xl drop-shadow-md"></i>`;
        else if (rank === 2) rankUI = `<i class="fa-solid fa-medal text-slate-300 text-3xl drop-shadow-md"></i>`;
        else if (rank === 3) rankUI = `<i class="fa-solid fa-medal text-orange-400 text-3xl drop-shadow-md"></i>`;

        const pctRounded = Math.round(s.pct);
        let pColor = pctRounded >= 100 ? 'bg-green-500' : (pctRounded >= 50 ? 'bg-[#F97316]' : 'bg-red-500');
        
        // Hiệu ứng Highlight dòng Bảng Vàng
        let rowBg = 'hover:bg-slate-50';
        if (rank === 1) rowBg = 'bg-yellow-50/50 hover:bg-yellow-50 border-l-4 border-l-yellow-400';
        else if (rank === 2) rowBg = 'bg-slate-50/50 hover:bg-slate-100 border-l-4 border-l-slate-300';
        else if (rank === 3) rowBg = 'bg-orange-50/50 hover:bg-orange-50 border-l-4 border-l-orange-400';

        return `
        <tr class="border-b border-gray-100 transition ${rowBg}">
            <td class="p-4 text-center align-middle">${rankUI}</td>
            <td class="p-4 align-middle">
                <h4 class="font-black text-slate-800 text-sm uppercase">${s.name}</h4>
                <p class="text-[10px] font-bold text-gray-400 mt-1">Chiến Binh NVKD</p>
            </td>
            <td class="p-4 text-center font-bold text-gray-500 align-middle text-base">${s.tgt_so}</td>
            <td class="p-4 text-center font-black text-blue-600 text-xl align-middle">${s.act_so}</td>
            <td class="p-4 align-middle">
                <div class="flex items-center justify-between mb-1">
                    <div class="w-full bg-gray-200 rounded-full h-2.5 mr-3">
                        <div class="${pColor} h-2.5 rounded-full" style="width: ${Math.min(pctRounded, 100)}%"></div>
                    </div>
                    <span class="text-sm font-black text-slate-700 w-10 text-right">${pctRounded}%</span>
                </div>
            </td>
        </tr>`;
    }).join('');

    tbody.innerHTML = html;
};

// Chạy Init khi load trang
init();