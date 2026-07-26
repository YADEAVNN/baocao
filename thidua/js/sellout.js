import { sb, STATE } from './config.js';

// ==========================================
// PHẦN 1: LOGIC FORM NHẬP LIỆU HÀNG NGÀY (S.O)
// ==========================================
window.submitDailySO = async () => {
    try {
        const dateEl = document.querySelector('input[type="date"]');
        const date = dateEl ? dateEl.value : null;

        if (!date) return alert("Vui lòng chọn ngày báo cáo!");

        let total = 0;
        const totalEl = document.getElementById('so_total') || document.querySelector('input[type="number"]') || document.querySelector('input[type="text"].text-center') || document.querySelector('.counter-value');
        
        if (totalEl) {
            total = parseInt(totalEl.value !== undefined ? totalEl.value : totalEl.innerText, 10);
        }
        if (isNaN(total)) total = 0;

        const noteEl = document.getElementById('so_note') || document.querySelector('textarea');
        const note = noteEl ? noteEl.value : '';

        const user = window.STATE.currentUser;
        if (!user) return alert("Lỗi: Không tìm thấy thông tin đăng nhập, vui lòng tải lại trang!");

        const btn = document.querySelector('button[onclick*="submitDailySO"]') || document.getElementById('btnSubmitSO') || document.querySelector('button.bg-orange-500');
        const originalText = btn ? btn.innerHTML : 'XÁC NHẬN KẾT QUẢ';
        
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> ĐANG LƯU...';
            btn.disabled = true;
        }

        let assignedRegion = 'Khác';
        if (window.STATE.globalAssignedShops && window.STATE.globalAssignedShops.length > 0) {
            const myShop = window.STATE.globalAssignedShops.find(s => s.sale_name === user.full_name);
            if (myShop) assignedRegion = myShop.area || myShop.khu_vuc || myShop.region || 'Khác';
        }

        const payload = {
            report_date: date,
            sale_name: user.full_name,
            total_so: total,
            region_name: user.region || assignedRegion,
            status: 'pending' 
        };

        const { data: exist } = await window.sb.from('daily_so_reports').select('id').eq('report_date', date).eq('sale_name', user.full_name).maybeSingle();

        if (exist) {
            await window.sb.from('daily_so_reports').update(payload).eq('id', exist.id);
        } else {
            await window.sb.from('daily_so_reports').insert([payload]);
        }

        alert("✅ Đã lưu thành công! Báo cáo đang ở trạng thái CHỜ SẾP DUYỆT (Màu vàng).");

        if (totalEl) {
            if (totalEl.value !== undefined) totalEl.value = 0;
            else totalEl.innerText = '0';
        }
        if (noteEl) noteEl.value = '';

        if (typeof window.loadHistoryData === 'function') window.loadHistoryData();

        if (btn) {
            btn.innerHTML = originalText;
            btn.disabled = false;
        }

    } catch (err) {
        console.error(err);
        alert("Lỗi hệ thống khi lưu: " + err.message);
        const btn = document.querySelector('button[onclick*="submitDailySO"]') || document.querySelector('button.bg-orange-500');
        if (btn) {
            btn.innerHTML = 'XÁC NHẬN KẾT QUẢ';
            btn.disabled = false;
        }
    }
};

// ==========================================
// HÀM HỖ TRỢ: LỌC DANH SÁCH NVKD THEO PHÂN QUYỀN
// ==========================================
function getActiveSalesSO() {
    const selects = document.querySelectorAll('#app-content select');
    const dirFilter = selects[0]?.value || "";
    const saleFilter = selects[1]?.value || "";
    const currentUser = window.STATE.currentUser;
    const role = currentUser?.role || '';
    const name = currentUser?.full_name || '';
    const nameNorm = name.trim().toLowerCase();
    let shops = window.STATE.globalAssignedShops || [];

    if (role === 'Admin') {
        if (dirFilter) shops = shops.filter(s => s.director_name === dirFilter);
        if (saleFilter) shops = shops.filter(s => s.sale_name === saleFilter);
        return [...new Set(shops.map(s => s.sale_name).filter(Boolean))];
    } 
    else if (role === 'RSM' || role === 'Giám đốc' || role.toLowerCase().includes('giám đốc') || role.toLowerCase().includes('gđ')) {
        shops = shops.filter(s => {
            const dirDB = (s.director_name || '').trim().toLowerCase();
            return dirDB === nameNorm || dirDB.includes(nameNorm);
        });
        if (saleFilter) shops = shops.filter(s => s.sale_name === saleFilter);
        return [...new Set(shops.map(s => s.sale_name).filter(Boolean))];
    } 
    else {
        return [name];
    }
}

// ==========================================
// PHẦN 2: LOGIC LỊCH SỬ BÁO CÁO S.O (MATRIX)
// ==========================================
window.loadHistoryData = async () => {
    let monthInput = document.querySelector('#app-content input[type="month"]') || document.querySelector('#app-content input');
    let monthVal = monthInput ? monthInput.value : "";
    let year, month;

    if (monthVal && monthVal.includes('-')) {
        [year, month] = monthVal.split('-');
    } else {
        const d = new Date();
        year = d.getFullYear();
        month = String(d.getMonth() + 1).padStart(2, '0');
    }

    let container = document.getElementById('history_matrix_container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'history_matrix_container';
        container.className = 'mt-8 w-full'; 
        const hintTags = Array.from(document.querySelectorAll('#app-content *')).filter(el => el.innerText && el.innerText.includes('Bấm vào ô có số liệu'));
        if (hintTags.length > 0) {
            const hintEl = hintTags[hintTags.length - 1]; 
            if(hintEl.parentNode) hintEl.parentNode.insertBefore(container, hintEl.nextSibling);
        } else {
            const mainWrapper = document.querySelector('#app-content > div') || document.getElementById('app-content');
            mainWrapper.appendChild(container);
        }
    }

    container.innerHTML = '<div class="p-10 flex justify-center items-center text-blue-500 font-bold"><i class="fa-solid fa-spinner fa-spin mr-3 text-2xl"></i> Đang tải dữ liệu ma trận...</div>';

    const startDate = `${year}-${month}-01`;
    const daysInMonth = new Date(year, month, 0).getDate();
    const endDate = `${year}-${month}-${daysInMonth}`;

    try {
        const { data: reports, error } = await window.sb.from('daily_so_reports').select('*').gte('report_date', startDate).lte('report_date', endDate);
        if (error) throw error;
        window.STATE.rawHistorySO = reports || [];

        if (!window.STATE.globalAssignedShops || window.STATE.globalAssignedShops.length === 0) {
            let { data: shops } = await window.sb.from('master_shop_list').select('*');
            if (!shops || shops.length === 0) {
                const res = await window.sb.from('assigned_shops').select('*');
                shops = res.data || [];
            }
            window.STATE.globalAssignedShops = shops || [];
        }

        window.STATE.historyDaysInMonth = daysInMonth;
        window.STATE.historyYear = year;
        window.STATE.historyMonth = month;

        window.updateHistoryFilters('init');
        window.renderHistoryMatrix();

    } catch (err) {
        console.error("Lỗi tải lịch sử:", err);
        container.innerHTML = '<div class="p-6 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200">Lỗi tải dữ liệu: ' + err.message + '</div>';
    }
};

window.updateHistoryFilters = (action) => {
    const selects = document.querySelectorAll('#app-content select');
    const dirSelect = selects[0]; 
    const saleSelect = selects[1]; 
    const shopSelect = selects[2]; 
    let shops = window.STATE.globalAssignedShops || [];
    const currentUser = window.STATE.currentUser;
    const role = currentUser?.role || '';
    const name = currentUser?.full_name || '';
    const nameNorm = name.trim().toLowerCase();

    if (role === 'RSM' || role === 'Giám đốc' || role.toLowerCase().includes('giám đốc') || role.toLowerCase().includes('gđ')) {
        shops = shops.filter(s => {
            const dirDB = (s.director_name || '').trim().toLowerCase();
            return dirDB === nameNorm || dirDB.includes(nameNorm);
        });
    } else if (role !== 'Admin') {
        shops = shops.filter(s => s.sale_name === name);
    }

    if (action === 'init') {
        if (dirSelect) {
            const dirs = [...new Set(shops.map(s => s.director_name).filter(Boolean))];
            dirSelect.innerHTML = '<option value="">-- Tất cả GĐ --</option>' + dirs.map(d => `<option value="${d}">${d}</option>`).join('');
            dirSelect.onchange = () => window.updateHistoryFilters('dir_changed');
        }
        if (saleSelect) {
            const sales = [...new Set(shops.map(s => s.sale_name).filter(Boolean))];
            saleSelect.innerHTML = '<option value="">-- Tất cả NVKD --</option>' + sales.map(s => `<option value="${s}">${s}</option>`).join('');
            saleSelect.onchange = () => window.updateHistoryFilters('sale_changed');
        }
        if (shopSelect) {
            shopSelect.innerHTML = '<option value="">-- Tất cả SVN --</option>';
            shopSelect.onchange = () => window.renderHistoryMatrix();
        }
        const btnReset = Array.from(document.querySelectorAll('#app-content button')).find(b => b.innerText.includes('Bỏ Lọc'));
        if (btnReset) btnReset.onclick = () => {
            if(dirSelect) dirSelect.value = "";
            if(saleSelect) saleSelect.value = "";
            window.updateHistoryFilters('init');
            window.renderHistoryMatrix();
        };
    }

    if (action === 'dir_changed') {
        const selectedDir = dirSelect?.value;
        let filteredShops = shops;
        if (selectedDir) filteredShops = shops.filter(s => s.director_name === selectedDir);
        if (saleSelect) {
            const sales = [...new Set(filteredShops.map(s => s.sale_name).filter(Boolean))];
            saleSelect.innerHTML = '<option value="">-- Tất cả NVKD --</option>' + sales.map(s => `<option value="${s}">${s}</option>`).join('');
        }
        if (shopSelect) shopSelect.innerHTML = '<option value="">-- Tất cả SVN --</option>';
        window.renderHistoryMatrix();
    }

    if (action === 'sale_changed') {
        const selectedSale = saleSelect?.value;
        let filteredShops = shops;
        if (selectedSale) filteredShops = shops.filter(s => s.sale_name === selectedSale);
        if (shopSelect) {
            const svns = [...new Set(filteredShops.map(s => s.shop_code).filter(Boolean))];
            shopSelect.innerHTML = '<option value="">-- Tất cả SVN --</option>' + svns.map(s => `<option value="${s}">${s}</option>`).join('');
        }
        window.renderHistoryMatrix();
    }
};

window.renderHistoryMatrix = () => {
    const container = document.getElementById('history_matrix_container');
    if (!container) return;

    const daysInMonth = window.STATE.historyDaysInMonth || 31;
    const year = window.STATE.historyYear;
    const month = window.STATE.historyMonth;

    const role = window.STATE.currentUser?.role || '';
    const isManager = role === 'Admin' || role === 'RSM' || role.toLowerCase().includes('giám đốc') || role.toLowerCase().includes('gđ');

    let activeSales = getActiveSalesSO();
    const reports = window.STATE.rawHistorySO || [];
    let pendingIds = [];

    let headerHtml = '<div class="flex justify-between items-end mb-4"><div class="flex items-center gap-4 text-xs font-bold text-gray-500"><div class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-orange-100 border border-orange-300 block"></span> Đã duyệt (Chính thức)</div><div class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 block"></span> Chờ duyệt (Pending)</div></div><div id="btn-mass-approve-container"></div></div>';

    let thead = '<tr class="border-b border-gray-100"><th class="py-4 px-3 sticky left-0 bg-white z-20 min-w-[200px] font-bold text-slate-500 shadow-[1px_0_0_0_#e2e8f0]">CHIẾN BINH (NVKD)</th>';
    for (let d = 1; d <= daysInMonth; d++) {
        thead += '<th class="py-4 px-2 text-center min-w-[35px] font-bold text-slate-500">' + d + '</th>';
    }
    thead += '<th class="py-4 px-3 text-center font-black text-orange-600 bg-orange-50 sticky right-0 shadow-[-1px_0_0_0_#e2e8f0]">TỔNG (ĐÃ DUYỆT)</th></tr>';

    let tbody = '';
    
    activeSales.forEach(saleName => {
        const saleReports = reports.filter(r => r.sale_name === saleName);
        let totalApprovedMonth = 0;
        let rowHtml = '<td class="py-3 px-3 sticky left-0 bg-white font-bold text-slate-800 z-10 shadow-[1px_0_0_0_#f1f5f9]">' + saleName + '</td>';
        
        for (let d = 1; d <= daysInMonth; d++) {
            const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const dailyData = saleReports.filter(r => r.report_date === fullDate);
            const record = dailyData[0];
            const dailyTotal = dailyData.reduce((sum, item) => sum + (item.total_so || 0), 0);
            const status = record ? (record.status || 'approved') : null;
            const recordId = record ? record.id : null;
            
            if (status === 'pending' && recordId) pendingIds.push(recordId);

            if (dailyTotal > 0) {
                if (status === 'pending') {
                    rowHtml += '<td class="p-1"><div onclick="window.editHistorySO(\'' + fullDate + '\', \'' + saleName + '\', ' + dailyTotal + ', \'' + status + '\', \'' + recordId + '\')" title="Chờ sếp duyệt - Click để xử lý" class="font-bold text-yellow-700 bg-yellow-100 w-full h-full flex items-center justify-center py-1.5 rounded-md cursor-pointer hover:bg-yellow-200 hover:scale-105 transition text-sm shadow-sm border border-yellow-200"><i class="fa-regular fa-clock text-[10px] mr-1"></i>' + dailyTotal + '</div></td>';
                } else {
                    totalApprovedMonth += dailyTotal; 
                    rowHtml += '<td class="p-1"><div onclick="window.editHistorySO(\'' + fullDate + '\', \'' + saleName + '\', ' + dailyTotal + ', \'' + status + '\', \'' + recordId + '\')" title="Đã duyệt - Click để sửa" class="font-bold text-orange-600 bg-orange-50/80 w-full h-full flex items-center justify-center py-1.5 rounded-md cursor-pointer hover:bg-orange-100 hover:scale-105 transition text-sm">' + dailyTotal + '</div></td>';
                }
            } else {
                rowHtml += '<td class="p-1"><div onclick="window.editHistorySO(\'' + fullDate + '\', \'' + saleName + '\', 0, null, null)" title="Thêm số liệu ngày ' + d + '" class="font-medium text-gray-300 w-full h-full flex items-center justify-center py-1.5 rounded-md cursor-pointer hover:bg-slate-50 hover:text-orange-500 transition text-sm">-</div></td>';
            }
        }
        
        rowHtml += '<td class="py-3 px-3 text-center font-black text-orange-600 bg-orange-50 sticky right-0 shadow-[-1px_0_0_0_#f1f5f9]">' + totalApprovedMonth + '</td>';
        tbody += '<tr class="hover:bg-slate-50/50 border-b border-gray-50 transition-colors">' + rowHtml + '</tr>';
    });

    if (activeSales.length === 0) {
        tbody = '<tr><td colspan="' + (daysInMonth + 2) + '" class="p-12 text-center text-red-500 font-bold"><i class="fa-solid fa-circle-exclamation mr-1"></i> Không tìm thấy NVKD nào thuộc quyền quản lý.</td></tr>';
    }

    container.innerHTML = headerHtml + '<div class="overflow-x-auto w-full pb-4 border border-gray-200 rounded-lg shadow-sm"><table class="w-full text-left border-collapse whitespace-nowrap text-sm"><thead class="text-[11px] uppercase bg-white">' + thead + '</thead><tbody class="divide-y divide-gray-50 bg-white">' + tbody + '</tbody></table></div>';

    if (isManager && pendingIds.length > 0) {
        document.getElementById('btn-mass-approve-container').innerHTML = '<button onclick="window.massApproveSO(\'' + pendingIds.join(',') + '\')" class="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition flex items-center gap-2"><i class="fa-solid fa-check-double"></i> DUYỆT TẤT CẢ (' + pendingIds.length + ')</button>';
    }
};

window.editHistorySO = async (fullDate, saleName, currentTotal, currentStatus, recordId) => {
    const role = window.STATE.currentUser?.role || '';
    const isManager = role === 'Admin' || role === 'RSM' || role.toLowerCase().includes('giám đốc') || role.toLowerCase().includes('gđ');
    let input;
    
    if (isManager && currentStatus === 'pending') {
        input = prompt("📝 [" + saleName + "] ĐANG CHỜ DUYỆT BÁO CÁO NGÀY " + fullDate + "\n- Số lượng báo cáo: " + currentTotal + " xe\n\n💡 BẠN MUỐN LÀM GÌ?\n👉 Gõ \"D\" để DUYỆT\n👉 Gõ \"T\" để TỪ CHỐI (Xóa bỏ)\n👉 Hoặc gõ 1 SỐ LƯỢNG MỚI để Sửa & Duyệt luôn");
        if (input === null || input.trim() === '') return;
        const val = input.trim().toUpperCase();

        try {
            if (val === 'T') {
                await window.sb.from('daily_so_reports').delete().eq('id', recordId);
                alert("✅ Đã TỪ CHỐI (Xóa) báo cáo của " + saleName + "!");
            } else if (val === 'D') {
                await window.sb.from('daily_so_reports').update({ status: 'approved' }).eq('id', recordId);
            } else {
                const newTotal = parseInt(val, 10);
                if (isNaN(newTotal) || newTotal < 0) { alert("❌ Số không hợp lệ!"); return; }
                await window.sb.from('daily_so_reports').update({ total_so: newTotal, status: 'approved' }).eq('id', recordId);
            }
            window.loadHistoryData();
            return;
        } catch(e) {
            alert("❌ Lỗi hệ thống: " + e.message); return;
        }
    }

    let promptMsg = currentTotal > 0 ? "📝 Báo cáo ngày " + fullDate + " của [" + saleName + "]:\n- Số lượng hiện tại: " + currentTotal + "\n\n👉 Nhập SỐ LƯỢNG MỚI vào đây\n👉 Hoặc gõ \"X\" để XÓA" : "📝 THÊM MỚI báo cáo S.O ngày " + fullDate + " cho [" + saleName + "]:\n👉 Nhập SỐ LƯỢNG:";
    input = prompt(promptMsg);
    if (input === null || input.trim() === '') return;
    const val = input.trim().toUpperCase();

    try {
        if (val === 'X') {
            if (currentTotal === 0) return; 
            await window.sb.from('daily_so_reports').delete().eq('report_date', fullDate).eq('sale_name', saleName);
            alert("✅ Đã XÓA thành công báo cáo!");
        } else {
            const newTotal = parseInt(val, 10);
            if (isNaN(newTotal) || newTotal < 0) { alert("❌ Số không hợp lệ!"); return; }

            let assignedRegion = 'Khác';
            if (window.STATE.globalAssignedShops && window.STATE.globalAssignedShops.length > 0) {
                const myShop = window.STATE.globalAssignedShops.find(s => s.sale_name === saleName);
                if (myShop) assignedRegion = myShop.area || myShop.khu_vuc || myShop.region || 'Khác';
            }

            const finalStatus = isManager ? 'approved' : 'pending';

            if (recordId && recordId !== 'null') {
                await window.sb.from('daily_so_reports').update({ total_so: newTotal, region_name: assignedRegion, status: finalStatus }).eq('id', recordId);
            } else {
                await window.sb.from('daily_so_reports').insert([{ report_date: fullDate, sale_name: saleName, total_so: newTotal, region_name: assignedRegion, status: finalStatus }]);
            }
            if (!isManager) alert("✅ Đã lưu! Báo cáo đang ở trạng thái CHỜ SẾP DUYỆT (Màu vàng).");
        }
        window.loadHistoryData();
    } catch (err) {
        alert("❌ Có lỗi xảy ra: " + err.message);
    }
};

window.massApproveSO = async (idsString) => {
    if (!idsString) return;
    const ids = idsString.split(',');
    if (!confirm("🚀 Bạn có chắc chắn muốn DUYỆT NHANH toàn bộ " + ids.length + " báo cáo đang chờ?")) return;
    try {
        const { error } = await window.sb.from('daily_so_reports').update({ status: 'approved' }).in('id', ids);
        if (error) throw error;
        alert("✅ Đã duyệt thành công " + ids.length + " báo cáo!");
        window.loadHistoryData(); 
    } catch (e) {
        alert("❌ Lỗi khi duyệt: " + e.message);
    }
};

window.exportHistoryExcel = () => {
    const daysInMonth = window.STATE.historyDaysInMonth || 31;
    const year = window.STATE.historyYear;
    const month = window.STATE.historyMonth;
    const reports = window.STATE.rawHistorySO || [];
    let activeSales = getActiveSalesSO();

    if (activeSales.length === 0) { alert("❌ Không có dữ liệu NVKD nào để xuất!"); return; }

    let csvContent = "\uFEFF"; 
    let header = ["CHIEN BINH (NVKD)"];
    for (let d = 1; d <= daysInMonth; d++) { header.push("Ngay " + d); }
    header.push("TONG THANG (DA DUYET)");
    csvContent += header.join(",") + "\n";

    activeSales.forEach(saleName => {
        const saleReports = reports.filter(r => r.sale_name === saleName);
        let row = ['"' + saleName + '"']; 
        let totalMonth = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const dailyData = saleReports.filter(r => r.report_date === fullDate);
            const validData = dailyData.filter(r => !r.status || r.status === 'approved');
            const dailyTotal = validData.reduce((sum, item) => sum + (item.total_so || 0), 0);
            row.push(dailyTotal);
            totalMonth += dailyTotal;
        }
        row.push(totalMonth);
        csvContent += row.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "Bao_Cao_SellOut_Thang_" + month + "_" + year + ".csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

window.showMissingReportsModal = () => {
    const year = window.STATE.historyYear;
    const month = window.STATE.historyMonth;
    const reports = window.STATE.rawHistorySO || [];
    let activeSales = getActiveSalesSO();
    const today = new Date();
    let checkUntilDay = window.STATE.historyDaysInMonth;
    
    if (parseInt(year) === today.getFullYear() && parseInt(month) === today.getMonth() + 1) {
        checkUntilDay = today.getDate() - 1; 
        if (checkUntilDay === 0) checkUntilDay = 1; 
    } else if (parseInt(year) > today.getFullYear() || (parseInt(year) === today.getFullYear() && parseInt(month) > today.getMonth() + 1)) {
        return alert("Tháng này ở tương lai, chưa có dữ liệu để kiểm tra.");
    }

    let missingData = [];
    let textForClipboard = "⚠️ CẢNH BÁO NHIỆM VỤ BÁO CÁO SELL-OUT (Tính đến ngày " + String(checkUntilDay).padStart(2, '0') + "/" + month + ")\n\n";

    activeSales.forEach(saleName => {
        const saleReports = reports.filter(r => r.sale_name === saleName);
        let missingDays = [];
        for (let d = 1; d <= checkUntilDay; d++) {
            const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const dailyData = saleReports.filter(r => r.report_date === fullDate);
            if (dailyData.length === 0) missingDays.push(String(d).padStart(2, '0') + "/" + month);
        }
        if (missingDays.length > 0) {
            missingData.push({ name: saleName, count: missingDays.length, days: missingDays.join(', ') });
            textForClipboard += "NVKD: [" + saleName + "]\n🚨 Thiếu " + missingDays.length + " ngày: " + missingDays.join(', ') + "\n\n";
        }
    });

    if (missingData.length === 0) return alert("✅ TUYỆT VỜI! Tất cả NVKD đã hoàn thành nhiệm vụ báo cáo.");

    const existingModal = document.getElementById('custom-missing-modal');
    if (existingModal) existingModal.remove();

    let modalHtml = '<div id="custom-missing-modal" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"><div class="bg-white rounded-xl shadow-2xl w-[90%] max-w-3xl flex flex-col font-sans"><div class="bg-red-50 text-red-600 px-6 py-4 flex items-center justify-between border-b border-red-100"><h3 class="font-bold text-lg"><i class="fa-solid fa-triangle-exclamation"></i> CẢNH BÁO BÁO CÁO</h3><button onclick="document.getElementById(\'custom-missing-modal\').remove()" class="text-red-400 hover:text-red-700 w-8 h-8"><i class="fa-solid fa-xmark"></i></button></div><div class="p-6 max-h-[60vh] overflow-y-auto">';
    missingData.forEach(item => { 
        modalHtml += '<div class="mb-5 last:mb-0"><div class="font-bold text-gray-800">NVKD: [' + item.name + ']</div><div class="text-red-600 font-medium mt-1.5"><i class="fa-solid fa-caret-right text-xs mr-1"></i> Thiếu ' + item.count + ' ngày: ' + item.days + '</div></div>'; 
    });
    modalHtml += '</div><div class="bg-gray-50 px-6 py-4 flex justify-end gap-3"><button onclick="document.getElementById(\'custom-missing-modal\').remove()" class="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">Đóng</button><button id="btn-copy-zalo" class="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"><i class="fa-regular fa-copy"></i> COPY GỬI ZALO</button></div></div></div>';

    document.body.insertAdjacentHTML('beforeend', modalHtml);
    document.getElementById('btn-copy-zalo').onclick = () => {
        navigator.clipboard.writeText(textForClipboard).then(() => {
            const btn = document.getElementById('btn-copy-zalo');
            btn.innerHTML = '<i class="fa-solid fa-check"></i> ĐÃ COPY THÀNH CÔNG';
            btn.className = 'px-6 py-2.5 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700';
        });
    };
};