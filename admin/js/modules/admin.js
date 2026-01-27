import { $, fmn, formatMonth, toggleModal } from '../core/utils.js';
import { sb } from '../core/supabase.js';

// --- USERS ---
export async function loadUsers() {
      const { data: users, error } = await sb.from('profiles').select('*').order('created_at', { ascending: false });
      if(error || !users || users.length === 0) { $('userTableBody').innerHTML = `<tr><td colspan="5" class="p-4 text-center text-gray-500">Chưa có dữ liệu.</td></tr>`; return;
      }
      $('userTableBody').innerHTML = users.map(u => {
          const areaInfo = getAreaBySaleName(u.full_name);
          const areaDisplay = areaInfo ? `<span class="bg-purple-100 text-purple-700 px-2 py-0.5 rounded border border-purple-200 text-xs font-bold">${areaInfo}</span>` : `<span class="text-gray-400 italic text-xs">Chưa gán shop</span>`;
          return `<tr class="hover:bg-slate-50 border-b">
            <td class="p-4"><div class="font-bold text-slate-800">${u.full_name || '...'}</div><div class="text-xs text-gray-500">${u.email}</div></td>
            <td class="p-4">${areaDisplay}</td>
            <td class="p-4"><span class="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-bold border border-blue-100">${u.role || 'Sale'}</span></td>
            <td class="p-4 text-center"><span class="px-2 py-1 rounded text-[10px] font-black uppercase ${u.is_approved ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}">${u.is_approved ? 'Hoạt Động' : 'Đã Khóa'}</span></td>
            <td class="p-4 text-center flex justify-center gap-2">
                <button onclick="openUserEdit('${u.id}', '${u.full_name}', '${u.role}', '${u.email}')" class="text-blue-500 hover:bg-blue-50 p-2 rounded" title="Sửa tên để khớp"><i class="fa-solid fa-pen-to-square"></i></button>
                <button onclick="toggleApprove('${u.id}', ${u.is_approved})" class="${u.is_approved ?
                'text-orange-500' : 'text-green-600'} hover:scale-110 transition"><i class="fa-solid ${u.is_approved ? 'fa-lock' : 'fa-lock-open'}"></i></button>
                <button onclick="deleteUser('${u.id}')" class="text-red-500 hover:text-red-700 hover:scale-110 transition"><i class="fa-solid fa-trash"></i></button>
            </td>
          </tr>`
      }).join('');
}

function getAreaBySaleName(name) {
    if (!name) return null;
    const shops = Object.values(window.globalAdminShopMap || {}).filter(s => s.sale_name && s.sale_name.trim().toLowerCase() === name.trim().toLowerCase());
    if (shops.length === 0) return null;
    const areas = [...new Set(shops.map(s => s.area))];
    return areas.join(", ");
}

export const openUserEdit = (id, name, role, email) => {
    $('edit_u_id').value = id; $('edit_u_name').value = name === 'null' ? '' : name;
    $('edit_u_role').value = role; $('edit_u_email').value = email; toggleModal('userEditModal');
}
export const submitUserEdit = async () => {
    const uid = $('edit_u_id').value;
    const payload = { full_name: $('edit_u_name').value, role: $('edit_u_role').value };
    const { error } = await sb.from('profiles').update(payload).eq('id', uid);
    if(error) alert("Lỗi cập nhật: " + error.message); else { toggleModal('userEditModal'); loadUsers(); }
}
export const toggleApprove = async (uid, s) => { await sb.from('profiles').update({ is_approved: !s }).eq('id', uid); loadUsers(); }
export const deleteUser = async (uid) => { if(confirm("CẢNH BÁO: Xóa người dùng này vĩnh viễn?")) { await sb.from('profiles').delete().eq('id', uid); loadUsers(); } }

// --- MASTER DATA ---
export async function loadMasterData() { const { data } = await sb.from('master_shop_list').select('*').order('area', {ascending: true}); $('shopCount').innerText = `${data?.length || 0} Shop`;
    $('masterBody').innerHTML = (data||[]).map(r => `<tr class="hover:bg-slate-50 border-b"><td class="p-4 font-bold text-orange-600 text-xs uppercase">${r.area || '-'}</td><td class="p-4 text-xs font-mono text-slate-500">${r.svn_code || '-'}</td><td class="p-4 font-bold text-sm">${r.shop_code}</td><td class="p-4 text-sm font-bold text-slate-700">${r.shop_name}</td><td class="p-4 text-xs">${r.province || '-'}</td><td class="p-4 text-xs font-bold">${r.sale_name||'-'}</td><td class="p-4 text-center flex justify-center gap-2"><button onclick='openShopEdit(${JSON.stringify(r)})' class="text-blue-500 hover:bg-blue-50 p-2 rounded"><i class="fa-solid fa-pen"></i></button><button onclick="deleteShop('${r.shop_code}')" class="text-red-500 hover:bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
}

// [NEW] EXPORT MASTER DATA
export async function exportMasterData() {
    const { data } = await sb.from('master_shop_list').select('*').order('area');
    if (!data || data.length === 0) return alert("Chưa có dữ liệu để xuất!");

    // Định dạng dữ liệu khớp với file mẫu để có thể nạp lại được
    const header = ["Khu Vực", "Mã Khách Hàng", "Mã DVN", "Tên Đại Lý", "Tỉnh/Thành", "Sale Phụ Trách", "Giám Đốc", "Loại Hình"];
    const rows = data.map(d => [
        d.area, 
        d.svn_code, 
        d.shop_code, 
        d.shop_name, 
        d.province, 
        d.sale_name, 
        d.director_name, 
        d.shop_type
    ]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "DanhSachDaiLy");
    XLSX.writeFile(wb, "Master_Data_YADEA.xlsx");
}

export const deleteShop = async (code) => { if(confirm(`Xóa Shop ${code}?`)) { await sb.from('master_shop_list').delete().eq('shop_code', code); loadMasterData(); } }
export const openShopEdit = (s) => { $('edit_s_code').value = s.shop_code; $('edit_s_name').value = s.shop_name || ''; $('edit_s_area').value = s.area || ''; $('edit_s_svn').value = s.svn_code || ''; $('edit_s_province').value = s.province || ''; $('edit_s_sale').value = s.sale_name || ''; toggleModal('shopEditModal'); }
export const submitShopEdit = async () => { const payload = { shop_name: $('edit_s_name').value, area: $('edit_s_area').value, svn_code: $('edit_s_svn').value, province: $('edit_s_province').value, sale_name: $('edit_s_sale').value }; const { error } = await sb.from('master_shop_list').update(payload).eq('shop_code', $('edit_s_code').value); if(error) alert("Lỗi: " + error.message); else { toggleModal('shopEditModal'); loadMasterData(); } }

// --- PRICING ---
export async function loadPriceHistory() { const filterM = $('search_price_month').value; let q = sb.from('monthly_product_prices').select('*').order('report_month', {ascending:false}).order('model');
    if(filterM) q = q.eq('report_month', filterM); const { data } = await q;
    if(data) $('priceBody').innerHTML = data.map(r => `<tr class="hover:bg-slate-50 border-b"><td class="p-4 font-bold text-slate-800">${r.report_month}</td><td class="p-4 font-bold text-slate-600">${r.model}</td><td class="p-4 text-right text-red-600 font-mono">${fmn(r.import_price)}</td><td class="p-4 text-right text-blue-600 font-mono">${fmn(r.selling_price)}</td><td class="p-4 text-center"><button onclick="openPriceEdit('${r.report_month}', '${r.model}', ${r.import_price}, ${r.selling_price})" class="text-blue-500 bg-blue-50 p-2 rounded"><i class="fa-solid fa-pen"></i></button> <button onclick="deletePrice('${r.report_month}', '${r.model}')" class="text-red-500 bg-red-50 p-2 rounded"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('');
}

// [NEW] EXPORT PRICE DATA
export async function exportPriceData() {
    const filterM = $('search_price_month').value;
    let q = sb.from('monthly_product_prices').select('*').order('report_month', {ascending:false}).order('model');
    if(filterM) q = q.eq('report_month', filterM); // Xuất theo tháng đang lọc
    
    const { data } = await q;
    if (!data || data.length === 0) return alert("Không có dữ liệu giá để xuất!");

    const header = ["Tháng", "Model", "Giá Nhập", "Giá Bán"];
    const rows = data.map(d => [d.report_month, d.model, d.import_price, d.selling_price]);

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([header, ...rows]);
    XLSX.utils.book_append_sheet(wb, ws, "BangGia");
    XLSX.writeFile(wb, `Bang_Gia_${filterM || 'ALL'}.xlsx`);
}

let currentEditPrice = {}; 
export const openPriceEdit = (m, mo, c, p) => { currentEditPrice={month:m, model:mo}; $('edit_p_key').value=`${m}-${mo}`; $('edit_p_cost').value=c; $('edit_p_price').value=p; toggleModal('priceEditModal'); }; 
export const submitPriceEdit = async () => { await sb.from('monthly_product_prices').update({ import_price: parseFloat($('edit_p_cost').value)||0, selling_price: parseFloat($('edit_p_price').value)||0 }).match({ report_month: currentEditPrice.month, model: currentEditPrice.model }); toggleModal('priceEditModal'); loadPriceHistory(); }
export const deletePrice = async (m, mo) => { if(confirm(`Xóa giá?`)) { await sb.from('monthly_product_prices').delete().match({ report_month: m, model: mo }); loadPriceHistory(); } }

// --- EVENT HANDLERS FOR FILE UPLOAD ---
export function initAdminEvents() {
    $('excelFile').onchange = (e) => { const file=e.target.files[0]; if(!file)return; if(!confirm("XÓA CŨ & NẠP MỚI?")) return;
        $('uploadStatus').innerText="Đang xử lý..."; const reader=new FileReader(); reader.onload=async(e)=>{ try{ const wb=XLSX.read(new Uint8Array(e.target.result),{type:'array'}); const jsonData=XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        const getVal=(row,...kws)=>{const keys=Object.keys(row);for(const k of keys){if(kws.some(kw=>k.toLowerCase().trim()===kw.toLowerCase()))return row[k];}return null;}; const dbData=jsonData.map(row=>({area:getVal(row,'khu vực'),svn_code:getVal(row,'mã khách hàng'),shop_code:getVal(row,'mã dvn'),shop_name:getVal(row,'tên đại lý'),director_name:getVal(row,'giám đốc'),sale_name:getVal(row,'sale phụ trách'),province:getVal(row,'tỉnh/thành'),shop_type:getVal(row,'loại hình')})).filter(x=>x.shop_code);
        await sb.from('master_shop_list').delete().neq('shop_code','PLACEHOLDER'); await sb.from('master_shop_list').insert(dbData); $('uploadStatus').innerText="Thành công!"; loadMasterData(); }catch(err){$('uploadStatus').innerText="Lỗi: "+err.message;} }; reader.readAsArrayBuffer(file); };
    
    $('priceFile').onchange = (e) => { const file = e.target.files[0]; if(!file) return;
        $('priceStatus').innerText = "Đang phân tích file..."; const reader = new FileReader();
        reader.onload = async (e) => { try { const workbook = XLSX.read(new Uint8Array(e.target.result), {type: 'array'}); const jsonData = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        const getVal = (row, ...kws) => { const keys = Object.keys(row); for(const k of keys) if(kws.some(kw => k.toLowerCase().includes(kw))) return row[k];
        return null; }; const dbData = jsonData.map(row => ({ report_month: formatMonth(getVal(row, 'tháng', 'month', 'date')), model: getVal(row, 'model', 'loại xe', 'tên xe'), import_price: getVal(row, 'giá nhập', 'cost', 'import') || 0, selling_price: getVal(row, 'giá bán', 'price', 'sell') || 0 })).filter(x => x.report_month && x.model);
        if(dbData.length === 0) { $('priceStatus').innerText = "File trống!"; return; } const monthsInFile = [...new Set(dbData.map(item => item.report_month))];
        if(!confirm(`Xóa giá cũ tháng ${monthsInFile.join(', ')} và nạp mới?`)) { $('priceStatus').innerText = "Đã hủy."; return;
        } for (const m of monthsInFile) { await sb.from('monthly_product_prices').delete().eq('report_month', m); } const { error } = await sb.from('monthly_product_prices').insert(dbData);
        if(error) $('priceStatus').innerText = "Lỗi: " + error.message; else { $('priceStatus').innerText = "✅ Thành công!"; loadPriceHistory();
        } } catch(err) { $('priceStatus').innerText = "Lỗi file: " + err.message; } }; reader.readAsArrayBuffer(file); };
}