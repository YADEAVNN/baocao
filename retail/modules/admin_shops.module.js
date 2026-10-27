// modules/admin_shops.module.js
window.AdminShopsModule = {
  activeTab: 'SHOPS', // 'SHOPS' (Danh sách Shop) | 'SO_INPUT' (Nhập liệu S.O theo Tháng/Năm)
  selectedYear: 2026,
  selectedMonth: 10,
  searchQuery: '',
  regionFilter: 'ALL',
  supervisorFilter: 'ALL',
  isSyncing: false,
  hasLoadedFromSupabase: false,
  pendingSOChanges: {}, // Lưu tạm các thay đổi S.O khi gõ trực tiếp trên bảng trước khi bấm Lưu

  // Dữ liệu mẫu mặc định ban đầu (khi chưa import file Excel)
  mockData: [
    { region: 'BẮC TRUNG BỘ', mien: 'Miền Bắc 北部', svn: 'SVN90011', dvn: 'DVN900002', name: 'Yadea Shop Nam Thành Đạt', province: 'Ninh Bình', ward: '', shopType: 'A形象店', sale: 'Hoàng Kim Anh', gdKhuVuc: 'Nông Đức Long', gdMien: 'Vũ Đức Hưng', supervisor: 'Vũ Đức Hưng', isVip: true, so2025: {}, so2026: {} },
    { region: 'BẮC TRUNG BỘ', mien: 'Miền Bắc 北部', svn: 'SVN18001', dvn: 'DVN180018', name: 'Yadea Shop Xe điện Thanh Tùng', province: 'Ninh Bình', ward: '', shopType: 'A形象店', sale: 'Hoàng Kim Anh', gdKhuVuc: 'Nông Đức Long', gdMien: 'Vũ Đức Hưng', supervisor: 'Vũ Đức Hưng', isVip: true, so2025: {}, so2026: {} },
    { region: 'BẮC TRUNG BỘ', mien: 'Miền Bắc 北部', svn: 'SVN36040', dvn: 'DVN360049', name: 'Yadea Shop Xe Điện Thanh Hoa', province: 'Thanh Hóa', ward: '', shopType: 'A形象店', sale: 'Nguyễn Thế Tuyển', gdKhuVuc: 'Nông Đức Long', gdMien: 'Vũ Đức Hưng', supervisor: 'Vũ Đức Hưng', isVip: true, so2025: {}, so2026: {} },
    { region: 'BẮC TRUNG BỘ', mien: 'Miền Bắc 北部', svn: 'SVN89032', dvn: 'DVN890017', name: 'Yadea Shop Xe điện Ngọc Quyền', province: 'Hưng Yên', ward: '', shopType: 'A形象店', sale: 'Nguyễn Việt Tùng', gdKhuVuc: 'Nông Đức Long', gdMien: 'Vũ Đức Hưng', supervisor: 'Vũ Đức Hưng', isVip: true, so2025: {}, so2026: {} },
    { region: 'ĐÔNG BẮC', mien: 'Miền Bắc 北部', svn: 'SVN99022', dvn: 'DVN990028', name: 'Yadea Shop Trung Thành', province: 'Bắc Ninh', ward: '', shopType: 'A形象店', sale: 'Chu Tiến Nhật', gdKhuVuc: 'Trịnh Trần Cường', gdMien: 'Vũ Đức Hưng', supervisor: 'Vũ Đức Hưng', isVip: true, so2025: {}, so2026: {} }
  ],

  // 1. Tự động nạp thư viện SheetJS (XLSX)
  async ensureXLSXLoaded() {
    if (window.XLSX) return true;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  },

  // 2. Lấy danh sách cửa hàng từ LocalStorage
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
    return this.mockData;
  },

  // 3. Lưu danh sách và đồng bộ sang toàn bộ hệ thống
  saveList(list) {
    localStorage.setItem('yadea_admin_shops_db', JSON.stringify(list));
    this.syncToGlobalAppStore(list);
  },

  // Helper lấy S.O của một shop theo Năm và Tháng bất kỳ (Hỗ trợ 2025, 2026, 2027, 2028...)
  getShopSO(shop, year, month) {
    const yearKey = `so${year}`;
    const monthKey = `T${Number(month)}`;
    // Kiểm tra trong object soYYYY hoặc trong so2026[`Y2027_T1`] (dự phòng cho Supabase)
    if (shop[yearKey] && shop[yearKey][monthKey] !== undefined) {
      return shop[yearKey][monthKey];
    }
    if (year > 2026 && shop.so2026 && shop.so2026[`Y${year}_${monthKey}`] !== undefined) {
      return shop.so2026[`Y${year}_${monthKey}`];
    }
    return null;
  },

  // Helper ghi S.O của một shop theo Năm và Tháng bất kỳ
  setShopSO(shop, year, month, val) {
    const yearKey = `so${year}`;
    const monthKey = `T${Number(month)}`;
    if (!shop[yearKey]) shop[yearKey] = {};
    shop[yearKey][monthKey] = val;

    // Tính lại tổng năm đó
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

    // Nếu là năm >= 2027, lưu kèm vào jsonb so2026 để không cần sửa cấu trúc bảng Supabase
    if (year > 2026) {
      if (!shop.so2026) shop.so2026 = {};
      shop.so2026[`Y${year}_${monthKey}`] = val;
    }
  },

  // 4. Tải dữ liệu từ bảng `shops` trên Supabase về khi mở trang
  async fetchFromSupabaseIfNeeded() {
    if (this.hasLoadedFromSupabase) return;
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
          // Khôi phục dữ liệu năm 2027, 2028 nếu được lưu mở rộng trong jsonb
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
        if (window.AppState?.activeModule === 'admin_shops') {
          window.App.renderCurrentModule();
        }
      }
    } catch (e) {
      console.warn('Chưa tải được bảng shops từ Supabase:', e);
    }
  },

  // 5. Chuyển đổi tên Miền sang mã chuẩn (NORTH / CENTRAL / SOUTH)
  mapRegionEnum(mienStr, khuVucStr) {
    const text = `${mienStr || ''} ${khuVucStr || ''}`.toUpperCase();
    if (text.includes('NAM') || text.includes('南部')) return 'SOUTH';
    if (text.includes('TRUNG') && !text.includes('BẮC') && !text.includes('北部')) return 'CENTRAL';
    return 'NORTH';
  },

  // 6. Đồng bộ dữ liệu sang window.AppStore để Dashboard & Quản lý Shop tự động nhảy số
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

      // Tìm kỳ (Năm/Tháng) gần nhất có số liệu thực tế (hỗ trợ cả 2027, 2026)
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
        dvn: String(item.dvn).trim(), // Quy tắc 2: Giữ mã DVN ở định dạng chuỗi (String)
        svn: String(item.svn || '').trim(),
        name: item.name,
        region: this.mapRegionEnum(item.mien, item.region),
        subRegion: item.region,
        province: item.province,
        supervisor: supName,
        sale: item.sale,
        director: item.gdKhuVuc,
        targetSO: item.targetSO || 35,
        currentSO: currentSO, // Quy tắc 3: Không coi dữ liệu thiếu (null) là 0
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

  // Chuyển đổi giữa Tab Danh Sách Shop và Tab Nhập Liệu S.O
  switchTab(tabId) {
    this.activeTab = tabId;
    window.App.renderCurrentModule();
  },

  // Đổi Tháng hoặc Năm cần nhập S.O
  setPeriod(year, month) {
    if (year !== null) this.selectedYear = Number(year);
    if (month !== null) this.selectedMonth = Number(month);
    this.pendingSOChanges = {};
    window.App.renderCurrentModule();
  },

  // 7. Cập nhật bộ lọc tìm kiếm trực tiếp mượt mà
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

  // Ghi nhận giá trị khi người dùng gõ S.O trực tiếp trên bảng (Tab 2)
  handleInlineSOInput(dvnCode, rawValue) {
    const cleanDvn = String(dvnCode).trim();
    const parsed = this.parseSOVal(rawValue);
    this.pendingSOChanges[cleanDvn] = parsed;

    // Cập nhật nhanh badge đếm số dòng vừa sửa trên nút Lưu mà không cần re-render toàn trang
    const badge = document.getElementById('pending-so-count');
    const count = Object.keys(this.pendingSOChanges).length;
    if (badge) {
      badge.innerText = count > 0 ? `(${count} thay đổi)` : '';
    }
  },

  // Lưu toàn bộ số liệu S.O vừa nhập tay trên bảng (Tab 2)
  async saveAllPendingSO() {
    const dvnKeys = Object.keys(this.pendingSOChanges);
    if (dvnKeys.length === 0) {
      alert(`Bạn chưa thay đổi số liệu S.O nào cho Tháng ${this.selectedMonth}/${this.selectedYear}. Hãy gõ số vào ô nhập liệu trước!`);
      return;
    }

    const list = this.getList();
    const updatedShopsForSupabase = [];

    dvnKeys.forEach(dvn => {
      const idx = list.findIndex(s => String(s.dvn).trim() === dvn);
      if (idx >= 0) {
        this.setShopSO(list[idx], this.selectedYear, this.selectedMonth, this.pendingSOChanges[dvn]);
        updatedShopsForSupabase.push(list[idx]);
      }
    });

    this.saveList(list);
    this.pendingSOChanges = {};

    let supaMsg = '';
    if (window.SupabaseService && window.SupabaseService.isConnected && updatedShopsForSupabase.length > 0) {
      this.isSyncing = true;
      window.App.renderCurrentModule();

      const payload = updatedShopsForSupabase.map(s => ({
        dvn_code: String(s.dvn).trim(),
        svn_code: s.svn,
        shop_name: s.name,
        supervisor_name: s.supervisor,
        region: s.mien,
        sub_region: s.region,
        director_name: s.gdKhuVuc,
        sale_name: s.sale,
        province: s.province,
        ward: s.ward,
        shop_type: s.shopType,
        so_data_2025: s.so2025 || {},
        so_data_2026: s.so2026 || {}
      }));

      const { error } = await window.SupabaseService.client
        .from('shops')
        .upsert(payload, { onConflict: 'dvn_code' });

      this.isSyncing = false;
      supaMsg = error ? `\n(Lưu ý Supabase: ${error.message})` : `\n(Đã đồng bộ lên Cloud Supabase!)`;
    }

    window.App.renderCurrentModule();
    alert(`Đã lưu thành công S.O Tháng ${this.selectedMonth}/${this.selectedYear} cho ${dvnKeys.length} cửa hàng!${supaMsg}`);
  },

  // Tải file Excel Mẫu để nhập S.O riêng cho Tháng/Năm đang chọn (Cực kỳ gọn nhẹ)
  async exportMonthlySOTemplate() {
    const loaded = await this.ensureXLSXLoaded();
    if (!loaded || !window.XLSX) return;

    const list = this.getFilteredList();
    const colTitle = `S.O THÁNG ${this.selectedMonth}/${this.selectedYear}`;

    const rows = list.map(s => {
      const currentVal = this.getShopSO(s, this.selectedYear, this.selectedMonth);
      return {
        'KHU VỰC': s.region || '',
        'MÃ SVN': String(s.svn || ''),
        'MÃ DVN': String(s.dvn || ''), // Giữ chuẩn String
        'TÊN ĐẠI LÝ': s.name || '',
        'TỈNH/THÀNH': s.province || '',
        'GIÁM SÁT': s.supervisor || s.gdMien || '',
        [colTitle]: currentVal !== null && currentVal !== undefined ? currentVal : ''
      };
    });

    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, `SO_T${this.selectedMonth}_${this.selectedYear}`);
    window.XLSX.writeFile(wb, `YADEA_Mau_Nhap_SO_Thang_${this.selectedMonth}_${this.selectedYear}.xlsx`);
  },

  // Mở hộp thoại chọn file Excel S.O theo Tháng
  triggerMonthlySOFileInput() {
    const fileInput = document.getElementById('monthly-so-upload-input');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  },

  // Xử lý khi người dùng Upload file Excel S.O của riêng Tháng/Năm đang chọn
  async handleMonthlySOFileUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;

    const loaded = await this.ensureXLSXLoaded();
    if (!loaded || !window.XLSX) return;

    try {
      const buffer = await file.arrayBuffer();
      const workbook = window.XLSX.read(buffer, { type: 'array' });
      const ws = workbook.Sheets[workbook.SheetNames[0]];
      const rows = window.XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });

      if (!rows || rows.length < 2) {
        alert('File Excel không có dữ liệu!');
        return;
      }

      // Tìm cột chứa Mã DVN và cột chứa số liệu S.O
      let dvnCol = -1;
      let soCol = -1;
      let startRow = 1;

      const headerRow = (rows[0] || []).map(cell => String(cell || '').trim().toUpperCase());
      headerRow.forEach((h, idx) => {
        if (h.includes('DVN')) dvnCol = idx;
        if (h.includes('S.O') || h.includes('SELL') || h.includes('THÁNG') || h.includes('SO ') || h === 'SO') soCol = idx;
      });

      // Nếu dòng 0 không phải tiêu đề chuẩn, tự động dò dòng đầu tiên có chữ DVN...
      if (dvnCol === -1) {
        for (let r = 0; r < Math.min(15, rows.length); r++) {
          const row = rows[r] || [];
          for (let c = 0; c < row.length; c++) {
            if (/^DVN[A-Z0-9]+/i.test(String(row[c] || '').trim())) {
              dvnCol = c;
              startRow = r;
              break;
            }
          }
          if (dvnCol !== -1) break;
        }
      }

      if (dvnCol === -1) {
        alert('Không tìm thấy cột Mã DVN trong file Excel!');
        return;
      }

      // Nếu chưa xác định được cột S.O, mặc định lấy cột cuối cùng của bảng mẫu
      if (soCol === -1) {
        soCol = (rows[startRow] || []).length - 1;
      }

      const list = this.getList();
      let updatedCount = 0;
      const updatedForSupabase = [];

      for (let i = startRow; i < rows.length; i++) {
        const r = rows[i];
        if (!r) continue;
        const rawDvn = String(r[dvnCol] || '').trim();
        if (!rawDvn.toUpperCase().startsWith('DVN')) continue;

        const soValue = this.parseSOVal(r[soCol]);
        const shopIdx = list.findIndex(s => String(s.dvn).trim().toUpperCase() === rawDvn.toUpperCase());

        if (shopIdx >= 0) {
          this.setShopSO(list[shopIdx], this.selectedYear, this.selectedMonth, soValue);
          updatedForSupabase.push(list[shopIdx]);
          updatedCount++;
        }
      }

      if (updatedCount === 0) {
        alert('Không khớp được Mã DVN nào với danh sách Shop hiện tại trong hệ thống!');
        return;
      }

      this.saveList(list);
      this.pendingSOChanges = {};

      // Lưu lịch sử Import
      if (window.AppStore && Array.isArray(window.AppStore.importHistory)) {
        window.AppStore.importHistory.unshift({
          batchId: `SO-T${this.selectedMonth}/${this.selectedYear}-` + Date.now().toString().slice(-4),
          fileName: file.name,
          importedBy: window.AppState?.userName || 'Admin',
          date: new Date().toLocaleString('vi-VN'),
          validRows: updatedCount,
          duplicateRows: 0
        });
        window.AppStore.saveToStorage();
      }

      if (window.SupabaseService && window.SupabaseService.isConnected && updatedForSupabase.length > 0) {
        this.isSyncing = true;
        window.App.renderCurrentModule();
        const payload = updatedForSupabase.map(s => ({
          dvn_code: String(s.dvn).trim(),
          svn_code: s.svn,
          shop_name: s.name,
          supervisor_name: s.supervisor,
          region: s.mien,
          sub_region: s.region,
          director_name: s.gdKhuVuc,
          sale_name: s.sale,
          province: s.province,
          ward: s.ward,
          shop_type: s.shopType,
          so_data_2025: s.so2025 || {},
          so_data_2026: s.so2026 || {}
        }));
        await window.SupabaseService.client.from('shops').upsert(payload, { onConflict: 'dvn_code' });
        this.isSyncing = false;
      }

      window.App.renderCurrentModule();
      alert(`Đã nhập thành công S.O Tháng ${this.selectedMonth}/${this.selectedYear} cho ${updatedCount} cửa hàng!`);
    } catch (err) {
      this.isSyncing = false;
      alert('Lỗi đọc file S.O: ' + err.message);
    } finally {
      event.target.value = '';
    }
  },

  // 8. Mở hộp thoại chọn file Excel Danh sách Shop (Master Data)
  triggerFileInput() {
    const fileInput = document.getElementById('excel-upload-input');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  },

  // Chuẩn hóa số liệu S.O: Ô rỗng hoặc NaN giữ nguyên là null (Quy tắc 3)
  parseSOVal(val) {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    if (str === '' || str.toUpperCase() === 'NAN' || str.toUpperCase() === 'NULL') return null;
    const num = Number(str.replace(/,/g, ''));
    return isNaN(num) ? null : num;
  },

  // 9. Xử lý đọc file Excel Master Data
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

      // Giữ lại dữ liệu S.O đã nhập của các shop cũ nếu import lại danh sách
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
        if (error) {
          supaStatusMsg = `\n(Đã lưu trên trình duyệt. Lưu ý từ Supabase: ${error.message})`;
        } else {
          supaStatusMsg = `\n(Đã đồng bộ thành công ${payloadArray.length} shop lên Cloud Supabase!)`;
        }
      }

      window.App.renderCurrentModule();
      alert(`Đã nhập thành công ${parsedShops.length} cửa hàng vào hệ thống!${supaStatusMsg}`);
    } catch (err) {
      this.isSyncing = false;
      console.error('Lỗi khi đọc file Excel:', err);
      alert('Lỗi khi đọc file Excel: ' + err.message);
    } finally {
      event.target.value = '';
    }
  },

  // 10. Xuất danh sách hiện tại ra file Excel (.xlsx)
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

  // 11. Mở Modal chỉnh sửa thông tin cửa hàng
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

  // 12. Lưu thông tin cửa hàng sau khi sửa
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

  // 13. Lọc danh sách theo ô tìm kiếm và các dropdown
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

  // Render riêng phần bảng của Tab 2: Nhập liệu S.O theo Tháng/Năm
  renderSOInputTab(filteredShops) {
    const y = this.selectedYear;
    const m = this.selectedMonth;
    const prevM = m > 1 ? m - 1 : 12;
    const prevY = m > 1 ? y : y - 1;
    const pendingCount = Object.keys(this.pendingSOChanges).length;

    // Tính tổng S.O của kỳ đang chọn và số shop đã có dữ liệu
    let totalPeriodSO = 0;
    let shopsWithData = 0;
    filteredShops.forEach(s => {
      const val = this.pendingSOChanges[s.dvn] !== undefined
        ? this.pendingSOChanges[s.dvn]
        : this.getShopSO(s, y, m);
      if (typeof val === 'number') {
        totalPeriodSO += val;
        shopsWithData++;
      }
    });

    return `
      <!-- THANH CHỌN KỲ (THÁNG / NĂM) & CÔNG CỤ IMPORT S.O THEO THÁNG -->
      <div class="p-4 bg-orange-50/60 dark:bg-slate-800/50 border-b border-orange-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-orange-200 shadow-sm">
            <i class="fa-regular fa-calendar-check text-[#F26522]"></i>
            <span class="text-xs font-extrabold text-slate-600 dark:text-slate-300">Kỳ nhập S.O:</span>
            
            <!-- Chọn Tháng -->
            <select
              onchange="AdminShopsModule.setPeriod(null, this.value)"
              class="bg-transparent text-xs font-black text-[#F26522] focus:outline-none cursor-pointer"
            >
              ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(month => `
                <option value="${month}" ${this.selectedMonth === month ? 'selected' : ''} class="text-slate-900">
                  Tháng ${month < 10 ? '0' + month : month}
                </option>
              `).join('')}
            </select>

            <span class="text-slate-300">/</span>

            <!-- Chọn Năm (Mở rộng thoải mái sang 2027, 2028) -->
            <select
              onchange="AdminShopsModule.setPeriod(this.value, null)"
              class="bg-transparent text-xs font-black text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              ${[2025, 2026, 2027, 2028].map(year => `
                <option value="${year}" ${this.selectedYear === year ? 'selected' : ''} class="text-slate-900">
                  Năm ${year}
                </option>
              `).join('')}
            </select>
          </div>

          <!-- Thống kê nhanh của Tháng đang chọn -->
          <div class="flex items-center gap-2 text-xs">
            <span class="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 font-bold text-slate-700 dark:text-slate-200">
              Đã nhập: <strong class="text-emerald-600">${shopsWithData}/${filteredShops.length}</strong> shop
            </span>
            <span class="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 font-bold text-slate-700 dark:text-slate-200">
              Tổng S.O T${m}/${y}: <strong class="text-[#F26522] font-mono">${totalPeriodSO.toLocaleString()} xe</strong>
            </span>
          </div>
        </div>

        <!-- Cụm nút: Tải file mẫu tháng, Upload Excel tháng, Lưu nhập tay -->
        <div class="flex flex-wrap items-center gap-2.5 text-xs">
          <button
            onclick="AdminShopsModule.exportMonthlySOTemplate()"
            class="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            title="Tải file Excel chỉ gồm Mã DVN và cột S.O của tháng này để điền nhanh"
          >
            <i class="fa-solid fa-download text-emerald-600"></i>
            <span>Tải Mẫu Excel T${m}/${y}</span>
          </button>

          <button
            onclick="AdminShopsModule.triggerMonthlySOFileInput()"
            class="px-3.5 py-2 rounded-xl bg-[#111625] hover:bg-slate-800 text-white font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            title="Upload file Excel S.O cho riêng Tháng ${m}/${y}"
          >
            <i class="fa-solid fa-file-import text-amber-400"></i>
            <span>Import Excel T${m}/${y}</span>
          </button>

          <button
            onclick="AdminShopsModule.saveAllPendingSO()"
            class="btn-3d-orange px-4 py-2 rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            <span>Lưu Số Liệu T${m}/${y}</span>
            <span id="pending-so-count" class="text-[11px] font-mono">${pendingCount > 0 ? `(${pendingCount} thay đổi)` : ''}</span>
          </button>
        </div>
      </div>

      <!-- BẢNG NHẬP LIỆU S.O TRỰC TIẾP THEO THÁNG / NĂM -->
      <div class="overflow-x-auto max-h-[62vh]">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="sticky top-0 z-20 shadow-sm">
            <tr class="bg-slate-100 dark:bg-slate-900 text-[#667085] uppercase tracking-wider font-bold border-b border-slate-200">
              <th class="py-3.5 px-4 bg-slate-100 dark:bg-slate-900">KHU VỰC</th>
              <th class="py-3.5 px-3 bg-slate-100 dark:bg-slate-900">MÃ DVN</th>
              <th class="py-3.5 px-4 bg-slate-100 dark:bg-slate-900">TÊN ĐẠI LÝ</th>
              <th class="py-3.5 px-3 bg-slate-100 dark:bg-slate-900">GIÁM SÁT</th>
              <th class="py-3.5 px-3 text-right bg-slate-100 dark:bg-slate-900">CÙNG KỲ (T${m}/${y - 1})</th>
              <th class="py-3.5 px-3 text-right bg-slate-100 dark:bg-slate-900">THÁNG TRƯỚC (T${prevM}/${prevY})</th>
              <th class="py-3.5 px-4 text-center bg-orange-100/90 dark:bg-orange-950 text-[#F26522] font-black">
                NHẬP S.O T${m}/${y} (XE)
              </th>
              <th class="py-3.5 px-3 text-center bg-slate-100 dark:bg-slate-900">TĂNG TRƯỞNG (MoM / YoY)</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            ${filteredShops.map(shop => {
              const sameMonthLastYear = this.getShopSO(shop, y - 1, m);
              const prevMonthVal = this.getShopSO(shop, prevY, prevM);
              const savedVal = this.getShopSO(shop, y, m);
              const currentVal = this.pendingSOChanges[shop.dvn] !== undefined ? this.pendingSOChanges[shop.dvn] : savedVal;

              const mom = (currentVal !== null && prevMonthVal !== null && prevMonthVal > 0)
                ? Math.round(((currentVal - prevMonthVal) / prevMonthVal) * 100)
                : null;
              const yoy = (currentVal !== null && sameMonthLastYear !== null && sameMonthLastYear > 0)
                ? Math.round(((currentVal - sameMonthLastYear) / sameMonthLastYear) * 100)
                : null;

              return `
                <tr class="hover:bg-slate-50/90 transition">
                  <td class="py-3 px-4 text-orange-600 font-extrabold uppercase">${shop.region || ''}</td>
                  <td class="py-3 px-3 font-black font-mono text-[#172033]">${shop.dvn}</td>
                  <td class="py-3 px-4 font-bold text-[#172033]">${shop.name}</td>
                  <td class="py-3 px-3 text-slate-600 font-semibold">${shop.supervisor || shop.gdMien || ''}</td>
                  <td class="py-3 px-3 text-right font-mono text-slate-500">
                    ${sameMonthLastYear === null || sameMonthLastYear === undefined ? '<span class="text-slate-300">NULL</span>' : sameMonthLastYear}
                  </td>
                  <td class="py-3 px-3 text-right font-mono text-slate-600 font-bold">
                    ${prevMonthVal === null || prevMonthVal === undefined ? '<span class="text-slate-300">NULL</span>' : prevMonthVal}
                  </td>
                  <td class="py-2.5 px-4 text-center bg-orange-50/30">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="Chưa có (NULL)"
                      value="${currentVal !== null && currentVal !== undefined ? currentVal : ''}"
                      oninput="AdminShopsModule.handleInlineSOInput('${shop.dvn}', this.value)"
                      class="w-32 px-3 py-1.5 rounded-lg border border-orange-300 bg-white text-center font-mono font-extrabold text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                    />
                  </td>
                  <td class="py-3 px-3 text-center font-mono text-[11px]">
                    <span class="${mom === null ? 'text-slate-400' : mom >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                      ${mom === null ? '—' : (mom >= 0 ? '+' + mom + '%' : mom + '%')}
                    </span>
                    <span class="text-slate-300 mx-1">/</span>
                    <span class="${yoy === null ? 'text-slate-400' : yoy >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                      ${yoy === null ? '—' : (yoy >= 0 ? '+' + yoy + '%' : yoy + '%')}
                    </span>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  },

  // 14. Render giao diện chính
  render() {
    this.ensureXLSXLoaded();
    this.fetchFromSupabaseIfNeeded();

    const allShops = this.getList();
    const filteredShops = this.getFilteredList();

    const uniqueRegions = [...new Set(allShops.map(s => s.region).filter(Boolean))];
    const uniqueSups = [...new Set(allShops.map(s => s.supervisor || s.gdMien).filter(Boolean))];

    return `
      <!-- INPUT FILE ẨN ĐỂ CHỌN FILE EXCEL MASTER DATA & FILE EXCEL S.O THÁNG -->
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

      <!-- KHỐI HEADER & CHUYỂN TAB (2 TAB RÕ RÀNG) -->
      <div class="card-3d p-6 mb-6 bg-white flex flex-col items-center justify-between space-y-5 rounded-2xl shadow-sm border border-slate-100">
        <div class="text-center space-y-1">
          <h2 class="text-2xl font-black text-[#172033]">Quản Trị Hệ Thống Cửa Hàng & Sản Lượng Sell-Out</h2>
          <p class="text-xs text-slate-500 font-medium">Tách biệt Danh sách Shop cố định và Nhập liệu S.O theo từng Tháng / Năm (2025 - 2028)</p>
        </div>

        <!-- THANH CHUYỂN TAB -->
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

        <!-- NÚT UPLOAD / EXPORT MASTER DATA (CHỈ HIỆN Ở TAB 1) -->
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

      <!-- KHỐI BẢNG DỮ LIỆU & BỘ LỌC TÊN NHANH -->
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

          <!-- THANH LỌC TÊN ĐỂ TÌM & SỬA NHANH (DÙNG CHUNG CHO CẢ 2 TAB) -->
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

        <!-- NỘI DUNG TỪNG TAB -->
        ${this.activeTab === 'SO_INPUT' ? this.renderSOInputTab(filteredShops) : `
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