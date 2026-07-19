import { $, fmn, formatMonth, toggleModal } from '../core/utils.js';
import { sb } from '../core/supabase.js';

let cachedUsersList = []; 

// --- USERS ---
export async function loadUsers() {
    const { data: users, error } = await sb.from('profiles').select('*');
    if (error) { $('userTableBody').innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-600 font-bold bg-red-50">LỖI: ${error.message}</td></tr>`; return; }
    
    cachedUsersList = users || [];
    renderUserTableFiltered();
}

export function renderUserTableFiltered() {
    const searchEl = $('user_search');
    const filterEl = $('user_status_filter');
    const roleFilterEl = $('user_role_filter'); 
    
    const kw = searchEl ? searchEl.value.toLowerCase().trim() : "";
    const statusFilter = filterEl ? filterEl.value : "ALL";
    const roleFilter = roleFilterEl ? roleFilterEl.value : "ALL"; 
    
    const filtered = cachedUsersList.filter(u => {
        const matchesKeyword = (u.full_name || '').toLowerCase().includes(kw) || (u.email || '').toLowerCase().includes(kw);
        
        let matchesStatus = true;
        if (statusFilter === 'PENDING') matchesStatus = !u.is_approved;
        if (statusFilter === 'APPROVED') matchesStatus = u.is_approved;
        
        let matchesRole = true;
        if (roleFilter !== 'ALL') {
            matchesRole = (u.role === roleFilter);
        }
        
        return matchesKeyword && matchesStatus && matchesRole; 
    });

    const tbody = $('userTableBody');
    if (!tbody) return;

    if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="p-6 text-center text-gray-500 italic">Không tìm thấy tài khoản nào phù hợp điều kiện lọc.</td></tr>`;
        return;
    }

    tbody.innerHTML = filtered.map(u => {
        const areaInfo = getAreaBySaleName(u.full_name);
        const areaDisplay = areaInfo ? `<span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 text-xs font-bold">${areaInfo}</span>` : `<span class="text-gray-400 italic text-xs">Chưa gán shop</span>`;
        return `<tr class="hover:bg-slate-50 border-b">
            <td class="p-4"><div class="font-bold text-slate-800">${u.full_name || '...'}</div><div class="text-xs text-gray-500">${u.email}</div></td>
            <td class="p-4">${areaDisplay}</td>
            <td class="p-4"><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">${u.role || 'Sale'}</span></td>
            <td class="p-4 text-center"><span class="px-2 py-1 rounded text-[10px] font-black uppercase ${u.is_approved ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">${u.is_approved ? 'Hoạt Động' : 'Đã Khóa'}</span></td>
            <td class="p-4 text-center flex justify-center gap-2">
                <button onclick="openUserEdit('${u.id}', '${u.full_name}', '${u.role}', '${u.email}')" class="text-blue-500 hover:bg-blue-50 p-2 rounded" title="Sửa thông tin"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="resetUserPassword('${u.email}')" class="text-purple-600 hover:bg-purple-50 p-2 rounded" title="Gửi link khôi phục mật khẩu"><i class="fa-solid fa-key"></i></button>
                <button onclick="toggleApprove('${u.id}', ${u.is_approved})" class="${u.is_approved ? 'text-orange-500' : 'text-green-600'} hover:scale-110 transition p-2" title="Khóa/Mở khóa"><i class="fa-solid ${u.is_approved ? 'fa-lock' : 'fa-lock-open'}"></i></button>
                <button onclick="deleteUser('${u.id}')" class="text-red-500 hover:text-red-700 hover:scale-110 transition p-2" title="Xóa tài khoản"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`;
    }).join('');
}

function getAreaBySaleName(name) {
    if (!name) return null;
    const shops = Object.values(window.globalAdminShopMap || {}).filter(s => s.sale_name && s.sale_name.trim().toLowerCase() === name.trim().toLowerCase());
    if (shops.length === 0) return null;
    return [...new Set(shops.map(s => s.area))].join(", ");
}

export const openUserEdit = (id, name, role, email) => { $('edit_u_id').value = id; $('edit_u_name').value = name === 'null' ? '' : name; $('edit_u_role').value = role; $('edit_u_email').value = email; toggleModal('userEditModal'); }
export const submitUserEdit = async () => { const uid = $('edit_u_id').value; const { error } = await sb.from('profiles').update({ full_name: $('edit_u_name').value, role: $('edit_u_role').value }).eq('id', uid); if(error) alert("Lỗi: " + error.message); else { toggleModal('userEditModal'); loadUsers(); } }
export const toggleApprove = async (uid, s) => { await sb.from('profiles').update({ is_approved: !s }).eq('id', uid); loadUsers(); }
export const deleteUser = async (uid) => { if(confirm("Xóa người dùng?")) { await sb.from('profiles').delete().eq('id', uid); loadUsers(); } }

export const resetUserPassword = async (email) => {
    if(confirm(`Xác nhận gửi email khôi phục mật khẩu cho tài khoản: ${email} ?`)) {
        const { error } = await sb.auth.resetPasswordForEmail(email);
        if (error) alert("Lỗi: " + error.message);
        else alert(`✅ Đã gửi link khôi phục mật khẩu thành công tới email: ${email}`);
    }
}

// --- MASTER DATA ---
export async function loadMasterData() { 
    const { data } = await sb.from('master_shop_list').select('*').order('area', {ascending: true}); 
    $('shopCount').innerText = `${data?.length || 0} Shop`;
    
    $('masterBody').innerHTML = (data||[]).map(r => `
        <tr class="hover:bg-slate-50 border-b">
            <td class="p-4 font-bold text-orange-600 text-xs uppercase">${r.area || '-'}</td>
            <td class="p-4 text-xs font-mono text-slate-500">${r.svn_code || '-'}</td>
            <td class="p-4 font-bold text-sm">${r.shop_code}</td>
            <td class="p-4 text-sm font-bold text-slate-700">${r.shop_name}</td>
            <td class="p-4 text-xs">${r.province || '-'}</td>
            <td class="p-4 text-xs font-bold">${r.sale_name||'-'}</td>
            <td class="p-4 text-xs font-bold text-blue-600">${r.director_name||'-'}</td>
            <td class="p-4 text-xs font-bold text-orange-600">${r.regional_director||'-'}</td>
            <td class="p-4 text-center flex justify-center gap-2">
                <button onclick='openShopEdit(${JSON.stringify(r)})' class="text-blue-500 hover:bg-blue-50 p-2 rounded"><i class="fa-solid fa-pen"></i></button>
                <button onclick="deleteShop('${r.shop_code}')" class="text-red-500 hover:bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button>
            </td>
        </tr>`).join('');
}

export async function exportMasterData() {
    const { data } = await sb.from('master_shop_list').select('*').order('area');
    if (!data || data.length === 0) return alert("Chưa có dữ liệu!");
    
    const header = ["Khu Vực", "Mã Khách Hàng", "Mã DVN", "Tên Đại Lý", "Tỉnh/Thành", "Sale Phụ Trách", "GĐ Khu Vực", "GĐ Miền", "Loại Hình"];
    const rows = data.map(d => [ d.area, d.svn_code, d.shop_code, d.shop_name, d.province, d.sale_name, d.director_name, d.regional_director, d.shop_type ]);
    
    const wb = XLSX.utils.book_new(); 
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]); 
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachDaiLy"); 
    XLSX.writeFile(wb, "Master_Data_YADEA.xlsx");
}

export const deleteShop = async (code) => { if(confirm(`Xóa Shop ${code}?`)) { await sb.from('master_shop_list').delete().eq('shop_code', code); loadMasterData(); } }

export const openShopEdit = (s) => { 
    $('edit_s_code').value = s.shop_code; 
    $('edit_s_name').value = s.shop_name || ''; 
    $('edit_s_area').value = s.area || ''; 
    $('edit_s_svn').value = s.svn_code || ''; 
    $('edit_s_province').value = s.province || ''; 
    $('edit_s_sale').value = s.sale_name || ''; 
    $('edit_s_director').value = s.director_name || '';
    $('edit_s_regional_director').value = s.regional_director || ''; 
    toggleModal('shopEditModal'); 
}

export const submitShopEdit = async () => { 
    const payload = { 
        shop_name: $('edit_s_name').value, 
        area: $('edit_s_area').value, 
        svn_code: $('edit_s_svn').value, 
        province: $('edit_s_province').value, 
        sale_name: $('edit_s_sale').value,
        director_name: $('edit_s_director').value,
        regional_director: $('edit_s_regional_director').value 
    }; 
    const { error } = await sb.from('master_shop_list').update(payload).eq('shop_code', $('edit_s_code').value); 
    if(error) alert("Lỗi: " + error.message); 
    else { 
        toggleModal('shopEditModal'); 
        loadMasterData(); 
        alert("Cập nhật thông tin thành công!");
    } 
}

// --- PRICING ---
export async function loadPriceHistory() { const filterM = $('search_price_month').value; let q = sb.from('monthly_product_prices').select('*').order('report_month', {ascending:false}).order('model'); if(filterM) q = q.eq('report_month', filterM); const { data } = await q; if(data) $('priceBody').innerHTML = data.map(r => `<tr class="hover:bg-slate-50 border-b"><td class="p-4 font-bold text-slate-800">${r.report_month}</td><td class="p-4 font-bold text-slate-600">${r.model}</td><td class="p-4 text-right text-red-600 font-mono">${fmn(r.import_price)}</td><td class="p-4 text-right text-blue-600 font-mono">${fmn(r.selling_price)}</td><td class="p-4 text-center"><button onclick="openPriceEdit('${r.report_month}', '${r.model}', ${r.import_price}, ${r.selling_price})" class="text-blue-500 bg-blue-50 p-2 rounded"><i class="fa-solid fa-pen"></i></button> <button onclick="deletePrice('${r.report_month}', '${r.model}')" class="text-red-500 bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button></td></tr>`).join(''); }
export async function exportPriceData() { const filterM = $('search_price_month').value; let q = sb.from('monthly_product_prices').select('*').order('report_month', {ascending:false}).order('model'); if(filterM) q = q.eq('report_month', filterM); const { data } = await q; if (!data || data.length === 0) return alert("Không có dữ liệu!"); const header = ["Tháng", "Model", "Giá Nhập", "Giá Bán"]; const rows = data.map(d => [d.report_month, d.model, d.import_price, d.selling_price]); const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet([header, ...rows]); XLSX.utils.book_append_sheet(wb, ws, "BangGia"); XLSX.writeFile(wb, `Bang_Gia_${filterM || 'ALL'}.xlsx`); }
let currentEditPrice = {}; 
export const openPriceEdit = (m, mo, c, p) => { currentEditPrice={month:m, model:mo}; $('edit_p_key').value=`${m}-${mo}`; $('edit_p_cost').value=c; $('edit_p_price').value=p; toggleModal('priceEditModal'); }; 
export const submitPriceEdit = async () => { await sb.from('monthly_product_prices').update({ import_price: parseFloat($('edit_p_cost').value)||0, selling_price: parseFloat($('edit_p_price').value)||0 }).match({ report_month: currentEditPrice.month, model: currentEditPrice.model }); toggleModal('priceEditModal'); loadPriceHistory(); }
export const deletePrice = async (m, mo) => { if(confirm(`Xóa giá?`)) { await sb.from('monthly_product_prices').delete().match({ report_month: m, model: mo }); loadPriceHistory(); } }

export function initAdminEvents() {
    $('excelFile').onchange = async (e) => { 
        const file = e.target.files[0]; if(!file) return; 
        if(!confirm("Hệ thống sẽ đồng bộ thông tin bao gồm cả cột Giám Đốc Miền từ file Excel.\nBạn có muốn tiếp tục?")) return;
        
        $('uploadStatus').innerText = "Đang xử lý đồng bộ..."; 
        const reader = new FileReader(); 
        reader.onload = async (e) => { 
            try { 
                const wb = XLSX.read(new Uint8Array(e.target.result), {type:'array'}); 
                const jsonData = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
                
                const getVal = (row, ...kws) => {
                    const keys = Object.keys(row);
                    for (const k of keys) {
                        if (kws.some(kw => k.toLowerCase().trim() === kw.toLowerCase())) return row[k];
                    }
                    return undefined;
                }; 

                const { data: oldData } = await sb.from('master_shop_list').select('*');
                const oldMap = {};
                if(oldData) oldData.forEach(s => oldMap[s.shop_code] = s);

                const dbData = jsonData.map(row => {
                    const shop_code = getVal(row, 'mã dvn', 'shop code');
                    if (!shop_code) return null;

                    const old = oldMap[shop_code] || {}; 
                    let valSvn = getVal(row, 'mã svn', 'mã khách hàng', 'svn');
                    
                    return {
                        ...old, 
                        shop_code: shop_code,
                        area: getVal(row, 'khu vực') !== undefined ? getVal(row, 'khu vực') : old.area,
                        svn_code: valSvn !== undefined ? String(valSvn).trim() : old.svn_code,
                        shop_name: getVal(row, 'tên đại lý', 'tên shop') !== undefined ? getVal(row, 'tên đại lý', 'tên shop') : old.shop_name,
                        director_name: getVal(row, 'giám đốc', 'gđ khu vực', 'giám đốc vùng') !== undefined ? getVal(row, 'giám đốc', 'gđ khu vực', 'giám đốc vùng') : old.director_name,
                        regional_director: getVal(row, 'gđ miền', 'giám đốc miền', 'regional director') !== undefined ? getVal(row, 'gđ miền', 'giám đốc miền', 'regional director') : old.regional_director,
                        province: getVal(row, 'tỉnh/thành', 'tỉnh') !== undefined ? getVal(row, 'tỉnh/thành', 'tỉnh') : old.province,
                        shop_type: getVal(row, 'loại hình') !== undefined ? getVal(row, 'loại hình') : old.shop_type
                    };
                }).filter(x => x !== null);

                if (dbData.length === 0) throw new Error("File không có dữ liệu hợp lệ (Thiếu cột Mã DVN).");

                const { error } = await sb.from('master_shop_list').upsert(dbData); 
                if (error) throw error;

                $('uploadStatus').innerText = "Đồng bộ thành công!"; 
                loadMasterData(); 
            } catch(err) {
                $('uploadStatus').innerText = "Lỗi: " + err.message;
            } 
        }; 
        reader.readAsArrayBuffer(file); 
        e.target.value = '';
    };
    
    $('priceFile').onchange = (e) => { 
        const file = e.target.files[0]; if(!file) return;
        $('priceStatus').innerText = "Đang phân tích..."; const reader = new FileReader();
        reader.onload = async (e) => { 
            try { 
                const workbook = XLSX.read(new Uint8Array(e.target.result), {type: 'array'}); 
                const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
                
                const getVal = (row, ...kws) => { 
                    const keys = Object.keys(row); 
                    for(const k of keys) {
                        if(kws.some(kw => k.toLowerCase().includes(kw))) return row[k]; 
                    }
                    return null; 
                }; 
                
                const dbData = jsonData.map(row => {
                    let rawMonth = getVal(row, 'tháng', 'month', 'date', 'áp dụng');
                    let finalMonth = "";
                    
                    if (typeof rawMonth === 'number' && rawMonth > 10000) {
                        const dateObj = new Date(Math.round((rawMonth - 25569) * 86400 * 1000));
                        finalMonth = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
                    } else {
                        finalMonth = formatMonth(rawMonth); 
                    }

                    return { 
                        report_month: finalMonth, 
                        model: getVal(row, 'model', 'loại xe', 'tên xe', 'dòng xe'), 
                        import_price: getVal(row, 'giá nhập', 'cost', 'import') || 0, 
                        selling_price: getVal(row, 'giá bán', 'price', 'sell') || 0 
                    };
                }).filter(x => x.report_month && x.model);

                if(dbData.length === 0) { 
                    $('priceStatus').innerText = "Lỗi: File trống hoặc sai tên cột (Cần cột Tháng, Model, Giá nhập, Giá bán)!"; 
                    return; 
                } 
                
                const monthsInFile = [...new Set(dbData.map(item => item.report_month))]; 
                if(!confirm(`Hệ thống tìm thấy dữ liệu giá của (các) tháng: ${monthsInFile.join(', ')}.\nXóa giá cũ của các tháng này và nạp giá mới?`)) { 
                    $('priceStatus').innerText = "Đã hủy."; return; 
                } 
                
                for (const m of monthsInFile) { 
                    await sb.from('monthly_product_prices').delete().eq('report_month', m); 
                } 
                
                const { error } = await sb.from('monthly_product_prices').insert(dbData);
                
                if(error) $('priceStatus').innerText = "Lỗi: " + error.message; 
                else { 
                    $('priceStatus').innerText = "✅ Thành công!"; 
                    loadPriceHistory(); 
                } 
            } catch(err) { 
                $('priceStatus').innerText = "Lỗi file: " + err.message; 
            } 
        }; 
        reader.readAsArrayBuffer(file); 
        e.target.value = '';
    };
}

// ==========================================
// THIẾT LẬP TARGET (ĐÃ FIX THEO NVKD)
// ==========================================

window.currentViewTargets = [];

export function initTargetFilters() {
    const directors = [...new Set(Object.values(window.globalAdminShopMap || {}).map(s => s.director_name).filter(n => n))].sort();
    const dirEl = $('tgt_director');
    if (dirEl) dirEl.innerHTML = `<option value="">-- Tất cả GĐ --</option>` + directors.map(d => `<option value="${d}">${d}</option>`).join(''); 
    updateTargetFilterChain('director');
}

export function updateTargetFilterChain(level) {
    const selDir = $('tgt_director') ? $('tgt_director').value : ''; 
    const kw = $('target_search') ? $('target_search').value.toLowerCase().trim() : '';
    
    // Nhóm Master Data để lấy danh sách NVKD duy nhất
    const salesMap = {};
    Object.values(window.globalAdminShopMap || {}).forEach(s => {
        if (!s.sale_name) return;
        if (!salesMap[s.sale_name]) {
            salesMap[s.sale_name] = { sale_name: s.sale_name, director_name: s.director_name };
        }
    });

    let filteredSales = Object.values(salesMap);

    // Lọc theo Giám đốc
    if(selDir) filteredSales = filteredSales.filter(s => s.director_name === selDir);
    
    if(level === 'director') { 
        const saleNames = [...new Set(filteredSales.map(s => s.sale_name))].sort();
        const saleEl = $('tgt_sale');
        if(saleEl) {
            saleEl.innerHTML = `<option value="">-- Tất cả NVKD --</option>` + saleNames.map(s => `<option value="${s}">${s}</option>`).join(''); 
            saleEl.value = "";
        }
    } 
    
    // Lọc theo NVKD
    const selSale = $('tgt_sale') ? $('tgt_sale').value : '';
    if(selSale) filteredSales = filteredSales.filter(s => s.sale_name === selSale); 
    
    // Tìm kiếm (theo tên NVKD hoặc Giám đốc)
    if (kw) { 
        filteredSales = filteredSales.filter(s => (s.sale_name || '').toLowerCase().includes(kw) || (s.director_name || '').toLowerCase().includes(kw)); 
    }

    const allowedSales = new Set(filteredSales.map(s => s.sale_name));
    const finalTargets = window.currentViewTargets.filter(t => allowedSales.has(t.sale_name));
    
    renderTargetTable(finalTargets);
}

export function resetTargetFilters() { 
    if($('tgt_director')) $('tgt_director').value = ""; 
    if($('target_search')) $('target_search').value = ""; 
    updateTargetFilterChain('director'); 
}

export async function loadTargets() {
    let month = $('target_month').value;
    if (!month) { 
        const d = new Date(); 
        month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`; 
        if($('target_month')) $('target_month').value = month; 
    }
    
    // Gọi dữ liệu từ bảng mới: monthly_sale_targets
    const { data: dbTargets, error } = await sb.from('monthly_sale_targets').select('*').eq('report_month', month);
    if(error) console.error("Lỗi tải target:", error);

    const targetMap = {}; 
    if (dbTargets) dbTargets.forEach(t => targetMap[t.sale_name] = t);
    
    // Lấy danh sách NVKD từ Master Data
    const salesMap = {};
    Object.values(window.globalAdminShopMap || {}).forEach(s => {
        if (!s.sale_name) return;
        if (!salesMap[s.sale_name]) {
            salesMap[s.sale_name] = { sale_name: s.sale_name, director_name: s.director_name };
        }
    });

    const uniqueSales = Object.values(salesMap).sort((a, b) => a.sale_name.localeCompare(b.sale_name));
    
    window.currentViewTargets = uniqueSales.map(s => {
        const t = targetMap[s.sale_name] || {};
        return { 
            sale_name: s.sale_name, 
            director_name: s.director_name, 
            targets: { 
                target_si: t.target_si || 0,
                target_so: t.target_so || 0
            } 
        };
    });
    updateTargetFilterChain('load');
}

function renderTargetTable(data) {
    const tbody = $('targetBody');
    const tfoot = $('targetFooter');
    
    if(!tbody) return;

    if(data.length === 0) { 
        tbody.innerHTML = `<tr><td colspan="4" class="p-6 text-center text-gray-500 font-bold">Không tìm thấy Nhân viên kinh doanh phù hợp.</td></tr>`; 
        if(tfoot) tfoot.classList.add('hidden');
        return; 
    }
    
    let totalSI = 0, totalSO = 0;

    tbody.innerHTML = data.map(s => {
        totalSI += parseInt(s.targets.target_si) || 0;
        totalSO += parseInt(s.targets.target_so) || 0;

        return `
        <tr class="hover:bg-slate-50 border-b">
            <td class="p-4">
                <div class="font-bold text-sm text-slate-800">${s.sale_name}</div>
            </td>
            <td class="p-4">
                <div class="text-xs font-bold text-blue-600 bg-blue-50 inline-block px-2 py-1 rounded border border-blue-100">${s.director_name || 'Chưa gán GĐ'}</div>
            </td>
            <td class="p-4 text-center bg-blue-50/50 border-l border-blue-100">
                <input type="number" onchange="window.updateLocalTarget('${s.sale_name}', 'target_si', this.value)" value="${s.targets.target_si}" class="w-24 border border-blue-200 rounded-lg text-center text-sm font-black text-blue-600 focus:border-blue-500 outline-none p-2 shadow-inner bg-white transition-colors">
            </td>
            <td class="p-4 text-center bg-orange-50/50 border-l border-orange-100">
                <input type="number" onchange="window.updateLocalTarget('${s.sale_name}', 'target_so', this.value)" value="${s.targets.target_so}" class="w-24 border border-orange-200 rounded-lg text-center text-sm font-black text-orange-600 focus:border-orange-500 outline-none p-2 shadow-inner bg-white transition-colors">
            </td>
        </tr>`;
    }).join('');

    // Hiển thị dòng tổng cộng
    const selDir = $('tgt_director') ? $('tgt_director').value : '';
    if (selDir && tfoot) {
        tfoot.innerHTML = `
            <tr>
                <td class="p-4 text-right" colspan="2">TỔNG TARGET CỦA GĐ: ${selDir}</td>
                <td class="p-4 text-center text-blue-400 text-base font-black">${totalSI}</td>
                <td class="p-4 text-center text-orange-400 text-base font-black">${totalSO}</td>
            </tr>
        `;
        tfoot.classList.remove('hidden');
    } else if (tfoot) {
        tfoot.classList.add('hidden');
    }
}

export function updateLocalTarget(saleName, field, value) { 
    const item = window.currentViewTargets.find(x => x.sale_name === saleName); 
    if (item) { 
        item.targets[field] = parseInt(value) || 0; 
        updateTargetFilterChain('calc'); 
    } 
}

export async function saveAllTargets() {
    const month = $('target_month') ? $('target_month').value : ''; 
    if (!month) return alert("Vui lòng chọn tháng Target!");
    
    if (!confirm(`Xác nhận LƯU TOÀN BỘ Target cho tháng ${month}?`)) return;
    
    // Fix lỗi Event lấy nút đang bấm (Tương thích module)
    const btn = window.event ? window.event.currentTarget || window.event.srcElement : document.activeElement; 
    let oldText = "Lưu Target";
    if(btn && btn.tagName === 'BUTTON') {
        oldText = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...`; 
        btn.disabled = true;
    }

    // Lọc lại các NVKD có điền Target S.I hoặc S.O
    const payload = window.currentViewTargets
        .filter(s => s.targets.target_si > 0 || s.targets.target_so > 0)
        .map(s => ({ 
            report_month: month, 
            sale_name: s.sale_name, 
            director_name: s.director_name,
            target_si: s.targets.target_si,
            target_so: s.targets.target_so
        }));

    if(payload.length === 0) { 
        alert("Chưa có Target nào được nhập!"); 
        if(btn && btn.tagName === 'BUTTON') { btn.innerHTML = oldText; btn.disabled = false; }
        return; 
    }
    
    // Lưu vào bảng monthly_sale_targets
    const { error } = await sb.from('monthly_sale_targets').upsert(payload, { onConflict: 'report_month, sale_name' });
    
    if(btn && btn.tagName === 'BUTTON') { btn.innerHTML = oldText; btn.disabled = false; }
    
    if (error) alert("Lỗi khi lưu Target: " + error.message);
    else alert(`✅ Đã lưu thành công Target tháng ${month} cho ${payload.length} Nhân viên kinh doanh!`);
}

// BƯỚC QUAN TRỌNG: Gắn tất cả các hàm ra đối tượng window để HTML đọc được
window.initTargetFilters = initTargetFilters;
window.updateTargetFilterChain = updateTargetFilterChain;
window.resetTargetFilters = resetTargetFilters;
window.loadTargets = loadTargets;
window.updateLocalTarget = updateLocalTarget;
window.saveAllTargets = saveAllTargets;

// ==========================================
// CẬP NHẬT TIẾN ĐỘ SELL-IN
// ==========================================

window.currentSellinData = [];

export async function loadSellinData() {
    const dateStr = $('si_date').value;
    if (!dateStr) return;
    
    const [y, m, d] = dateStr.split('-');
    const reportMonth = `${y}-${m}`;
    $('si_th_date').innerText = `DỮ LIỆU NGÀY: ${d}/${m}`;
    
    $('sellinBody').innerHTML = `<tr><td colspan="12" class="p-8 text-center"><i class="fa-solid fa-spinner fa-spin text-orange-500 text-2xl"></i></td></tr>`;

    // 1. Lấy Target S.I của tháng (Group theo Giám Đốc)
    const { data: targets } = await sb.from('monthly_sale_targets').select('director_name, target_si').eq('report_month', reportMonth);
    const targetMap = {};
    (targets || []).forEach(t => {
        if(t.director_name) {
            targetMap[t.director_name] = (targetMap[t.director_name] || 0) + (parseInt(t.target_si) || 0);
        }
    });

    // 2. Lấy dữ liệu Lũy kế (Tất cả các ngày trong tháng <= Ngày đang chọn)
    const startDate = `${reportMonth}-01`;
    const { data: monthData } = await sb.from('daily_sellin')
        .select('*')
        .gte('report_date', startDate)
        .lte('report_date', dateStr);

    // Tính Lũy kế trước đó (Chưa tính ngày hiện tại) và Dữ liệu ngày hiện tại
    const prevLuyKe = {};
    const todayData = {};

    (monthData || []).forEach(row => {
        if (!prevLuyKe[row.director_name]) {
            prevLuyKe[row.director_name] = { paid: 0, export: 0, area: row.area };
        }
        
        if (row.report_date === dateStr) {
            todayData[row.director_name] = { paid: row.paid_qty || 0, export: row.exported_qty || 0 };
        } else {
            prevLuyKe[row.director_name].paid += (row.paid_qty || 0);
            prevLuyKe[row.director_name].export += (row.exported_qty || 0);
        }
    });

    // Lấy danh sách Giám đốc và Khu vực từ Master Data nếu DB chưa có
    const directorAreaMap = {};
    Object.values(window.globalAdminShopMap || {}).forEach(s => {
        if (s.director_name && s.area) {
            directorAreaMap[s.director_name] = s.area;
        }
    });

    // 3. Xây dựng mảng dữ liệu tính toán
    const allDirectors = [...new Set([...Object.keys(targetMap), ...Object.keys(directorAreaMap)])].filter(n => n);
    
    window.currentSellinData = allDirectors.map(dir => {
        const tgt = targetMap[dir] || 0;
        const prevP = prevLuyKe[dir]?.paid || 0;
        const prevE = prevLuyKe[dir]?.export || 0;
        const todP = todayData[dir]?.paid || 0;
        const todE = todayData[dir]?.export || 0;
        const area = prevLuyKe[dir]?.area || directorAreaMap[dir] || 'Chưa phân vùng';

        return {
            director: dir,
            area: area,
            target: tgt,
            prev_paid: prevP,
            prev_export: prevE,
            today_paid: todP,
            today_export: todE,
            total_paid: 0,
            total_export: 0,
            unexported: 0,
            paid_rate: 0,
            export_rate: 0,
            rank: 0
        };
    });

    calcAndRenderSellin();
}

function calcAndRenderSellin() {
    // Tính toán số liệu
    window.currentSellinData.forEach(d => {
        d.total_paid = d.prev_paid + d.today_paid;
        d.total_export = d.prev_export + d.today_export;
        d.unexported = d.total_paid - d.total_export; 
        
        d.paid_rate = d.target > 0 ? (d.total_paid / d.target * 100) : 0;
        d.export_rate = d.target > 0 ? (d.total_export / d.target * 100) : 0;
    });

    // Xếp hạng dựa trên Tỷ lệ hoàn thành (Export Rate)
    const sortedForRank = [...window.currentSellinData].sort((a, b) => b.export_rate - a.export_rate);
    sortedForRank.forEach((item, index) => {
        const realItem = window.currentSellinData.find(x => x.director === item.director);
        realItem.rank = index + 1;
    });

    // Render bảng 
    const displayData = [...window.currentSellinData].sort((a, b) => a.rank - b.rank);

    $('sellinBody').innerHTML = displayData.map((d, index) => {
        let rankColor = 'text-gray-500';
        if(d.rank === 1) rankColor = 'text-red-500 font-black text-lg';
        else if(d.rank === 2) rankColor = 'text-orange-500 font-black text-base';
        else if(d.rank === 3) rankColor = 'text-blue-500 font-black text-base';

        return `
            <tr class="hover:bg-slate-50 border-b">
                <td class="p-3 border-r">${index + 1}</td>
                <td class="p-3 border-r text-left font-bold text-slate-800">${d.director}</td>
                <td class="p-3 border-r text-left text-xs font-bold">${d.area}</td>
                <td class="p-3 border-r font-mono">${d.target}</td>
                
                <td class="p-2 border-r bg-orange-50/30">
                    <input type="number" oninput="window.updateSellinInput('${d.director}', 'today_paid', this.value)" value="${d.today_paid || ''}" class="w-16 border border-gray-200 rounded text-center text-sm font-bold focus:border-orange-500 outline-none p-1.5 shadow-inner">
                </td>
                <td class="p-2 border-r bg-orange-50/30">
                    <input type="number" oninput="window.updateSellinInput('${d.director}', 'today_export', this.value)" value="${d.today_export || ''}" class="w-16 border border-gray-200 rounded text-center text-sm font-bold focus:border-orange-500 outline-none p-1.5 shadow-inner">
                </td>
                
                <td class="p-3 border-r font-black text-slate-700">${d.total_paid}</td>
                <td class="p-3 border-r font-black text-yellow-700 bg-yellow-50/50">${d.total_export}</td>
                <td class="p-3 border-r font-black text-red-500">${d.unexported}</td>
                <td class="p-3 border-r font-bold">${d.paid_rate.toFixed(1)}%</td>
                <td class="p-3 border-r font-bold">${d.export_rate.toFixed(1)}%</td>
                <td class="p-3 bg-indigo-50/30 ${rankColor}">${d.rank}</td>
            </tr>
        `;
    }).join('');
}

window.updateSellinInput = function(director, field, value) {
    const item = window.currentSellinData.find(x => x.director === director);
    if(item) {
        item[field] = parseInt(value) || 0;
        calcAndRenderSellin(); 
    }
};

window.saveSellinData = async function() {
    const dateStr = $('si_date').value;
    if (!dateStr) return alert("Vui lòng chọn ngày nhập liệu!");

    const payload = window.currentSellinData
        .filter(d => d.today_paid > 0 || d.today_export > 0)
        .map(d => ({
            report_date: dateStr,
            director_name: d.director,
            area: d.area,
            paid_qty: d.today_paid,
            exported_qty: d.today_export
        }));

    if(payload.length === 0) return alert("Chưa có số liệu thanh toán hoặc xuất hàng nào được nhập!");

    const btn = window.event ? window.event.currentTarget || window.event.srcElement : document.activeElement; 
    let oldText = "Lưu Số Liệu";
    if(btn && btn.tagName === 'BUTTON') {
        oldText = btn.innerHTML;
        btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...`; 
        btn.disabled = true;
    }

    const { error } = await sb.from('daily_sellin').upsert(payload, { onConflict: 'report_date, director_name' });

    if(btn && btn.tagName === 'BUTTON') { btn.innerHTML = oldText; btn.disabled = false; }

    if (error) alert("Lỗi khi lưu: " + error.message);
    else alert(`✅ Đã lưu thành công dữ liệu Sell-In ngày ${dateStr}!`);
};

window.loadSellinData = loadSellinData;