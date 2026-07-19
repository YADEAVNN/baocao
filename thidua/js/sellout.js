// ==========================================
// PHẦN 1: LOGIC FORM NHẬP LIỆU HÀNG NGÀY
// ==========================================
// BẠN HÃY DÁN LẠI CODE XỬ LÝ NÚT "GỬI BÁO CÁO" CŨ CỦA BẠN VÀO ĐÂY
// (Ví dụ: window.submitSO = async () => { ... })




// ==========================================
// PHẦN 2: LOGIC LỊCH SỬ BÁO CÁO S.O (MATRIX) - ĐÃ FIX TRIỆT ĐỂ
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
        
        const hintTags = Array.from(document.querySelectorAll('#app-content *'))
            .filter(el => el.innerText && el.innerText.includes('Bấm vào ô có số liệu màu cam'));
        
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
        const { data: reports, error } = await window.sb.from('daily_so_reports')
            .select('*')
            .gte('report_date', startDate)
            .lte('report_date', endDate);
        
        if (error) throw error;
        window.STATE.rawHistorySO = reports || [];

        if (!window.STATE.globalAssignedShops || window.STATE.globalAssignedShops.length === 0) {
            const { data: shops } = await window.sb.from('assigned_shops').select('*');
            window.STATE.globalAssignedShops = shops || [];
        }

        window.STATE.historyDaysInMonth = daysInMonth;
        window.STATE.historyYear = year;
        window.STATE.historyMonth = month;

        window.updateHistoryFilters('init');
        window.renderHistoryMatrix();

    } catch (err) {
        console.error("Lỗi tải lịch sử:", err);
        container.innerHTML = `<div class="p-6 bg-red-50 text-red-600 font-bold rounded-xl border border-red-200">Lỗi tải dữ liệu: ${err.message}</div>`;
    }
};

window.updateHistoryFilters = (action) => {
    const selects = document.querySelectorAll('#app-content select');
    const dirSelect = selects[0]; 
    const saleSelect = selects[1]; 
    const shopSelect = selects[2]; 

    const shops = window.STATE.globalAssignedShops || [];

    if (action === 'init') {
        if (dirSelect) {
            const dirs = [...new Set(shops.map(s => s.director_name).filter(Boolean))];
            dirSelect.innerHTML = '<option value="">-- Tất cả GĐ --</option>' + dirs.map(d => `<option value="${d}">${d}</option>`).join('');
            dirSelect.onchange = () => window.updateHistoryFilters('dir_changed');
        }
        if (saleSelect) {
            saleSelect.innerHTML = '<option value="">-- Tất cả NVKD --</option>';
            saleSelect.onchange = () => window.updateHistoryFilters('sale_changed');
        }
        if (shopSelect) {
            shopSelect.innerHTML = '<option value="">-- Tất cả SVN --</option>';
            shopSelect.onchange = () => window.renderHistoryMatrix();
        }
        
        const btnReset = Array.from(document.querySelectorAll('#app-content button')).find(b => b.innerText.includes('Bỏ Lọc'));
        if (btnReset) btnReset.onclick = () => {
            if(dirSelect) dirSelect.value = "";
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

    const selects = document.querySelectorAll('#app-content select');
    const dirFilter = selects[0]?.value || "";
    const saleFilter = selects[1]?.value || "";

    const daysInMonth = window.STATE.historyDaysInMonth || 31;
    const year = window.STATE.historyYear;
    const month = window.STATE.historyMonth;

    let activeSales = [];
    const currentUser = window.STATE.currentUser;
    
    if (currentUser?.role !== 'Admin') {
        activeSales = [currentUser?.full_name];
    } else {
        let shops = window.STATE.globalAssignedShops || [];
        if (dirFilter) shops = shops.filter(s => s.director_name === dirFilter);
        if (saleFilter) shops = shops.filter(s => s.sale_name === saleFilter);
        activeSales = [...new Set(shops.map(s => s.sale_name).filter(Boolean))];
    }

    const reports = window.STATE.rawHistorySO || [];

    let thead = `<tr class="border-b border-gray-100"><th class="py-4 px-3 sticky left-0 bg-white z-20 min-w-[200px] font-bold text-slate-500 shadow-[1px_0_0_0_#e2e8f0]">CHIẾN BINH (NVKD)</th>`;
    for (let d = 1; d <= daysInMonth; d++) {
        thead += `<th class="py-4 px-2 text-center min-w-[35px] font-bold text-slate-500">${d}</th>`;
    }
    thead += `<th class="py-4 px-3 text-center font-black text-orange-600 bg-orange-50 sticky right-0 shadow-[-1px_0_0_0_#e2e8f0]">TỔNG</th></tr>`;

    let tbody = '';
    
    activeSales.forEach(saleName => {
        const saleReports = reports.filter(r => r.sale_name === saleName);
        let totalMonth = 0;
        
        let rowHtml = `<td class="py-3 px-3 sticky left-0 bg-white font-bold text-slate-800 z-10 shadow-[1px_0_0_0_#f1f5f9]">${saleName}</td>`;
        
        for (let d = 1; d <= daysInMonth; d++) {
            const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const dailyData = saleReports.filter(r => r.report_date === fullDate);
            const dailyTotal = dailyData.reduce((sum, item) => sum + (item.total_so || 0), 0);
            
            if (dailyTotal > 0) {
                totalMonth += dailyTotal;
                rowHtml += `<td class="p-1"><div onclick="window.editHistorySO('${fullDate}', '${saleName}', ${dailyTotal})" title="Click để sửa số liệu ngày ${d}" class="font-bold text-orange-600 bg-orange-50/80 w-full h-full flex items-center justify-center py-1.5 rounded-md cursor-pointer hover:bg-orange-100 hover:scale-105 transition text-sm">${dailyTotal}</div></td>`;
            } else {
                rowHtml += `<td class="p-1"><div onclick="window.editHistorySO('${fullDate}', '${saleName}', 0)" title="Click để thêm số liệu ngày ${d}" class="font-medium text-gray-300 w-full h-full flex items-center justify-center py-1.5 rounded-md cursor-pointer hover:bg-slate-50 hover:text-orange-500 transition text-sm">-</div></td>`;
            }
        }
        
        rowHtml += `<td class="py-3 px-3 text-center font-black text-orange-600 bg-orange-50 sticky right-0 shadow-[-1px_0_0_0_#f1f5f9]">${totalMonth}</td>`;
        tbody += `<tr class="hover:bg-slate-50/50 border-b border-gray-50 transition-colors">${rowHtml}</tr>`;
    });

    if (activeSales.length === 0) {
        tbody = `<tr><td colspan="${daysInMonth + 2}" class="p-12 text-center text-gray-400 font-bold">Không tìm thấy dữ liệu NVKD</td></tr>`;
    }

    container.innerHTML = `<div class="overflow-x-auto w-full pb-4"><table class="w-full text-left border-collapse whitespace-nowrap text-sm"><thead class="text-[11px] uppercase bg-white">${thead}</thead><tbody class="divide-y divide-gray-50 bg-white">${tbody}</tbody></table></div>`;
};

window.editHistorySO = async (fullDate, saleName, currentTotal) => {
    let promptMsg = currentTotal > 0 
        ? `📝 Báo cáo ngày ${fullDate} của [${saleName}]:\n- Số lượng hiện tại đang là: ${currentTotal}\n\n💡 BẠN MUỐN LÀM GÌ?\n👉 Nhập luôn SỐ LƯỢNG MỚI vào đây (ví dụ: 5)\n👉 Hoặc gõ "X" để XÓA báo cáo này`
        : `📝 THÊM MỚI báo cáo S.O ngày ${fullDate} cho [${saleName}]:\n\n👉 Nhập SỐ LƯỢNG vào đây:`;

    const input = prompt(promptMsg);

    if (input === null || input.trim() === '') return;
    const val = input.trim().toUpperCase();

    try {
        if (val === 'X') {
            if (currentTotal === 0) return; 
            
            const { error } = await window.sb.from('daily_so_reports')
                .delete()
                .eq('report_date', fullDate)
                .eq('sale_name', saleName);
            
            if (error) throw error;
            alert(`✅ Đã XÓA thành công báo cáo ngày ${fullDate}!`);

        } else {
            const newTotal = parseInt(val, 10);
            
            if (isNaN(newTotal) || newTotal < 0) {
                alert("❌ LỖI: Số lượng nhập vào không hợp lệ!");
                return;
            }

            const { data: existingData } = await window.sb.from('daily_so_reports')
                .select('id')
                .eq('report_date', fullDate)
                .eq('sale_name', saleName);

            if (existingData && existingData.length > 0) {
                // Đã có dữ liệu -> Cập nhật
                const { error } = await window.sb.from('daily_so_reports')
                    .update({ total_so: newTotal })
                    .eq('report_date', fullDate)
                    .eq('sale_name', saleName);
                if (error) throw error;
            } else {
                // Chưa có dữ liệu -> Thêm mới (ĐÃ FIX: Chỉ gửi các cột chắc chắn có trong bảng)
                const { error } = await window.sb.from('daily_so_reports')
                    .insert([{
                        report_date: fullDate,
                        sale_name: saleName,
                        total_so: newTotal
                    }]);
                if (error) throw error;
            }

            alert(`✅ Đã LƯU số lượng mới: ${newTotal}`);
        }

        // Gọi lại hàm để reload ma trận
        if (typeof window.loadHistoryData === 'function') {
            window.loadHistoryData();
        }

    } catch (err) {
        console.error("Lỗi khi lưu/xóa:", err);
        alert("❌ Có lỗi xảy ra khi thao tác: " + err.message);
    }
};
// ------------------------------------------
// 5. TÍNH NĂNG XUẤT EXCEL (CSV)
// ------------------------------------------
window.exportHistoryExcel = () => {
    const daysInMonth = window.STATE.historyDaysInMonth || 31;
    const year = window.STATE.historyYear;
    const month = window.STATE.historyMonth;
    const reports = window.STATE.rawHistorySO || [];
    
    // Lấy danh sách NVKD đang hiển thị trên bảng
    const selects = document.querySelectorAll('#app-content select');
    const dirFilter = selects[0]?.value || "";
    const saleFilter = selects[1]?.value || "";
    let activeSales = [];
    const currentUser = window.STATE.currentUser;
    
    if (currentUser?.role !== 'Admin') {
        activeSales = [currentUser?.full_name];
    } else {
        let shops = window.STATE.globalAssignedShops || [];
        if (dirFilter) shops = shops.filter(s => s.director_name === dirFilter);
        if (saleFilter) shops = shops.filter(s => s.sale_name === saleFilter);
        activeSales = [...new Set(shops.map(s => s.sale_name).filter(Boolean))];
    }

    if (activeSales.length === 0) {
        alert("❌ Không có dữ liệu NVKD nào để xuất!");
        return;
    }

    // Xây dựng nội dung file CSV
    let csvContent = "\uFEFF"; // Thêm BOM để Excel đọc được tiếng Việt có dấu
    
    // Tạo Dòng Header (Tiêu đề)
    let header = ["CHIEN BINH (NVKD)"];
    for (let d = 1; d <= daysInMonth; d++) {
        header.push(`Ngay ${d}`);
    }
    header.push("TONG THANG");
    csvContent += header.join(",") + "\n";

    // Tạo các dòng Dữ liệu
    activeSales.forEach(saleName => {
        const saleReports = reports.filter(r => r.sale_name === saleName);
        let row = [`"${saleName}"`]; // Bọc tên trong ngoặc kép để tránh lỗi dấu phẩy
        let totalMonth = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const dailyData = saleReports.filter(r => r.report_date === fullDate);
            const dailyTotal = dailyData.reduce((sum, item) => sum + (item.total_so || 0), 0);
            
            row.push(dailyTotal);
            totalMonth += dailyTotal;
        }
        row.push(totalMonth);
        csvContent += row.join(",") + "\n";
    });

    // Tạo file và kích hoạt tải xuống
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `Bao_Cao_SellOut_Thang_${month}_${year}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// ------------------------------------------
// 6. TÍNH NĂNG CẢNH BÁO THIẾU SỐ (GIAO DIỆN MODAL CHUYÊN NGHIỆP)
// ------------------------------------------
window.showMissingReportsModal = () => {
    const year = window.STATE.historyYear;
    const month = window.STATE.historyMonth;
    const reports = window.STATE.rawHistorySO || [];
    
    const selects = document.querySelectorAll('#app-content select');
    const dirFilter = selects[0]?.value || "";
    const saleFilter = selects[1]?.value || "";
    let activeSales = [];
    const currentUser = window.STATE.currentUser;
    
    if (currentUser?.role !== 'Admin') {
        activeSales = [currentUser?.full_name];
    } else {
        let shops = window.STATE.globalAssignedShops || [];
        if (dirFilter) shops = shops.filter(s => s.director_name === dirFilter);
        if (saleFilter) shops = shops.filter(s => s.sale_name === saleFilter);
        activeSales = [...new Set(shops.map(s => s.sale_name).filter(Boolean))];
    }
    
    // Tính toán số ngày cần kiểm tra
    const today = new Date();
    let checkUntilDay = window.STATE.historyDaysInMonth;
    
    if (parseInt(year) === today.getFullYear() && parseInt(month) === today.getMonth() + 1) {
        checkUntilDay = today.getDate() - 1; // Kiểm tra đến ngày hôm qua
        if (checkUntilDay === 0) checkUntilDay = 1; 
    } else if (parseInt(year) > today.getFullYear() || (parseInt(year) === today.getFullYear() && parseInt(month) > today.getMonth() + 1)) {
        alert("Tháng này ở tương lai, chưa có dữ liệu để kiểm tra.");
        return;
    }

    let missingData = [];
    let textForClipboard = `⚠️ CẢNH BÁO KỶ LUẬT BÁO CÁO (Tính đến ngày ${String(checkUntilDay).padStart(2, '0')}/${month})\n\n`;

    activeSales.forEach(saleName => {
        const saleReports = reports.filter(r => r.sale_name === saleName);
        let missingDays = [];
        
        for (let d = 1; d <= checkUntilDay; d++) {
            const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
            const dailyData = saleReports.filter(r => r.report_date === fullDate);
            
            if (dailyData.length === 0) {
                // Định dạng ngày theo kiểu dd/mm
                missingDays.push(`${String(d).padStart(2, '0')}/${month}`);
            }
        }
        
        if (missingDays.length > 0) {
            missingData.push({
                name: saleName,
                count: missingDays.length,
                days: missingDays.join(', ')
            });
            textForClipboard += `NVKD: [${saleName}]\n🚨 Thiếu ${missingDays.length} ngày: ${missingDays.join(', ')}\n\n`;
        }
    });

    if (missingData.length === 0) {
        alert(`✅ TUYỆT VỜI! Tất cả NVKD trên bảng đã báo cáo đầy đủ (tính đến ngày ${checkUntilDay}/${month}).`);
        return;
    }

    // Xóa modal cũ nếu đang mở
    const existingModal = document.getElementById('custom-missing-modal');
    if (existingModal) existingModal.remove();

    // Dựng khung HTML cho Modal bằng TailwindCSS
    let modalHtml = `
        <div id="custom-missing-modal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity">
            <div class="bg-white rounded-xl shadow-2xl w-[90%] max-w-3xl overflow-hidden flex flex-col font-sans">
                <!-- Header -->
                <div class="bg-red-50 text-red-600 px-6 py-4 flex items-center justify-between border-b border-red-100">
                    <h3 class="font-bold text-lg flex items-center gap-2">
                        <i class="fa-solid fa-triangle-exclamation"></i> CẢNH BÁO KỶ LUẬT BÁO CÁO
                    </h3>
                    <button onclick="document.getElementById('custom-missing-modal').remove()" class="text-red-400 hover:text-red-700 hover:bg-red-200 rounded-full w-8 h-8 flex items-center justify-center transition">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
                
                <!-- Body -->
                <div class="p-6 max-h-[60vh] overflow-y-auto text-base">
    `;

    // Render danh sách NVKD thiếu số
    missingData.forEach(item => {
        modalHtml += `
            <div class="mb-5 last:mb-0">
                <div class="font-bold text-gray-800">NVKD: [${item.name}]</div>
                <div class="text-red-600 font-medium mt-1.5 leading-relaxed">
                    <i class="fa-solid fa-caret-right text-xs mr-1"></i> Thiếu ${item.count} ngày: ${item.days}
                </div>
            </div>
        `;
    });

    modalHtml += `
                </div>
                
                <!-- Footer -->
                <div class="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                    <button onclick="document.getElementById('custom-missing-modal').remove()" class="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition">
                        Đóng lại
                    </button>
                    <button id="btn-copy-zalo" class="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md transition flex items-center gap-2">
                        <i class="fa-regular fa-copy"></i> COPY GỬI ZALO GROUP
                    </button>
                </div>
            </div>
        </div>
    `;

    // Chèn modal vào cuối thẻ body
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Gắn sự kiện cho nút COPY
    document.getElementById('btn-copy-zalo').onclick = () => {
        navigator.clipboard.writeText(textForClipboard).then(() => {
            const btn = document.getElementById('btn-copy-zalo');
            const originalText = btn.innerHTML;
            
            // Đổi style khi copy thành công
            btn.innerHTML = '<i class="fa-solid fa-check"></i> ĐÃ COPY THÀNH CÔNG';
            btn.classList.remove('bg-red-600', 'hover:bg-red-700');
            btn.classList.add('bg-green-600', 'hover:bg-green-700');
            
            // Trả lại trạng thái cũ sau 2.5 giây
            setTimeout(() => {
                btn.innerHTML = originalText;
                btn.classList.add('bg-red-600', 'hover:bg-red-700');
                btn.classList.remove('bg-green-600', 'hover:bg-green-700');
            }, 2500);
        }).catch(err => {
            alert('❌ Trình duyệt không hỗ trợ tự động Copy: ' + err);
        });
    };
};