import { sb, STATE } from './config.js';

// ==========================================
// 1. LƯU DỮ LIỆU NHẬP S.I LÊN SUPABASE
// ==========================================
window.submitSIReport = async () => {
    const date = document.getElementById('si_daily_date').value;
    const tt = document.getElementById('si_thanh_toan').value || 0;
    const xh = document.getElementById('si_xuat_hang').value || 0;
    const note = document.getElementById('si_note').value || '';
    
    if(!date) return alert("Vui lòng chọn ngày báo cáo!");
    
    const user = STATE.currentUser;
    if(!user) return alert("Lỗi xác thực, vui lòng đăng nhập lại!");

    const btn = document.getElementById('btnSubmitSI');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i> ĐANG LƯU...';
    btn.disabled = true;

    try {
        const payload = {
            report_date: date,
            sale_name: user.full_name,
            thanh_toan: Number(tt),
            xuat_hang: Number(xh),
            note: note,
            region_name: user.region || 'Chưa rõ'
        };

        const { data: exist } = await sb.from('daily_si_reports')
            .select('id').eq('report_date', date).eq('sale_name', user.full_name).maybeSingle();

        if (exist) {
            await sb.from('daily_si_reports').update(payload).eq('id', exist.id);
        } else {
            await sb.from('daily_si_reports').insert([payload]);
        }

        alert("✅ Đã lưu kết quả S.I thành công!");
        document.getElementById('si_thanh_toan').value = '';
        document.getElementById('si_xuat_hang').value = '';
        document.getElementById('si_note').value = '';
        
        if (typeof window.loadHistorySIData === 'function') window.loadHistorySIData();

    } catch (error) {
        console.error(error);
        alert("Lỗi khi lưu dữ liệu: " + error.message);
    } finally {
        btn.innerHTML = '<i class="fa-solid fa-check mr-2"></i> XÁC NHẬN KẾT QUẢ S.I';
        btn.disabled = false;
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
    const shops = window.STATE.globalAssignedShops || [];

    if (action === 'init') {
        if (dirSelect) {
            const dirs = [...new Set(shops.map(s => s.director_name).filter(Boolean))];
            dirSelect.innerHTML = '<option value="">-- Tất cả GĐ --</option>' + dirs.map(d => `<option value="${d}">${d}</option>`).join('');
            dirSelect.onchange = () => window.updateHistorySIFilters('dir_changed');
        }
        if (saleSelect) {
            saleSelect.innerHTML = '<option value="">-- Tất cả NVKD --</option>';
            saleSelect.onchange = () => window.updateHistorySIFilters('sale_changed');
        }
        if (shopSelect) {
            shopSelect.innerHTML = '<option value="">-- Tất cả SVN --</option>';
            shopSelect.onchange = () => window.loadHistorySIData();
        }
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
        window.loadHistorySIData();
    }

    if (action === 'sale_changed') {
        const selectedSale = saleSelect?.value;
        let filteredShops = shops;
        if (selectedSale) filteredShops = shops.filter(s => s.sale_name === selectedSale);
        
        if (shopSelect) {
            const svns = [...new Set(filteredShops.map(s => s.shop_code).filter(Boolean))];
            shopSelect.innerHTML = '<option value="">-- Tất cả SVN --</option>' + svns.map(s => `<option value="${s}">${s}</option>`).join('');
        }
        window.loadHistorySIData();
    }
};

// ==========================================
// 3. TẢI VÀ VẼ MA TRẬN S.I
// ==========================================
window.loadHistorySIData = async () => {
    const monthInput = document.getElementById('filter_month_si')?.value;
    if(!monthInput) return;
    
    const dirFilter = document.getElementById('filter_rsm_si')?.value || "";
    const saleFilter = document.getElementById('filter_sale_si')?.value || "";

    const tbody = document.getElementById('si_matrix_body');
    const thead = document.getElementById('si_matrix_head');
    if(!tbody || !thead) return;

    const [year, month] = monthInput.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();
    
    let headHTML = '<tr>';
    headHTML += '<th class="py-4 px-4 text-left bg-gray-50 sticky left-0 z-20 min-w-[150px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">CHIẾN BINH (NVKD)</th>';
    headHTML += '<th class="py-4 px-2 text-center bg-gray-50 z-10 min-w-[90px] border-r border-gray-200">PHÂN LOẠI</th>';
    for(let i=1; i<=daysInMonth; i++) { headHTML += `<th class="py-4 px-1 w-10 text-center">${i}</th>`; }
    headHTML += '<th class="py-4 px-4 text-center text-blue-600 bg-gray-50 sticky right-0 z-20 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)]">TỔNG</th>';
    headHTML += '</tr>';
    thead.innerHTML = headHTML;

    tbody.innerHTML = `<tr><td colspan="${daysInMonth + 3}" class="p-8 text-center text-gray-500"><i class="fa-solid fa-spinner fa-spin mr-2"></i> Đang tải dữ liệu Ma trận...</td></tr>`;

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

    try {
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-${daysInMonth}`;
        
        const { data: siData } = await sb.from('daily_si_reports')
            .select('*')
            .gte('report_date', startDate)
            .lte('report_date', endDate);

        if(!siData || siData.length === 0 || activeSales.length === 0) {
            tbody.innerHTML = `<tr><td colspan="${daysInMonth + 3}" class="p-8 text-center text-gray-400 font-bold">Chưa có dữ liệu S.I phù hợp với bộ lọc</td></tr>`;
            return;
        }

        let bodyHTML = '';
        activeSales.forEach(sName => {
            const saleReports = siData.filter(r => r.sale_name === sName);
            let totalTT = 0;
            let totalXH = 0;
            
            let rowTT = `<td rowspan="2" class="py-2 px-4 text-left font-bold text-gray-800 bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-gray-200">${sName}</td>`;
            rowTT += `<td class="py-2 px-2 text-center text-[11px] font-bold text-blue-600 bg-blue-50/50 border-r border-gray-100">Thanh Toán</td>`;
            
            let rowXH = `<td class="py-2 px-2 text-center text-[11px] font-bold text-teal-600 bg-teal-50/50 border-r border-gray-100 border-b border-gray-200">Xuất Hàng</td>`;

            for (let d = 1; d <= daysInMonth; d++) {
                const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
                const dailyData = saleReports.find(r => r.report_date === fullDate);
                const valTT = dailyData ? Number(dailyData.thanh_toan || 0) : 0;
                const valXH = dailyData ? Number(dailyData.xuat_hang || 0) : 0;
                
                if(valTT > 0) {
                    totalTT += valTT;
                    rowTT += `<td class="p-1"><div onclick="window.editHistorySI('${fullDate}', '${sName}', 'thanh_toan', ${valTT})" class="font-bold text-blue-600 bg-blue-100 w-full h-full flex items-center justify-center py-1.5 rounded cursor-pointer hover:bg-blue-200 transition text-xs" title="Sửa Thanh Toán">${valTT}</div></td>`;
                } else {
                    rowTT += `<td class="p-1"><div onclick="window.editHistorySI('${fullDate}', '${sName}', 'thanh_toan', 0)" class="text-gray-300 w-full h-full flex items-center justify-center py-1.5 rounded cursor-pointer hover:bg-gray-100 transition text-xs">-</div></td>`;
                }

                if(valXH > 0) {
                    totalXH += valXH;
                    rowXH += `<td class="p-1 border-b border-gray-100"><div onclick="window.editHistorySI('${fullDate}', '${sName}', 'xuat_hang', ${valXH})" class="font-bold text-teal-600 bg-teal-100 w-full h-full flex items-center justify-center py-1.5 rounded cursor-pointer hover:bg-teal-200 transition text-xs" title="Sửa Xuất Hàng">${valXH}</div></td>`;
                } else {
                    rowXH += `<td class="p-1 border-b border-gray-100"><div onclick="window.editHistorySI('${fullDate}', '${sName}', 'xuat_hang', 0)" class="text-gray-300 w-full h-full flex items-center justify-center py-1.5 rounded cursor-pointer hover:bg-gray-100 transition text-xs">-</div></td>`;
                }
            }
            
            rowTT += `<td class="py-2 px-4 font-black text-blue-600 bg-blue-50/80 sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] text-center">${totalTT}</td>`;
            rowXH += `<td class="py-2 px-4 font-black text-teal-600 bg-teal-50/80 sticky right-0 z-10 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] border-b border-gray-200 text-center">${totalXH}</td>`;

            bodyHTML += `<tr class="hover:bg-blue-50/30 transition">${rowTT}</tr><tr class="hover:bg-teal-50/30 transition">${rowXH}</tr>`;
        });
        
        tbody.innerHTML = bodyHTML;

    } catch(err) {
        console.error(err);
        tbody.innerHTML = `<tr><td colspan="${daysInMonth + 3}" class="p-8 text-center text-red-500">Lỗi kết nối CSDL khi tải S.I</td></tr>`;
    }
};

// ==========================================
// 4. CHỈNH SỬA & XÓA BÁO CÁO S.I
// ==========================================
window.editHistorySI = async (fullDate, saleName, fieldType, currentTotal) => {
    const fieldNameVN = fieldType === 'thanh_toan' ? 'THANH TOÁN' : 'XUẤT HÀNG';
    let promptMsg = currentTotal > 0 
        ? `📝 Báo cáo ${fieldNameVN} ngày ${fullDate} của [${saleName}]:\n- Số lượng hiện tại: ${currentTotal}\n\n💡 BẠN MUỐN LÀM GÌ?\n👉 Nhập SỐ LƯỢNG MỚI vào đây\n👉 Hoặc gõ "X" để XÓA số này`
        : `📝 THÊM MỚI báo cáo ${fieldNameVN} ngày ${fullDate} cho [${saleName}]:\n\n👉 Nhập SỐ LƯỢNG vào đây:`;

    const input = prompt(promptMsg);

    if (input === null || input.trim() === '') return;
    const val = input.trim().toUpperCase();

    try {
        const { data: existingData } = await window.sb.from('daily_si_reports')
            .select('*').eq('report_date', fullDate).eq('sale_name', saleName).maybeSingle();

        if (val === 'X') {
            if (currentTotal === 0) return; 
            if (existingData) {
                const payload = {};
                payload[fieldType] = 0; 
                
                const otherField = fieldType === 'thanh_toan' ? 'xuat_hang' : 'thanh_toan';
                if ((existingData[otherField] || 0) === 0) {
                    await window.sb.from('daily_si_reports').delete().eq('id', existingData.id);
                } else {
                    await window.sb.from('daily_si_reports').update(payload).eq('id', existingData.id);
                }
            }
            alert(`✅ Đã XÓA số lượng ${fieldNameVN} ngày ${fullDate}!`);
        } else {
            const newTotal = parseInt(val, 10);
            if (isNaN(newTotal) || newTotal < 0) return alert("❌ LỖI: Số lượng không hợp lệ!");

            const payload = {};
            payload[fieldType] = newTotal;

            if (existingData) {
                await window.sb.from('daily_si_reports').update(payload).eq('id', existingData.id);
            } else {
                const currentUser = window.STATE.currentUser;
                payload.report_date = fullDate;
                payload.sale_name = saleName;
                payload.region_name = currentUser?.region || 'Chưa rõ';
                
                const otherField = fieldType === 'thanh_toan' ? 'xuat_hang' : 'thanh_toan';
                payload[otherField] = 0;
                
                await window.sb.from('daily_si_reports').insert([payload]);
            }
            alert(`✅ Đã LƯU số lượng ${fieldNameVN} mới: ${newTotal}`);
        }

        if (typeof window.loadHistorySIData === 'function') window.loadHistorySIData();

    } catch (err) {
        console.error("Lỗi khi lưu/xóa:", err);
        alert("❌ Có lỗi xảy ra khi thao tác: " + err.message);
    }
};

// ==========================================
// 5. XUẤT EXCEL (CSV) S.I
// ==========================================
window.exportHistorySIExcel = async () => {
    const monthInput = document.getElementById('filter_month_si')?.value;
    if(!monthInput) return alert("Vui lòng chọn tháng!");
    
    const dirFilter = document.getElementById('filter_rsm_si')?.value || "";
    const saleFilter = document.getElementById('filter_sale_si')?.value || "";

    const [year, month] = monthInput.split('-');
    const daysInMonth = new Date(year, month, 0).getDate();

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

    if (activeSales.length === 0) return alert("Không có dữ liệu NVKD để xuất!");

    try {
        const startDate = `${year}-${month}-01`;
        const endDate = `${year}-${month}-${daysInMonth}`;
        
        const { data: siData } = await window.sb.from('daily_si_reports')
            .select('*').gte('report_date', startDate).lte('report_date', endDate);

        let csvContent = "\uFEFF"; 
        let header = ["CHIEN BINH (NVKD)", "PHAN LOAI"];
        for (let d = 1; d <= daysInMonth; d++) { header.push(`Ngay ${d}`); }
        header.push("TONG THANG");
        csvContent += header.join(",") + "\n";

        activeSales.forEach(sName => {
            const saleReports = (siData || []).filter(r => r.sale_name === sName);
            
            let rowTT = [`"${sName}"`, "Thanh Toan"];
            let rowXH = [`"${sName}"`, "Xuat Hang"];
            let totalTT = 0, totalXH = 0;

            for (let d = 1; d <= daysInMonth; d++) {
                const fullDate = `${year}-${month}-${String(d).padStart(2, '0')}`;
                const dailyData = saleReports.find(r => r.report_date === fullDate);
                
                const valTT = dailyData ? Number(dailyData.thanh_toan || 0) : 0;
                const valXH = dailyData ? Number(dailyData.xuat_hang || 0) : 0;
                
                rowTT.push(valTT);
                rowXH.push(valXH);
                totalTT += valTT;
                totalXH += valXH;
            }
            
            rowTT.push(totalTT);
            rowXH.push(totalXH);
            
            csvContent += rowTT.join(",") + "\n";
            csvContent += rowXH.join(",") + "\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Bao_Cao_SellIn_${month}_${year}.csv`);
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
    
    const dirFilter = document.getElementById('filter_rsm_si')?.value || "";
    const saleFilter = document.getElementById('filter_sale_si')?.value || "";
    const [yearStr, monthStr] = monthInput.split('-');
    const year = parseInt(yearStr);
    const month = parseInt(monthStr);

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

    const today = new Date();
    const daysInMonth = new Date(year, month, 0).getDate();
    let checkUntilDay = daysInMonth;
    
    // Nếu là tháng hiện tại, kiểm tra đến ngày hôm qua
    if (year === today.getFullYear() && month === today.getMonth() + 1) {
        checkUntilDay = today.getDate() - 1; 
        if (checkUntilDay === 0) checkUntilDay = 1; 
    } else if (year > today.getFullYear() || (year === today.getFullYear() && month > today.getMonth() + 1)) {
        return alert("Tháng này ở tương lai, chưa có dữ liệu để kiểm tra.");
    }

    try {
        const startDate = `${yearStr}-${monthStr}-01`;
        const endDate = `${yearStr}-${monthStr}-${String(daysInMonth).padStart(2, '0')}`;
        const { data: siData } = await window.sb.from('daily_si_reports')
            .select('*').gte('report_date', startDate).lte('report_date', endDate);

        let missingData = [];
        let textForClipboard = `⚠️ CẢNH BÁO KỶ LUẬT BÁO CÁO SELL-IN (Tính đến ngày ${String(checkUntilDay).padStart(2, '0')}/${monthStr})\n\n`;

        activeSales.forEach(saleName => {
            const saleReports = (siData || []).filter(r => r.sale_name === saleName);
            let missingDays = [];
            
            for (let d = 1; d <= checkUntilDay; d++) {
                const fullDate = `${yearStr}-${monthStr}-${String(d).padStart(2, '0')}`;
                const dailyData = saleReports.find(r => r.report_date === fullDate);
                
                // Cảnh báo nếu KHÔNG có data, HOẶC cả Thanh Toán và Xuất Hàng đều bằng 0
                if (!dailyData || (Number(dailyData.thanh_toan||0) === 0 && Number(dailyData.xuat_hang||0) === 0)) {
                    missingDays.push(`${String(d).padStart(2, '0')}/${monthStr}`);
                }
            }
            
            if (missingDays.length > 0) {
                missingData.push({ name: saleName, count: missingDays.length, days: missingDays.join(', ') });
                textForClipboard += `NVKD: [${saleName}]\n🚨 Thiếu ${missingDays.length} ngày: ${missingDays.join(', ')}\n\n`;
            }
        });

        if (missingData.length === 0) {
            return alert(`✅ TUYỆT VỜI! Tất cả NVKD trên bảng đã báo cáo S.I đầy đủ (tính đến ngày ${checkUntilDay}/${monthStr}).`);
        }

        // Tạo Modal hiển thị cảnh báo
        const existingModal = document.getElementById('custom-missing-modal-si');
        if (existingModal) existingModal.remove();

        let modalHtml = `
            <div id="custom-missing-modal-si" class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm transition-opacity fade-in">
                <div class="bg-white rounded-xl shadow-2xl w-[90%] max-w-3xl overflow-hidden flex flex-col font-sans">
                    <div class="bg-red-50 text-red-600 px-6 py-4 flex items-center justify-between border-b border-red-100">
                        <h3 class="font-bold text-lg flex items-center gap-2">
                            <i class="fa-solid fa-triangle-exclamation"></i> CẢNH BÁO THIẾU SỐ SELL-IN
                        </h3>
                        <button onclick="document.getElementById('custom-missing-modal-si').remove()" class="text-red-400 hover:text-red-700 hover:bg-red-200 rounded-full w-8 h-8 flex items-center justify-center transition">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>
                    <div class="p-6 max-h-[60vh] overflow-y-auto text-base">
        `;

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
                    <div class="bg-gray-50 px-6 py-4 border-t flex justify-end gap-3">
                        <button onclick="document.getElementById('custom-missing-modal-si').remove()" class="px-6 py-2.5 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 transition">Đóng lại</button>
                        <button id="btn-copy-zalo-si" class="px-6 py-2.5 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 shadow-md transition flex items-center gap-2">
                            <i class="fa-regular fa-copy"></i> COPY GỬI ZALO GROUP
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Xử lý nút Copy Zalo
        document.getElementById('btn-copy-zalo-si').onclick = () => {
            navigator.clipboard.writeText(textForClipboard).then(() => {
                const btn = document.getElementById('btn-copy-zalo-si');
                const originalText = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check"></i> ĐÃ COPY THÀNH CÔNG';
                btn.classList.replace('bg-red-600', 'bg-green-600');
                btn.classList.replace('hover:bg-red-700', 'hover:bg-green-700');
                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.classList.replace('bg-green-600', 'bg-red-600');
                    btn.classList.replace('hover:bg-green-700', 'hover:bg-red-700');
                }, 2500);
            }).catch(err => alert('❌ Trình duyệt không hỗ trợ Copy: ' + err));
        };

    } catch (err) {
        console.error(err);
        alert("Lỗi khi kiểm tra dữ liệu S.I: " + err.message);
    }
};