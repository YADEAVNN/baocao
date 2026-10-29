// modules/admin_shops/admin_shops.so_input.js
Object.assign(window.AdminShopsModule, {
  pendingPersonnelChanges: {}, // Lưu tạm thay đổi Sale / Giám sát / GĐKV / Khu vực ngay trên bảng S.O

  handleInlineSOInput(dvnCode, rawValue) {
    const cleanDvn = String(dvnCode).trim();
    const parsed = this.parseSOVal(rawValue);
    this.pendingSOChanges[cleanDvn] = parsed;
    this.updatePendingBadgeUI();
  },

  handleInlinePersonnelInput(dvnCode, field, rawValue) {
    const cleanDvn = String(dvnCode).trim();
    if (!this.pendingPersonnelChanges) this.pendingPersonnelChanges = {};
    if (!this.pendingPersonnelChanges[cleanDvn]) {
      this.pendingPersonnelChanges[cleanDvn] = {};
    }
    this.pendingPersonnelChanges[cleanDvn][field] = String(rawValue || '').normalize('NFC').trim();
    this.updatePendingBadgeUI();
  },

  updatePendingBadgeUI() {
    const badge = document.getElementById('pending-so-count');
    const soCount = Object.keys(this.pendingSOChanges || {}).length;
    const perCount = Object.keys(this.pendingPersonnelChanges || {}).length;
    const total = new Set([
      ...Object.keys(this.pendingSOChanges || {}),
      ...Object.keys(this.pendingPersonnelChanges || {})
    ]).size;
    if (badge) {
      badge.innerText = total > 0 ? `(${total} shop thay đổi)` : '';
    }
  },

  // Hàm chuẩn hóa và cập nhật thông tin nhân sự / khu vực mới nhất cho 1 Shop (Giữ nguyên mã DVN String)
  applyLatestPersonnelToShop(shopObj, newInfo) {
    if (!shopObj || !newInfo) return false;
    let changed = false;
    const changesLog = [];

    const checkAndUpdate = (field, newVal, label) => {
      const cleanNew = String(newVal || '').normalize('NFC').trim();
      if (!cleanNew) return;
      const oldVal = String(shopObj[field] || '').normalize('NFC').trim();
      if (oldVal !== cleanNew) {
        changesLog.push(`${label}: "${oldVal || 'Trống'}" → "${cleanNew}"`);
        shopObj[field] = cleanNew;
        changed = true;
      }
    };

    checkAndUpdate('name', newInfo.name, 'Tên Shop');
    checkAndUpdate('svn', newInfo.svn, 'Mã SVN');
    checkAndUpdate('mien', newInfo.mien, 'Miền');
    checkAndUpdate('region', newInfo.region, 'Khu vực');
    checkAndUpdate('province', newInfo.province, 'Tỉnh/Thành');
    checkAndUpdate('sale', newInfo.sale, 'Sale');
    checkAndUpdate('gdKhuVuc', newInfo.gdKhuVuc, 'GĐ Khu vực');

    if (newInfo.supervisor) {
      const cleanSup = String(newInfo.supervisor).normalize('NFC').trim();
      const oldSup = String(shopObj.supervisor || shopObj.gdMien || '').normalize('NFC').trim();
      if (cleanSup && oldSup !== cleanSup) {
        changesLog.push(`Giám sát: "${oldSup || 'Trống'}" → "${cleanSup}"`);
        shopObj.supervisor = cleanSup;
        shopObj.gdMien = cleanSup;
        changed = true;
      }
    }

    // Tự động suy luận lại Miền (Bắc/Nam) nếu Giám đốc hoặc Shop đổi sang Khu vực thuộc miền khác
    if (newInfo.region || newInfo.mien) {
      const resolvedEnum = window.AppUtils && window.AppUtils.resolveMienCode
        ? window.AppUtils.resolveMienCode(shopObj.mien, shopObj.region)
        : (String(shopObj.region || '').toUpperCase().includes('NAM') ? 'SOUTH' : 'NORTH');
      shopObj.mien = resolvedEnum === 'SOUTH' ? 'Miền Nam 南部' : 'Miền Bắc 北部';
    }

    if (changed) {
      if (!Array.isArray(shopObj.personnelHistory)) shopObj.personnelHistory = [];
      shopObj.personnelHistory.unshift({
        date: new Date().toLocaleString('vi-VN'),
        updatedBy: window.AppState?.userName || 'Admin',
        details: changesLog.join(' | ')
      });
    }

    return changed;
  },

  async saveAllPendingSO() {
    if (!this.pendingPersonnelChanges) this.pendingPersonnelChanges = {};
    const allChangedDvns = [...new Set([
      ...Object.keys(this.pendingSOChanges || {}),
      ...Object.keys(this.pendingPersonnelChanges || {})
    ])];

    if (allChangedDvns.length === 0) {
      alert(`Bạn chưa thay đổi số liệu S.O hoặc nhân sự nào cho Tháng ${this.selectedMonth}/${this.selectedYear}!`);
      return;
    }

    const list = this.getList();
    const updatedShopsForSupabase = [];
    let personnelUpdatedCount = 0;

    allChangedDvns.forEach(dvn => {
      const idx = list.findIndex(s => String(s.dvn).trim() === dvn);
      if (idx >= 0) {
        if (this.pendingSOChanges[dvn] !== undefined) {
          this.setShopSO(list[idx], this.selectedYear, this.selectedMonth, this.pendingSOChanges[dvn]);
        }
        if (this.pendingPersonnelChanges[dvn]) {
          const perChanged = this.applyLatestPersonnelToShop(list[idx], this.pendingPersonnelChanges[dvn]);
          if (perChanged) personnelUpdatedCount++;
        }
        updatedShopsForSupabase.push(list[idx]);
      }
    });

    this.saveList(list);
    this.pendingSOChanges = {};
    this.pendingPersonnelChanges = {};

    if (window.App && typeof window.App.populateHeaderAdvancedFilters === 'function') {
      window.App.populateHeaderAdvancedFilters();
    }

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
    alert(
      `Đã lưu thành công dữ liệu Tháng ${this.selectedMonth}/${this.selectedYear} cho ${allChangedDvns.length} cửa hàng!` +
      (personnelUpdatedCount > 0 ? `\n• Đã đồng bộ nhân sự/khu vực mới nhất cho ${personnelUpdatedCount} cửa hàng.` : '') +
      supaMsg
    );
  },

  // Xuất file Excel mẫu S.O tháng có đầy đủ cột Sale, Giám đốc KV, Giám sát, Khu vực để dễ dàng thay đổi nhân sự mới
  async exportMonthlySOTemplate() {
    const loaded = await this.ensureXLSXLoaded();
    if (!loaded || !window.XLSX) return;

    const list = this.getFilteredList();
    const colTitle = `S.O THÁNG ${this.selectedMonth}/${this.selectedYear}`;

    const rows = list.map(s => {
      const currentVal = this.getShopSO(s, this.selectedYear, this.selectedMonth);
      return {
        'MIỀN': s.mien || '',
        'KHU VỰC': s.region || '',
        'MÃ SVN': String(s.svn || ''),
        'MÃ DVN': String(s.dvn || ''), // Giữ chuẩn String theo Quy tắc 2
        'TÊN ĐẠI LÝ': s.name || '',
        'TỈNH/THÀNH': s.province || '',
        'SALE': s.sale || '',
        'GĐ KHU VỰC': s.gdKhuVuc || '',
        'GIÁM SÁT': s.supervisor || s.gdMien || '',
        [colTitle]: currentVal !== null && currentVal !== undefined ? currentVal : ''
      };
    });

    const ws = window.XLSX.utils.json_to_sheet(rows);
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, `SO_T${this.selectedMonth}_${this.selectedYear}`);
    window.XLSX.writeFile(wb, `YADEA_Mau_Nhap_SO_Thang_${this.selectedMonth}_${this.selectedYear}.xlsx`);
  },

  triggerMonthlySOFileInput() {
    const fileInput = document.getElementById('monthly-so-upload-input');
    if (fileInput) {
      fileInput.value = '';
      fileInput.click();
    }
  },

  // Khi Import file S.O tháng: Tự động cập nhật luôn Sale mới, Giám sát mới, Giám đốc mới, Khu vực mới (và thêm Shop mới nếu chưa có)
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

      let headerRowIdx = 0;
      let dvnCol = -1;

      // Dò dòng tiêu đề chứa cột DVN
      for (let r = 0; r < Math.min(15, rows.length); r++) {
        const rowUpper = (rows[r] || []).map(c => String(c || '').trim().toUpperCase());
        const foundDvnIdx = rowUpper.findIndex(h => h.includes('DVN') || h.includes('MÃ CỬA HÀNG'));
        if (foundDvnIdx !== -1) {
          headerRowIdx = r;
          dvnCol = foundDvnIdx;
          break;
        }
      }

      // Nếu không có tiêu đề tường minh thì dò theo giá trị ô bắt đầu bằng "DVN..."
      let startRow = headerRowIdx + 1;
      if (dvnCol === -1) {
        for (let r = 0; r < Math.min(15, rows.length); r++) {
          const row = rows[r] || [];
          for (let c = 0; c < row.length; c++) {
            if (/^DVN[A-Z0-9]+/i.test(String(row[c] || '').trim())) {
              dvnCol = c;
              headerRowIdx = Math.max(0, r - 1);
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

      const headerRow = (rows[headerRowIdx] || []).map(cell => String(cell || '').trim().toUpperCase());
      const findColByKeywords = (keywords, excludeCols = []) =>
        headerRow.findIndex((h, idx) => !excludeCols.includes(idx) && keywords.some(k => h.includes(k)));

      const colMien = findColByKeywords(['MIỀN', '南北']);
      const colRegion = findColByKeywords(['KHU VỰC', 'VÙNG', '区域'], [colMien]);
      const colSvn = findColByKeywords(['SVN']);
      const colName = findColByKeywords(['TÊN ĐẠI LÝ', 'TÊN CỬA HÀNG', 'TÊN SHOP', '门店名称']);
      const colProvince = findColByKeywords(['TỈNH', 'THÀNH PHỐ', '省份']);
      const colSale = findColByKeywords(['SALE', 'NVKD', 'NHÂN VIÊN KINH DOANH', '销售']);
      const colDirector = findColByKeywords(['GĐ KHU VỰC', 'GIÁM ĐỐC', 'GĐKV', '区域总监', '总监']);
      const colSupervisor = findColByKeywords(['GIÁM SÁT', 'GĐ MIỀN', '督导'], [colDirector]);
      const colShopType = findColByKeywords(['LOẠI HÌNH', 'SIZE', 'HẠNG']);

      // Tìm cột chứa số liệu S.O của tháng đang chọn (hoặc cột S.O cuối cùng)
      const targetMonthStr1 = `T${this.selectedMonth}`;
      const targetMonthStr2 = `THÁNG ${this.selectedMonth}`;
      let soCol = headerRow.findIndex(h =>
        (h.includes('S.O') || h.includes('SELL') || h.includes('SO ')) &&
        (h.includes(targetMonthStr1) || h.includes(targetMonthStr2))
      );
      if (soCol === -1) {
        soCol = findColByKeywords(['S.O', 'SELL-OUT', 'SELL OUT', 'SẢN LƯỢNG', 'SO THÁNG']);
      }
      if (soCol === -1) {
        soCol = (rows[startRow] || []).length - 1;
      }

      const cleanStr = (val) => (val === null || val === undefined) ? '' : String(val).normalize('NFC').trim();

      const list = this.getList();
      let updatedSOCount = 0;
      let updatedPersonnelCount = 0;
      let newAddedShopCount = 0;
      const updatedForSupabaseMap = new Map();

      for (let i = startRow; i < rows.length; i++) {
        const r = rows[i];
        if (!r) continue;
        const rawDvn = cleanStr(r[dvnCol]);
        if (!rawDvn.toUpperCase().startsWith('DVN')) continue;

        const soValue = this.parseSOVal(r[soCol]);

        // Trích xuất thông tin nhân sự & khu vực mới nhất từ dòng Excel (nếu có cột tương ứng)
        const latestPersonnel = {
          mien: colMien >= 0 ? cleanStr(r[colMien]) : '',
          region: colRegion >= 0 ? cleanStr(r[colRegion]) : '',
          svn: colSvn >= 0 ? cleanStr(r[colSvn]) : '',
          name: colName >= 0 ? cleanStr(r[colName]) : '',
          province: colProvince >= 0 ? cleanStr(r[colProvince]) : '',
          sale: colSale >= 0 ? cleanStr(r[colSale]) : '',
          gdKhuVuc: colDirector >= 0 ? cleanStr(r[colDirector]) : '',
          supervisor: colSupervisor >= 0 ? cleanStr(r[colSupervisor]) : '',
          shopType: colShopType >= 0 ? cleanStr(r[colShopType]) : ''
        };

        const shopIdx = list.findIndex(s => String(s.dvn).trim().toUpperCase() === rawDvn.toUpperCase());

        if (shopIdx >= 0) {
          // 1. Cập nhật số S.O tháng
          this.setShopSO(list[shopIdx], this.selectedYear, this.selectedMonth, soValue);
          updatedSOCount++;

          // 2. Đồng bộ ngay Sale mới, Giám sát mới, Giám đốc mới, Khu vực mới (nếu có thay đổi)
          const hasPerChange = this.applyLatestPersonnelToShop(list[shopIdx], latestPersonnel);
          if (hasPerChange) updatedPersonnelCount++;

          updatedForSupabaseMap.set(list[shopIdx].dvn, list[shopIdx]);
        } else {
          // 3. Nếu cửa hàng mới mở chưa có trong danh sách Shop -> Tự động thêm mới và gán S.O
          const enumMien = window.AppUtils && window.AppUtils.resolveMienCode
            ? window.AppUtils.resolveMienCode(latestPersonnel.mien, latestPersonnel.region)
            : 'NORTH';
          const newShop = {
            dvn: rawDvn, // Giữ chuẩn String
            svn: latestPersonnel.svn || '',
            name: latestPersonnel.name || `Yadea Shop ${rawDvn}`,
            mien: latestPersonnel.mien || (enumMien === 'SOUTH' ? 'Miền Nam 南部' : 'Miền Bắc 北部'),
            region: latestPersonnel.region || 'Khác',
            province: latestPersonnel.province || '',
            ward: '',
            sale: latestPersonnel.sale || 'Chưa phân công',
            gdKhuVuc: latestPersonnel.gdKhuVuc || 'Chưa phân công',
            supervisor: latestPersonnel.supervisor || 'Chưa phân công',
            gdMien: latestPersonnel.supervisor || 'Chưa phân công',
            shopType: latestPersonnel.shopType || 'A形象店',
            isVip: true,
            so2025: {},
            so2026: {},
            so2027: {},
            so2028: {}
          };
          this.setShopSO(newShop, this.selectedYear, this.selectedMonth, soValue);
          list.push(newShop);
          newAddedShopCount++;
          updatedSOCount++;
          updatedForSupabaseMap.set(newShop.dvn, newShop);
        }
      }

      if (updatedSOCount === 0) {
        alert('Không tìm thấy Mã DVN hợp lệ nào trong file Excel!');
        return;
      }

      this.saveList(list);
      this.pendingSOChanges = {};
      this.pendingPersonnelChanges = {};

      // Cập nhật lại bộ lọc toàn hệ thống để nhận diện ngay Sale/Giám sát/Giám đốc/Khu vực mới
      if (window.App && typeof window.App.populateHeaderAdvancedFilters === 'function') {
        window.App.populateHeaderAdvancedFilters();
      }

      if (window.AppStore && Array.isArray(window.AppStore.importHistory)) {
        window.AppStore.importHistory.unshift({
          batchId: `SO-T${this.selectedMonth}/${this.selectedYear}-` + Date.now().toString().slice(-4),
          fileName: file.name,
          importedBy: window.AppState?.userName || 'Admin',
          date: new Date().toLocaleString('vi-VN'),
          validRows: updatedSOCount,
          duplicateRows: 0
        });
        window.AppStore.saveToStorage();
      }

      const updatedForSupabase = Array.from(updatedForSupabaseMap.values());
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
      alert(
        `Đã Import thành công S.O Tháng ${this.selectedMonth}/${this.selectedYear} cho ${updatedSOCount} cửa hàng!\n` +
        `• Tự động cập nhật Sale / Giám sát / GĐKV / Khu vực mới nhất: ${updatedPersonnelCount} shop\n` +
        (newAddedShopCount > 0 ? `• Tự động bổ sung Shop mới vào hệ thống: ${newAddedShopCount} shop` : '')
      );
    } catch (err) {
      this.isSyncing = false;
      alert('Lỗi đọc file S.O: ' + err.message);
    } finally {
      event.target.value = '';
    }
  },

  renderSOInputTab(filteredShops) {
    if (!this.pendingPersonnelChanges) this.pendingPersonnelChanges = {};
    const y = this.selectedYear;
    const m = this.selectedMonth;
    const prevM = m > 1 ? m - 1 : 12;
    const prevY = m > 1 ? y : y - 1;
    const pendingTotalCount = new Set([
      ...Object.keys(this.pendingSOChanges || {}),
      ...Object.keys(this.pendingPersonnelChanges || {})
    ]).size;

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
      <!-- THANH CHỌN KỲ (THÁNG / NĂM) & CÔNG CỤ IMPORT S.O KÈM ĐỒNG BỘ NHÂN SỰ MỚI -->
      <div class="p-4 bg-orange-50/60 dark:bg-slate-800/50 border-b border-orange-100 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2 bg-white dark:bg-slate-900 px-3.5 py-2 rounded-xl border border-orange-200 shadow-sm">
            <i class="fa-regular fa-calendar-check text-[#F26522]"></i>
            <span class="text-xs font-extrabold text-slate-600 dark:text-slate-300">Kỳ nhập S.O:</span>
            
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

          <div class="flex items-center gap-2 text-xs">
            <span class="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 font-bold text-slate-700 dark:text-slate-200">
              Đã nhập: <strong class="text-emerald-600">${shopsWithData}/${filteredShops.length}</strong> shop
            </span>
            <span class="px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 font-bold text-slate-700 dark:text-slate-200">
              Tổng S.O T${m}/${y}: <strong class="text-[#F26522] font-mono">${totalPeriodSO.toLocaleString()} xe</strong>
            </span>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-2.5 text-xs">
          <button
            onclick="AdminShopsModule.exportMonthlySOTemplate()"
            class="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            title="Tải file Excel gồm Mã DVN, Khu vực, Sale, GĐKV, Giám sát và S.O của tháng này"
          >
            <i class="fa-solid fa-download text-emerald-600"></i>
            <span>Tải Mẫu Excel T${m}/${y} (Đủ Cột Nhân Sự)</span>
          </button>

          <button
            onclick="AdminShopsModule.triggerMonthlySOFileInput()"
            class="px-3.5 py-2 rounded-xl bg-[#111625] hover:bg-slate-800 text-white font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            title="Upload file Excel S.O: Tự động cập nhật luôn Sale mới, Giám sát mới, GĐKV mới và Khu vực mới"
          >
            <i class="fa-solid fa-file-import text-amber-400"></i>
            <span>Import S.O & Đồng Bộ Nhân Sự Mới</span>
          </button>

          <button
            onclick="AdminShopsModule.saveAllPendingSO()"
            class="btn-3d-orange px-4 py-2 rounded-xl font-extrabold flex items-center gap-1.5 cursor-pointer"
          >
            <i class="fa-solid fa-floppy-disk"></i>
            <span>Lưu Thay Đổi T${m}/${y}</span>
            <span id="pending-so-count" class="text-[11px] font-mono">${pendingTotalCount > 0 ? `(${pendingTotalCount} shop thay đổi)` : ''}</span>
          </button>
        </div>
      </div>

      <!-- BẢNG NHẬP LIỆU S.O & CẬP NHẬT NHANH SALE / GIÁM SÁT / GĐKV / KHU VỰC MỚI NHẤT -->
      <div class="overflow-x-auto max-h-[62vh]">
        <table class="w-full text-left border-collapse text-xs">
          <thead class="sticky top-0 z-20 shadow-sm">
            <tr class="bg-slate-100 dark:bg-slate-900 text-[#667085] uppercase tracking-wider font-bold border-b border-slate-200">
              <th class="py-3.5 px-3 bg-slate-100 dark:bg-slate-900">KHU VỰC (MỚI NHẤT)</th>
              <th class="py-3.5 px-3 bg-slate-100 dark:bg-slate-900">MÃ DVN</th>
              <th class="py-3.5 px-3 bg-slate-100 dark:bg-slate-900">TÊN ĐẠI LÝ</th>
              <th class="py-3.5 px-3 bg-slate-100 dark:bg-slate-900">SALE PHỤ TRÁCH</th>
              <th class="py-3.5 px-3 bg-slate-100 dark:bg-slate-900">GĐ KHU VỰC</th>
              <th class="py-3.5 px-3 bg-slate-100 dark:bg-slate-900">GIÁM SÁT</th>
              <th class="py-3.5 px-2 text-right bg-slate-100 dark:bg-slate-900">CK T${m}/${y - 1}</th>
              <th class="py-3.5 px-2 text-right bg-slate-100 dark:bg-slate-900">TT T${prevM}/${prevY}</th>
              <th class="py-3.5 px-3 text-center bg-orange-100/90 dark:bg-orange-950 text-[#F26522] font-black">
                NHẬP S.O T${m}/${y}
              </th>
              <th class="py-3.5 px-2 text-center bg-slate-100 dark:bg-slate-900">MoM / YoY</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100 font-medium">
            ${filteredShops.map(shop => {
              const sameMonthLastYear = this.getShopSO(shop, y - 1, m);
              const prevMonthVal = this.getShopSO(shop, prevY, prevM);
              const savedVal = this.getShopSO(shop, y, m);
              const currentVal = this.pendingSOChanges[shop.dvn] !== undefined ? this.pendingSOChanges[shop.dvn] : savedVal;

              const perDraft = this.pendingPersonnelChanges[shop.dvn] || {};
              const curRegion = perDraft.region !== undefined ? perDraft.region : (shop.region || '');
              const curSale = perDraft.sale !== undefined ? perDraft.sale : (shop.sale || '');
              const curDirector = perDraft.gdKhuVuc !== undefined ? perDraft.gdKhuVuc : (shop.gdKhuVuc || '');
              const curSup = perDraft.supervisor !== undefined ? perDraft.supervisor : (shop.supervisor || shop.gdMien || '');

              const mom = (currentVal !== null && prevMonthVal !== null && prevMonthVal > 0)
                ? Math.round(((currentVal - prevMonthVal) / prevMonthVal) * 100)
                : null;
              const yoy = (currentVal !== null && sameMonthLastYear !== null && sameMonthLastYear > 0)
                ? Math.round(((currentVal - sameMonthLastYear) / sameMonthLastYear) * 100)
                : null;

              return `
                <tr class="hover:bg-slate-50/90 transition">
                  <td class="py-2.5 px-2">
                    <input
                      type="text"
                      value="${curRegion}"
                      oninput="AdminShopsModule.handleInlinePersonnelInput('${shop.dvn}', 'region', this.value)"
                      class="w-28 px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#F26522] bg-transparent focus:bg-white text-orange-600 font-extrabold uppercase text-[11px] focus:outline-none"
                      title="Sửa nhanh Khu vực nếu có thay đổi"
                    />
                  </td>
                  <td class="py-2.5 px-3 font-black font-mono text-blue-600">${shop.dvn}</td>
                  <td class="py-2.5 px-3 font-bold text-[#172033]">
                    <div>${shop.name}</div>
                    <div class="text-[10px] text-slate-400">${shop.province || ''}</div>
                  </td>
                  <td class="py-2.5 px-2">
                    <input
                      type="text"
                      value="${curSale}"
                      oninput="AdminShopsModule.handleInlinePersonnelInput('${shop.dvn}', 'sale', this.value)"
                      class="w-32 px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#F26522] bg-transparent focus:bg-white text-slate-800 font-bold text-[11px] focus:outline-none"
                      title="Gõ tên Sale mới nếu Sale cũ nghỉ hoặc chuyển vùng"
                    />
                  </td>
                  <td class="py-2.5 px-2">
                    <input
                      type="text"
                      value="${curDirector}"
                      oninput="AdminShopsModule.handleInlinePersonnelInput('${shop.dvn}', 'gdKhuVuc', this.value)"
                      class="w-32 px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#F26522] bg-transparent focus:bg-white text-blue-600 font-bold text-[11px] focus:outline-none"
                      title="Gõ tên Giám đốc KV mới"
                    />
                  </td>
                  <td class="py-2.5 px-2">
                    <input
                      type="text"
                      value="${curSup}"
                      oninput="AdminShopsModule.handleInlinePersonnelInput('${shop.dvn}', 'supervisor', this.value)"
                      class="w-32 px-2 py-1 rounded border border-transparent hover:border-slate-300 focus:border-[#F26522] bg-transparent focus:bg-white text-orange-600 font-bold text-[11px] focus:outline-none"
                      title="Gõ tên Giám sát mới"
                    />
                  </td>
                  <td class="py-2.5 px-2 text-right font-mono text-slate-500">
                    ${sameMonthLastYear === null || sameMonthLastYear === undefined ? '<span class="text-slate-300">NULL</span>' : sameMonthLastYear}
                  </td>
                  <td class="py-2.5 px-2 text-right font-mono text-slate-600 font-bold">
                    ${prevMonthVal === null || prevMonthVal === undefined ? '<span class="text-slate-300">NULL</span>' : prevMonthVal}
                  </td>
                  <td class="py-2 px-3 text-center bg-orange-50/30">
                    <input
                      type="number"
                      min="0"
                      step="1"
                      placeholder="NULL"
                      value="${currentVal !== null && currentVal !== undefined ? currentVal : ''}"
                      oninput="AdminShopsModule.handleInlineSOInput('${shop.dvn}', this.value)"
                      class="w-24 px-2.5 py-1.5 rounded-lg border border-orange-300 bg-white text-center font-mono font-extrabold text-sm text-[#172033] focus:outline-none focus:ring-2 focus:ring-[#F26522]"
                    />
                  </td>
                  <td class="py-2.5 px-2 text-center font-mono text-[11px]">
                    <span class="${mom === null ? 'text-slate-400' : mom >= 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}">
                      ${mom === null ? '—' : (mom >= 0 ? '+' + mom + '%' : mom + '%')}
                    </span>
                    <span class="text-slate-300 mx-0.5">/</span>
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
  }
});