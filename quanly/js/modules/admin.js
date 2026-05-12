import { $, fmn, formatMonth, toggleModal } from '../core/utils.js';
import { sb } from '../core/supabase.js';

// --- USERS ---
export async function loadUsers() {
    const { data: users, error } = await sb.from('profiles').select('*');
    if (error) { $('userTableBody').innerHTML = `<tr><td colspan="5" class="p-4 text-center text-red-600 font-bold bg-red-50">LỖI: ${error.message}</td></tr>`; return; }
    if (!users || users.length === 0) { $('userTableBody').innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Chưa có dữ liệu.</td></tr>`; return; }
    
    $('userTableBody').innerHTML = users.map(u => {
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
        </tr>`
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

// HÀM GỬI EMAIL KHÔI PHỤC MẬT KHẨU
export const resetUserPassword = async (email) => {
    if(confirm(`Xác nhận gửi email khôi phục mật khẩu cho tài khoản: ${email} ?`)) {
        const { error } = await sb.auth.resetPasswordForEmail(email);
        if (error) {
            alert("Lỗi: " + error.message);
        } else {
            alert(`✅ Đã gửi link tạo mật khẩu mới tới email: ${email}\nVui lòng yêu cầu nhân sự kiểm tra hộp thư đến (hoặc mục Spam).`);
        }
    }
}

// --- MASTER DATA ---
export async function loadMasterData() { 
    const { data } = await sb.from('master_shop_list').select('*').order('area', {ascending: true}); 
    $('shopCount').innerText = `${data?.length || 0} Shop`;
    
    $('masterBody').innerHTML = (data||[]).map(r => `<tr class="hover:bg-slate-50 border-b"><td class="p-4 font-bold text-orange-600 text-xs uppercase">${r.area || '-'}</td><td class="p-4 text-xs font-mono text-slate-500">${r.svn_code || '-'}</td><td class="p-4 font-bold text-sm">${r.shop_code}</td><td class="p-4 text-sm font-bold text-slate-700">${r.shop_name}</td><td class="p-4 text-xs">${r.province || '-'}</td><td class="p-4 text-xs font-bold">${r.sale_name||'-'}</td><td class="p-4 text-xs font-bold text-blue-600">${r.director_name||'-'}</td><td class="p-4 text-center flex justify-center gap-2"><button onclick='openShopEdit(${JSON.stringify(r)})' class="text-blue-500 hover:bg-blue-50 p-2 rounded"><i class="fa-solid fa-pen"></i></button><button onclick="deleteShop('${r.shop_code}')" class="text-red-500 hover:bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
}

export async function exportMasterData() {
    const { data } = await sb.from('master_shop_list').select('*').order('area');
    if (!data || data.length === 0) return alert("Chưa có dữ liệu!");
    const header = ["Khu Vực", "Mã Khách Hàng", "Mã DVN", "Tên Đại Lý", "Tỉnh/Thành", "Sale Phụ Trách", "Giám Đốc", "Loại Hình"];
    const rows = data.map(d => [ d.area, d.svn_code, d.shop_code, d.shop_name, d.province, d.sale_name, d.director_name, d.shop_type ]);
    const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet([header, ...rows]); XLSX.utils.book_append_sheet(wb, ws, "DanhSachDaiLy"); XLSX.writeFile(wb, "Master_Data_YADEA.xlsx");
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
    toggleModal('shopEditModal'); 
}

export const submitShopEdit = async () => { 
    const payload = { 
        shop_name: $('edit_s_name').value, 
        area: $('edit_s_area').value, 
        svn_code: $('edit_s_svn').value, 
        province: $('edit_s_province').value, 
        sale_name: $('edit_s_sale').value,
        director_name: $('edit_s_director').value
    }; 
    const { error } = await sb.from('master_shop_list').update(payload).eq('shop_code', $('edit_s_code').value); 
    if(error) alert("Lỗi: " + error.message); 
    else { 
        toggleModal('shopEditModal'); 
        loadMasterData(); 
        alert("Cập nhật thành công! Vui lòng F5 (Tải lại trang) để Bộ lọc nhận diện dữ liệu mới.");
    } 
}

// --- PRICING ---
export async function loadPriceHistory() { const filterM = $('search_price_month').value; let q = sb.from('monthly_product_prices').select('*').order('report_month', {ascending:false}).order('model'); if(filterM) q = q.eq('report_month', filterM); const { data } = await q; if(data) $('priceBody').innerHTML = data.map(r => `<tr class="hover:bg-slate-50 border-b"><td class="p-4 font-bold text-slate-800">${r.report_month}</td><td class="p-4 font-bold text-slate-600">${r.model}</td><td class="p-4 text-right text-red-600 font-mono">${fmn(r.import_price)}</td><td class="p-4 text-right text-blue-600 font-mono">${fmn(r.selling_price)}</td><td class="p-4 text-center"><button onclick="openPriceEdit('${r.report_month}', '${r.model}', ${r.import_price}, ${r.selling_price})" class="text-blue-500 bg-blue-50 p-2 rounded"><i class="fa-solid fa-pen"></i></button> <button onclick="deletePrice('${r.report_month}', '${r.model}')" class="text-red-500 bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button></td></tr>`).join(''); }
export async function exportPriceData() { const filterM = $('search_price_month').value; let q = sb.from('monthly_product_prices').select('*').order('report_month', {ascending:false}).order('model'); if(filterM) q = q.eq('report_month', filterM); const { data } = await q; if (!data || data.length === 0) return alert("Không có dữ liệu!"); const header = ["Tháng", "Model", "Giá Nhập", "Giá Bán"]; const rows = data.map(d => [d.report_month, d.model, d.import_price, d.selling_price]); const wb = XLSX.utils.book_new(); const ws = XLSX.utils.aoa_to_sheet([header, ...rows]); XLSX.utils.book_append_sheet(wb, ws, "BangGia"); XLSX.writeFile(wb, `Bang_Gia_${filterM || 'ALL'}.xlsx`); }
let currentEditPrice = {}; 
export const openPriceEdit = (m, mo, c, p) => { currentEditPrice={month:m, model:mo}; $('edit_p_key').value=`${m}-${mo}`; $('edit_p_cost').value=c; $('edit_p_price').value=p; toggleModal('priceEditModal'); }; 
export const submitPriceEdit = async () => { await sb.from('monthly_product_prices').update({ import_price: parseFloat($('edit_p_cost').value)||0, selling_price: parseFloat($('edit_p_price').value)||0 }).match({ report_month: currentEditPrice.month, model: currentEditPrice.model }); toggleModal('priceEditModal'); loadPriceHistory(); }
export const deletePrice = async (m, mo) => { if(confirm(`Xóa giá?`)) { await sb.from('monthly_product_prices').delete().match({ report_month: m, model: mo }); loadPriceHistory(); } }

// --- EVENT HANDLERS FOR FILE UPLOAD ---
export function initAdminEvents() {
    $('excelFile').onchange = async (e) => { 
        const file = e.target.files[0]; if(!file) return; 
        if(!confirm("Hệ thống sẽ TỰ ĐỘNG ĐỒNG BỘ dữ liệu mới từ file Excel (Cập nhật Mã SVN và giữ nguyên các thông tin cũ).\nBạn có muốn tiếp tục?")) return;
        
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
                        director_name: getVal(row, 'giám đốc') !== undefined ? getVal(row, 'giám đốc') : old.director_name,
                        sale_name: getVal(row, 'sale phụ trách', 'sale') !== undefined ? getVal(row, 'sale phụ trách', 'sale') : old.sale_name,
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
// THIẾT LẬP TARGET CỬA HÀNG (CÓ LỌC ĐA TẦNG)
// ==========================================

window.currentViewTargets = [];

export function initTargetFilters() {
    const directors = [...new Set(Object.values(window.globalAdminShopMap).map(s => s.director_name).filter(n => n))].sort();
    $('tgt_director').innerHTML = `<option value="">-- Tất cả --</option>` + directors.map(d => `<option value="${d}">${d}</option>`).join(''); 
    updateTargetFilterChain('director');
}

export function updateTargetFilterChain(level) {
    const selDir = $('tgt_director').value; 
    const selSale = $('tgt_sale').value;
    const selSVN = $('tgt_svn').value; 
    const kw = $('target_search').value.toLowerCase().trim();
    
    let filteredShops = Object.values(window.globalAdminShopMap); 
    
    if(selDir) filteredShops = filteredShops.filter(s => s.director_name === selDir);
    
    if(level === 'director') { 
        const sales = [...new Set(filteredShops.map(s => s.sale_name).filter(n => n))].sort();
        $('tgt_sale').innerHTML = `<option value="">-- Tất cả --</option>` + sales.map(s => `<option value="${s}">${s}</option>`).join(''); 
        $('tgt_sale').value = "";
    } 
    
    if($('tgt_sale').value) filteredShops = filteredShops.filter(s => s.sale_name === $('tgt_sale').value); 
    
    if(level === 'director' || level === 'sale') { 
        const svns = [...new Set(filteredShops.map(s => s.svn_code).filter(n => n))].sort();
        $('tgt_svn').innerHTML = `<option value="">-- Tất cả --</option>` + svns.map(s => `<option value="${s}">${s}</option>`).join(''); 
        $('tgt_svn').value = "";
    } 
    
    if($('tgt_svn').value) filteredShops = filteredShops.filter(s => s.svn_code === $('tgt_svn').value);

    // Xử lý tìm kiếm bằng Text
    if (kw) {
        filteredShops = filteredShops.filter(s => 
            (s.shop_name || '').toLowerCase().includes(kw) || 
            (s.shop_code || '').toLowerCase().includes(kw)
        );
    }

    // Sau khi có list mã Shop hợp lệ từ Bộ lọc, tiến hành render Target
    const allowedShopCodes = new Set(filteredShops.map(s => s.shop_code));
    const finalTargets = window.currentViewTargets.filter(t => allowedShopCodes.has(t.shop_code));
    
    renderTargetTable(finalTargets);
}

export function resetTargetFilters() {
    $('tgt_director').value = "";
    $('target_search').value = "";
    updateTargetFilterChain('director');
}

export async function loadTargets() {
    let month = $('target_month').value;
    if (!month) {
        const d = new Date();
        month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        $('target_month').value = month;
    }

    const { data: dbTargets } = await sb.from('monthly_shop_targets').select('*').eq('report_month', month);
    const targetMap = {};
    if (dbTargets) dbTargets.forEach(t => targetMap[t.shop_code] = t);

    const shops = Object.values(window.globalAdminShopMap || {}).sort((a, b) => a.shop_name.localeCompare(b.shop_name));
    
    window.currentViewTargets = shops.map(s => {
        const t = targetMap[s.shop_code] || {};
        return { 
            ...s, 
            targets: {
                target_so: t.target_so || 0,
                target_report: t.target_report || 0,
                target_traffic: t.target_traffic || 0,
                target_video: t.target_video || 0,
                target_view: t.target_view || 0,
                target_livestream: t.target_livestream || 0
            } 
        };
    });

    // Sau khi tải dữ liệu xong, áp dụng lại các bộ lọc hiện tại để render
    updateTargetFilterChain('load');
}

function renderTargetTable(data) {
    if(data.length === 0) {
        $('targetBody').innerHTML = `<tr><td colspan="7" class="p-6 text-center text-gray-500">Không tìm thấy cửa hàng nào phù hợp với bộ lọc.</td></tr>`;
        return;
    }

    $('targetBody').innerHTML = data.map(s => `
        <tr class="hover:bg-slate-50 border-b">
            <td class="p-4">
                <div class="font-bold text-sm text-slate-800">${s.shop_name}</div>
                <div class="text-[10px] text-gray-500 font-mono bg-gray-100 inline-block px-1 rounded mt-1">${s.shop_code}</div>
            </td>
            <td class="p-4 text-center bg-orange-50/50"><input type="number" onchange="updateLocalTarget('${s.shop_code}', 'target_so', this.value)" value="${s.targets.target_so}" class="w-16 border border-orange-200 rounded text-center text-sm font-bold text-orange-600 focus:border-orange-500 outline-none p-1.5 shadow-inner"></td>
            <td class="p-4 text-center"><input type="number" onchange="updateLocalTarget('${s.shop_code}', 'target_report', this.value)" value="${s.targets.target_report}" class="w-16 border border-blue-200 rounded text-center text-sm font-bold text-blue-600 focus:border-blue-500 outline-none p-1.5 shadow-inner"></td>
            <td class="p-4 text-center bg-green-50/50"><input type="number" onchange="updateLocalTarget('${s.shop_code}', 'target_traffic', this.value)" value="${s.targets.target_traffic}" class="w-16 border border-green-200 rounded text-center text-sm font-bold text-green-600 focus:border-green-500 outline-none p-1.5 shadow-inner"></td>
            <td class="p-4 text-center"><input type="number" onchange="updateLocalTarget('${s.shop_code}', 'target_video', this.value)" value="${s.targets.target_video}" class="w-16 border border-pink-200 rounded text-center text-sm font-bold text-pink-600 focus:border-pink-500 outline-none p-1.5 shadow-inner"></td>
            <td class="p-4 text-center bg-purple-50/50"><input type="number" onchange="updateLocalTarget('${s.shop_code}', 'target_view', this.value)" value="${s.targets.target_view}" class="w-16 border border-purple-200 rounded text-center text-sm font-bold text-purple-600 focus:border-purple-500 outline-none p-1.5 shadow-inner"></td>
            <td class="p-4 text-center"><input type="number" onchange="updateLocalTarget('${s.shop_code}', 'target_livestream', this.value)" value="${s.targets.target_livestream}" class="w-16 border border-red-200 rounded text-center text-sm font-bold text-red-600 focus:border-red-500 outline-none p-1.5 shadow-inner"></td>
        </tr>
    `).join('');
}

export function updateLocalTarget(shopCode, field, value) {
    const item = window.currentViewTargets.find(x => x.shop_code === shopCode);
    if (item) {
        item.targets[field] = parseInt(value) || 0;
    }
}

export async function saveAllTargets() {
    const month = $('target_month').value;
    if (!month) return alert("Vui lòng chọn tháng Target!");
    if (!confirm(`Xác nhận LƯU TOÀN BỘ Target cho tháng ${month}?`)) return;

    const btn = event.currentTarget;
    const oldText = btn.innerHTML;
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Đang lưu...`;
    btn.disabled = true;

    const payload = window.currentViewTargets
        .filter(s => Object.values(s.targets).some(v => v > 0))
        .map(s => ({
            report_month: month,
            shop_code: s.shop_code,
            target_so: s.targets.target_so,
            target_report: s.targets.target_report,
            target_traffic: s.targets.target_traffic,
            target_video: s.targets.target_video,
            target_view: s.targets.target_view,
            target_livestream: s.targets.target_livestream
        }));

    if(payload.length === 0) {
        alert("Chưa có Target nào được nhập!");
        btn.innerHTML = oldText; btn.disabled = false;
        return;
    }

    const { error } = await sb.from('monthly_shop_targets').upsert(payload, { onConflict: 'report_month, shop_code' });

    btn.innerHTML = oldText;
    btn.disabled = false;

    if (error) {
        alert("Lỗi khi lưu Target: " + error.message);
    } else {
        alert(`✅ Đã lưu thành công Target tháng ${month} cho ${payload.length} Cửa hàng!`);
    }
}