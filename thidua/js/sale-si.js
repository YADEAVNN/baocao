import { sb, STATE } from './config.js';

// ==========================================
// HÀM HỖ TRỢ: LỌC DANH SÁCH NVKD THEO PHÂN QUYỀN 
// ==========================================
function getActiveSalesSI() {
    const dirFilter = document.getElementById('filter_rsm_si')?.value || "";
    const saleFilter = document.getElementById('filter_sale_si')?.value || "";
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
// 1. LƯU DỮ LIỆU NHẬP S.I LÊN SUPABASE (CÓ CHỜ DUYỆT)
// ==========================================
window.submitSIReport = async () => {
    try {
        const dateEl = document.getElementById('si_daily_date') || document.querySelector('input[type="date"]');
        const date = dateEl ? dateEl.value : null;
        if(!date) return alert("Vui lòng chọn ngày báo cáo!");

        const ttEl = document.getElementById('si_thanh_toan') || document.querySelectorAll('input[type="number"]')[0];
        const xhEl = document.getElementById('si_xuat_hang') || document.querySelectorAll('input[type="number"]')[1];
        const noteEl = document.getElementById('si_note') || document.querySelector('textarea');
        
        const tt = ttEl ? parseInt(ttEl.value || 0, 10) : 0;
        const xh = xhEl ? parseInt(xhEl.value || 0, 10) : 0;
        const note = noteEl ? noteEl.value : '';

        const user = STATE.currentUser;
        if(!user) return alert("Lỗi xác thực, vui lòng đăng nhập lại!");

        const btn = document.getElementById('btnSubmitSI') || document.querySelector('button[onclick*="submitSIReport"]');
        const origText = btn ? btn.innerHTML : 'XÁC NHẬN KẾT QUẢ S.I';
        if (btn) {
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> ĐANG LƯU...';
            btn.disabled = true;
        }

        let assignedRegion = 'Chưa rõ';
        if (window.STATE.globalAssignedShops && window.STATE.globalAssignedShops.length > 0) {
            const myShop = window.STATE.globalAssignedShops.find(s => s.sale_name === user.full_name);
            if (myShop) assignedRegion = myShop.area || myShop.khu_vuc || myShop.region || 'Chưa rõ';
        }

        const payload = {
            report_date: date,
            sale_name: user.full_name,
            thanh_toan: isNaN(tt) ? 0 : tt,
            xuat_hang: isNaN(xh) ? 0 : xh,
            note: note,
            region_name: user.region || assignedRegion,
            status: 'pending' 
        };

        const { data: exist } = await sb.from('game_si_reports').select('id').eq('report_date', date).eq('sale_name', user.full_name).maybeSingle();

        if (exist) {
            await sb.from('game_si_reports').update(payload).eq('id', exist.id);
        } else {
            await sb.from('game_si_reports').insert([payload]);
        }

        alert("✅ Đã lưu! Kết quả của bạn đang CHỜ SẾP DUYỆT (Màu Vàng).");
        
        if (ttEl) ttEl.value = '';
        if (xhEl) xhEl.value = '';
        if (noteEl) noteEl.value = '';
        
        if (typeof window.loadHistorySIData === 'function') window.loadHistorySIData();

        if (btn) {
            btn.innerHTML = origText;
            btn.disabled = false;
        }

    } catch (error) {
        console.error(error);
        alert("Lỗi khi lưu dữ liệu: " + error.message);
        const btn = document.getElementById('btnSubmitSI') || document.querySelector('button[onclick*="submitSIReport"]');
        if (btn) {
            btn.innerHTML = 'XÁC NHẬN KẾT QUẢ S.I';
            btn.disabled = false;
        }
    }
};

document.addEventListener('click', (e) => {
    if(e.target && (e.target.id === 'btnSubmitSI' || e.target.closest('#btnSubmitSI'))) {
        window.submitSIReport();
    }
});

// ==========================================
// 2. XỬ LÝ BỘ LỌC MA TRẬN S.I
// ==========================================
window.updateHistorySIFilters = (action) => {
    const dirSelect = document.getElementById('filter_rsm_si');
    const saleSelect = document.getElementById('filter_sale_si');
    const shopSelect = document.getElementById('filter_svn_si');
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
            dirSelect.innerHTML = '<option value="">-- Tất cả GĐ --</option>' + dirs.map(d => '<option value="' + d + '">' + d + '</option>').join('');
            dirSelect.onchange = () => window.updateHistorySIFilters('dir_changed');
        }
        if (saleSelect) {
            const sales = [...new Set(shops.map(s => s.sale_name).filter(Boolean))];
            saleSelect.innerHTML = '<option value="">-- Tất cả NVKD --</option>' + sales.map(s => '<option value="' + s + '">' + s + '</option>').join('');
            saleSelect.onchange = () => window.updateHistorySIFilters('sale_changed');
        }
        if (shopSelect) {
            const svns = [...new Set(shops.map(s => s.shop_code).filter(Boolean))];
            shopSelect.innerHTML = '<option value="">-- Tất cả SVN --</option>' + svns.map(s => '<option value="' + s + '">' + s + '</option>').join('');
            shopSelect.onchange = () => window.loadHistorySIData();
        }
    }

    if (action === 'dir_changed') {
        const selectedDir = dirSelect?.value;
        if (selectedDir) shops = shops.filter(s => s.director_name === selectedDir);
        if (saleSelect) {
            const sales = [...new Set(shops.map(s => s.sale_name).filter(Boolean))];
            saleSelect.innerHTML = '<option value="">-- Tất cả NVKD --</option>' + sales.map(s => '<option value="' + s + '">' + s + '</option>').join('');
        }
        window.loadHistorySIData();
    }

    if (action === 'sale_changed') {
        const selectedDir = dirSelect?.value;
        if (selectedDir) shops = shops.filter(s => s.director_name === selectedDir);
        const selectedSale = saleSelect?.value;
        if (selectedSale) shops = shops.filter(s => s.sale_name === selectedSale);
        if (shopSelect) {
            const svns = [...new Set(shops.map(s => s.shop_code).filter(Boolean))];
            shopSelect.innerHTML = '<option value="">-- Tất cả SVN --</option>' + svns.map(s => '<option value="' + s + '">' + s + '</option>').join('');
        }
        window.loadHistorySIData();
    }
};

// ==========================================
// 3. TẢI VÀ VẼ MA TRẬN S.I TỪ BẢNG GAME_SI_REPORTS 
// ==========================================
window.loadHistorySIData = async () => {
    const monthInput = document.getElementById('filter_month_si')?.value;
    if(!monthInput) return;
    
    const tbody = document.getElementById('si_matrix_body');
    const thead = document.getElementById('si_matrix_head');
    const table = thead?.closest('table');
    if(!tbody || !thead || !table) return;

    const role = window.STATE.currentUser?.role || '';
    const isManager = role === 'Admin' || role === 'RSM' || role.toLowerCase().includes('giám đốc') || role.toLowerCase().includes('gđ');

    const [year, month] = monthInput.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let headHTML = '<tr><th class="py-4 px-4 text-left bg-gray-50 sticky left-0 z-20 min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">CHIẾN BINH (NVKD)</th><th class="py-4 px-2 text-center bg-gray-50 z-10 min-w-[90px] border-r border-gray-200">PHÂN LOẠI</th>';
    for(let i=1; i<=daysInMonth; i++) { headHTML += '<th class="py-4 px-1 w-10 text-center">' + i + '</th>'; }
    headHTML += '<th class="py-4 px-4 text-center text-blue-600 bg-gray-50 sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">TỔNG</th></tr>';
    thead.innerHTML = headHTML;

    tbody.innerHTML = '<tr><td colspan="' + (daysInMonth + 3) + '" class="p-8 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu Ma trận...</td></tr>';

    let controlsDiv = document.getElementById('si_matrix_controls');
    if (!controlsDiv) {
        controlsDiv = document.createElement('div');
        controlsDiv.id = 'si_matrix_controls';
        table.parentNode.insertBefore(controlsDiv, table);
    }
    controlsDiv.innerHTML = ''; 

    try {
        if (!window.STATE.globalAssignedShops || window.STATE.globalAssignedShops.length === 0) {
            let { data: shops } = await window.sb.from('master_shop_list').select('*');
            if (!shops || shops.length === 0) {
                const res = await window.sb.from('assigned_shops').select('*');
                shops = res.data || [];
            }
            window.STATE.globalAssignedShops = shops || [];
        }

        let activeSales = getActiveSalesSI();

        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-${daysInMonth}`;
        
        const { data: siData } = await window.sb.from('game_si_reports').select('*').gte('report_date', startDate).lte('report_date', endDate);

        if(activeSales.length === 0) {
            tbody.innerHTML = '<tr><td colspan="' + (daysInMonth + 3) + '" class="p-8 text-center text-red-500 font-bold"><i class="fa-solid fa-circle-exclamation mr-1"></i> Không tìm thấy NVKD nào thuộc quyền quản lý.</td></tr>';
            return;
        }

        const safeSiData = siData || [];
        let bodyHTML = '';
        let pendingIds = []; 

        activeSales.forEach(sName => {
            const saleReports = safeSiData.filter(r => r.sale_name === sName);
            let totalTT = 0;
            let totalXH = 0;
            
            let rowTT = '<td rowspan="2" class="py-2 px-4 text-left font-bold text-gray-800 bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-gray-200">' + sName + '</td><td class="py-2 px-2 text-center text-[11px] font-bold text-blue-600 bg-blue-50/50 border-r border-gray-100">Thanh Toán</td>';
            let rowXH = '<td class="py-2 px-2 text-center text-[11px] font-bold text-teal-600 bg-teal-50/50 border-r border-gray-100 border-b border-gray-200">Xuất Hàng</td>';

            for (let d = 1; d <= daysInMonth; d++) {
                const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
                const record = saleReports.find(r => r.report_date === fullDate);
                
                const valTT = record ? Number(record.thanh_toan || 0) : 0;
                const valXH = record ? Number(record.xuat_hang || 0) : 0;
                const status = record ? (record.status || 'approved') : null;
                const recordId = record ? record.id : null;

                if (status === 'pending' && recordId && !pendingIds.includes(recordId)) {
                    pendingIds.push(recordId);
                }
                
                if(valTT > 0) {
                    if (status === 'pending') {
                        rowTT += '<td class="p-1"><div onclick="window.editHistorySI(\'' + fullDate + '\', \'' + sName + '\', \'thanh_toan\', ' + valTT + ', \'' + status + '\', \'' + recordId + '\')" class="font-bold text-yellow-700 bg-yellow-100 w-full h-full flex items-center justify-center py-1.5 rounded cursor-pointer hover:bg-yellow-200 transition text-xs border border-yellow-200" title="Chờ sếp duyệt Thanh Toán"><i class="fa-regular fa-clock text-[9px] mr-1"></i>' + valTT + '</div></td>';
                    } else {
                        totalTT += valTT;
                        rowTT += '<td class="p-1"><div onclick="window.editHistorySI(\'' + fullDate + '\', \'' + sName + '\', \'thanh_toan\', ' + valTT + ', \'' + status + '\', \'' + recordId + '\')" class="font-bold text-blue-600 bg-blue-100 w-full h-full flex items-center justify-center py-1.5 rounded cursor-pointer hover:bg-blue-200 transition text-xs" title="Sửa Thanh Toán">' + valTT + '</div></td>';
                    }
                } else {
                    rowTT += '<td class="p-1"><div onclick="window.editHistorySI(\'' + fullDate + '\', \'' + sName + '\', \'thanh_toan\', 0, null, null)" class="text-gray-300 w-full h-full flex items-center justify-center py-1.5 rounded cursor-pointer hover:bg-gray-100 transition text-xs">-</div></td>';
                }

                if(valXH > 0) {
                    if (status === 'pending') {
                        rowXH += '<td class="p-1 border-b border-gray-100"><div onclick="window.editHistorySI(\'' + fullDate + '\', \'' + sName + '\', \'xuat_hang\', ' + valXH + ', \'' + status + '\', \'' + recordId + '\')" class="font-bold text-yellow-700 bg-yellow-100 w-full h-full flex items-center justify-center py-1.5 rounded cursor-pointer hover:bg-yellow-200 transition text-xs border border-yellow-200" title="Chờ sếp duyệt Xuất Hàng"><i class="fa-regular fa-clock text-[9px] mr-1"></i>' + valXH + '</div></td>';
                    } else {
                        totalXH += valXH;
                        rowXH += '<td class="p-1 border-b border-gray-100"><div onclick="window.editHistorySI(\'' + fullDate + '\', \'' + sName + '\', \'xuat_hang\', ' + valXH + ', \'' + status + '\', \'' + recordId + '\')" class="font-bold text-teal-600 bg-teal-100 w-full h-full flex items-center justify-center py-1.5 rounded cursor-pointer hover:bg-teal-200 transition text-xs" title="Sửa Xuất Hàng">' + valXH + '</div></td>';
                    }
                } else {
                    rowXH += '<td class="p-1 border-b border-gray-100"><div onclick="window.editHistorySI(\'' + fullDate + '\', \'' + sName + '\', \'xuat_hang\', 0, null, null)" class="text-gray-300 w-full h-full flex items-center justify-center py-1.5 rounded cursor-pointer hover:bg-gray-100 transition text-xs">-</div></td>';
                }
            }
            
            rowTT += '<td class="py-2 px-4 font-black text-blue-600 bg-blue-50/80 sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-center">' + totalTT + '</td>';
            rowXH += '<td class="py-2 px-4 font-black text-teal-600 bg-teal-50/80 sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-gray-200 text-center">' + totalXH + '</td>';

            bodyHTML += '<tr class="hover:bg-blue-50/30 transition">' + rowTT + '</tr><tr class="hover:bg-teal-50/30 transition">' + rowXH + '</tr>';
        });
        
        tbody.innerHTML = bodyHTML;

        controlsDiv.innerHTML = '<div class="flex justify-between items-end mb-4 px-2"><div class="flex items-center gap-4 text-xs font-bold text-gray-500"><div class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-blue-100 block"></span> Đã duyệt (Chính thức)</div><div class="flex items-center gap-1"><span class="w-3 h-3 rounded bg-yellow-100 border border-yellow-300 block"></span> Chờ duyệt (Pending)</div></div>' + ((isManager && pendingIds.length > 0) ? '<button onclick="window.massApproveSI(\'' + pendingIds.join(',') + '\')" class="bg-blue-600 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-blue-700 shadow-md transition flex items-center gap-2"><i class="fa-solid fa-check-double"></i> DUYỆT TẤT CẢ S.I (' + pendingIds.length + ')</button>' : '') + '</div>';

    } catch(err) {
        console.error(err);
        tbody.innerHTML = '<tr><td colspan="' + (daysInMonth + 3) + '" class="p-8 text-center text-red-500">Lỗi kết nối CSDL khi tải S.I: ' + err.message + '</td></tr>';
    }
};

// ==========================================
// HÀM MỚI: DUYỆT HÀNG LOẠT S.I (CHỈ SẾP THẤY)
// ==========================================
window.massApproveSI = async (idsString) => {
    if (!idsString) return;
    const ids = idsString.split(',');
    if (!confirm("🚀 Bạn có chắc chắn muốn DUYỆT NHANH toàn bộ " + ids.length + " báo cáo S.I đang chờ?")) return;
    
    try {
        const { error } = await window.sb.from('game_si_reports').update({ status: 'approved' }).in('id', ids);
        if (error) throw error;
        alert("✅ Đã duyệt thành công " + ids.length + " báo cáo S.I!");
        window.loadHistorySIData(); 
    } catch (e) {
        alert("❌ Lỗi khi duyệt: " + e.message);
    }
};

// ==========================================
// 4. CHỈNH SỬA & XÓA BÁO CÁO S.I
// ==========================================
window.editHistorySI = async (fullDate, saleName, fieldType, currentTotal, currentStatus, recordId) => {
    const role = window.STATE.currentUser?.role || '';
    const isManager = role === 'Admin' || role === 'RSM' || role.toLowerCase().includes('giám đốc') || role.toLowerCase().includes('gđ');
    const fieldNameVN = fieldType === 'thanh_toan' ? 'THANH TOÁN' : 'XUẤT HÀNG';

    if (isManager && currentStatus === 'pending') {
        const input = prompt("📝 [" + saleName + "] ĐANG CHỜ DUYỆT " + fieldNameVN + " NGÀY " + fullDate + "\n- Số lượng: " + currentTotal + " xe\n\n👉 Gõ \"D\" để DUYỆT\n👉 Gõ \"T\" để TỪ CHỐI (Xóa)\n👉 Hoặc gõ 1 SỐ LƯỢNG MỚI để Sửa & Duyệt luôn");
        if (input === null || input.trim() === '') return;
        const val = input.trim().toUpperCase();

        try {
            if (val === 'T') {
                const { data: existingData } = await window.sb.from('game_si_reports').select('*').eq('id', recordId).single();
                if (existingData) {
                    const otherField = fieldType === 'thanh_toan' ? 'xuat_hang' : 'thanh_toan';
                    if ((existingData[otherField] || 0) === 0) {
                        await window.sb.from('game_si_reports').delete().eq('id', recordId);
                    } else {
                        const payload = {}; payload[fieldType] = 0; payload.status = 'approved';
                        await window.sb.from('game_si_reports').update(payload).eq('id', recordId);
                    }
                }
                alert("✅ Đã TỪ CHỐI (Xóa) số lượng " + fieldNameVN + "!");
            } else if (val === 'D') {
                await window.sb.from('game_si_reports').update({ status: 'approved' }).eq('id', recordId);
            } else {
                const newTotal = parseInt(val, 10);
                if (isNaN(newTotal) || newTotal < 0) { alert("❌ Số không hợp lệ!"); return; }
                const payload = { status: 'approved' };
                payload[fieldType] = newTotal;
                await window.sb.from('game_si_reports').update(payload).eq('id', recordId);
            }
            if (typeof window.loadHistorySIData === 'function') window.loadHistorySIData();
            return;
        } catch(e) {
            alert("❌ Lỗi hệ thống: " + e.message); return;
        }
    }

    const input = prompt(currentTotal > 0 ? "📝 Báo cáo " + fieldNameVN + " ngày " + fullDate + " của [" + saleName + "]:\n- Số lượng hiện tại: " + currentTotal + "\n\n👉 Nhập SỐ LƯỢNG MỚI vào đây\n👉 Hoặc gõ \"X\" để XÓA số này" : "📝 THÊM MỚI báo cáo " + fieldNameVN + " ngày " + fullDate + " cho [" + saleName + "]:\n\n👉 Nhập SỐ LƯỢNG vào đây:");
    if (input === null || input.trim() === '') return;
    const val = input.trim().toUpperCase();

    try {
        const { data: existingData } = await window.sb.from('game_si_reports').select('*').eq('report_date', fullDate).eq('sale_name', saleName).maybeSingle();
        const finalStatus = isManager ? 'approved' : 'pending';

        if (val === 'X') {
            if (currentTotal === 0) return; 
            if (existingData) {
                const payload = {}; payload[fieldType] = 0; payload.status = finalStatus;
                const otherField = fieldType === 'thanh_toan' ? 'xuat_hang' : 'thanh_toan';
                if ((existingData[otherField] || 0) === 0) {
                    await window.sb.from('game_si_reports').delete().eq('id', existingData.id);
                } else {
                    await window.sb.from('game_si_reports').update(payload).eq('id', existingData.id);
                }
            }
            alert("✅ Đã XÓA số lượng " + fieldNameVN + " ngày " + fullDate + "!");
        } else {
            const newTotal = parseInt(val, 10);
            if (isNaN(newTotal) || newTotal < 0) return alert("❌ LỖI: Số lượng không hợp lệ!");

            const payload = { status: finalStatus };
            payload[fieldType] = newTotal;

            if (existingData) {
                await window.sb.from('game_si_reports').update(payload).eq('id', existingData.id);
            } else {
                const currentUser = window.STATE.currentUser;
                let assignedRegion = 'Chưa rõ';
                if (window.STATE.globalAssignedShops && window.STATE.globalAssignedShops.length > 0) {
                    const myShop = window.STATE.globalAssignedShops.find(s => s.sale_name === saleName);
                    if (myShop) assignedRegion = myShop.area || myShop.khu_vuc || myShop.region || 'Chưa rõ';
                }

                payload.report_date = fullDate;
                payload.sale_name = saleName;
                payload.region_name = currentUser?.region || assignedRegion;
                
                const otherField = fieldType === 'thanh_toan' ? 'xuat_hang' : 'thanh_toan';
                payload[otherField] = 0;
                
                await window.sb.from('game_si_reports').insert([payload]);
            }
            
            if (!isManager) alert("✅ Đã lưu! Số liệu mới đang ở trạng thái CHỜ SẾP DUYỆT (Màu vàng).");
            else alert("✅ Đã LƯU số lượng " + fieldNameVN + " mới: " + newTotal);
        }

        if (typeof window.loadHistorySIData === 'function') window.loadHistorySIData();

    } catch (err) {
        alert("❌ Có lỗi xảy ra khi thao tác: " + err.message);
    }
};

// ==========================================
// 5. XUẤT EXCEL (CSV) S.I (CHỈ TÍNH SỐ ĐÃ DUYỆT)
// ==========================================
window.exportHistorySIExcel = async () => {
    const monthInput = document.getElementById('filter_month_si')?.value;
    if(!monthInput) return alert("Vui lòng chọn tháng!");
    
    const [year, month] = monthInput.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    let activeSales = getActiveSalesSI();
    if (activeSales.length === 0) return alert("Không có dữ liệu NVKD để xuất!");

    try {
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-${daysInMonth}`;
        const { data: siData } = await window.sb.from('game_si_reports').select('*').gte('report_date', startDate).lte('report_date', endDate);

        let csvContent = "\uFEFF"; 
        let header = ["CHIEN BINH (NVKD)", "PHAN LOAI"];
        for (let d = 1; d <= daysInMonth; d++) { header.push("Ngay " + d); }
        header.push("TONG THANG (DA DUYET)");
        csvContent += header.join(",") + "\n";

        activeSales.forEach(sName => {
            const saleReports = (siData || []).filter(r => r.sale_name === sName);
            let rowTT = ['"' + sName + '"', "Thanh Toan"];
            let rowXH = ['"' + sName + '"', "Xuat Hang"];
            let totalTT = 0, totalXH = 0;

            for (let d = 1; d <= daysInMonth; d++) {
                const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
                const dailyData = saleReports.find(r => r.report_date === fullDate);
                const isApproved = dailyData && (!dailyData.status || dailyData.status === 'approved');
                
                const valTT = isApproved ? Number(dailyData.thanh_toan || 0) : 0;
                const valXH = isApproved ? Number(dailyData.xuat_hang || 0) : 0;
                
                rowTT.push(valTT); rowXH.push(valXH);
                totalTT += valTT; totalXH += valXH;
            }
            
            rowTT.push(totalTT); rowXH.push(totalXH);
            csvContent += rowTT.join(",") + "\n";
            csvContent += rowXH.join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", "Bao_Cao_SellIn_ThiDua_" + month + "_" + year + ".csv");
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

    } catch(err) {
        alert("Lỗi xuất Excel: " + err.message);
    }
};

// ==========================================
// 6. CẢNH BÁO THIẾU SỐ S.I (MODAL)
// ==========================================
window.showMissingReportsModalSI = async () => {
    const monthInput = document.getElementById('filter_month_si')?.value;
    if(!monthInput) return;
    
    const [yearStr, monthStr] = monthInput.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

    let activeSales = getActiveSalesSI();
    const today = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    let checkUntilDay = daysInMonth;
    
    if (year === today.getFullYear() && month === today.getMonth() + 1) {
        checkUntilDay = today.getDate() - 1; 
        if (checkUntilDay === 0) checkUntilDay = 1; 
    } else if (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1)) {
        return alert("Tháng này ở tương lai, chưa có dữ liệu để kiểm tra.");
    }

    try {
        const startDate = `${yearStr}-${monthStr}-01`;
        const endDate = `${yearStr}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
        const { data: siData } = await window.sb.from('game_si_reports').select('*').gte('report_date', startDate).lte('report_date', endDate);

        let missingData = [];
        let textForClipboard = "⚠️ CẢNH BÁO KỶ LUẬT BÁO CÁO SELL-IN (Tính đến ngày " + String(checkUntilDay).padStart(2, '0') + "/" + monthStr + ")\n\n";

        activeSales.forEach(saleName => {
            const saleReports = (siData || []).filter(r => r.sale_name === saleName);
            let missingDays = [];
            for (let d = 1; d <= checkUntilDay; d++) {
                const fullDate = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
                const dailyData = saleReports.find(r => r.report_date === fullDate);
                if (!dailyData || (Number(dailyData.thanh_toan||0) === 0 && Number(dailyData.xuat_hang||0) === 0)) {
                    missingDays.push(String(d).padStart(2, '0') + "/" + monthStr);
                }
            }
            if (missingDays.length > 0) {
                missingData.push({ name: saleName, count: missingDays.length, days: missingDays.join(', ') });
                textForClipboard += "NVKD: [" + saleName + "]\n🚨 Thiếu " + missingDays.length + " ngày: " + missingDays.join(', ') + "\n\n";
            }
        });

        if (missingData.length === 0) return alert("✅ TUYỆT VỜI! Tất cả NVKD trên bảng đã báo cáo S.I đầy đủ.");

        const existingModal = document.getElementById('custom-missing-modal-si');
        if (existingModal) existingModal.remove();

        let modalHtml = '<div id="custom-missing-modal-si" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"><div class="bg-white rounded-xl shadow-2xl w-[90%] max-w-3xl flex flex-col font-sans"><div class="bg-red-50 text-red-600 px-6 py-4 flex items-center justify-between border-b border-red-100"><h3 class="font-bold text-lg"><i class="fa-solid fa-triangle-exclamation"></i> CẢNH BÁO THIẾU SỐ SELL-IN</h3><button onclick="document.getElementById(\'custom-missing-modal-si\').remove()" class="text-red-400 hover:text-red-700 w-8 h-8"><i class="fa-solid fa-xmark"></i></button></div><div class="p-6 max-h-[60vh] overflow-y-auto">';
        
        missingData.forEach(item => {
            modalHtml += '<div class="mb-5 last:mb-0"><div class="font-bold text-gray-800">NVKD: [' + item.name + ']</div><div class="text-red-600 font-medium mt-1.5"><i class="fa-solid fa-caret-right text-xs mr-1"></i> Thiếu ' + item.count + ' ngày: ' + item.days + '</div></div>';
        });

        modalHtml += '</div><div class="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3"><button onclick="document.getElementById(\'custom-missing-modal-si\').remove()" class="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300">Đóng lại</button><button id="btn-copy-zalo-si" class="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700"><i class="fa-regular fa-copy"></i> COPY GỬI ZALO GROUP</button></div></div></div>';

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        document.getElementById('btn-copy-zalo-si').onclick = () => {
            navigator.clipboard.writeText(textForClipboard).then(() => {
                const btn = document.getElementById('btn-copy-zalo-si');
                btn.innerHTML = '<i class="fa-solid fa-check"></i> ĐÃ COPY THÀNH CÔNG';
                btn.classList.replace('bg-red-600', 'bg-green-600');
            });
        };

    } catch (err) {
        alert("Lỗi khi kiểm tra dữ liệu S.I: " + err.message);
    }
};