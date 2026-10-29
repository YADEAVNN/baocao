// modules/admin_shops/admin_shops.list.js
window.AdminShopsModule = {
  activeTab: 'SHOPS', // 'SHOPS' | 'SO_INPUT'
  selectedYear: 2026,
  selectedMonth: 10,
  searchQuery: '',
  regionFilter: 'ALL',
  supervisorFilter: 'ALL',
  isSyncing: false,
  hasLoadedFromSupabase: false,
  pendingSOChanges: {},

  async ensureXLSXLoaded() {
    if (window.AppUtils && window.AppUtils.ensureXLSXLoaded) {
      return window.AppUtils.ensureXLSXLoaded();
    }
    return Boolean(window.XLSX);
  },

  getList() {
    const saved = localStorage.getItem('yadea_admin_shops_db');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Lỗi đọc cache yadea_admin_shops_db:', e);
      }
    }
    // Fallback an toàn nếu DefaultData chưa kịp nạp
    if (window.DefaultData && Array.isArray(window.DefaultData.mockShops) && window.DefaultData.mockShops.length > 0) {
      return window.DefaultData.mockShops;
    }
    return [
      { region: 'BẮC TRUNG BỘ', mien: 'Miền Bắc 北部', svn: 'SVN90011', dvn: 'DVN900002', name: 'Yadea Shop Nam Thành Đạt', province: 'Ninh Bình', ward: '', shopType: 'A形象店', sale: 'Hoàng Kim Anh', gdKhuVuc: 'Nông Đức Long', gdMien: 'Vũ Đức Hưng', supervisor: 'Vũ Đức Hưng', isVip: true, so2025: {}, so2026: {} }
    ];
  },

  saveList(list) {
    localStorage.setItem('yadea_admin_shops_db', JSON.stringify(list));
    this.syncToGlobalAppStore(list);
  },

  getShopSO(shop, year, month) {
    const yearKey = `so${year}`;
    const monthKey = `T${Number(month)}`;
    if (shop[yearKey] && shop[yearKey][monthKey] !== undefined) {
      return shop[yearKey][monthKey];
    }
    if (year > 2026 && shop.so2026 && shop.so2026[`Y${year}_${monthKey}`] !== undefined) {
      return shop.so2026[`Y${year}_${monthKey}`];
    }
    return null;
  },

  setShopSO(shop, year, month, val) {
    const yearKey = `so${year}`;
    const monthKey = `T${Number(month)}`;
    if (!shop[yearKey]) shop[yearKey] = {};
    shop[yearKey][monthKey] = val;

    let sum = 0;
    let hasAny = false;
    for (let m = 1; m <= 12; m++) {
      const v = shop[yearKey][`T${m}`];
      if (typeof v === 'number') {
        sum += v;
        hasAny = true;
      }
    }
    shop[yearKey].total = hasAny ? sum : null;

    if (year > 2026) {
      if (!shop.so2026) shop.so2026 = {};
      shop.so2026[`Y${year}_${monthKey}`] = val;
    }
  },

  async fetchFromSupabaseIfNeeded(force = false) {
    if (this.hasLoadedFromSupabase && !force) return;
    if (!window.SupabaseService || !window.SupabaseService.isConnected) return;

    this.hasLoadedFromSupabase = true;
    try {
      const { data, error } = await window.SupabaseService.client
        .from('shops')
        .select('*')
        .order('dvn_code', { ascending: true });

      if (!error && Array.isArray(data) && data.length > 0) {
        const mapped = data.map(row => {
          const s26 = row.so_data_2026 || {};
          const so2027 = {};
          const so2028 = {};
          Object.keys(s26).forEach(k => {
            if (k.startsWith('Y2027_')) so2027[k.replace('Y2027_', '')] = s26[k];
            if (k.startsWith('Y2028_')) so2028[k.replace('Y2028_', '')] = s26[k];
          });

          return {
            dvn: String(row.dvn_code || '').trim(),
            svn: String(row.svn_code || '').trim(),
            name: row.shop_name || '',
            supervisor: row.supervisor_name || '',
            gdMien: row.supervisor_name || '',
            mien: row.region || '',
            region: row.sub_region || row.region || '',
            gdKhuVuc: row.director_name || '',
            sale: row.sale_name || '',
            province: row.province || '',
            ward: row.ward || '',
            shopType: row.shop_type || 'A形象店',
            isVip: String(row.shop_type || 'A').toUpperCase().includes('A'),
            so2025: row.so_data_2025 || {},
            so2026: s26,
            so2027: so2027,
            so2028: so2028
          };
        });
        this.saveList(mapped);
        // Tự động vẽ lại giao diện ở BẤT KỲ trang nào (Dashboard, Sellout, AdminShops) ngay khi tải xong dữ liệu từ Supabase!
        if (window.App) {
          window.App.populateHeaderAdvancedFilters();
          window.App.renderCurrentModule();
        }
      }
    } catch (e) {
      console.warn('Chưa tải được bảng shops từ Supabase:', e);
    }
  },

  mapRegionEnum(mienStr, khuVucStr) {
    if (window.AppUtils && window.AppUtils.resolveMienCode) {
      return window.AppUtils.resolveMienCode(mienStr, khuVucStr);
    }
    const text = `${mienStr || ''} ${khuVucStr || ''}`.toUpperCase();
    if (text.includes('NAM') || text.includes('南部')) return 'SOUTH';
    return 'NORTH';
  },

  syncToGlobalAppStore(adminList) {
    if (!window.AppStore) return;

    const monthlyTotals = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

    const mappedShops = adminList.map(item => {
      const s25 = item.so2025 || {};
      const s26 = item.so2026 || {};

      if (typeof s25.T11 === 'number') monthlyTotals[0] += s25.T11;
      if (typeof s25.T12 === 'number') monthlyTotals[1] += s25.T12;
      for (let m = 1; m <= 10; m++) {
        const val = s26[`T${m}`];
        if (typeof val === 'number') monthlyTotals[m + 1] += val;
      }

      let activeY = 2026;
      let latestMonth = 9;
      let foundLatest = false;

      for (const y of [2028, 2027, 2026]) {
        for (let m = 12; m >= 1; m--) {
          const val = this.getShopSO(item, y, m);
          if (val !== null && val !== undefined) {
            activeY = y;
            latestMonth = m;
            foundLatest = true;
            break;
          }
        }
        if (foundLatest) break;
      }

      const currentSO = this.getShopSO(item, activeY, latestMonth);
      const prevMonthSO = latestMonth > 1
        ? this.getShopSO(item, activeY, latestMonth - 1)
        : this.getShopSO(item, activeY - 1, 12);
      const sameMonthLastYearSO = this.getShopSO(item, activeY - 1, latestMonth);

      const mom = (currentSO !== null && prevMonthSO !== null && prevMonthSO > 0)
        ? Math.round(((currentSO - prevMonthSO) / prevMonthSO) * 100)
        : null;

      const yoy = (currentSO !== null && sameMonthLastYearSO !== null && sameMonthLastYearSO > 0)
        ? Math.round(((currentSO - sameMonthLastYearSO) / sameMonthLastYearSO) * 100)
        : null;

      const supName = item.supervisor || item.gdMien || 'Chưa phân công';

      return {
        dvn: String(item.dvn).trim(),
        svn: String(item.svn || '').trim(),
        name: item.name,
        region: this.mapRegionEnum(item.mien, item.region),
        subRegion: item.region,
        province: item.province,
        supervisor: supName,
        sale: item.sale,
        director: item.gdKhuVuc,
        targetSO: item.targetSO || 35,
        currentSO: currentSO,
        mom: mom,
        yoy: yoy,
        hasFullData: currentSO !== null,
        trend3mScore: 82,
        stabilityScore: 80,
        improvementPlan: item.improvementPlan || 'Theo dõi trưng bày & thúc đẩy S.O thực địa'
      };
    });

    window.AppStore.shops = mappedShops;
    if (Array.isArray(window.AppStore.monthlySO12)) {
      window.AppStore.monthlySO12.forEach((mObj, idx) => {
        mObj.value = monthlyTotals[idx];
      });
    }
    window.AppStore.saveToStorage();
  },

  switchTab(tabId) {
    this.activeTab = tabId;
    window.App.renderCurrentModule();
  },

  setPeriod(year, month) {
    if (year !== null) this.selectedYear = Number(year);
    if (month !== null) this.selectedMonth = Number(month);
    this.pendingSOChanges = {};
    window.App.renderCurrentModule();
  },

  setFilter(key, val) {
    this[key] = val;
    window.App.renderCurrentModule();
    if (key === 'searchQuery') {
      const input = document.getElementById('admin-shop-search');
      if (input) {
        input.focus();
        input.setSelectionRange(input.value.length, input.value.length);
      }
    }
  },

  resetFilters() {
    this.searchQuery = '';
    this.regionFilter = 'ALL';
    this.supervisorFilter = 'ALL';
    window.App.renderCurrentModule();
  },

  triggerFileInput() {
    const fileInput = document.getElementById('excel-upload-input');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  },

  parseSOVal(val) {
    if (window.AppUtils && window.AppUtils.parseSOVal) {
      return window.AppUtils.parseSOVal(val);
    }
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    if (str === '' || str.toUpperCase() === 'NAN' || str.toUpperCase() === 'NULL') return null;
    const num = Number(str.replace(/,/g, ''));
    return isNaN(num) ? null : num;
  },

  async handleFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const loaded = await this.ensureXLSXLoaded();
    if (!loaded || !window.XLSX) {
      alert('Không thể tải thư viện đọc Excel (SheetJS). Vui lòng kiểm tra kết nối Internet!');
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: 'array' });

      let targetRows = [];
      let dvnColIdx = -1;
      let firstDataRowIdx = -1;

      for (const sheetName of workbook.SheetNames) {
        const ws = workbook.Sheets[sheetName];
        const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
        if (!rows || rows.length === 0) continue;

        for (let r = 0; r < Math.min(30, rows.length); r++) {
          const row = rows[r] || [];
          for (let c = 0; c < row.length; c++) {
            const cellVal = String(row[c] || '').trim().toUpperCase();
            if (/^DVN[A-Z0-9]+/i.test(cellVal)) {
              dvnColIdx = c;
              firstDataRowIdx = r;
              targetRows = rows;
              break;
            }
          }
          if (dvnColIdx !== -1) break;
        }
        if (dvnColIdx !== -1) break;
      }

      if (dvnColIdx === -1 || targetRows.length === 0) {
        alert('Không tìm thấy cột Mã DVN (VD: DVN370003) trong file Excel bạn chọn!');
        event.target.value = '';
        return;
      }

      const isStandardExport = (dvnColIdx === 2);
      const cleanStr = (val) => (val === null || val === undefined) ? '' : String(val).normalize('NFC').trim();

      const existingList = this.getList();
      const existingMap = new Map(existingList.map(item => [String(item.dvn).trim(), item]));

      const parsedShops = [];
      const supabaseMap = new Map();

      for (let i = firstDataRowIdx; i < targetRows.length; i++) {
        const r = targetRows[i];
        if (!r || r.length === 0) continue;

        const rawDvn = cleanStr(r[dvnColIdx]);
        if (!rawDvn || !rawDvn.toUpperCase().startsWith('DVN')) continue;

        const oldShop = existingMap.get(rawDvn);
        let shopObj = null;

        if (isStandardExport) {
          const supVal = cleanStr(r[7]);
          shopObj = {
            region: cleanStr(r[0]),
            svn: cleanStr(r[1]),
            dvn: rawDvn,
            name: cleanStr(r[3]),
            province: cleanStr(r[4]),
            sale: cleanStr(r[5]),
            gdKhuVuc: cleanStr(r[6]),
            supervisor: supVal,
            gdMien: supVal,
            mien: cleanStr(r[8] || 'Miền Bắc 北部'),
            ward: cleanStr(r[9]),
            shopType: cleanStr(r[10] || 'A形象店'),
            isVip: cleanStr(r[10]).toUpperCase().includes('A') || true,
            so2025: oldShop?.so2025 || {},
            so2026: oldShop?.so2026 || {},
            so2027: oldShop?.so2027 || {},
            so2028: oldShop?.so2028 || {}
          };
        } else {
          const offset = dvnColIdx - 8;
          const getCol = (idx) => (idx + offset >= 0 ? r[idx + offset] : null);

          const so2025 = { ...(oldShop?.so2025 || {}) };
          const so2026 = { ...(oldShop?.so2026 || {}) };
          for (let m = 1; m <= 12; m++) {
            const v25 = this.parseSOVal(getCol(10 + m));
            const v26 = this.parseSOVal(getCol(23 + m));
            if (v25 !== null) so2025[`T${m}`] = v25;
            if (v26 !== null) so2026[`T${m}`] = v26;
          }
          const t25 = this.parseSOVal(getCol(23));
          const t26 = this.parseSOVal(getCol(36));
          if (t25 !== null) so2025.total = t25;
          if (t26 !== null) so2026.total = t26;

          const shopTypeStr = cleanStr(getCol(9));
          const supVal = cleanStr(getCol(0));

          shopObj = {
            supervisor: supVal,
            gdMien: supVal,
            mien: cleanStr(getCol(1)),
            region: cleanStr(getCol(2)),
            gdKhuVuc: cleanStr(getCol(3)),
            sale: cleanStr(getCol(4)),
            province: cleanStr(getCol(5)),
            ward: cleanStr(getCol(6)),
            svn: cleanStr(getCol(7)),
            dvn: rawDvn,
            shopType: shopTypeStr,
            name: cleanStr(getCol(10)),
            isVip: shopTypeStr.toUpperCase().includes('A'),
            so2025: so2025,
            so2026: so2026,
            so2027: oldShop?.so2027 || {},
            so2028: oldShop?.so2028 || {}
          };
        }

        parsedShops.push(shopObj);
        supabaseMap.set(shopObj.dvn, {
          dvn_code: shopObj.dvn,
          svn_code: shopObj.svn,
          shop_name: shopObj.name,
          supervisor_name: shopObj.supervisor,
          region: shopObj.mien,
          sub_region: shopObj.region,
          director_name: shopObj.gdKhuVuc,
          sale_name: shopObj.sale,
          province: shopObj.province,
          ward: shopObj.ward,
          shop_type: shopObj.shopType,
          so_data_2025: shopObj.so2025,
          so_data_2026: shopObj.so2026
        });
      }

      if (parsedShops.length === 0) {
        alert('Không tìm thấy dòng dữ liệu nào có Mã DVN hợp lệ!');
        event.target.value = '';
        return;
      }

      this.searchQuery = '';
      this.regionFilter = 'ALL';
      this.supervisorFilter = 'ALL';

      this.saveList(parsedShops);

      if (window.AppStore && Array.isArray(window.AppStore.importHistory)) {
        const uniqueCount = supabaseMap.size;
        window.AppStore.importHistory.unshift({
          batchId: 'BATCH-' + Date.now().toString().slice(-5),
          fileName: file.name,
          importedBy: window.AppState?.userName || 'Admin',
          date: new Date().toLocaleString('vi-VN'),
          validRows: parsedShops.length,
          duplicateRows: Math.max(0, parsedShops.length - uniqueCount)
        });
        window.AppStore.saveToStorage();
      }

      let supaStatusMsg = '';
      if (window.SupabaseService && window.SupabaseService.isConnected) {
        this.isSyncing = true;
        window.App.renderCurrentModule();

        const payloadArray = Array.from(supabaseMap.values());
        const { error } = await window.SupabaseService.client
          .from('shops')
          .upsert(payloadArray, { onConflict: 'dvn_code' });

        this.isSyncing = false;
        supaStatusMsg = error
          ? `\n(Đã lưu trên trình duyệt. Lưu ý từ Supabase: ${error.message})`
          : `\n(Đã đồng bộ thành công ${payloadArray.length} shop lên Cloud Supabase!)`;
      }

      window.App.renderCurrentModule();
      alert(`Đã nhập thành công ${parsedShops.length} cửa hàng vào hệ thống!${supaStatusMsg}`);
    } catch (err) {
      this.isSyncing = false;
      alert('Lỗi khi đọc file Excel: ' + err.message);
    } finally {
      event.target.value = '';
    }
  },

  async exportToExcel() {
    const loaded = await this.ensureXLSXLoaded();
    if (!loaded || !window.XLSX) {
      alert('Không thể tải thư viện xuất Excel (SheetJS)!');
      return;
    }

    const list = this.getFilteredList();
    if (list.length === 0) {
      alert('Không có dữ liệu cửa hàng nào để xuất!');
      return;
    }

    const exportRows = list.map(s => ({
      'KHU VỰC': s.region || '',
      'MÃ SVN': String(s.svn || ''),
      'MÃ DVN': String(s.dvn || ''),
      'TÊN ĐẠI LÝ': s.name || '',
      'TỈNH/THÀNH': s.province || '',
      'SALE': s.sale || '',
      'GĐ KHU VỰC': s.gdKhuVuc || '',
      'GIÁM SÁT / GĐ MIỀN': s.supervisor || s.gdMien || '',
      'MIỀN': s.mien || '',
      'XÃ/PHƯỜNG': s.ward || '',
      'LOẠI HÌNH': s.shopType || (s.isVip ? 'A形象店' : 'B标准店'),
      'TỔNG S.O 2025': s.so2025?.total ?? '',
      'TỔNG S.O 2026': s.so2026?.total ?? ''
    }));

    const worksheet = window.XLSX.utils.json_to_sheet(exportRows);
    const workbook = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh_Sach_Shop');

    const fileName = `YADEA_Danh_Sach_Shop_${new Date().toISOString().slice(0, 10)}.xlsx`;
    window.XLSX.writeFile(workbook, fileName);
  },

  openEditShopModal(dvnCode) {
    const list = this.getList();
    const shop = list.find(s => String(s.dvn) === String(dvnCode));
    if (!shop) return;

    const supName = shop.supervisor || shop.gdMien || '';

    document.getElementById('modal-title').innerText = `Chỉnh sửa thông tin Shop: ${shop.dvn}`;
    document.getElementById('modal-body').innerHTML = `
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
        <div>
          <label class="block font-bold text-slate-600 mb-1">Mã DVN (Cố định - Chuỗi)</label>
          <input type="text" value="${shop.dvn}" disabled class="w-full p-2.5 rounded-xl border bg-slate-100 font-mono font-bold text-slate-500 cursor-not-allowed" />
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Mã Khách Hàng (SVN)</label>
          <input id="edit-shop-svn" type="text" value="${shop.svn || ''}" class="w-full p-2.5 rounded-xl border font-mono font-bold focus:outline-none focus:border-[#F26522]" />
        </div>
        <div class="md:col-span-2">
          <label class="block font-bold text-slate-600 mb-1">Tên Đại Lý / Cửa Hàng (Việt - Trung)</label>
          <input id="edit-shop-name" type="text" value="${shop.name || ''}" class="w-full p-2.5 rounded-xl border font-bold text-[#172033] focus:outline-none focus:border-[#F26522]" />
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Khu Vực (VD: BẮC TRUNG BỘ)</label>
          <input id="edit-shop-region" type="text" value="${shop.region || ''}" class="w-full p-2.5 rounded-xl border font-bold focus:outline-none focus:border-[#F26522]" />
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Tỉnh / Thành Phố</label>
          <input id="edit-shop-province" type="text" value="${shop.province || ''}" class="w-full p-2.5 rounded-xl border font-bold focus:outline-none focus:border-[#F26522]" />
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Sale Phụ Trách</label>
          <input id="edit-shop-sale" type="text" value="${shop.sale || ''}" class="w-full p-2.5 rounded-xl border font-bold focus:outline-none focus:border-[#F26522]" />
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Giám Đốc Khu Vực</label>
          <input id="edit-shop-gdkv" type="text" value="${shop.gdKhuVuc || ''}" class="w-full p-2.5 rounded-xl border font-bold text-blue-600 focus:outline-none focus:border-[#F26522]" />
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Giám Sát / GĐ Miền</label>
          <input id="edit-shop-sup" type="text" value="${supName}" class="w-full p-2.5 rounded-xl border font-bold text-orange-600 focus:outline-none focus:border-[#F26522]" />
        </div>
        <div>
          <label class="block font-bold text-slate-600 mb-1">Phân Hạng Cửa Hàng</label>
          <select id="edit-shop-vip" class="w-full p-2.5 rounded-xl border font-bold focus:outline-none focus:border-[#F26522]">
            <option value="true" ${shop.isVip ? 'selected' : ''}>VIP / A形象店</option>
            <option value="false" ${!shop.isVip ? 'selected' : ''}>Tiêu chuẩn / B标准店</option>
          </select>
        </div>
      </div>

      <div class="pt-4 mt-2 border-t flex justify-end gap-2 text-xs">
        <button onclick="App.closeModal()" class="px-4 py-2 rounded-xl border font-bold hover:bg-slate-50">Hủy</button>
        <button onclick="AdminShopsModule.saveShopEdit('${shop.dvn}')" class="btn-3d-orange px-5 py-2 rounded-xl font-bold">
          <i class="fa-solid fa-floppy-disk mr-1"></i> Lưu Thay Đổi
        </button>
      </div>
    `;

    const modal = document.getElementById('global-modal');
    modal.classList.remove('hidden');
    modal.classList.add('flex');
  },

  async saveShopEdit(dvnCode) {
    const list = this.getList();
    const idx = list.findIndex(s => String(s.dvn) === String(dvnCode));
    if (idx < 0) return;

    const supVal = document.getElementById('edit-shop-sup').value.trim();
    const isVipVal = document.getElementById('edit-shop-vip').value === 'true';

    const updated = {
      ...list[idx],
      svn: document.getElementById('edit-shop-svn').value.trim(),
      name: document.getElementById('edit-shop-name').value.trim(),
      region: document.getElementById('edit-shop-region').value.trim(),
      province: document.getElementById('edit-shop-province').value.trim(),
      sale: document.getElementById('edit-shop-sale').value.trim(),
      gdKhuVuc: document.getElementById('edit-shop-gdkv').value.trim(),
      supervisor: supVal,
      gdMien: supVal,
      isVip: isVipVal,
      shopType: isVipVal ? 'A形象店' : 'B标准店'
    };

    list[idx] = updated;
    this.saveList(list);

    if (window.SupabaseService && window.SupabaseService.isConnected) {
      await window.SupabaseService.client
        .from('shops')
        .update({
          svn_code: updated.svn,
          shop_name: updated.name,
          sub_region: updated.region,
          province: updated.province,
          sale_name: updated.sale,
          director_name: updated.gdKhuVuc,
          supervisor_name: updated.supervisor,
          shop_type: updated.shopType,
          updated_at: new Date().toISOString()
        })
        .eq('dvn_code', String(dvnCode));
    }

    window.App.closeModal();
    window.App.renderCurrentModule();
  },

  getFilteredList() {
    const list = this.getList();
    const q = this.searchQuery.trim().toLowerCase();

    return list.filter(shop => {
      const supName = shop.supervisor || shop.gdMien || '';
      const matchQuery = !q ||
        String(shop.dvn || '').toLowerCase().includes(q) ||
        String(shop.svn || '').toLowerCase().includes(q) ||
        String(shop.name || '').toLowerCase().includes(q) ||
        String(shop.sale || '').toLowerCase().includes(q) ||
        String(shop.gdKhuVuc || '').toLowerCase().includes(q) ||
        String(supName).toLowerCase().includes(q) ||
        String(shop.province || '').toLowerCase().includes(q);

      const matchRegion = this.regionFilter === 'ALL' || shop.region === this.regionFilter;
      const matchSup = this.supervisorFilter === 'ALL' || supName === this.supervisorFilter;

      return matchQuery && matchRegion && matchSup;
    });
  },

  render() {
    this.ensureXLSXLoaded();
    this.fetchFromSupabaseIfNeeded();

    const allShops = this.getList();
    const filteredShops = this.getFilteredList();

    const uniqueRegions = [...new Set(allShops.map(s => s.region).filter(Boolean))];
    const uniqueSups = [...new Set(allShops.map(s => s.supervisor || s.gdMien).filter(Boolean))];

    return `
      <input
        id="excel-upload-input"
        type="file"
        accept=".xlsx, .xls, .csv"
        class="hidden"
        onchange="AdminShopsModule.handleFileUpload(event)"
      />
      <input
        id="monthly-so-upload-input"
        type="file"
        accept=".xlsx, .xls, .csv"
        class="hidden"
        onchange="AdminShopsModule.handleMonthlySOFileUpload(event)"
      />

      <!-- KHỐI HEADER & CHUYỂN 2 TAB -->
      <div class="card-3d p-6 mb-6 bg-white flex flex-col items-center justify-between space-y-5 rounded-2xl shadow-sm border border-slate-100">
        <div class="text-center space-y-1">
          <h2 class="text-2xl font-black text-[#172033]">Quản Trị Hệ Thống Cửa Hàng & Sản Lượng Sell-Out</h2>
          <p class="text-xs text-slate-500 font-medium">Tách biệt Danh sách Shop cố định và Nhập liệu S.O theo từng Tháng / Năm (2025 - 2028)</p>
        </div>

        <div class="flex flex-wrap items-center justify-center gap-3 bg-slate-100 p-1.5 rounded-2xl border border-slate-200/80">
          <button
            onclick="AdminShopsModule.switchTab('SHOPS')"
            class="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${
              this.activeTab === 'SHOPS'
                ? 'bg-[#111625] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }"
          >
            <i class="fa-solid fa-store text-[#F26522]"></i>
            <span>1. Danh Sách Shop (${allShops.length} Shop)</span>
          </button>

          <button
            onclick="AdminShopsModule.switchTab('SO_INPUT')"
            class="px-5 py-2.5 rounded-xl font-extrabold text-xs flex items-center gap-2 transition cursor-pointer ${
              this.activeTab === 'SO_INPUT'
                ? 'bg-[#F26522] text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }"
          >
            <i class="fa-solid fa-chart-column"></i>
            <span>2. Nhập Liệu Sell-Out (Theo Tháng / Năm)</span>
          </button>
        </div>

        ${this.activeTab === 'SHOPS' ? `
          <div class="flex flex-wrap items-center justify-center gap-4 pt-1">
            <button
              onclick="AdminShopsModule.triggerFileInput()"
              class="px-5 py-2 rounded-xl bg-[#111625] hover:bg-slate-800 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <i class="fa-solid ${this.isSyncing ? 'fa-spinner fa-spin' : 'fa-upload'}"></i>
              <span>${this.isSyncing ? 'Đang đồng bộ Supabase...' : 'Tải lên danh sách Shop mới'}</span>
            </button>

            <button
              onclick="AdminShopsModule.exportToExcel()"
              class="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <i class="fa-solid fa-file-excel"></i> Xuất Excel Hiện Tại
            </button>
          </div>
        ` : ''}
      </div>

      <!-- KHỐI BẢNG DỮ LIỆU -->
      <div class="card-3d bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100">
        <div class="p-4 border-b flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-2.5">
            <h3 class="font-bold text-[#172033]">
              ${this.activeTab === 'SHOPS' ? 'Thông Tin Cửa Hàng Hệ Thống' : `Bảng Nhập Sell-Out Tháng ${this.selectedMonth}/${this.selectedYear}`}
            </h3>
            <span class="px-3 py-1 rounded-md bg-blue-50 text-blue-600 font-bold text-xs">
              ${filteredShops.length} / ${allShops.length} Shop
            </span>
          </div>

          <div class="flex flex-wrap items-center gap-2.5">
            <div class="relative">
              <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs"></i>
              <input
                id="admin-shop-search"
                type="text"
                value="${this.searchQuery}"
                oninput="AdminShopsModule.setFilter('searchQuery', this.value)"
                placeholder="Tìm tên Shop, Sale, GĐ, mã DVN..."
                class="pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold w-64 focus:outline-none focus:border-[#F26522]"
              />
            </div>

            <select
              onchange="AdminShopsModule.setFilter('regionFilter', this.value)"
              class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Khu vực --</option>
              ${uniqueRegions.map(r => `<option value="${r}" ${this.regionFilter === r ? 'selected' : ''}>${r}</option>`).join('')}
            </select>

            <select
              onchange="AdminShopsModule.setFilter('supervisorFilter', this.value)"
              class="px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 focus:outline-none focus:border-[#F26522] cursor-pointer"
            >
              <option value="ALL">-- Tất cả Giám sát / GĐ Miền --</option>
              ${uniqueSups.map(sup => `<option value="${sup}" ${this.supervisorFilter === sup ? 'selected' : ''}>${sup}</option>`).join('')}
            </select>

            ${(this.searchQuery || this.regionFilter !== 'ALL' || this.supervisorFilter !== 'ALL') ? `
              <button
                onclick="AdminShopsModule.resetFilters()"
                class="px-3 py-2 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-bold transition"
              >
                Xóa lọc
              </button>
            ` : ''}
          </div>
        </div>

        ${this.activeTab === 'SO_INPUT' && this.renderSOInputTab ? this.renderSOInputTab(filteredShops) : `
          <div class="overflow-x-auto max-h-[65vh]">
            <table class="w-full text-left border-collapse text-xs">
              <thead class="sticky top-0 z-20 shadow-sm">
                <tr class="bg-slate-100 dark:bg-slate-900 text-[#667085] uppercase tracking-wider font-bold border-b border-slate-200">
                  <th class="py-4 px-5 bg-slate-100 dark:bg-slate-900">KHU VỰC</th>
                  <th class="py-4 px-3 bg-slate-100 dark:bg-slate-900">MÃ SVN</th>
                  <th class="py-4 px-3 bg-slate-100 dark:bg-slate-900">MÃ DVN</th>
                  <th class="py-4 px-5 bg-slate-100 dark:bg-slate-900">TÊN ĐẠI LÝ</th>
                  <th class="py-4 px-4 bg-slate-100 dark:bg-slate-900">TỈNH/THÀNH</th>
                  <th class="py-4 px-4 bg-slate-100 dark:bg-slate-900">SALE</th>
                  <th class="py-4 px-4 bg-slate-100 dark:bg-slate-900">GĐ KHU VỰC</th>
                  <th class="py-4 px-4 bg-slate-100 dark:bg-slate-900">GIÁM SÁT / GĐ MIỀN</th>
                  <th class="py-4 px-4 text-center bg-slate-100 dark:bg-slate-900">SỬA</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 font-medium">
                ${filteredShops.map(shop => `
                  <tr class="hover:bg-slate-50 transition">
                    <td class="py-4 px-5 text-orange-600 font-extrabold uppercase">${shop.region || ''}</td>
                    <td class="py-4 px-3 text-slate-400 font-mono">${shop.svn || ''}</td>
                    <td class="py-4 px-3">
                      <span class="font-black font-mono text-[#172033]">${shop.dvn}</span>
                    </td>
                    <td class="py-4 px-5 font-bold text-[#172033]">
                      ${shop.name}
                      ${shop.isVip ? `<span class="ml-2 inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-400 text-white text-[10px] font-black"><i class="fa-solid fa-star text-[8px]"></i> VIP</span>` : ''}
                    </td>
                    <td class="py-4 px-4 text-[#172033]">${shop.province || ''}</td>
                    <td class="py-4 px-4 text-[#172033] font-bold">${shop.sale || ''}</td>
                    <td class="py-4 px-4 text-blue-600 font-bold">${shop.gdKhuVuc || ''}</td>
                    <td class="py-4 px-4 text-orange-600 font-bold">${shop.supervisor || shop.gdMien || ''}</td>
                    <td class="py-4 px-4 text-center">
                      <button
                        onclick="AdminShopsModule.openEditShopModal('${shop.dvn}')"
                        class="p-2 rounded-lg text-blue-600 hover:bg-blue-50 hover:scale-110 transition cursor-pointer"
                        title="Sửa thông tin cửa hàng"
                      >
                        <i class="fa-regular fa-pen-to-square text-sm"></i>
                      </button>
                    </td>
                  </tr>
                `).join('')}
                ${filteredShops.length === 0 ? `
                  <tr>
                    <td colspan="9" class="py-8 text-center text-slate-400 font-semibold">
                      Không tìm thấy cửa hàng nào phù hợp với bộ lọc hiện tại.
                    </td>
                  </tr>
                ` : ''}
              </tbody>
            </table>
          </div>
        `}
      </div>
    `;
  }
};